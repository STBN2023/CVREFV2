const path = require('path');

function safeFilename(filename) {
  return String(filename || '').replace(/[^a-zA-Z0-9._-]/g, '_');
}

function sanitizeSlug(s) {
  return String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
}

// Échappement XML sûr
function xmlEscape(value) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function formatMontant(value) {
  if (value === null || value === undefined) return '';
  const num = typeof value === 'number' ? value : Number(value);
  if (Number.isNaN(num)) return xmlEscape(String(value ?? ''));
  return xmlEscape(new Intl.NumberFormat('fr-FR').format(num) + ' €');
}

function mapReferenceFields(ref) {
  return {
    REF_RESIDENCE: xmlEscape(ref?.residence || ref?.nom_projet || ''),
    REF_MOA: xmlEscape(ref?.moa || ref?.client || ''),
    REF_MONTANT: ref?.montant !== undefined && ref?.montant !== null ? formatMontant(ref.montant) : '',
    REF_TRAVAUX: xmlEscape(ref?.travaux || ref?.type_mission || ''),
    REF_REALISATION: xmlEscape(ref?.realisation || ref?.annee || ''),
  };
}

function buildReferenceBlock(ref) {
  const r = mapReferenceFields(ref);
  const parts = [
    r.REF_RESIDENCE,
    r.REF_MOA ? `Maître d'ouvrage: ${r.REF_MOA}` : '',
    r.REF_MONTANT ? `Montant: ${r.REF_MONTANT}` : '',
    r.REF_TRAVAUX ? `Travaux: ${r.REF_TRAVAUX}` : '',
    r.REF_REALISATION ? `Réalisation: ${r.REF_REALISATION}` : '',
  ].filter(Boolean);
  return parts.join(' — ');
}

// Cas direct: <a:t>reference_1</a:t>
function replaceTextTokenExact(xml, token, replacement) {
  const esc = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`<a:t([^>]*)>\\s*${esc}\\s*<\\/a:t>`, 'g');
  const safe = xmlEscape(replacement);
  return xml.replace(re, `<a:t$1>${safe}</a:t>`);
}

// Remplacement flexible sur 1/2/3 runs
function replaceTokenFlexible(xml, token, replacement) {
  const safe = xmlEscape(replacement);
  // 1) direct
  xml = replaceTextTokenExact(xml, token, replacement);

  const [prefix, suffix] = token.split('_'); // "reference", "1"

  // 2) "<a:t>reference_</a:t><a:t>1</a:t>"
  xml = xml.replace(
    new RegExp(`<a:t([^>]*)>\\s*${prefix}_\\s*<\\/a:t>\\s*<a:t([^>]*)>\\s*${suffix}\\s*<\\/a:t>`, 'g'),
    (_m, a1, a2) => (replacement ? `<a:t${a1}>${safe}</a:t><a:t${a2}></a:t>` : `<a:t${a1}></a:t><a:t${a2}></a:t>`)
  );

  // 3) "<a:t>reference</a:t><a:t>_1</a:t>"
  xml = xml.replace(
    new RegExp(`<a:t([^>]*)>\\s*${prefix}\\s*<\\/a:t>\\s*<a:t([^>]*)>\\s*_${suffix}\\s*<\\/a:t>`, 'g'),
    (_m, a1, a2) => (replacement ? `<a:t${a1}>${safe}</a:t><a:t${a2}></a:t>` : `<a:t${a1}></a:t><a:t${a2}></a:t>`)
  );

  // 4) "<a:t>reference</a:t><a:t>_</a:t><a:t>1</a:t>"
  xml = xml.replace(
    new RegExp(
      `<a:t([^>]*)>\\s*${prefix}\\s*<\\/a:t>\\s*<a:t([^>]*)>\\s*_\\s*<\\/a:t>\\s*<a:t([^>]*)>\\s*${suffix}\\s*<\\/a:t>`,
      'g'
    ),
    (_m, a1, a2, a3) => (replacement ? `<a:t${a1}>${safe}</a:t><a:t${a2}></a:t><a:t${a3}></a:t>` : `<a:t${a1}></a:t><a:t${a2}></a:t><a:t${a3}></a:t>`)
  );

  return xml;
}

/**
 * Ajoute/supprime hidden="1" sur le p:cNvPr name="shapeName"
 */
function setShapeHidden(xml, shapeName, hidden) {
  const nameEsc = shapeName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`(<p:cNvPr\\b[^>]*name="${nameEsc}"[^>]*)(>)`, 'g');
  return xml.replace(re, (_m, before, end) => {
    if (hidden) {
      if (/\bhidden="/i.test(before)) {
        return before.replace(/\bhidden="[^"]*"/i, 'hidden="1"') + end;
      }
      return before + ' hidden="1"' + end;
    } else {
      return before.replace(/\s*hidden="[^"]*"/i, '') + end;
    }
  });
}

