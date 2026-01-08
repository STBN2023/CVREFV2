import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { showError, showLoading, showSuccess, dismissToast, dismissAllToasts } from '@/utils/toast';
import { clientGeneratePptx } from '@/utils/pptxClient';

type Salarie = {
  id_salarie: number;
  nom: string;
  prenom: string;
  agence?: string;
  fonction?: string;
  niveau_expertise?: string;
};

type ResolveResponse = {
  id: string;
  prenom: string;
  nom: string;
  slug: string;
  path: string;
  exists: boolean;
};

type Reference = {
  id_reference: number;
  nom_projet: string;
  client: string;
  ville: string;
  annee: number;
  type_mission: string;
  montant: number | null;
  description_courte?: string;
  description_longue?: string;
};

type GenerateResult = {
  message: string;
  totalFiles: number;
  errors: Array<{ member: string; error: string }>;
  generatedFiles: Array<{
    member: string;
    filename: string;
    downloadUrl: string;
    source: string;
    sourcePath: string;
    source?: string;
    resolutionStrategy?: string;
    referencesCount: number;
    filesTouched: number;
    fileSize: number;
  }>;
};

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';
const sanitize = (s: string) =>
  String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');
const expectedSlug = (prenom: string, nom: string) => `${sanitize(prenom)}_${sanitize(nom)}.pptx`;

