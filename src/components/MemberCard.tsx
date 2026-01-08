import React from 'react';
import { Employee, Reference } from '../types';
import { Checkbox } from '@/components/ui/checkbox';

interface MemberCardProps {
  member: Employee;
  selectedReferences: string[];
  allReferences: Reference[];
  onReferenceSelect: (referenceId: string) => void;
}

export const MemberCard: React.FC<MemberCardProps> = ({ 
  member, 
  selectedReferences, 
  allReferences, 
  onReferenceSelect 
}) => {
  return (
    <div className="bg-white rounded-xl shadow p-6 border-2 border-brand-dark">
      <div className="font-semibold text-lg text-brand-dark mb-4">{member.name}</div>
      <div className="text-sm text-brand-dark/80 mb-4">{member.function} • {member.level} • {member.agency}</div>
      
      <div className="mt-4">
        <h5 className="font-medium text-brand-dark mb-3">Références associées :</h5>
        <div className="space-y-3 max-h-60 overflow-y-auto pr-2">
          {allReferences.map(ref => (
            <div key={ref.id} className="flex items-center space-x-3 p-2 rounded-lg hover:bg-brand-pale transition">
              <Checkbox
                id={`${member.id}-${ref.id}`}
                checked={selectedReferences.includes(ref.id)}
                onCheckedChange={() => onReferenceSelect(ref.id)}
              />
              <label 
                htmlFor={`${member.id}-${ref.id}`}
                className="text-sm text-brand-dark cursor-pointer flex-1"
              >
                <span className="font-medium">{ref.nom_projet}</span> ({ref.annee})
              </label>
            </div>
          ))}
          {allReferences.length === 0 && (
            <div className="text-center text-brand-dark/60 py-4 text-sm">
              Aucune référence disponible.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
