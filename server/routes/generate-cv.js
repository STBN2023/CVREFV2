const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');
const utils = require('../utils/pptx');

const { sanitizeSlug, replaceReferenceBlocks, replaceRefPlaceholders, replaceShapeBlocks, toSafeBaseName } = utils;
// Fallback no-op si la fonction n'est pas exportée (évite le crash)
const replaceAliasPlaceholders =
  typeof utils.replaceAliasPlaceholders === 'function'
    ? utils.replaceAliasPlaceholders
    : (xml) => xml;

function findBestPptx(dataDir, prenomRaw, nomRaw) {
  const prenom = utils.sanitizeSlug(prenomRaw || '');
  const nom = utils.sanitizeSlug(nomRaw || '');
  const targetSanitized = `${prenom}_${nom}`;

  const files = fs
    .readdirSync(dataDir)
    .filter((f) => f.toLowerCase().endsWith('.pptx'))
    .filter((f) => f.toLowerCase() !== 'template.pptx');

  const catalog = files.map((f) => {
    const base = path.basename(f, '.pptx');
    const baseSanitized = utils.sanitizeSlug(base);
    return { file: path.join(dataDir, f), base, baseSanitized };
  });

  const exact = catalog.find((c) => c.baseSanitized === targetSanitized);
  if (exact) return { file: exact.file, match: 'exact' };

  const byNom = catalog.find((c) => c.baseSanitized.endsWith(`_${nom}`));
  if (byNom) return { file: byNom.file, match: 'by_lastname' };

  const byPrenom = catalog.find((c) => c.baseSanitized.startsWith(`${prenom}_`));
  if (byPrenom) return { file: byPrenom.file, match: 'by_firstname' };

  const byNomLoose = catalog.find((c) => c.baseSanitized.includes(nom));
  if (byNomLoose) return { file: byNomLoose.file, match: 'loose_lastname' };

  return null;
}

function registerGenerateCvRoutes(app, ctx) {
  const { dataDir, downloadsDir } = ctx;

  app.post('/api/generate-cv', async (req, res) => {
    console.log('\n=== 🚀 [GENERATE-CV] DÉBUT GÉNÉRATION ===');
    console.log('📅 Timestamp:', new Date().toISOString());
    try {
      const { teamData, referencesData, associations } = req.body;

      if (!teamData || !referencesData || !associations) {
        console.error('❌ [GENERATE-CV] Données manquantes (teamData/referencesData/associations)');
        return res.status(400).json({ error: 'Données manquantes (teamData, referencesData, associations)' });
      }

      const refsNormalized = (referencesData || []).map((r) => ({
        ...r,
        id: r?.id != null ? String(r.id) : undefined,
      }));

      const generatedFiles = [];
      const errors = [];

      for (const member of (teamData || [])) {
        const prenom = member?.prenom || (member?.name || '').split(' ')[0] || '';
        const nom = member?.nom || (member?.name || '').split(' ').slice(1).join(' ') || '';
        const candidate = findBestPptx(dataDir, prenom, nom);

        console.log(`👤 [GENERATE-CV] ${member?.name || `${prenom} ${nom}`}`);
        if (!candidate) {
          const msg = `CV personnel introuvable dans server/data (variantes normalisées testées pour "${prenom} ${nom}")`;
          console.warn(`⚠️ [GENERATE-CV] ${msg}`);
          errors.push({ member: member.name || `${prenom} ${nom}`, error: msg });
          continue;
        }

        const sourcePath = candidate.file;
        const resolutionStrategy = candidate.match;
        const sourceExists = fs.existsSync(sourcePath);

        console.log(`   📄 Source PPTX (résolution: ${resolutionStrategy}): ${sourcePath} | exists=${sourceExists}`);
        if (!sourceExists) {
          const msg = `CV personnel détecté mais introuvable sur le disque: ${sourcePath}`;
          console.warn(`⚠️ [GENERATE-CV] ${msg}`);
          errors.push({ member: member.name || `${prenom} ${nom}`, error: msg });
          continue;
        }

        const assoc = associations[member.id] ?? associations[String(member.id)] ?? associations[Number(member.id)] ?? [];
        const refIds = Array.isArray(assoc) ? assoc.map((x) => String(x)) : [];
        const memberRefs = refIds.map((id) => refsNormalized.find((r) => r.id === id)).filter(Boolean);

        console.log(`   🔗 Refs associées: ${memberRefs.length} (IDs: ${refIds.join(', ') || '-'})`);

        const zip = new JSZip();
        const buffer = fs.readFileSync(sourcePath);
        const content = await zip.loadAsync(buffer);

        const xmlFiles = Object.keys(content.files).filter(
          (f) => f.startsWith('ppt/') && f.endsWith('.xml') && !f.includes('_rels')
        );

        let filesTouched = 0;
        for (const fileName of xmlFiles) {
          const file = content.files[fileName];
          if (!file || file.dir) continue;

          const xml = await file.async('string');
          let newXml = xml;

          // Injection NON-destructive
          newXml = replaceShapeBlocks(newXml, memberRefs);
          newXml = replaceReferenceBlocks(newXml, memberRefs);
          newXml = replaceRefPlaceholders(newXml, memberRefs);
          newXml = replaceAliasPlaceholders(newXml, memberRefs);

          if (newXml !== xml) {
            filesTouched++;
            content.file(fileName, newXml);
            console.log(`   ✏️  Remplacement dans ${fileName}`);
          }
        }

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const baseName = toSafeBaseName(member?.name || `${prenom} ${nom}`) || 'cv';
        const outputFilename = `cv_${baseName}_${timestamp}.pptx`;
        const outputPath = path.join(downloadsDir, outputFilename);

        const outBuffer = await content.generateAsync({ type: 'nodebuffer' });
        fs.writeFileSync(outputPath, outBuffer);

        generatedFiles.push({
          member: member.name || `${prenom} ${nom}`,
          filename: outputFilename,
          downloadUrl: `/api/download/${outputFilename}`,
          source: path.basename(sourcePath),
          sourcePath,
          resolutionStrategy,
          referencesCount: memberRefs.length,
          filesTouched,
          fileSize: outBuffer.length,
        });

        console.log(`✅ [GENERATE-CV] Généré: ${outputFilename} | refs=${memberRefs.length} | fichiers modifiés=${filesTouched}`);
      }

      const response = {
        message: 'CV générés avec succès',
        generatedFiles,
        totalFiles: generatedFiles.length,
        errors,
      };

      console.log('✅ [GENERATE-CV] Total générés:', response.totalFiles);
      if (errors.length) console.log('⚠️ [GENERATE-CV] Erreurs:', errors.length, errors);
      console.log('=== 🏁 [GENERATE-CV] FIN GÉNÉRATION ===\n');

      res.json(response);
    } catch (error) {
      console.error('💥 [GENERATE-CV] ERREUR:', error.message);
      console.error('💥 [GENERATE-CV] Stack:', error.stack);
      res.status(500).json({ error: 'Erreur lors de la génération des CV', details: error.message });
    }
  });
}

module.exports = { registerGenerateCvRoutes };