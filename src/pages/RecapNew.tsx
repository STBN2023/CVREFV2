import React, { useEffect, useState } from 'react';
import { useWorkflow } from '@/components/WorkflowContext';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { showSuccess, showError, showLoading, dismissToast, dismissAllToasts } from '@/utils/toast';
import { clientGeneratePptx } from '@/utils/pptxClient';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

interface Employee {
  id: string;
  name: string;
  [key: string]: any;
}

interface Reference {
  id: string;
  nom_projet: string;
  description_courte?: string;
  description_longue?: string;
  montant?: number | null;
  [key: string]: any;
}

const sanitize = (s: string) =>
  String(s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '');

const RecapStep = () => {
  console.log('🚀 [RECAP] Composant Recap monté');
  
  const {
    selectedTeam,
    selectedReferences,
    referenceAssociation
  } = useWorkflow();
  
  const navigate = useNavigate();
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [references, setReferences] = useState<Reference[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [defaultMap, setDefaultMap] = useState<Record<string, string[]>>({});
  const [loadingDefaults, setLoadingDefaults] = useState(false);
  
  console.log('📋 [RECAP] Context data:', {
    selectedTeam: selectedTeam?.length || 0,
    selectedReferences: selectedReferences?.length || 0,
    referenceAssociation: Object.keys(referenceAssociation || {}).length
  });

  // Chargement des données depuis le backend
  useEffect(() => {
    const fetchData = async () => {
      try {
        console.log('🔄 [RECAP] Chargement des données...');
        setLoading(true);
        
        // Chargement des employés
        const employeesResponse = await fetch(`${BACKEND_URL}/api/salaries`);
        if (!employeesResponse.ok) throw new Error('Erreur chargement employés');
        const employeesData = await employeesResponse.json();
        
        const employeesFormatted = employeesData.salaries.map((emp: any) => ({
          id: emp.id_salarie.toString(),
          name: `${emp.prenom} ${emp.nom}`,
          ...emp
        }));
        setEmployees(employeesFormatted);
        console.log('👥 [RECAP] Employés chargés:', employeesFormatted.length);
        
        // Chargement des références
        const referencesResponse = await fetch(`${BACKEND_URL}/api/references`);
        if (!referencesResponse.ok) throw new Error('Erreur chargement références');
        const referencesData = await referencesResponse.json();
        
        const referencesFormatted = referencesData.references.map((ref: any) => ({
          id: ref.id_reference.toString(),
          nom_projet: ref.nom_projet,
          description_courte: ref.description_courte,
          description_longue: ref.description_longue,
          ...ref
        }));
        setReferences(referencesFormatted);
        console.log('📋 [RECAP] Références chargées:', referencesFormatted.length);
        
      } catch (err) {
        console.error('❌ [RECAP] Erreur:', err);
        setError(err instanceof Error ? err.message : 'Erreur inconnue');
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Charger les références par défaut par membre pour colorer les cartes
  useEffect(() => {
    const fetchDefaults = async () => {
      try {
        const ids = selectedTeam
          .map((m: any) => (typeof m === 'string' ? m : (m?.id?.toString?.() ?? m?.id_salarie?.toString?.())))
          .filter(Boolean);
        if (ids.length === 0) { setDefaultMap({}); return; }
        setLoadingDefaults(true);
        const entries = await Promise.all(ids.map(async (id: string) => {
          try {
            const resp = await fetch(`${BACKEND_URL}/api/salaries/${id}/references`);
            if (!resp.ok) return [id, []] as const;
            const data = await resp.json();
            const arr = (data.references || [])
              .map((r: any) => r?.id_reference?.toString?.())
              .filter(Boolean);
            return [id, arr] as const;
          } catch {
            return [id, []] as const;
          }
        }));
        const map: Record<string, string[]> = {};
        entries.forEach(([id, arr]) => { map[id] = arr; });
        setDefaultMap(map);
      } finally {
        setLoadingDefaults(false);
      }
    };
    fetchDefaults();
  }, [JSON.stringify(selectedTeam)]);

  // Helpers
  const isProd = import.meta.env.MODE === 'production';
  const buildDataUrl = (slug: string) => (isProd ? `/data/${slug}` : `${BACKEND_URL}/data/${slug}`);
  const getEmployeeById = (id: string) => employees.find(e => e.id === id);
  const getMemberSlug = (emp: Employee | undefined) => {
    const prenom = (emp as any)?.prenom || emp?.name?.split(' ')?.[0] || '';
    const nom = (emp as any)?.nom || emp?.name?.split(' ')?.slice(1).join(' ') || '';
    return `${sanitize(prenom)}_${sanitize(nom)}.pptx`;
  };
  const getMemberRefs = (memberId: string) => {
    const ids = referenceAssociation[parseInt(memberId, 10)] || [];
    return ids
      .map((rid: number) => references.find(r => r.id === String(rid)))
      .filter(Boolean) as Reference[];
  };

  // Fallback client-side: génère un PPTX par membre dans le navigateur
  const clientSideGenerateAll = async () => {
    const toastId = showLoading('Génération locale des CV en cours…');
    let successCount = 0;
    let failCount = 0;

    try {
      for (const m of selectedTeam) {
        const memberId = typeof m === 'string' ? m : (m?.id?.toString?.() ?? m?.id_salarie?.toString?.());
        if (!memberId) continue;

        const emp = getEmployeeById(memberId) || (m as any);
        const slug = getMemberSlug(emp);
        const url = buildDataUrl(slug);

        // Vérifier l’existence du fichier
        let exists = false;
        try {
          const headResp = await fetch(url, { method: 'HEAD' });
          exists = headResp.ok;
        } catch {
          exists = false;
        }

        if (!exists) {
          console.warn(`⚠️ [RECAP] CV introuvable pour ${emp?.name || memberId}: ${slug}`);
          failCount++;
          continue;
        }

        // Télécharger le PPTX source
        const resp = await fetch(url);
        if (!resp.ok) {
          console.warn(`⚠️ [RECAP] Lecture PPTX échouée pour ${slug}: HTTP ${resp.status}`);
          failCount++;
          continue;
        }
        const buf = await resp.arrayBuffer();

        // Références du membre (si vides, on conserve tel quel)
        const refs = getMemberRefs(memberId).map(r => ({
          id: r.id,
          nom_projet: r.nom_projet,
          client: (r as any).client,
          ville: (r as any).ville,
          annee: (r as any).annee,
          type_mission: (r as any).type_mission,
          montant: (r as any).montant,
          description_projet: r.description_courte || r.description_longue || '',
        }));

        // Générer blob PPTX
        const outBlob = await clientGeneratePptx(buf, refs);

        // Nom final
        const prenom = (emp as any)?.prenom || emp?.name?.split(' ')?.[0] || '';
        const nom = (emp as any)?.nom || emp?.name?.split(' ')?.slice(1).join(' ') || '';
        const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
        const outName = `cv_${sanitize(prenom)}_${sanitize(nom)}_${stamp}.pptx`;

        // Télécharger
        const dlUrl = URL.createObjectURL(outBlob);
        const a = document.createElement('a');
        a.href = dlUrl;
        a.download = outName;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(dlUrl);

        successCount++;
      }

      if (successCount > 0) {
        showSuccess(`✅ ${successCount} CV généré(s) localement${failCount ? `, ${failCount} échec(s)` : ''}`);
      } else {
        showError('❌ Aucun CV généré localement (CV source introuvables ou erreurs de lecture).');
      }
    } finally {
      dismissToast(String(toastId));
      // Sécurité: ferme tout au cas où
      dismissAllToasts();
    }
  };

  // Génération: serveur d’abord, fallback client si erreur quelconque
  const handleGenerateCV = async () => {
    console.log('🟦 [RECAP] Début génération des CV…');
    setGenerating(true);
    const waitId = showLoading('Génération des CV…');

    try {
      // Préparer les données pour l’API serveur
      const teamData = selectedTeam.map((member: any) => {
        const memberId = typeof member === 'string'
          ? member
          : (member?.id?.toString?.() ?? member?.id_salarie?.toString?.());
        const employee = employees.find(emp => emp.id === memberId);

        return {
          id: memberId,
          name: employee?.name || `Employé ${memberId}`,
          prenom: (employee as any)?.prenom || employee?.name?.split(' ')?.[0] || '',
          nom: (employee as any)?.nom || employee?.name?.split(' ')?.slice(1).join(' ') || '',
          fonction: (employee as any)?.fonction || 'Non spécifié',
          agence: (employee as any)?.agence || 'Non spécifié',
          niveau_expertise: (employee as any)?.niveau_expertise || 'Non spécifié'
        };
      });

      const referencesData = selectedReferences.map(refId => {
        const reference = references.find(ref => ref.id === refId);
        return {
          id: refId,
          nom_projet: reference?.nom_projet || `Projet ${refId}`,
          client: (reference as any)?.client || 'Client non spécifié',
          ville: (reference as any)?.ville || 'Non spécifié',
          annee: (reference as any)?.annee || new Date().getFullYear(),
          type_mission: (reference as any)?.type_mission || 'Non spécifié',
          montant: (reference as any)?.montant ?? null,
          description_projet: reference?.description_projet || reference?.description_courte || reference?.description_longue || 'Aucune description'
        };
      });

      const associations: Record<string, number[]> = {};
      Object.entries(referenceAssociation || {}).forEach(([k, v]) => {
        associations[k] = v;
      });

      // Tentative serveur
      const serverResp = await fetch(`${BACKEND_URL}/api/generate-cv`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ teamData, referencesData, associations }),
      });

      if (!serverResp.ok) {
        // Fallback sur erreurs connues
        if (serverResp.status === 404 || serverResp.status === 410) {
          dismissToast(String(waitId));
          await clientSideGenerateAll();
          return;
        }
        // Fallback sur tout autre code d’erreur
        const errText = await serverResp.text().catch(() => '');
        console.warn('⚠️ /api/generate-cv error:', serverResp.status, errText);
        dismissToast(String(waitId));
        await clientSideGenerateAll();
        return;
      }

      const result = await serverResp.json();
      console.log('✅ [RECAP] CV générés (serveur):', result);

      // Close loader
      dismissToast(String(waitId));
      dismissAllToasts();

      showSuccess(`✅ ${result.totalFiles} CV généré(s) côté serveur`);
      // Redirection vers téléchargements
      setTimeout(() => {
        navigate('/downloads');
      }, 600);
    } catch (e: any) {
      dismissToast(String(waitId));
      dismissAllToasts();
      showError(`Erreur lors de la génération des CV: ${e?.message || 'inconnue'}`);
    } finally {
      setGenerating(false);
      // Sécurité supplémentaire
      dismissAllToasts();
    }
  };

  // Validation du workflow
  const hasAssociations = Object.values(referenceAssociation || {}).some(arr => (arr?.length ?? 0) > 0);
  const isWorkflowValid = selectedTeam.length > 0 && (selectedReferences.length > 0 || hasAssociations);
  const selectedTeamIds = selectedTeam
    .map((m: any) => (typeof m === 'string' ? m : (m?.id?.toString?.() ?? m?.id_salarie?.toString?.())))
    .filter(Boolean);
  
  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <h1>Chargement du récapitulatif...</h1>
        <p>Récupération des données depuis la base de données...</p>
      </div>
    );
  }
  
  if (error) {
    return (
      <div style={{ padding: '20px', color: 'red' }}>
        <h1>Erreur</h1>
        <p>Erreur lors du chargement : {error}</p>
        <Button onClick={() => navigate('/team')}>Retour à la sélection d'équipe</Button>
      </div>
    );
  }
  
  if (!isWorkflowValid) {
    return (
      <div style={{ padding: '20px' }}>
        <h1>Workflow incomplet</h1>
        <p>Veuillez d'abord sélectionner une équipe et des références.</p>
        <div style={{ marginTop: '20px' }}>
          <Button onClick={() => navigate('/team')} style={{ marginRight: '10px' }}>
            Sélectionner une équipe
          </Button>
          <Button onClick={() => navigate('/references')}>
            Sélectionner des références
          </Button>
        </div>
      </div>
    );
  }
  
  // Vue par membre avec coloration Par défaut / Personnalisée
  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold text-sky-700 mb-6">📋 Récapitulatif de la génération CV</h1>

      <div className="flex items-center justify-between mb-4 text-sm">
        <div className="text-gray-600 flex items-center gap-4">
          <span className="inline-flex items-center"><span className="h-3 w-3 rounded-sm bg-amber-300 mr-2"></span>Par défaut</span>
          <span className="inline-flex items-center"><span className="h-3 w-3 rounded-sm bg-sky-300 mr-2"></span>Personnalisée</span>
        </div>
        <div className="text-gray-500">Membres: {selectedTeamIds.length} • Associations: {Object.values(referenceAssociation).reduce((s, a: any) => s + (a?.length || 0), 0)}</div>
      </div>

      {(loadingDefaults || loading) && (
        <div className="text-gray-600 mb-4">Chargement des données du récapitulatif…</div>
      )}

      <div className="space-y-8">
        {selectedTeamIds.map((empId: string) => {
          const employee = employees.find(e => e.id === empId);
          const keyNum = parseInt(empId, 10);
          const refIdsNum: number[] = (referenceAssociation as any)[keyNum] || [];
          const refs = refIdsNum
            .map((rid: number) => references.find(r => r.id === rid.toString()))
            .filter(Boolean) as Reference[];

          return (
            <section key={empId} className="bg-amber-50 border border-amber-200 rounded-2xl p-5 shadow">
              <div className="flex items-center mb-4">
                <div className="h-10 w-10 rounded-full bg-amber-400 text-white flex items-center justify-center font-semibold mr-3">
                  {(employee?.name || ' ').charAt(0).toUpperCase()}
                </div>
                <div>
                  <div className="font-semibold text-amber-900">{employee?.name || `Employé ${empId}`}</div>
                  <div className="text-sm text-amber-700">{refs.length} références sélectionnées</div>
                </div>
              </div>

              {refs.length > 0 ? (
                <div className="grid md:grid-cols-2 gap-3">
                  {refs.map((ref: any) => {
                    const isDefault = (defaultMap[empId] || []).includes(ref.id);
                    const cardClass = isDefault ? 'bg-amber-100 border-amber-300' : 'bg-sky-50 border-sky-200';
                    const badgeClass = isDefault ? 'bg-amber-200 text-amber-800' : 'bg-sky-200 text-sky-800';
                    const year = (ref.annee as any) || '';
                    return (
                      <div key={ref.id} className={`rounded-lg border p-3 ${cardClass}`}>
                        <div className="flex items-start justify-between">
                          <h3 className="font-medium text-gray-800">{ref.nom_projet}</h3>
                          {year && <span className={`text-xs px-2 py-0.5 rounded-full ${badgeClass}`}>{year}</span>}
                        </div>
                        <div className="text-sm text-gray-600 mt-1">
                          {ref.description_courte || ref.description_longue || 'Aucune description disponible'}
                        </div>
                        <div className="text-xs text-gray-500 mt-2">
                          {(ref as any).client ? `Client: ${(ref as any).client}` : ''}{(ref as any).ville ? ` • ${(ref as any).ville}` : ''}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-sm text-gray-500 italic">Aucune référence associée</div>
              )}
            </section>
          );
        })}
      </div>

      {/* Actions */}
      <div className="mt-8 flex gap-3 justify-center">
        <Button onClick={() => navigate('/association')} variant="outline">← Modifier les associations</Button>
        <Button onClick={handleGenerateCV} disabled={generating} className="bg-blue-600 hover:bg-blue-700">
          {generating ? '⏳ Génération en cours...' : '🚀 Générer les CV'}
        </Button>
      </div>

      {/* Informations de débogage */}
      <div className="mt-8 p-4 bg-slate-100 rounded-lg text-xs text-slate-600">
        <div className="font-semibold mb-1">🔧 Informations de débogage</div>
        <ul className="list-disc pl-5">
          <li>Backend URL: {BACKEND_URL}</li>
          <li>Employés chargés: {employees.length}</li>
          <li>Références chargées: {references.length}</li>
          <li>Équipe sélectionnée: {selectedTeam.length} membres</li>
          <li>Associations: {Object.keys(referenceAssociation).length} membres associés</li>
        </ul>
      </div>
    </div>
  );
};

export default RecapStep;