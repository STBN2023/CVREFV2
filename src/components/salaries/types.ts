export type Salarie = {
  id: string;
  nom: string;
  prenom: string;
  agence?: string;
  fonction?: string;
  niveau?: string;
  actif: boolean;
  template?: string;
  email?: string;
  telephone?: string;
  competences?: string[];
};

export type ImportProgress = {
  show: boolean;
  type: "salaries";
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

export type ImportRecap = {
  show: boolean;
  importDetails?: {
    statistiques?: {
      fichier: string;
      lignes_traitees: number;
      salaries_ajoutes: number;
      salaries_existants: number;
      erreurs: number;
      total_base: number;
    };
    erreurs_detaillees?: Array<{
      ligne: number;
      erreur: string;
      donnees?: any;
    }>;
    doublons_detectes?: Array<{
      ligne: number;
      nom: string;
      email?: string;
    }>;
    salaries_ajoutes?: Array<{
      nom: string;
      agence?: string;
      fonction?: string;
      niveau_expertise?: string;
      email?: string;
    }>;
  } | null;
};