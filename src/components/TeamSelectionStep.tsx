import { useState, useMemo, useEffect } from "react";
import { FilterChips } from "./FilterChips";
import { EmployeeCard, Employee } from "./EmployeeCard";
import { TeamCounter } from "./TeamCounter";
import { Button } from "@/components/ui/button";
import { showSuccess } from "@/utils/toast";
import { useNavigate } from "react-router-dom";
import { useWorkflow } from "./WorkflowContext";
import { AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle, AlertDialogFooter, AlertDialogCancel, AlertDialogAction } from "@/components/ui/alert-dialog";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:4000';

export const TeamSelectionStep = () => {
  const [selectedAgencies, setSelectedAgencies] = useState<string[]>([]);
  const [selectedFunctions, setSelectedFunctions] = useState<string[]>([]);
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [openReset, setOpenReset] = useState(false);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [agencies, setAgencies] = useState<string[]>([]);
  const [functions, setFunctions] = useState<string[]>([]);
  const [levels, setLevels] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const navigate = useNavigate();
  const { setSelectedTeam } = useWorkflow();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [salariesResponse, agencesResponse, fonctionsResponse, niveauxResponse] = await Promise.all([
          fetch(`${BACKEND_URL}/api/salaries`),
          fetch(`${BACKEND_URL}/api/agences`),
          fetch(`${BACKEND_URL}/api/fonctions`),
          fetch(`${BACKEND_URL}/api/niveaux`),
        ]);

        if (!salariesResponse.ok || !agencesResponse.ok || !fonctionsResponse.ok || !niveauxResponse.ok) {
          throw new Error(`Erreur HTTP lors du chargement des données de référence`);
        }

        const salariesData = await salariesResponse.json();
        const agencesData = await agencesResponse.json();
        const fonctionsData = await fonctionsResponse.json();
        const niveauxData = await niveauxResponse.json();

        const employeesFormatted = salariesData.salaries.map((salary: any) => ({
          id: salary.id_salarie.toString(),
          name: `${salary.prenom} ${salary.nom}`,
          agency: salary.agence,
          function: salary.fonction,
          level: salary.niveau_expertise,
        }));
        setEmployees(employeesFormatted);

        // Utiliser les données des référentiels pour les filtres (uniquement les actifs)
        setAgencies(agencesData.agences.filter((a: any) => a.actif).map((a: any) => a.nom));
        setFunctions(fonctionsData.fonctions.filter((f: any) => f.actif).map((f: any) => f.nom));
        setLevels(niveauxData.niveaux.filter((n: any) => n.actif).map((n: any) => n.nom));

      } catch (err) {
        console.error('Erreur lors du chargement des données:', err);
        setError('Impossible de charger les données des référentiels ou des salariés.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  const filteredEmployees = useMemo(() => {
    return employees.filter((e) =>
      (selectedAgencies.length === 0 || selectedAgencies.includes(e.agency)) &&
      (selectedFunctions.length === 0 || selectedFunctions.includes(e.function)) &&
      (selectedLevels.length === 0 || selectedLevels.includes(e.level))
    );
  }, [employees, selectedAgencies, selectedFunctions, selectedLevels]);

  const handleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const handleReset = () => {
    setSelectedAgencies([]);
    setSelectedFunctions([]);
    setSelectedLevels([]);
    setSelectedIds([]);
    setOpenReset(false);
  };

  const handleValidate = () => {
    // Récupérer les objets employés complets pour les IDs sélectionnés
    const selectedEmployees = employees.filter(emp => selectedIds.includes(emp.id));
    
    console.log('🎯 [TEAM] Équipe sélectionnée:', selectedEmployees);
    
    setSelectedTeam(selectedEmployees);
    showSuccess(`Équipe de ${selectedEmployees.length} personnes validée !`);
    
    setTimeout(() => {
      navigate("/association"); // Aller directement vers l’étape Association
    }, 600);
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto py-10 px-2 bg-[hsl(var(--brand-lightblue))] min-h-screen">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-blue"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-5xl mx-auto py-10 px-2 bg-[hsl(var(--brand-lightblue))] min-h-screen">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Erreur : </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto py-10 px-2 bg-[hsl(var(--brand-lightblue))] min-h-screen">
      <h2 className="text-4xl font-extrabold mb-10 text-center text-[hsl(var(--brand-dark))] tracking-tight drop-shadow-sm">
        Constituer l’équipe
      </h2>
      <div className="mb-10 flex flex-col gap-4 md:flex-row md:items-end md:justify-center md:gap-8">
        <div className="flex-1">
          <FilterChips
            options={agencies}
            selected={selectedAgencies}
            onChange={setSelectedAgencies}
            label="Agence"
          />
        </div>
        <div className="flex-1">
          <FilterChips
            options={functions}
            selected={selectedFunctions}
            onChange={setSelectedFunctions}
            label="Fonction"
          />
        </div>
        <div className="flex-1">
          <FilterChips
            options={levels}
            selected={selectedLevels}
            onChange={setSelectedLevels}
            label="Niveau"
          />
        </div>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-8 mb-12">
        {filteredEmployees.map((employee) => (
          <EmployeeCard
            key={employee.id}
            employee={employee}
            selected={selectedIds.includes(employee.id)}
            onSelect={handleSelect}
          />
        ))}
        {filteredEmployees.length === 0 && (
          <div className="col-span-full text-center text-[hsl(var(--brand-dark))/0.6] py-8 text-lg font-medium">
            Aucun salarié ne correspond aux filtres.
          </div>
        )}
      </div>
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4 mt-4">
        <Button
          variant="outline"
          onClick={() => setOpenReset(true)}
          className="rounded-full px-8 py-2 text-base font-semibold border-2 border-[hsl(var(--brand-dark))] text-[hsl(var(--brand-dark))] bg-white hover:bg-[hsl(var(--brand-pale))] transition"
        >
          Réinitialiser
        </Button>
        <Button
          onClick={handleValidate}
          disabled={selectedIds.length === 0}
          className="rounded-full px-8 py-2 text-base font-bold bg-[hsl(var(--brand-yellow))] text-[hsl(var(--brand-dark))] shadow-lg hover:bg-[hsl(var(--brand-yellow))/0.9] disabled:opacity-60 transition"
        >
          Valider l’équipe et continuer
        </Button>
      </div>
      <TeamCounter count={selectedIds.length} />
      <AlertDialog open={openReset} onOpenChange={setOpenReset}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Réinitialiser la sélection ?</AlertDialogTitle>
          </AlertDialogHeader>
          <div>Cette action va effacer tous les filtres et la sélection en cours.</div>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="outline">Annuler</Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button variant="destructive" onClick={handleReset}>Réinitialiser</Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};