import JSZip from 'jszip';

// Échappement XML sûr
function xmlEscape(value: any) {
  return String(value ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function formatMontant(value: any) {
  if (value === null || value === undefined) return '';
  const num = typeof value === 'number' ? value : Number(value);
  if (Number.isNaN(num)) return xmlEscape(String(value ?? ''));
  return xmlEscape(new Intl.NumberFormat('fr-FR').format(num) + ' €');
}

export function mapReferenceFields(ref: any) {
  return {
    REF_RESIDENCE: xmlEscape(ref?.residence || ref?.nom_projet || ''),
    REF_MOA: xmlEscape(ref?.moa || ref?.client || ''),
    REF_MONTANT: ref?.montant !== undefined && ref?.montant !== null ? formatMontant(ref.montant) : '',
    REF_TRAVAUX: xmlEscape(ref?.travaux || ref?.type_mission || ''),
    REF_REALISATION: xmlEscape(ref?.realisation || ref?.annee || ''),
  };
}

function buildReferenceBlock(ref: any) {
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

// Remplacements reference_i
function replaceTextTokenExact(xml: string, token: string, replacement: string) {
  const esc = token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`<a:t([^>]*)>\\s*${esc}\\s*<\\/a:t>`, 'g');
  const safe = xmlEscape(replacement);
  return xml.replace(re, `<a:t$1>${safe}</a:t>`);
}

function replaceTokenFlexible(xml: string, token: string, replacement: string) {
  const safe = xmlEscape(replacement);
  // direct
  xml = replaceTextTokenExact(xml, token, replacement);
  const [prefix, suffix] = token.split('_');
  // "<a:t>reference_</a:t><a:t>1</a:t>"
  xml = xml.replace(
    new RegExp(`<a:t([^>]*)>\\s*${prefix}_\\s*<\\/a:t>\\s*<a:t([^>]*)>\\s*${suffix}\\s*<\\/a:t>`, 'g'),
    (_m, a1, a2) => (replacement ? `<a:t${a1}>${safe}</a:t><a:t${a2}></a:t>` : `<a:t${a1}></a:t><a:t${a2}></a:t>`)
  );
  // "<a:t>reference</a:t><a:t>_1</a:t>"
  xml = xml.replace(
    new RegExp(`<a:t([^>]*)>\\s*${prefix}\\s*<\\/a:t>\\s*<a:t([^>]*)>\\s*_${suffix}\\s*<\\/a:t>`, 'g'),
    (_m, a1, a2) => (replacement ? `<a:t${a1}>${safe}</a:t><a:t${a2}></a:t>` : `<a:t${a1}></a:t><a:t${a2}></a:t>`)
  );
  // "<a:t>reference</a:t><a:t>_</a:t><a:t>1</a:t>"
  xml = xml.replace(
    new RegExp(
      `<a:t([^>]*)>\\s*${prefix}\\s*<\\/a:t>\\s*<a:t([^>]*)>\\s*_\\s*<\\/a:t>\\s*<a:t([^>]*)>\\s*${suffix}\\s*<\\/a:t>`,
      'g'
    ),
    (_m, a1, a2, a3) => (replacement ? `<a:t${a1}>${safe}</a:t><a:t${a2}></a:t><a:t${a3}></a:t>` : `<a:t${a1}></a:t><a:t${a2}></a:t><a:t${a3}></a:t>`)
  );
  return xml;
}

// Masquage shape reference_i via hidden="1" sur p:cNvPr name="reference_i"
function setShapeHidden(xml: string, shapeName: string, hidden: boolean) {
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

// Remplacement séquentiel des {{REF_*}} / {REF_*}
function replaceRefPlaceholders(xml: string, refs: any[]) {
  if (!Array.isArray(refs) || refs.length === 0) {
    return xml.replace(/\{\{?REF_(RESIDENCE|MOA|MONTANT|TRAVAUX|REALISATION)\}?\}/g, '');
  }
  const MAX = 5;
  const limited = refs.slice(0, MAX).map(mapReferenceFields);
  const counters: Record<string, number> = {
    REF_RESIDENCE: 0,
    REF_MOA: 0,
    REF_MONTANT: 0,
    REF_TRAVAUX: 0,
    REF_REALISATION: 0,
  };

  const replaceOne = (content: string, key: keyof ReturnType<typeof mapReferenceFields>) => {
    const re = new RegExp(`\\{\\{${key}\\}\\}|\\{${key}\\}`, 'g');
    return content.replace(re, () => {
      const i = counters[key];
      counters[key] = i + 1;
      if (i < limited.length) return (limited[i] as any)[key] || '';
      return '';
    });
  };

  let out = xml;
  out = replaceOne(out, 'REF_RESIDENCE');
  out = replaceOne(out, 'REF_MOA');
  out = replaceOne(out, 'REF_MONTANT');
  out = replaceOne(out, 'REF_TRAVAUX');
  out = replaceOne(out, 'REF_REALISATION');

  // Nettoyage de sûreté
  out = out.replace(/\{\{?REF_(RESIDENCE|MOA|MONTANT|TRAVAUX|REALISATION)\}?\}/g, '');
  return out;
}

export function replaceShapeBlocks(xml: string, refs: any[]) {
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

export async function clientGeneratePptx(original: ArrayBuffer, references: any[]) {
  const zip = await JSZip.loadAsync(original);
  const files = Object.keys(zip.files).filter(
    (f) => f.startsWith('ppt/') && f.endsWith('.xml') && !f.includes('_rels')
  );

  for (const fileName of files) {
    const file = zip.file(fileName);
    if (!file) continue;
    const xml = await file.async('string');

    let newXml = xml;
    newXml = replaceShapeBlocks(newXml, references);
    newXml = replaceRefPlaceholders(newXml, references);

    if (newXml !== xml) {
      zip.file(fileName, newXml);
    }
  }

  const outBlob = await zip.generateAsync({ type: 'blob' });
  return outBlob;
}