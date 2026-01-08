import React, { useEffect, useState } from 'react';
import { useWorkflow } from '@/components/WorkflowContext';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

interface Reference {
  id_reference: number;
  nom_projet: string;
  ville: string;
  annee: number;
  type_mission: string;
  montant: number | null;
  client: string;
  role_projet?: string;
  principal?: boolean;
}

type CvStatus = 'exists' | 'missing' | 'checking';

const ReferenceAssociation: React.FC = () => {
  const { 
    selectedTeam, 
    selectedReferences, 
    referenceAssociation, 
    setReferenceAssociation,
    setSelectedReferences,
    useDefaultReferences,
    setUseDefaultReferences
  } = useWorkflow();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [selectedMemberId, setSelectedMemberId] = useState<number | null>(null);
  const [employeeFilter, setEmployeeFilter] = useState('');
  const [referenceFilter, setReferenceFilter] = useState('');

  // Statut CV pour chaque salarié (exists/missing/checking)
  const [cvStatusMap, setCvStatusMap] = useState<Record<number, CvStatus>>({});

  // Initialiser le membre sélectionné (premier de l'équipe)
  useEffect(() => {
    if (selectedTeam && selectedTeam.length > 0) {
      const firstId = parseInt(selectedTeam[0].id, 10);
      setSelectedMemberId(Number.isNaN(firstId) ? null : firstId);
    } else {
      setSelectedMemberId(null);
    }
  }, [selectedTeam]);

  // Helpers slug (fallback uniquement)
  const sanitize = (s: string) =>
    String(s || '')
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]/g, '');

  const buildSlugFromName = (fullName: string) => {
    const parts = (fullName || '').trim().split(/\s+/);
    const prenom = parts[0] || '';
    const nom = parts.slice(1).join(' ') || '';
    return `${sanitize(prenom)}_${sanitize(nom)}.pptx`;
  };

  const getPptxUrl = (fullName: string) => {
    const slug = buildSlugFromName(fullName);
    const base = import.meta.env.MODE === 'production' ? '' : BACKEND_URL;
    return `${base}/data/${slug}`;
  };

  // Vérifier la présence du CV pour chaque membre (utilise l’endpoint de résolution par ID + fallback HEAD)
  useEffect(() => {
    let cancelled = false;

    const run = async () => {
      if (!Array.isArray(selectedTeam) || selectedTeam.length === 0) {
        setCvStatusMap({});
        return;
      }

      // Init en "checking"
      const init: Record<number, CvStatus> = {};
      selectedTeam.forEach((m: any) => {
        const idNum = parseInt(m.id, 10);
        if (!Number.isNaN(idNum)) init[idNum] = 'checking';
      });
      setCvStatusMap(init);

      const results = await Promise.all(
        selectedTeam.map(async (m: any) => {
          const idNum = parseInt(m.id, 10);
          if (Number.isNaN(idNum)) return [NaN, 'missing'] as const;

          // 1) Essayer via endpoint dédié
          try {
            const resp = await fetch(`${BACKEND_URL}/api/debug/resolve-cv/${idNum}`, { cache: 'no-store' });
            if (resp.ok) {
              const data = await resp.json().catch(() => ({}));
              return [idNum, data?.exists ? 'exists' : 'missing'] as const;
            }
          } catch {
            // ignore, fallback
          }

          // 2) Fallback: HEAD direct sur /data/slug
          try {
            const url = getPptxUrl(m.name || '');
            const head = await fetch(url, { method: 'HEAD' });
            return [idNum, head.ok ? 'exists' : 'missing'] as const;
          } catch {
            return [idNum, 'missing'] as const;
          }
        })
      );

      if (cancelled) return;

      const next: Record<number, CvStatus> = {};
      results.forEach(([id, st]) => {
        if (!Number.isNaN(id)) next[id] = st;
      });
      setCvStatusMap(next);
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [JSON.stringify(selectedTeam)]);

  const getMemberRefs = (memberId: number | null): number[] => {
    if (memberId == null) return [];
    return referenceAssociation[memberId] || [];
  };

  const addReference = (memberId: number, referenceId: number) => {
    const current = referenceAssociation[memberId] || [];
    if (current.includes(referenceId)) return;
    setReferenceAssociation({
      ...referenceAssociation,
      [memberId]: [...current, referenceId]
    });
  };

  const removeReference = (memberId: number, referenceId: number) => {
    const current = referenceAssociation[memberId] || [];
    if (!current.includes(referenceId)) return;
    setReferenceAssociation({
      ...referenceAssociation,
      [memberId]: current.filter(id => id !== referenceId)
    });
  };

  const handleDropAdd = (e: React.DragEvent) => {
    e.preventDefault();
    if (selectedMemberId == null) return;
    const data = e.dataTransfer.getData('text/plain');
    const refId = parseInt(data, 10);
    if (!Number.isNaN(refId)) addReference(selectedMemberId, refId);
  };

  const handleDropRemove = (e: React.DragEvent) => {
    e.preventDefault();
    if (selectedMemberId == null) return;
    const data = e.dataTransfer.getData('text/plain');
    const refId = parseInt(data, 10);
    if (!Number.isNaN(refId)) removeReference(selectedMemberId, refId);
  };

  // Charger toutes les références disponibles
  const { data: referencesData, isLoading: referencesLoading } = useQuery({
    queryKey: ['references'],
    queryFn: async () => {
      const response = await fetch(`${BACKEND_URL}/api/references`);
      if (!response.ok) throw new Error('Erreur chargement références');
      return response.json();
    }
  });

  const references = referencesData?.references || [];

  // Charger les références par défaut pour chaque membre de l'équipe
  useEffect(() => {
    const loadDefaultReferences = async () => {
      if (!useDefaultReferences || selectedTeam.length === 0) return;
      
      setLoading(true);
      const newAssociations: { [key: number]: number[] } = {};
      
      try {
        for (const member of selectedTeam) {
          const salarieId = parseInt(member.id, 10);
          const response = await fetch(`${BACKEND_URL}/api/salaries/${salarieId}/references`);
          if (response.ok) {
            const data = await response.json();
            newAssociations[salarieId] = data.references.map((ref: Reference) => ref.id_reference);
          } else {
            newAssociations[salarieId] = [];
          }
        }
        
        setReferenceAssociation(newAssociations);
        console.log('🔧 [ASSOCIATION] Références par défaut chargées:', newAssociations);
      } catch (error) {
        console.error('❌ [ASSOCIATION] Erreur chargement références par défaut:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDefaultReferences();
  }, [selectedTeam, useDefaultReferences, setReferenceAssociation]);

  // Vérifier si l'équipe est sélectionnée
  if (selectedTeam.length === 0) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="text-6xl mb-4">⚠️</div>
          <h2 className="text-2xl font-bold text-gray-800 mb-4">Aucune équipe sélectionnée</h2>
          <p className="text-gray-600 mb-6">Veuillez d'abord sélectionner une équipe.</p>
          <Button onClick={() => navigate('/team')} className="bg-blue-600 hover:bg-blue-700">
            🔙 Retour à la sélection d'équipe
          </Button>
        </div>
      </div>
    );
  }

  // Toggle d'une référence pour un membre
  const toggleReference = (memberId: number, referenceId: number) => {
    const currentRefs = referenceAssociation[memberId] || [];
    if (currentRefs.includes(referenceId)) removeReference(memberId, referenceId);
    else addReference(memberId, referenceId);
  };

  // Continuer vers le récapitulatif
  const handleContinue = () => {
    // Créer l'union des références associées à l'équipe
    const union = Array.from(new Set(
      Object.values(referenceAssociation || {}).flat()
    ));
    // Stocker en tant que strings pour compatibilité avec Recap
    setSelectedReferences(union.map((id) => id.toString()))
    console.log('🔗 [ASSOCIATION] Associations finales:', referenceAssociation, '→ selectedReferences:', union.length);
    navigate('/recap');
  };

  // Données dérivées pour l'affichage 3 colonnes
  const normalizedFilter = (s: string) => s.toLowerCase().normalize('NFD').replace(/\p{Diacritic}/gu, '');
  const ef = normalizedFilter(employeeFilter);
  const rf = normalizedFilter(referenceFilter);

  const filteredMembers = selectedTeam.filter((m: any) => {
    if (!ef) return true;
    const name = `${m.name || ''}`;
    const agency = `${m.agency || ''}`;
    const func = `${m.function || ''}`;
    const level = `${m.level || ''}`;
    const hay = normalizedFilter(`${name} ${agency} ${func} ${level}`);
    return hay.includes(ef);
  });

  const selectedRefs = getMemberRefs(selectedMemberId);
  const associatedRefs = references.filter((r: Reference) => selectedRefs.includes(r.id_reference));
  const availableRefsAll = references.filter((r: Reference) => !selectedRefs.includes(r.id_reference));
  const availableRefs = availableRefsAll.filter((r: Reference) => {
    if (!rf) return true;
    const hay = normalizedFilter(`${r.nom_projet} ${r.ville} ${r.client} ${r.type_mission} ${r.annee}`);
    return hay.includes(rf);
  });

  if (loading || referencesLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">
            {useDefaultReferences ? 'Chargement des références par défaut...' : 'Chargement des références...'}
          </p>
        </div>
      </div>
    );
  }

  // Stats
  const totalAssociations = Object.values(referenceAssociation).reduce((sum, refs) => sum + refs.length, 0);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">🔗 Association Membres ↔ Références</h1>
        <p className="text-gray-600">
          {useDefaultReferences
            ? 'Les références par défaut ont été pré-chargées. Vous pouvez les modifier selon vos besoins.'
            : 'Associez manuellement les références à chaque membre de l\'équipe.'}
        </p>
      </div>

      {/* Option de pré-chargement */}
      <div className="mb-6 p-4 bg-blue-50 rounded-lg">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={useDefaultReferences}
            onChange={(e) => setUseDefaultReferences(e.target.checked)}
            className="w-4 h-4 text-blue-600 rounded"
          />
          <span className="text-blue-800 font-medium">🔧 Utiliser les références par défaut des salariés</span>
        </label>
        <p className="text-sm text-blue-600 mt-2">Les références par défaut sont définies dans la page "🔧 Références par défaut" du menu.</p>
      </div>

      {/* 3 colonnes */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Colonne 1: Salariés */}
        <div className="bg-white rounded-lg shadow-md p-4 flex flex-col h-[75vh]">
          <div className="font-semibold text-gray-800 mb-2">👥 Salariés de l'équipe ({selectedTeam.length})</div>
          <input
            value={employeeFilter}
            onChange={(e) => setEmployeeFilter(e.target.value)}
            placeholder="Rechercher un salarié..."
            className="border rounded px-3 py-2 text-sm focus:outline-none focus:ring w-full"
          />
          <div className="mt-3 overflow-y-auto flex-1 space-y-2">
            {filteredMembers.map((m: any) => {
              const idNum = parseInt(m.id, 10);
              const count = (referenceAssociation[idNum] || []).length;
              const selected = selectedMemberId === idNum;
              const cvMissing = cvStatusMap[idNum] === 'missing';

              return (
                <button
                  key={m.id}
                  onClick={() => setSelectedMemberId(idNum)}
                  className={`w-full text-left border rounded px-3 py-2 text-sm transition
                    ${selected ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:bg-gray-50'}
                    ${cvMissing ? 'border-l-4 border-l-red-500' : 'border-l'}
                  `}
                  title={cvMissing ? "CV source introuvable pour ce salarié" : undefined}
                >
                  <div className="flex justify-between items-center">
                    <div className="font-medium text-gray-800">{m.name}</div>
                    <div className="text-xs text-gray-600">{count} réf.</div>
                  </div>
                  <div className="text-xs text-gray-500">{m.function || '—'} • {m.agency || '—'} • {m.level || '—'}</div>
                </button>
              );
            })}
            {filteredMembers.length === 0 && (
              <div className="text-sm text-gray-500">Aucun salarié ne correspond au filtre.</div>
            )}
          </div>
        </div>

        {/* Colonne 2: Références associées */}
        <div
          className="bg-white rounded-lg shadow-md p-4 flex flex-col h-[75vh]"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDropAdd}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="font-semibold text-gray-800">📚 Références associées {selectedMemberId != null ? `( ${getMemberRefs(selectedMemberId).length} )` : ''}</div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  if (selectedMemberId != null) {
                    setReferenceAssociation({ ...referenceAssociation, [selectedMemberId]: [] });
                  }
                }}
              >
                🗑️ Tout désélectionner
              </Button>
            </div>
          </div>
          <div className="text-xs text-gray-500 mb-2">Astuce: glissez une carte depuis la colonne de droite pour l'ajouter ici.</div>
          <div className="overflow-y-auto flex-1 space-y-2 border rounded p-2">
            {associatedRefs.length > 0 ? associatedRefs.map((reference: Reference) => (
              <div
                key={reference.id_reference}
                className="p-3 rounded border border-green-500 bg-green-50 cursor-pointer"
                draggable
                onDragStart={(e) => e.dataTransfer.setData('text/plain', reference.id_reference.toString())}
                onClick={() => selectedMemberId != null && toggleReference(selectedMemberId, reference.id_reference)}
                title="Cliquer pour retirer ou glisser vers la colonne de droite"
              >
                <div className="font-medium text-gray-800 text-sm">{reference.nom_projet}</div>
                <div className="text-xs text-gray-600">{reference.ville} • {reference.annee} • {reference.type_mission}</div>
              </div>
            )) : (
              <div className="text-sm text-gray-500">Aucune référence associée pour ce salarié.</div>
            )}
          </div>
        </div>

        {/* Colonne 3: Références disponibles */}
        <div
          className="bg-white rounded-lg shadow-md p-4 flex flex-col h-[75vh]"
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDropRemove}
        >
          <div className="font-semibold text-gray-800 mb-2">📂 Références disponibles</div>
          <input
            value={referenceFilter}
            onChange={(e) => setReferenceFilter(e.target.value)}
            placeholder="Rechercher (projet, ville, client, type, année)"
            className="border rounded px-3 py-2 text-sm focus:outline-none focus:ring w-full"
          />
          <div className="text-xs text-gray-500 mt-2 mb-2">Astuce: glissez une carte vers la colonne du milieu pour l'associer.</div>
          <div className="overflow-y-auto flex-1 space-y-2 border rounded p-2">
            {availableRefs.map((reference: Reference) => (
              <div
                key={reference.id_reference}
                className="p-3 rounded border border-gray-200 hover:border-gray-300 hover:bg-gray-50 cursor-grab"
                draggable
                onDragStart={(e) => e.dataTransfer.setData('text/plain', reference.id_reference.toString())}
                onClick={() => selectedMemberId != null && toggleReference(selectedMemberId, reference.id_reference)}
                title="Cliquer pour associer ou glisser vers la colonne du milieu"
              >
                <div className="font-medium text-gray-800 text-sm">{reference.nom_projet}</div>
                <div className="text-xs text-gray-600">{reference.ville} • {reference.annee} • {reference.type_mission}</div>
              </div>
            ))}
            {availableRefs.length === 0 && (
              <div className="text-sm text-gray-500">Aucune référence disponible ne correspond au filtre.</div>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 flex gap-4">
        <Button onClick={() => navigate('/team')} variant="outline" className="flex-1">🔙 Retour à l'équipe</Button>
        <Button onClick={handleContinue} className="flex-1 bg-green-600 hover:bg-green-700" disabled={totalAssociations === 0}>
          📋 Continuer vers le récapitulatif
        </Button>
      </div>
    </div>
  );
};

export default ReferenceAssociation;