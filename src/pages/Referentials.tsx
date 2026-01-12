import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { showSuccess, showError } from '@/utils/toast';
import { Trash2, Plus, Pencil, Building2, Briefcase, Award, Upload, FileSpreadsheet, Info, Puzzle } from 'lucide-react';
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from '@/components/ui/alert-dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';

const getBackendUrl = () => {
  const v = localStorage.getItem("app.backendUrl");
  return (v && v.trim()) || (import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000');
};

interface Agence {
  id_agence: number;
  nom: string;
  actif: boolean;
}

interface Fonction {
  id_fonction: number;
  nom: string;
  description: string;
  actif: boolean;
}

interface Niveau {
  id_niveau: number;
  nom: string;
  ordre: number;
  description: string;
  actif: boolean;
}

// AJOUT: type Compétence
interface Competence {
  id_competence: number;
  nom: string;
  description: string;
  actif: boolean;
}

export default function Referentials() {
  // États pour les données
  const [agences, setAgences] = useState<Agence[]>([]);
  const [fonctions, setFonctions] = useState<Fonction[]>([]);
  const [niveaux, setNiveaux] = useState<Niveau[]>([]);
  const [competences, setCompetences] = useState<Competence[]>([]);
  const [loading, setLoading] = useState(true);

  // États pour les dialogs
  const [openAgence, setOpenAgence] = useState(false);
  const [openFonction, setOpenFonction] = useState(false);
  const [openNiveau, setOpenNiveau] = useState(false);
  // AJOUT: dialog Compétence
  const [openCompetence, setOpenCompetence] = useState(false);

  // États pour l'édition
  const [editAgenceId, setEditAgenceId] = useState<number | null>(null);
  const [editFonctionId, setEditFonctionId] = useState<number | null>(null);
  const [editNiveauId, setEditNiveauId] = useState<number | null>(null);
  // AJOUT: édition Compétence
  const [editCompetenceId, setEditCompetenceId] = useState<number | null>(null);

  // États pour les formulaires
  const [agenceForm, setAgenceForm] = useState({
    nom: ''
  });

  const [fonctionForm, setFonctionForm] = useState({
    nom: '',
    description: ''
  });

  const [niveauForm, setNiveauForm] = useState({
    nom: '',
    ordre: 1,
    description: ''
  });
  // AJOUT: formulaire Compétence
  const [competenceForm, setCompetenceForm] = useState({
    nom: '',
    description: ''
  });

  // États pour la suppression
  const [deleteAgenceId, setDeleteAgenceId] = useState<number | null>(null);
  const [deleteFonctionId, setDeleteFonctionId] = useState<number | null>(null);
  const [deleteNiveauId, setDeleteNiveauId] = useState<number | null>(null);
  // AJOUT: suppression Compétence
  const [deleteCompetenceId, setDeleteCompetenceId] = useState<number | null>(null);

  // États pour l'import Excel
  const [importLoading, setImportLoading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // AJOUT: ref pour import compétences
  const competenceFileInputRef = useRef<HTMLInputElement>(null);
  const [importCompetenceLoading, setImportCompetenceLoading] = useState(false);

  // Fonction d'import Excel
  const handleImportExcel = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Vérifier l'extension
    const validExtensions = ['.xlsx', '.xls'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    if (!validExtensions.includes(fileExtension)) {
      showError('Veuillez sélectionner un fichier Excel (.xlsx ou .xls)');
      return;
    }

    setImportLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('xlsx', file);

      const response = await fetch(`${getBackendUrl()}/api/import-fonctions`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        showSuccess(
          `Import terminé ! ${result.added || result.count} nouvelles fonctions ajoutées${result.existing ? `, ${result.existing} existantes ignorées` : ''}`
        );
        
        // Recharger les fonctions
        const fonctionsRes = await fetch(`${getBackendUrl()}/api/fonctions`);
        if (fonctionsRes.ok) {
          const fonctionsData = await fonctionsRes.json();
          setFonctions(fonctionsData.fonctions);
        }
      } else {
        showError(result.error || 'Erreur lors de l\'import');
      }
    } catch (error) {
      console.error('Erreur import:', error);
      showError('Erreur lors de l\'import du fichier');
    } finally {
      setImportLoading(false);
      // Reset du input file
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  // AJOUT: Fonction d'import Excel pour les compétences
  const handleImportCompetencesExcel = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Vérifier l'extension
    const validExtensions = ['.xlsx', '.xls'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    if (!validExtensions.includes(fileExtension)) {
      showError('Veuillez sélectionner un fichier Excel (.xlsx ou .xls)');
      return;
    }

    setImportCompetenceLoading(true);
    
    try {
      const formData = new FormData();
      formData.append('xlsx', file);

      const response = await fetch(`${getBackendUrl()}/api/import-competences`, {
        method: 'POST',
        body: formData,
      });

      const result = await response.json();

      if (response.ok) {
        showSuccess(
          `Import terminé ! ${result.added || result.count} nouvelles compétences ajoutées${result.existing ? `, ${result.existing} existantes ignorées` : ''}`
        );
        
        // Recharger les compétences
        const competencesRes = await fetch(`${getBackendUrl()}/api/competences`);
        if (competencesRes.ok) {
          const competencesData = await competencesRes.json();
          setCompetences(competencesData.competences);
        }
      } else {
        showError(result.error || 'Erreur lors de l\'import');
      }
    } catch (error) {
      console.error('Erreur import:', error);
      showError('Erreur lors de l\'import du fichier');
    } finally {
      setImportCompetenceLoading(false);
      // Reset du input file
      if (competenceFileInputRef.current) {
        competenceFileInputRef.current.value = '';
      }
    }
  };

  // Chargement des données
  useEffect(() => {
    const fetchData = async () => {
      const BASE = getBackendUrl();
      try {
        const [agencesRes, fonctionsRes, niveauxRes, competencesRes] = await Promise.all([
          fetch(`${BASE}/api/agences`),
          fetch(`${BASE}/api/fonctions`),
          fetch(`${BASE}/api/niveaux`),
          fetch(`${BASE}/api/competences`), // AJOUT: compétences
        ]);

        if (agencesRes.ok) {
          const agencesData = await agencesRes.json();
          setAgences(agencesData.agences);
        }

        if (fonctionsRes.ok) {
          const fonctionsData = await fonctionsRes.json();
          setFonctions(fonctionsData.fonctions);
        }

        if (niveauxRes.ok) {
          const niveauxData = await niveauxRes.json();
          setNiveaux(niveauxData.niveaux);
        }

        // AJOUT: charger compétences
        if (competencesRes.ok) {
          const competencesData = await competencesRes.json();
          const list: Competence[] = (competencesData.competences || []).filter((c: Competence) => c.actif !== false);
          setCompetences(list);
        }

        setLoading(false);
      } catch (err) {
        console.error('Erreur lors du chargement des référentiels:', err);
        showError('Impossible de charger les référentiels');
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Handlers pour les agences
  const handleAddAgence = async () => {
    const BASE = getBackendUrl();
    try {
      const response = await fetch(`${BASE}/api/agences`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(agenceForm)
      });

      if (response.ok) {
        showSuccess('Agence ajoutée avec succès');
        setOpenAgence(false);
        resetAgenceForm();
        // Recharger les données
        const agencesRes = await fetch(`${BASE}/api/agences`);
        const agencesData = await agencesRes.json();
        setAgences(agencesData.agences);
      } else {
        showError('Erreur lors de l\'ajout de l\'agence');
      }
    } catch (err) {
      showError('Erreur lors de l\'ajout de l\'agence');
    }
  };

  const handleEditAgence = async () => {
    const BASE = getBackendUrl();
    if (!editAgenceId) return;
    
    try {
      const response = await fetch(`${BASE}/api/agences/${editAgenceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(agenceForm)
      });

      if (response.ok) {
        showSuccess('Agence modifiée avec succès');
        setOpenAgence(false);
        resetAgenceForm();
        setEditAgenceId(null);
        // Recharger les données
        const agencesRes = await fetch(`${BASE}/api/agences`);
        const agencesData = await agencesRes.json();
        setAgences(agencesData.agences);
      } else {
        showError('Erreur lors de la modification de l\'agence');
      }
    } catch (err) {
      showError('Erreur lors de la modification de l\'agence');
    }
  };

  const handleDeleteAgence = async () => {
    const BASE = getBackendUrl();
    if (!deleteAgenceId) return;

    try {
      const response = await fetch(`${BASE}/api/agences/${deleteAgenceId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        showSuccess('Agence supprimée avec succès');
        setDeleteAgenceId(null);
        // Recharger les données
        const agencesRes = await fetch(`${BASE}/api/agences`);
        const agencesData = await agencesRes.json();
        setAgences(agencesData.agences);
      } else {
        showError('Erreur lors de la suppression de l\'agence');
      }
    } catch (err) {
      showError('Erreur lors de la suppression de l\'agence');
    }
  };

  // Handlers similaires pour fonctions et niveaux
  const handleAddFonction = async () => {
    const BASE = getBackendUrl();
    try {
      const response = await fetch(`${BASE}/api/fonctions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fonctionForm)
      });

      if (response.ok) {
        showSuccess('Fonction ajoutée avec succès');
        setOpenFonction(false);
        resetFonctionForm();
        const fonctionsRes = await fetch(`${BASE}/api/fonctions`);
        const fonctionsData = await fonctionsRes.json();
        setFonctions(fonctionsData.fonctions);
      } else {
        showError('Erreur lors de l\'ajout de la fonction');
      }
    } catch (err) {
      showError('Erreur lors de l\'ajout de la fonction');
    }
  };

  const handleAddNiveau = async () => {
    const BASE = getBackendUrl();
    try {
      const response = await fetch(`${BASE}/api/niveaux`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(niveauForm)
      });

      if (response.ok) {
        showSuccess('Niveau ajouté avec succès');
        setOpenNiveau(false);
        resetNiveauForm();
        const niveauxRes = await fetch(`${BASE}/api/niveaux`);
        const niveauxData = await niveauxRes.json();
        setNiveaux(niveauxData.niveaux);
      } else {
        showError('Erreur lors de l\'ajout du niveau');
      }
    } catch (err) {
      showError('Erreur lors de l\'ajout du niveau');
    }
  };

  // AJOUT: handlers Compétence
  const handleAddCompetence = async () => {
    const BASE = getBackendUrl();
    try {
      const response = await fetch(`${BASE}/api/competences`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(competenceForm)
      });

      if (response.ok) {
        showSuccess('Compétence ajoutée avec succès');
        setOpenCompetence(false);
        resetCompetenceForm();
        const res = await fetch(`${BASE}/api/competences`);
        const data = await res.json();
        setCompetences(data.competences);
      } else {
        const j = await response.json().catch(() => ({}));
        showError(j.error || 'Erreur lors de l\'ajout de la compétence');
      }
    } catch (err) {
      showError('Erreur lors de l\'ajout de la compétence');
    }
  };

  const handleEditCompetence = async () => {
    const BASE = getBackendUrl();
    if (!editCompetenceId) return;
    try {
      const response = await fetch(`${BASE}/api/competences/${editCompetenceId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(competenceForm)
      });

      if (response.ok) {
        showSuccess('Compétence modifiée avec succès');
        setOpenCompetence(false);
        resetCompetenceForm();
        setEditCompetenceId(null);
        const res = await fetch(`${BASE}/api/competences`);
        const data = await res.json();
        setCompetences(data.competences);
      } else {
        const j = await response.json().catch(() => ({}));
        showError(j.error || 'Erreur lors de la modification de la compétence');
      }
    } catch (err) {
      showError('Erreur lors de la modification de la compétence');
    }
  };

  const handleDeleteCompetence = async () => {
    const BASE = getBackendUrl();
    if (!deleteCompetenceId) return;
    try {
      const response = await fetch(`${BASE}/api/competences/${deleteCompetenceId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        showSuccess('Compétence supprimée avec succès');
        setDeleteCompetenceId(null);
        const res = await fetch(`${BASE}/api/competences`);
        const data = await res.json();
        setCompetences(data.competences);
      } else {
        const j = await response.json().catch(() => ({}));
        showError(j.error || 'Erreur lors de la suppression de la compétence');
      }
    } catch (err) {
      showError('Erreur lors de la suppression de la compétence');
    }
  };

  // Fonctions utilitaires
  const resetAgenceForm = () => {
    setAgenceForm({
      nom: ''
    });
  };

  const resetFonctionForm = () => {
    setFonctionForm({
      nom: '',
      description: ''
    });
  };

  const resetNiveauForm = () => {
    setNiveauForm({
      nom: '',
      ordre: 1,
      description: ''
    });
  };

  // AJOUT: utilitaires Compétence
  const resetCompetenceForm = () => {
    setCompetenceForm({
      nom: '',
      description: ''
    });
  };

  const openEditAgence = (agence: Agence) => {
    setAgenceForm({
      nom: agence.nom
    });
    setEditAgenceId(agence.id_agence);
    setOpenAgence(true);
  };

  const openEditFonction = (fonction: Fonction) => {
    setFonctionForm({
      nom: fonction.nom,
      description: fonction.description
    });
    setEditFonctionId(fonction.id_fonction);
    setOpenFonction(true);
  };

  const openEditNiveau = (niveau: Niveau) => {
    setNiveauForm({
      nom: niveau.nom,
      ordre: niveau.ordre,
      description: niveau.description
    });
    setEditNiveauId(niveau.id_niveau);
    setOpenNiveau(true);
  };

  // AJOUT: open edit Compétence
  const openEditCompetence = (competence: Competence) => {
    setCompetenceForm({
      nom: competence.nom,
      description: competence.description || ''
    });
    setEditCompetenceId(competence.id_competence);
    setOpenCompetence(true);
  };

  const handleEditFonction = async () => {
    try {
      const response = await fetch(`${getBackendUrl()}/api/fonctions/${editFonctionId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(fonctionForm)
      });

      if (response.ok) {
        showSuccess('Fonction modifiée avec succès');
        setOpenFonction(false);
        resetFonctionForm();
        setEditFonctionId(null);
        // Recharger les données
        const fonctionsRes = await fetch(`${getBackendUrl()}/api/fonctions`);
        const fonctionsData = await fonctionsRes.json();
        setFonctions(fonctionsData.fonctions);
      } else {
        showError('Erreur lors de la modification de la fonction');
      }
    } catch (err) {
      showError('Erreur lors de la modification de la fonction');
    }
  };

  const handleEditNiveau = async () => {
    try {
      const response = await fetch(`${getBackendUrl()}/api/niveaux/${editNiveauId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(niveauForm)
      });

      if (response.ok) {
        showSuccess('Niveau modifié avec succès');
        setOpenNiveau(false);
        resetNiveauForm();
        setEditNiveauId(null);
        // Recharger les données
        const niveauxRes = await fetch(`${getBackendUrl()}/api/niveaux`);
        const niveauxData = await niveauxRes.json();
        setNiveaux(niveauxData.niveaux);
      } else {
        showError('Erreur lors de la modification du niveau');
      }
    } catch (err) {
      showError('Erreur lors de la modification du niveau');
    }
  };

  const handleDeleteFonction = async () => {
    try {
      const response = await fetch(`${getBackendUrl()}/api/fonctions/${deleteFonctionId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        showSuccess('Fonction supprimée avec succès');
        setDeleteFonctionId(null);
        // Recharger les données
        const fonctionsRes = await fetch(`${getBackendUrl()}/api/fonctions`);
        const fonctionsData = await fonctionsRes.json();
        setFonctions(fonctionsData.fonctions);
      } else {
        showError('Erreur lors de la suppression de la fonction');
      }
    } catch (err) {
      showError('Erreur lors de la suppression de la fonction');
    }
  };

  const handleDeleteNiveau = async () => {
    try {
      const response = await fetch(`${getBackendUrl()}/api/niveaux/${deleteNiveauId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        showSuccess('Niveau supprimé avec succès');
        setDeleteNiveauId(null);
        // Recharger les données
        const niveauxRes = await fetch(`${getBackendUrl()}/api/niveaux`);
        const niveauxData = await niveauxRes.json();
        setNiveaux(niveauxData.niveaux);
      } else {
        showError('Erreur lors de la suppression du niveau');
      }
    } catch (err) {
      showError('Erreur lors de la suppression du niveau');
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-10 px-2">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-blue"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-10 px-2">
      <h1 className="text-3xl font-bold mb-8 text-brand-dark">Gestion des Référentiels</h1>
      
      {/* Section Agences */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold text-brand-blue flex items-center gap-2">
            <Building2 className="mr-2" /> Agences (Villes)
          </h2>
          <Button
            variant="default"
            className="rounded-full px-6 py-2 font-bold"
            onClick={() => {
              resetAgenceForm();
              setEditAgenceId(null);
              setOpenAgence(true);
            }}
          >
            <Plus className="mr-2" /> Ajouter
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {agences.map((agence) => (
            <div key={agence.id_agence} className="bg-white rounded-xl shadow p-4 border-2 border-brand-dark">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-bold text-lg text-brand-dark">{agence.nom}</div>
                </div>
                <div className="flex flex-col gap-2">
                  <Button variant="outline" size="icon" onClick={() => openEditAgence(agence)} title="Éditer">
                    <Pencil size={16} />
                  </Button>
                  <Button variant="destructive" size="icon" onClick={() => setDeleteAgenceId(agence.id_agence)} title="Supprimer">
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section Fonctions */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold text-brand-blue flex items-center gap-2">
            <Briefcase className="mr-2" /> Fonctions
          </h2>
          <div className="flex gap-2 items-center">
            <Button
              variant="default"
              className="rounded-full px-6 py-2 font-bold"
              onClick={() => {
                resetFonctionForm();
                setEditFonctionId(null);
                setOpenFonction(true);
              }}
            >
              <Plus className="mr-2" /> Ajouter
            </Button>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                className="rounded-full px-6 py-2 font-bold"
                onClick={() => fileInputRef.current?.click()}
                disabled={importLoading}
              >
                {importLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand-blue mr-2"></div>
                    Import en cours...
                  </>
                ) : (
                  <>
                    <FileSpreadsheet className="mr-2" size={16} />
                    Importer Excel
                  </>
                )}
              </Button>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info size={16} className="text-brand-blue/60 hover:text-brand-blue cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <div className="text-sm">
                      <div className="font-semibold mb-1">Colonnes Excel attendues :</div>
                      <div><strong>Fonction</strong> (obligatoire)</div>
                      <div><strong>Description</strong> (optionnelle)</div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <input
                type="file"
                ref={fileInputRef}
                hidden
                onChange={handleImportExcel}
                accept=".xlsx, .xls"
              />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {fonctions.map((fonction) => (
            <div key={fonction.id_fonction} className="bg-white rounded-xl shadow p-4 border-2 border-brand-dark">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-bold text-lg text-brand-dark">{fonction.nom}</div>
                  <div className="text-sm text-brand-dark/80">{fonction.description}</div>
                </div>
                <div className="flex flex-col gap-2">
                  <Button variant="outline" size="icon" onClick={() => openEditFonction(fonction)} title="Éditer">
                    <Pencil size={16} />
                  </Button>
                  <Button variant="destructive" size="icon" onClick={() => setDeleteFonctionId(fonction.id_fonction)} title="Supprimer">
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Section Niveaux */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold text-brand-blue flex items-center gap-2">
            <Award className="mr-2" /> Niveaux d'Expertise
          </h2>
          <Button
            variant="default"
            className="rounded-full px-6 py-2 font-bold"
            onClick={() => {
              resetNiveauForm();
              setEditNiveauId(null);
              setOpenNiveau(true);
            }}
          >
            <Plus className="mr-2" /> Ajouter
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {niveaux.map((niveau) => (
            <div key={niveau.id_niveau} className="bg-white rounded-xl shadow p-4 border-2 border-brand-dark">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-bold text-lg text-brand-dark">{niveau.nom}</div>
                  <div className="text-sm text-brand-dark/80">Ordre: {niveau.ordre}</div>
                  <div className="text-xs text-brand-dark/60">{niveau.description}</div>
                </div>
                <div className="flex flex-col gap-2">
                  <Button variant="outline" size="icon" onClick={() => openEditNiveau(niveau)} title="Éditer">
                    <Pencil size={16} />
                  </Button>
                  <Button variant="destructive" size="icon" onClick={() => setDeleteNiveauId(niveau.id_niveau)} title="Supprimer">
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* AJOUT: Section Compétences */}
      <div className="mb-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-semibold text-brand-blue flex items-center gap-2">
            <Puzzle className="mr-2" /> Compétences
          </h2>
          <div className="flex gap-2 items-center">
            <Button
              variant="default"
              className="rounded-full px-6 py-2 font-bold"
              onClick={() => {
                resetCompetenceForm();
                setEditCompetenceId(null);
                setOpenCompetence(true);
              }}
            >
              <Plus className="mr-2" /> Ajouter
            </Button>
            <div className="flex items-center gap-1">
              <Button
                variant="outline"
                className="rounded-full px-6 py-2 font-bold"
                onClick={() => competenceFileInputRef.current?.click()}
                disabled={importCompetenceLoading}
              >
                {importCompetenceLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-brand-blue mr-2"></div>
                    Import en cours...
                  </>
                ) : (
                  <>
                    <FileSpreadsheet className="mr-2" size={16} />
                    Importer Excel
                  </>
                )}
              </Button>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Info size={16} className="text-brand-blue/60 hover:text-brand-blue cursor-help" />
                  </TooltipTrigger>
                  <TooltipContent side="top" className="max-w-xs">
                    <div className="text-sm">
                      <div className="font-semibold mb-1">Colonnes Excel attendues :</div>
                      <div><strong>Compétence</strong> ou <strong>Nom</strong> (obligatoire)</div>
                      <div><strong>Description</strong> (optionnelle)</div>
                    </div>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
              <input
                type="file"
                ref={competenceFileInputRef}
                hidden
                onChange={handleImportCompetencesExcel}
                accept=".xlsx, .xls"
              />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {competences.map((comp) => (
            <div key={comp.id_competence} className="bg-white rounded-xl shadow p-4 border-2 border-brand-dark">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="font-bold text-lg text-brand-dark">{comp.nom}</div>
                  <div className="text-xs text-brand-dark/70">{comp.description}</div>
                </div>
                <div className="flex flex-col gap-2">
                  <Button variant="outline" size="icon" onClick={() => openEditCompetence(comp)} title="Éditer">
                    <Pencil size={16} />
                  </Button>
                  <Button variant="destructive" size="icon" onClick={() => setDeleteCompetenceId(comp.id_competence)} title="Supprimer">
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            </div>
          ))}
          {competences.length === 0 && (
            <div className="col-span-full text-sm text-brand-dark/70">
              Aucune compétence définie pour le moment. Cliquez sur "Ajouter".
            </div>
          )}
        </div>
      </div>

      {/* Dialog Agence */}
      <Dialog open={openAgence} onOpenChange={setOpenAgence}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editAgenceId ? 'Modifier une ville' : 'Ajouter une ville'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div>
              <Label>Nom de la ville</Label>
              <Input 
                value={agenceForm.nom} 
                onChange={e => setAgenceForm(f => ({ ...f, nom: e.target.value }))} 
                placeholder="Ex: Paris, Lyon, Marseille..."
              />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Annuler</Button>
            </DialogClose>
            <Button onClick={editAgenceId ? handleEditAgence : handleAddAgence}>
              {editAgenceId ? 'Modifier' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Fonction */}
      <Dialog open={openFonction} onOpenChange={setOpenFonction}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editFonctionId ? 'Modifier une fonction' : 'Ajouter une fonction'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div>
              <Label>Nom</Label>
              <Input value={fonctionForm.nom} onChange={e => setFonctionForm(f => ({ ...f, nom: e.target.value }))} />
            </div>
            <div>
              <Label>Description</Label>
              <Input value={fonctionForm.description} onChange={e => setFonctionForm(f => ({ ...f, description: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Annuler</Button>
            </DialogClose>
            <Button onClick={editFonctionId ? handleEditFonction : handleAddFonction}>
              {editFonctionId ? 'Modifier' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Dialog Niveau */}
      <Dialog open={openNiveau} onOpenChange={setOpenNiveau}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editNiveauId ? 'Modifier un niveau' : 'Ajouter un niveau'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label>Nom</Label>
                <Input value={niveauForm.nom} onChange={e => setNiveauForm(f => ({ ...f, nom: e.target.value }))} />
              </div>
              <div>
                <Label>Ordre</Label>
                <Input type="number" value={niveauForm.ordre} onChange={e => setNiveauForm(f => ({ ...f, ordre: Number(e.target.value) }))} />
              </div>
            </div>
            <div>
              <Label>Description</Label>
              <Input value={niveauForm.description} onChange={e => setNiveauForm(f => ({ ...f, description: e.target.value }))} />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Annuler</Button>
            </DialogClose>
            <Button onClick={editNiveauId ? handleEditNiveau : handleAddNiveau}>
              {editNiveauId ? 'Modifier' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AJOUT: Dialog Compétence */}
      <Dialog open={openCompetence} onOpenChange={setOpenCompetence}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editCompetenceId ? 'Modifier une compétence' : 'Ajouter une compétence'}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4">
            <div>
              <Label>Nom</Label>
              <Input value={competenceForm.nom} onChange={e => setCompetenceForm(f => ({ ...f, nom: e.target.value }))} placeholder="Ex: Structure, Fluide, Thermique..." />
            </div>
            <div>
              <Label>Description</Label>
              <Input value={competenceForm.description} onChange={e => setCompetenceForm(f => ({ ...f, description: e.target.value }))} placeholder="Optionnel" />
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Annuler</Button>
            </DialogClose>
            <Button onClick={editCompetenceId ? handleEditCompetence : handleAddCompetence}>
              {editCompetenceId ? 'Modifier' : 'Ajouter'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* AlertDialogs pour suppression */}
      <AlertDialog open={!!deleteAgenceId} onOpenChange={open => !open && setDeleteAgenceId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette agence ?</AlertDialogTitle>
          </AlertDialogHeader>
          <div>Cette action est irréversible.</div>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="outline">Annuler</Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button variant="destructive" onClick={handleDeleteAgence}>Supprimer</Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AlertDialog pour suppression des fonctions */}
      <AlertDialog open={!!deleteFonctionId} onOpenChange={open => !open && setDeleteFonctionId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette fonction ?</AlertDialogTitle>
          </AlertDialogHeader>
          <div>Cette action est irréversible.</div>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="outline">Annuler</Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button variant="destructive" onClick={handleDeleteFonction}>Supprimer</Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AlertDialog pour suppression des niveaux */}
      <AlertDialog open={!!deleteNiveauId} onOpenChange={open => !open && setDeleteNiveauId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce niveau ?</AlertDialogTitle>
          </AlertDialogHeader>
          <div>Cette action est irréversible.</div>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="outline">Annuler</Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button variant="destructive" onClick={handleDeleteNiveau}>Supprimer</Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* AJOUT: AlertDialog pour suppression des compétences */}
      <AlertDialog open={!!deleteCompetenceId} onOpenChange={open => !open && setDeleteCompetenceId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette compétence ?</AlertDialogTitle>
          </AlertDialogHeader>
          <div>Cette action est irréversible.</div>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="outline">Annuler</Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button variant="destructive" onClick={handleDeleteCompetence}>Supprimer</Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}