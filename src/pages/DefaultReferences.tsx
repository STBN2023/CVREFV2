import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import AssociationsImportInlinePanel from '@/components/references/AssociationsImportInlinePanel';
import AssociationsImportRecapDialog from '@/components/references/AssociationsImportRecapDialog';
import { showLoading, dismissToast, showError, showSuccess } from '@/utils/toast';

interface Salarie {
  id_salarie: number;
  nom: string;
  prenom: string;
  agence: string;
  fonction: string;
  niveau_expertise: string;
  references?: Reference[];
}

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

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

const DefaultReferences: React.FC = () => {
  const [selectedSalarie, setSelectedSalarie] = useState<Salarie | null>(null);
  const [selectedReferences, setSelectedReferences] = useState<number[]>([]);
  const [referenceCountBySalarie, setReferenceCountBySalarie] = useState<Record<number, number>>({});
  const [assocRecapOpen, setAssocRecapOpen] = useState(false);
  const [assocRecapDetails, setAssocRecapDetails] = useState<any>(null);
  
  // Charger tous les salariés
  const { data: salariesData, isLoading: salariesLoading } = useQuery({
    queryKey: ['salaries'],
    queryFn: async () => {
      const response = await fetch(`${BACKEND_URL}/api/salaries`);
      if (!response.ok) throw new Error('Erreur chargement salariés');
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false
  });

  // Charger toutes les références disponibles
  const { data: referencesData, isLoading: referencesLoading } = useQuery({
    queryKey: ['references'],
    queryFn: async () => {
      const response = await fetch(`${BACKEND_URL}/api/references`);
      if (!response.ok) throw new Error('Erreur chargement références');
      return response.json();
    },
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: false
  });

  // Mutation pour mettre à jour les références par défaut
  const updateDefaultReferencesMutation = useMutation({
    mutationFn: async ({ salarieId, referenceIds }: { salarieId: number; referenceIds: number[] }) => {
      const response = await fetch(`${BACKEND_URL}/api/salaries/${salarieId}/references`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ referenceIds })
      });
      if (!response.ok) throw new Error('Erreur mise à jour références');
      return response.json();
    },
    onSuccess: () => {
      // Mettre à jour le compteur pour le salarié actuel sans refetch global
      if (selectedSalarie) {
        setReferenceCountBySalarie(prev => ({
          ...prev,
          [selectedSalarie.id_salarie]: selectedReferences.length
        }));
      }
      alert('✅ Références par défaut sauvegardées avec succès!');
    },
    onError: (error) => {
      alert(`❌ Erreur: ${error instanceof Error ? error.message : 'Erreur inconnue'}`);
    }
  });

  // Harmonisation + mémoïsation pour éviter de recréer des tableaux à chaque rendu
  const salaries: Salarie[] = useMemo(() => {
    const raw = Array.isArray(salariesData) ? salariesData : salariesData?.salaries || [];
    return (raw as any[]).map((s: any) => ({
      ...s,
      id_salarie: s.id_salarie ?? s.id,
      niveau_expertise: s.niveau_expertise ?? s.niveau
    }));
  }, [salariesData]);

  const references: Reference[] = useMemo(() => {
    return (Array.isArray(referencesData) ? referencesData : referencesData?.references || []) as Reference[];
  }, [referencesData]);

  // Garde-fou pour éviter plusieurs chargements concurrents des compteurs
  const loadingCountsRef = useRef(false);

  // Recherches / filtres
  const [salarieQuery, setSalarieQuery] = useState('');
  const [referenceQuery, setReferenceQuery] = useState('');

  const filteredSalaries = useMemo(() => {
    const q = salarieQuery.trim().toLowerCase();
    if (!q) return salaries;
    return salaries.filter((s) =>
      [s.prenom, s.nom, s.fonction, s.agence]
        .filter(Boolean)
        .some((x) => x.toLowerCase().includes(q))
    );
  }, [salarieQuery, salaries]);

  const unassociatedReferences = useMemo(() => {
    return references.filter((r: Reference) => !selectedReferences.includes(r.id_reference));
  }, [references, selectedReferences]);

  const filteredUnassociatedReferences = useMemo(() => {
    const q = referenceQuery.trim().toLowerCase();
    if (!q) return unassociatedReferences;
    return unassociatedReferences.filter((r) =>
      (r.nom_projet?.toLowerCase().includes(q)) ||
      (r.ville?.toLowerCase().includes(q)) ||
      (r.client?.toLowerCase().includes(q)) ||
      (r.type_mission?.toLowerCase().includes(q)) ||
      String(r.annee).includes(q)
    );
  }, [referenceQuery, unassociatedReferences]);

  // Charger les compteurs de références pour tous les salariés au démarrage
  useEffect(() => {
    let cancelled = false;
    const loadAllReferenceCounts = async () => {
      if (salaries.length === 0) return;
      if (loadingCountsRef.current) return;
      loadingCountsRef.current = true;

      try {
        const counts: Record<number, number> = {};
        for (const salarie of salaries) {
          if (cancelled) break;
          try {
            const response = await fetch(`${BACKEND_URL}/api/salaries/${salarie.id_salarie}/references`);
            if (response.ok) {
              const data = await response.json();
              counts[salarie.id_salarie] = Array.isArray(data?.references) ? data.references.length : 0;
            } else {
              counts[salarie.id_salarie] = 0;
            }
          } catch (error) {
            console.error(`Erreur chargement compteur pour salarié ${salarie.id_salarie}:`, error);
            counts[salarie.id_salarie] = 0;
          }
        }
        if (!cancelled) {
          setReferenceCountBySalarie(counts);
          console.log('🔢 [DEFAULT-REF] Compteurs de références chargés:', counts);
        }
      } finally {
        loadingCountsRef.current = false;
      }
    };

    loadAllReferenceCounts();
    return () => { cancelled = true; };
  }, [salaries]);

  // Recharge utilitaire après import pour refléter immédiatement les changements
  const reloadCountsAndSelection = async () => {
    if (salaries.length === 0) return;
    const counts: Record<number, number> = {};
    for (const salarie of salaries) {
      try {
        const r = await fetch(`${BACKEND_URL}/api/salaries/${salarie.id_salarie}/references`);
        if (r.ok) {
          const d = await r.json();
          counts[salarie.id_salarie] = Array.isArray(d?.references) ? d.references.length : 0;
          // Si c'est le salarié sélectionné, mettre à jour sa liste immédiatement
          if (selectedSalarie && selectedSalarie.id_salarie === salarie.id_salarie) {
            const ids = (d?.references || []).map((ref: any) => ref.id_reference);
            setSelectedReferences(ids);
          }
        } else {
          counts[salarie.id_salarie] = 0;
        }
      } catch {
        counts[salarie.id_salarie] = 0;
      }
    }
    setReferenceCountBySalarie(counts);
  };

  // Import depuis le panneau en haut
  const handleAssociationsImported = async (details: any) => {
    setAssocRecapDetails(details);
    setAssocRecapOpen(true);
    await reloadCountsAndSelection();
    showSuccess('Associations importées. Compteurs actualisés.');
  };

  // Sélectionner un salarié et charger ses références actuelles
  const handleSelectSalarie = async (salarie: Salarie) => {
    setSelectedSalarie(salarie);
    
    // Charger les références par défaut de ce salarié depuis l'API
    try {
      const response = await fetch(`${BACKEND_URL}/api/salaries/${salarie.id_salarie}/references`);
      if (response.ok) {
        const data = await response.json();
        const currentReferenceIds = data.references.map((ref: Reference) => ref.id_reference);
        setSelectedReferences(currentReferenceIds);
        // Mettre à jour le compteur pour ce salarié
        setReferenceCountBySalarie(prev => ({
          ...prev,
          [salarie.id_salarie]: currentReferenceIds.length
        }));
        console.log(`🔧 [DEFAULT-REF] Références chargées pour ${salarie.prenom} ${salarie.nom}:`, currentReferenceIds);
      } else {
        console.error(`❌ [DEFAULT-REF] Erreur chargement références pour salarié ${salarie.id_salarie}`);
        setSelectedReferences([]);
      }
    } catch (error) {
      console.error(`❌ [DEFAULT-REF] Erreur réseau:`, error);
      setSelectedReferences([]);
    }
  };

  // Sauvegarder les références par défaut
  const handleSave = () => {
    if (!selectedSalarie) return;
    
    updateDefaultReferencesMutation.mutate({
      salarieId: selectedSalarie.id_salarie,
      referenceIds: selectedReferences
    });
  };

  if (salariesLoading || referencesLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Chargement des données...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Import d'associations (export global) */}
      <AssociationsImportInlinePanel
        onImported={handleAssociationsImported}
        disabled={salaries.length === 0}
      />

      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          🔧 Gestion des Références par Défaut
        </h1>
        <p className="text-gray-600">
          Définissez les références par défaut pour chaque salarié. Ces références seront pré-sélectionnées lors de la génération des CV.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Liste des salariés */}
        <div className="bg-white rounded-lg shadow-md p-6 flex flex-col h-[75vh]">
          <h2 className="text-xl font-semibold mb-3 text-gray-800">👥 Salariés</h2>
          <div className="mb-3 flex items-center gap-2">
            <input
              type="text"
              value={salarieQuery}
              onChange={(e) => setSalarieQuery(e.target.value)}
              placeholder="Rechercher un salarié (nom, prénom, fonction, agence)"
              className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              aria-label="Filtrer les salariés"
            />
            {salarieQuery && (
              <button
                onClick={() => setSalarieQuery('')}
                className="text-xs px-2 py-1 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                aria-label="Effacer le filtre salariés"
              >
                Effacer
              </button>
            )}
          </div>
          <div className="space-y-2 flex-1 overflow-y-auto">
            {filteredSalaries.length === 0 ? (
              <div className="text-center text-gray-500 py-8">
                {salarieQuery ? 'Aucun salarié correspondant au filtre' : 'Aucun salarié'}
              </div>
            ) : (
              filteredSalaries.map((salarie: Salarie) => (
                <div
                  key={salarie.id_salarie}
                  onClick={() => handleSelectSalarie(salarie)}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedSalarie?.id_salarie === salarie.id_salarie
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  <div className="font-medium text-gray-800">
                    {salarie.prenom} {salarie.nom}
                  </div>
                  <div className="text-sm text-gray-600">
                    {salarie.fonction} • {salarie.agence}
                  </div>
                  <div className="text-xs text-blue-600 mt-1">
                    {referenceCountBySalarie[salarie.id_salarie] || 0} référence(s) assignée(s)
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Références associées */}
        <div className="bg-white rounded-lg shadow-md p-6 flex flex-col h-[75vh]">
          <h2 className="text-xl font-semibold mb-2 text-gray-800">📌 Références associées</h2>
          {!selectedSalarie ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-4">👆</div>
              <p>Sélectionnez un salarié pour voir ses références associées</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-600 mb-3">Glissez des éléments ici pour les associer.</p>
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const data = e.dataTransfer.getData('text/plain');
                  const refId = Number(data);
                  if (!Number.isNaN(refId)) {
                    setSelectedReferences(prev => (prev.includes(refId) ? prev : [...prev, refId]));
                  }
                }}
                className="flex-1 overflow-y-auto mb-4 p-2 rounded-lg border-2 border-dashed border-green-300 bg-green-50"
                aria-label="Zone de dépôt références associées"
              >
                {references.filter((r: Reference) => selectedReferences.includes(r.id_reference)).length === 0 ? (
                  <div className="text-center text-gray-500 py-8">Aucune référence associée</div>
                ) : (
                  <div className="space-y-2">
                    {references
                      .filter((r: Reference) => selectedReferences.includes(r.id_reference))
                      .map((reference: Reference) => (
                        <div
                          key={reference.id_reference}
                          draggable
                          onDragStart={(e) => {
                            e.dataTransfer.setData('text/plain', String(reference.id_reference));
                            e.dataTransfer.effectAllowed = 'move';
                          }}
                          onClick={() => setSelectedReferences(prev => prev.filter(id => id !== reference.id_reference))}
                          className="p-3 rounded-lg border cursor-move transition-colors border-green-400 bg-white hover:bg-green-50"
                          title="Glisser pour déplacer • Cliquer pour retirer"
                        >
                          <div className="font-medium text-gray-800">{reference.nom_projet}</div>
                          <div className="text-sm text-gray-600">{reference.ville} • {reference.annee} • {reference.type_mission}</div>
                          <div className="text-xs text-gray-500">{reference.client} • {reference.montant != null ? `${reference.montant.toLocaleString('fr-FR')} €` : '—'}</div>
                        </div>
                      ))}
                  </div>
                )}
              </div>
              <div className="mt-auto pt-3 flex gap-2 justify-end border-t border-gray-100">
                <button
                  onClick={handleSave}
                  disabled={updateDefaultReferencesMutation.isPending}
                  className="bg-blue-600 text-white text-sm px-3 py-1.5 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {updateDefaultReferencesMutation.isPending ? (
                    <>⏳ Sauvegarde...</>
                  ) : (
                    <>💾 Sauvegarder les références par défaut</>
                  )}
                </button>
                <button
                  onClick={() => setSelectedReferences([])}
                  className="text-sm px-3 py-1.5 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
                >
                  🗑️ Tout désélectionner
                </button>
              </div>
            </>
          )}
        </div>

        {/* Références disponibles (non associées) */}
        <div className="bg-white rounded-lg shadow-md p-6 flex flex-col h-[75vh]">
          <h2 className="text-xl font-semibold mb-2 text-gray-800">📚 Références disponibles</h2>
          {!selectedSalarie ? (
            <div className="text-center py-12 text-gray-500">
              <div className="text-4xl mb-4">👆</div>
              <p>Sélectionnez un salarié pour afficher les références disponibles</p>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-600 mb-2">Glissez des éléments depuis ici vers le bloc de gauche pour les associer.</p>
              <div className="mb-3 flex items-center gap-2">
                <input
                  type="text"
                  value={referenceQuery}
                  onChange={(e) => setReferenceQuery(e.target.value)}
                  placeholder="Rechercher une référence disponible (projet, ville, client, type, année)"
                  className="flex-1 px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  aria-label="Filtrer les références disponibles"
                />
                {referenceQuery && (
                  <button
                    onClick={() => setReferenceQuery('')}
                    className="text-xs px-2 py-1 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
                    aria-label="Effacer le filtre références"
                  >
                    Effacer
                  </button>
                )}
              </div>
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  const data = e.dataTransfer.getData('text/plain');
                  const refId = Number(data);
                  if (!Number.isNaN(refId)) {
                    // Un drop ici retire l'association
                    setSelectedReferences(prev => prev.filter(id => id !== refId));
                  }
                }}
                className="flex-1 overflow-y-auto p-2 rounded-lg border-2 border-dashed border-gray-300"
                aria-label="Zone de dépôt références disponibles"
              >
                {filteredUnassociatedReferences.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    {referenceQuery
                      ? 'Aucune référence correspondant au filtre'
                      : 'Toutes les références sont associées'}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {filteredUnassociatedReferences.map((reference: Reference) => (
                      <div
                        key={reference.id_reference}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/plain', String(reference.id_reference));
                          e.dataTransfer.effectAllowed = 'move';
                        }}
                        onClick={() => setSelectedReferences(prev => (prev.includes(reference.id_reference) ? prev : [...prev, reference.id_reference]))}
                        className="p-3 rounded-lg border cursor-move transition-colors border-gray-200 bg-white hover:bg-gray-50"
                        title="Glisser pour déplacer • Cliquer pour associer"
                      >
                        <div className="font-medium text-gray-800">{reference.nom_projet}</div>
                        <div className="text-sm text-gray-600">{reference.ville} • {reference.annee} • {reference.type_mission}</div>
                        <div className="text-xs text-gray-500">{reference.client} • {reference.montant != null ? `${reference.montant.toLocaleString('fr-FR')} €` : '—'}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Récap import associations */}
      <AssociationsImportRecapDialog
        open={assocRecapOpen}
        details={assocRecapDetails}
        onClose={() => setAssocRecapOpen(false)}
      />
    </div>
  );
};

export default DefaultReferences;