import React from 'react';
import { Reference } from '../types';

interface ReferenceCardProps {
  reference: Reference;
}

export const ReferenceCard: React.FC<ReferenceCardProps> = ({ reference }) => {
  return (
    <div className="bg-white rounded-xl shadow p-6 border-2 border-brand-dark">
      <div className="flex justify-between items-start mb-3">
        <h4 className="font-bold text-xl text-brand-dark">{reference.nom_projet}</h4>
        <span className="text-sm bg-brand-yellow text-brand-dark rounded-full px-3 py-1 font-semibold">
          {reference.annee}
        </span>
      </div>
      <div className="mb-2 text-sm text-brand-dark/80">
        <span className="font-semibold">{reference.ville}</span> • {reference.type_mission}
      </div>
      <div className="mb-2 text-sm text-brand-dark/80">
        Client : <span className="font-semibold">{reference.client}</span>
      </div>
      <div className="mb-3 text-sm text-brand-dark/70">
        Montant : <span className="font-semibold">{reference.montant != null ? `${reference.montant.toLocaleString('fr-FR')} €` : "—"}</span>
      </div>
      <div className="text-xs text-brand-dark/60">{reference.description_projet}</div>
    </div>
  );
};
