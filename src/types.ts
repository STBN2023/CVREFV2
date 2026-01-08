export interface Employee {
  id: string;
  name: string;
  agency: string;
  function: string;
  level: string;
}

export interface Reference {
  id: string;
  nom_projet: string;
  ville: string;
  annee: number;
  type_mission: string;
  montant: number | null;
  client: string;
  description_projet: string;
}
