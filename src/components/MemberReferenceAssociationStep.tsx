import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useWorkflow } from '../context/WorkflowContext';
import { ReferenceCard } from '@/components/ReferenceCard';
import { MemberCard } from '@/components/MemberCard';
import { Reference, Employee } from '../types';
import { useNavigate } from 'react-router-dom';
import { showSuccess } from '../utils/toast';

type ReferenceAssociation = Record<string, string[]>;

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

export const MemberReferenceAssociationStep = () => {
  const { selectedTeam, selectedReferences, referenceAssociation, setReferenceAssociation } = useWorkflow();
  const [references, setReferences] = useState<Reference[]>([]);
  const [members, setMembers] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Charger les références
        const referencesResponse = await fetch(`${BACKEND_URL}/api/references`);
        if (!referencesResponse.ok) {
          throw new Error(`Erreur HTTP lors du chargement des références: ${referencesResponse.status}`);
        }
        const referencesData = await referencesResponse.json();
        const referencesFormatted = referencesData.references.map((ref: any) => ({
          id: ref.id_reference.toString(),
          nom_projet: ref.nom_projet,
          ville: ref.ville,
          annee: ref.annee,
          type_mission: ref.type_mission,
          montant: ref.montant,
          client: ref.client,
          description_projet: ref.description_projet
        }));
        setReferences(referencesFormatted);

        // Charger les membres de l'équipe
        const membersResponse = await fetch(`${BACKEND_URL}/api/salaries`);
        if (!membersResponse.ok) {
          throw new Error(`Erreur HTTP lors du chargement des membres: ${membersResponse.status}`);
        }
        const membersData = await membersResponse.json();
        const membersFormatted = membersData.salaries.map((salary: any) => ({
          id: salary.id_salarie.toString(),
          name: `${salary.prenom} ${salary.nom}`,
          agency: salary.agence,
          function: salary.fonction,
          level: salary.niveau_expertise
        }));
        setMembers(membersFormatted);

        setLoading(false);
      } catch (err) {
        console.error('Erreur lors du chargement des données:', err);
        setError('Impossible de charger les données');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Rediriger si aucune équipe ou référence n'est sélectionnée
  useEffect(() => {
    if (selectedTeam.length === 0) {
      navigate('/team');
    } else if (selectedReferences.length === 0) {
      navigate('/references');
    }
  }, [selectedTeam, selectedReferences, navigate]);

  const filteredReferences = references.filter(ref => selectedReferences.includes(ref.id));
  const filteredMembers = members.filter(member => selectedTeam.includes(member.id));

  const handleReferenceSelect = (memberId: string, referenceId: string) => {
    const newAssociation = { ...referenceAssociation };
    const memberRefs = newAssociation[memberId] || [];
    const newMemberRefs = memberRefs.includes(referenceId)
      ? memberRefs.filter(id => id !== referenceId)
      : [...memberRefs, referenceId];
    
    newAssociation[memberId] = newMemberRefs;
    setReferenceAssociation(newAssociation);
  };

  const handleValidate = () => {
    showSuccess('Associations enregistrées !');
    setTimeout(() => {
      navigate('/recap');
    }, 600);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-blue"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto py-10 px-2">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Erreur : </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-10 px-2">
      <h2 className="text-4xl font-extrabold mb-10 text-center text-brand-dark tracking-tight drop-shadow-sm">
        Associer les références aux membres
      </h2>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-12">
        {/* Colonne des références */}
        <div>
          <h3 className="text-2xl font-bold mb-6 text-brand-blue">Références sélectionnées</h3>
          <div className="space-y-6">
            {filteredReferences.map(ref => (
              <ReferenceCard key={ref.id} reference={ref} />
            ))}
            {filteredReferences.length === 0 && (
              <div className="text-center text-brand-dark/60 py-8 text-lg font-medium">
                Aucune référence sélectionnée.
              </div>
            )}
          </div>
        </div>
        
        {/* Colonne des membres */}
        <div>
          <h3 className="text-2xl font-bold mb-6 text-brand-blue">Membres de l'équipe</h3>
          <div className="space-y-6">
            {filteredMembers.map(member => (
              <MemberCard 
                key={member.id} 
                member={member} 
                selectedReferences={referenceAssociation[member.id] || []}
                allReferences={filteredReferences}
                onReferenceSelect={(refId) => handleReferenceSelect(member.id, refId)}
              />
            ))}
            {filteredMembers.length === 0 && (
              <div className="text-center text-brand-dark/60 py-8 text-lg font-medium">
                Aucun membre sélectionné.
              </div>
            )}
          </div>
        </div>
      </div>
      
      <div className="flex justify-center mt-8">
        <Button
          className="rounded-full px-8 py-3 text-lg font-bold bg-brand-yellow text-brand-dark shadow-lg hover:bg-brand-yellow/90 transition"
          onClick={handleValidate}
          disabled={filteredMembers.length === 0}
        >
          Valider les associations et continuer
        </Button>
      </div>
    </div>
  );
};