/**
 * Remplacement NON destructif + masquage des shapes reference_i absentes:
 * - si ref présente => remplace token (y compris découpé) et rend la shape visible
 * - si absente => vide les <a:t> impliqués et masque la shape (hidden="1")
 */
function replaceShapeBlocks(xml, refs) {
  const MAX = 5;
  const refsToShow = Array.isArray(refs) ? refs.slice(0, MAX) : [];

  let out = xml;

  for (let i = 1; i <= MAX; i++) {
    const token = `reference_${i}`;
    const shapeName = `reference_${i}`;
    if (refsToShow[i - 1]) {
      const block = buildReferenceBlock(refsToShow[i - 1]) || '';
      out = replaceTokenFlexible(out, token, block);
      out = setShapeHidden(out, shapeName, false);
    } else {
      out = replaceTokenFlexible(out, token, '');
      out = setShapeHidden(out, shapeName, true);
    }
  }

  return out;
}

/**
 * Remplacement des placeholders en accolades, distribution séquentielle
 * Exemple: première occurrence de {{REF_RESIDENCE}} → ref[0].REF_RESIDENCE, deuxième → ref[1]...
 */
function replaceRefPlaceholders(xml, refs) {
  if (!Array.isArray(refs) || refs.length === 0) {
    // aucune donnée: supprimer visuellement les placeholders
    return xml.replace(/\{\{?REF_(RESIDENCE|MOA|MONTANT|TRAVAUX|REALISATION)\}?\}/g, '');
  }

  const MAX = 5;
  const limited = refs.slice(0, MAX).map(mapReferenceFields);

  // Compteurs alignés par clé
  const counters = {
    REF_RESIDENCE: 0,
    REF_MOA: 0,
    REF_MONTANT: 0,
    REF_TRAVAUX: 0,
    REF_REALISATION: 0,
  };

  const replaceOneKey = (content, key) => {
    // Deux formes: {{REF_*}} et {REF_*}
    const re = new RegExp(`\\{\\{${key}\\}\\}|\\{${key}\\}`, 'g');
    return content.replace(re, () => {
      const i = counters[key];
      counters[key] = i + 1;
      if (i < limited.length) {
        return limited[i][key] || '';
      }
      return ''; // au-delà: vider
    });
  };

  let out = xml;
  out = replaceOneKey(out, 'REF_RESIDENCE');
  out = replaceOneKey(out, 'REF_MOA');
  out = replaceOneKey(out, 'REF_MONTANT');
  out = replaceOneKey(out, 'REF_TRAVAUX');
  out = replaceOneKey(out, 'REF_REALISATION');

  // Nettoyage de sûreté: enlever tout placeholder restant
  out = out.replace(/\{\{?REF_(RESIDENCE|MOA|MONTANT|TRAVAUX|REALISATION)\}?\}/g, '');

  return out;
}

// Garde no-op pour éviter de toucher d'autres patterns
function replaceReferenceBlocks(xml, _refs) {
  return xml;
}

function replaceAliasPlaceholders(xml, _refs) {
  return xml;
}

/**
 * Convertit une chaîne en base "sûre" pour noms de fichiers:
 * - gestion ligatures (œ/æ/ß),
 * - dé-accentuation (NFD + suppression diacritiques),
 * - remplacement des séquences non alphanumériques par "_",
 * - trim des "_" et passage en minuscules.
 */
function toSafeBaseName(input) {
  let s = String(input || '');

  // Ligatures courantes
  s = s.replace(/œ/gi, (m) => (m === 'œ' ? 'oe' : 'oe'))
       .replace(/æ/gi, (m) => (m === 'æ' ? 'ae' : 'ae'))
       .replace(/ß/g, 'ss');

  // Dé-accentuation Unicode
  s = s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Remplacement des séquences non alphanumériques par "_"
  s = s.replace(/[^a-zA-Z0-9]+/g, '_');

  // Trim underscores superflus, puis minuscule
  s = s.replace(/^_+|_+$/g, '').toLowerCase();

  return s;
}

module.exports = {
  safeFilename,
  sanitizeSlug,
  formatMontant,
  mapReferenceFields,
  replaceRefPlaceholders,
  replaceReferenceBlocks,
  replaceShapeBlocks,
  buildReferenceBlock,
  xmlEscape,
  setShapeHidden,
  // export ajouté pour corriger l'erreur
  replaceAliasPlaceholders,
  // nouveau: base sûre pour nom de fichier
  toSafeBaseName,
};