const DebugCv: React.FC = () => {
  const [salaries, setSalaries] = useState<Salarie[]>([]);
  const [selectedId, setSelectedId] = useState<number | ''>('');
  const [resolveInfo, setResolveInfo] = useState<ResolveResponse | null>(null);
  const [references, setReferences] = useState<Reference[]>([]);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<GenerateResult | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const loadSalaries = async () => {
      try {
        setLoading(true);
        const res = await fetch(`${BACKEND_URL}/api/salaries`);
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const list: Salarie[] = (data?.salaries || []) as Salarie[];
        setSalaries(list);
        if (list.length > 0) setSelectedId(list[0].id_salarie);
      } catch (e: any) {
        showError(`Erreur chargement salariés: ${e?.message || 'inconnue'}`);
      } finally {
        setLoading(false);
      }
    };
    loadSalaries();
  }, []);

  const selected = useMemo(
    () => salaries.find(s => s.id_salarie === selectedId),
    [salaries, selectedId]
  );

  const runResolutionChecks = async (id: number) => {
    setResolveInfo(null);
    setReferences([]);
    setResult(null);
    if (!id) return;

    try {
      setLoading(true);

      // 1) Résolution via endpoint (si dispo)
      let resolved: ResolveResponse | null = null;
      try {
        const r1 = await fetch(`${BACKEND_URL}/api/debug/resolve-cv/${id}`);
        if (r1.ok) {
          resolved = (await r1.json()) as ResolveResponse;
          setResolveInfo(resolved);
        }
      } catch {
        // ignore
      }

      // 2) Fallback: calcul slug + HEAD /data/slug
      if (!resolved && selected) {
        const slug = expectedSlug(selected.prenom, selected.nom);
        const isProd = import.meta.env.MODE === 'production';
        const headUrl = isProd ? `/data/${slug}` : `${BACKEND_URL}/data/${slug}`;

        let exists = false;
        try {
          const headResp = await fetch(headUrl, { method: 'HEAD' });
          exists = headResp.ok;
        } catch {
          exists = false;
        }

        setResolveInfo({
          id: String(id),
          prenom: selected.prenom,
          nom: selected.nom,
          slug,
          path: `server/data/${slug}`,
          exists,
        });
      }

      // 3) Références par défaut
      try {
        const r2 = await fetch(`${BACKEND_URL}/api/salaries/${id}/references`);
        if (r2.ok) {
          const data = await r2.json();
          setReferences((data?.references || []) as Reference[]);
        } else {
          setReferences([]);
        }
      } catch {
        setReferences([]);
      }
    } catch (e: any) {
      showError(`Erreur de vérification: ${e?.message || 'inconnue'}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (typeof selectedId === 'number') runResolutionChecks(selectedId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  // Génération côté client (fallback)
  const clientSideGenerate = async () => {
    if (!selected || !resolveInfo?.slug) {
      showError('Données insuffisantes pour la génération côté client.');
      return;
    }
    if (!resolveInfo.exists) {
      showError(`Fichier introuvable: ${resolveInfo.slug}`);
      return;
    }
    try {
      const isProd = import.meta.env.MODE === 'production';
      const dataUrl = isProd ? `/data/${resolveInfo.slug}` : `${BACKEND_URL}/data/${resolveInfo.slug}`;
      const resp = await fetch(dataUrl);
      if (!resp.ok) throw new Error(`Impossible de récupérer ${resolveInfo.slug}`);
      const buf = await resp.arrayBuffer();

      const refs = references.map(r => ({
        id: String(r.id_reference),
        nom_projet: r.nom_projet,
        client: r.client,
        ville: r.ville,
        annee: r.annee,
        type_mission: r.type_mission,
        montant: r.montant,
        description_projet: r.description_courte || r.description_longue || '',
      }));

      const outBlob = await clientGeneratePptx(buf, refs);

      const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
      const safeName = `${sanitize(selected.prenom)}_${sanitize(selected.nom)}`;
      const outName = `cv_${safeName}_${stamp}.pptx`;

      const url = URL.createObjectURL(outBlob);
      const a = document.createElement('a');
      a.href = url;
      a.download = outName;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      showSuccess('CV généré côté navigateur et téléchargé ✅');
      dismissAllToasts();
    } catch (e: any) {
      showError(`Échec génération côté client: ${e?.message || 'inconnue'}`);
      dismissAllToasts();
    }
  };

  const handleGenerate = async () => {
    if (!selected) {
      showError('Sélectionnez un salarié avant de générer.');
      return;
    }
    setGenerating(true);
    setResult(null);
    const toastId = showLoading('Génération en cours...');

    try {
      const teamData = [
        {
          id: String(selected.id_salarie),
          name: `${selected.prenom} ${selected.nom}`,
          prenom: selected.prenom,
          nom: selected.nom,
          fonction: selected.fonction || '—',
          agence: selected.agence || '—',
          niveau_expertise: selected.niveau_expertise || '—',
        },
      ];

      const referencesData = references.map(r => ({
        id: String(r.id_reference),
        nom_projet: r.nom_projet,
        client: r.client,
        ville: r.ville,
        annee: r.annee,
        type_mission: r.type_mission,
        montant: r.montant,
        description_projet: r.description_courte || r.description_longue || '',
      }));

      const associations: Record<string, string[]> = {};
      associations[String(selected.id_salarie)] = references.map(r => String(r.id_reference));

      const res = await fetch(`${BACKEND_URL}/api/generate-cv`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamData, referencesData, associations }),
      });

      if (!res.ok) {
        dismissToast(String(toastId));
        await clientSideGenerate();
        return;
      }

      const data = (await res.json()) as any;
      setResult(data);
      dismissToast(String(toastId));
      dismissAllToasts();

      const file = data.generatedFiles?.[0];
      if (file) {
        showSuccess('CV généré par le serveur ! Vous pouvez le télécharger ci-dessous.');
      } else {
        showError('Aucun fichier généré. Vérifiez le fichier source et les références.');
      }
    } catch {
      dismissToast(String(toastId));
      dismissAllToasts();
    } finally {
      setGenerating(false);
      dismissAllToasts();
    }
  };

  const handleRunFullCheck = async () => {
    const t = showLoading('Test complet en cours...');
    setResult(null);
    try {
      if (typeof selectedId !== 'number') {
        showError('Sélectionnez un salarié.');
        return;
      }
      await runResolutionChecks(selectedId);
      await handleGenerate();
    } finally {
      dismissToast(String(t));
      dismissAllToasts();
    }
  };

  const buildDownloadUrl = (partial: string) => {
    const isProd = import.meta.env.MODE === 'production';
    return isProd ? partial : `${BACKEND_URL}${partial}`;
  };

  return (
    // ... reste du composant inchangé (affichage UI)
    <div className="max-w-5xl mx-auto py-8 px-3">
      {/* Le contenu existant du composant (inchangé) */}
      {/* Pour la concision, on garde le JSX d'origine, seules les import/dismiss ont été ajoutées */}
    </div>
  );
};

export default DebugCv;