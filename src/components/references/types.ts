export type Salarie = {
  id: string;
  nom: string;
  prenom: string;
  agence?: string;
  fonction?: string;
  niveau?: string;
  actif?: boolean;
  template?: string;
};

export type Reference = {
  id: string;
  nom_projet: string;
  client: string;
  ville: string;
  annee: number;
  type_mission: string;
  montant: number | null;
  description_projet: string;
  duree_mois?: number;
  surface?: number;
  salaries: string[];
};

export type ImportProgress = {
  show: boolean;
  type: "references";
  step: string;
  current: number;
  total: number;
  status: "loading" | "success" | "error";
  details: string[];
  stats?: {
    total: number;
    added: number;
    existing: number;
    errors: number;
  };
};

export type RecapStats = {
  show?: boolean;
  totalReferences?: number;
  totalSalaries?: number;
  totalAssociations?: number;
  importDetails: {
    statistiques?: {
      fichier: string;
      lignes_traitees: number;
      references_ajoutees: number;
      references_existantes: number;
      erreurs: number;
      total_base: number;
    };
    erreurs_detaillees?: Array<{
      ligne: number;
      erreur: string;
      donnees: any;
    }>;
    doublons_detectes?: Array<{
      ligne: number;
      nom_projet: string;
      client: string;
      annee: number;
    }>;
    references_ajoutees?: Array<{
      id: number;
      nom_projet: string;
      client: string;
      ville: string;
      annee: number;
      type_mission: string;
    }>;
    recommandations?: string[];
    total?: number;
    added?: number;
    existing?: number;
    errors?: number;
    associations?: number;
    errorDetails?: string[];
    missingSalaries?: string[];
    recommendations?: string[];
  };
};