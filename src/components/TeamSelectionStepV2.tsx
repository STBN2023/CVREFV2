import { useEffect, useMemo, useState } from "react";
import { FilterChips } from "./FilterChips";
import { EmployeeCard, Employee } from "./EmployeeCard";
import { TeamCounter } from "./TeamCounter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { showSuccess } from "@/utils/toast";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useWorkflow } from "./WorkflowContext";
import { ChevronDown, ChevronUp } from "lucide-react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

type SortKey = "name" | "level" | "function" | "agency";
type SortDir = "asc" | "desc";

export const TeamSelectionStepV2 = () => {
  const [selectedAgencies, setSelectedAgencies] = useState<string[]>([]);
  const [selectedFunctions, setSelectedFunctions] = useState<string[]>([]);
  const [selectedLevels, setSelectedLevels] = useState<string[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [openReset, setOpenReset] = useState(false);

  // AJOUT: compétences
  const [selectedSkills, setSelectedSkills] = useState<string[]>([]);
  const [skillsMatchMode, setSkillsMatchMode] = useState<"any" | "all">("any");

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [agencies, setAgencies] = useState<string[]>([]);
  const [functions, setFunctions] = useState<string[]>([]);
  const [levels, setLevels] = useState<string[]>([]);
  // AJOUT: référentiel compétences
  const [skillsRef, setSkillsRef] = useState<string[]>([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Nouveautés V2
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [sortBy, setSortBy] = useState<SortKey>("name");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [showOnlySelected, setShowOnlySelected] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(12);

  // Toggle bandeau de filtres
  const [filtersOpen, setFiltersOpen] = useState(true);

  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { setSelectedTeam } = useWorkflow();

  // Chargement des données de base
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
          throw new Error("Erreur HTTP lors du chargement des données de référence");
        }

        const salariesData = await salariesResponse.json();
        const agencesData = await agencesResponse.json();
        const fonctionsData = await fonctionsResponse.json();
        const niveauxData = await niveauxResponse.json();

        // AJOUT: charger référentiel compétences
        const skillsResponse = await fetch(`${BACKEND_URL}/api/competences`);
        let skillsData: any = null;
        if (skillsResponse.ok) {
          skillsData = await skillsResponse.json();
        }

        const employeesFormatted: Employee[] = salariesData.salaries.map((salary: any) => ({
          id: salary.id_salarie.toString(),
          name: `${salary.prenom} ${salary.nom}`,
          agency: salary.agence,
          function: salary.fonction,
          level: salary.niveau_expertise,
          inactive: !salary.actif, // Nouveau: marquage inactif
          skills: [], // sera enrichi ensuite
        }));
        setEmployees(employeesFormatted);

        // référentiels actifs
        setAgencies(agencesData.agences.filter((a: any) => a.actif).map((a: any) => a.nom));
        setFunctions(fonctionsData.fonctions.filter((f: any) => f.actif).map((f: any) => f.nom));
        setLevels(niveauxData.niveaux.filter((n: any) => n.actif).map((n: any) => n.nom));
        setSkillsRef(((skillsData?.competences || []).filter((c: any) => c.actif).map((c: any) => c.nom)) || []);
      } catch (err) {
        console.error("Erreur lors du chargement des données:", err);
        setError("Impossible de charger les données des référentiels ou des salariés.");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  // Enrichir chaque employé avec ses compétences (après chargement employés)
  useEffect(() => {
    let cancel = false;
    const enrichSkills = async () => {
      if (employees.length === 0) return;
      const updated = await Promise.all(
        employees.map(async (e) => {
          try {
            const r = await fetch(`${BACKEND_URL}/api/salaries/${e.id}/competences`);
            if (r.ok) {
              const j = await r.json();
              const names = (j?.competences || []).map((c: any) => c.nom).filter(Boolean);
              return { ...e, skills: names };
            }
          } catch {}
          return e;
        })
      );
      if (!cancel) setEmployees(updated);
    };
    enrichSkills();
    return () => { cancel = true; };
  }, [employees.length]);

  // Initialisation depuis URL et localStorage (une seule fois)
  useEffect(() => {
    try {
      const spq = searchParams.get("q") ?? "";
      const spa = searchParams.get("ag") ?? "";
      const spf = searchParams.get("fn") ?? "";
      const spl = searchParams.get("lv") ?? "";
      const spsort = (searchParams.get("sort") as SortKey | null);
      const spdir = (searchParams.get("dir") as SortDir | null);
      const spsel = searchParams.get("sel");

      const fromLS = localStorage.getItem("teamV2State");
      const saved = fromLS ? JSON.parse(fromLS) : {};

      setSearchTerm(spq || saved.searchTerm || "");
      if (spa) setSelectedAgencies(spa.split(",").filter(Boolean)); else if (saved.selectedAgencies) setSelectedAgencies(saved.selectedAgencies);
      if (spf) setSelectedFunctions(spf.split(",").filter(Boolean)); else if (saved.selectedFunctions) setSelectedFunctions(saved.selectedFunctions);
      if (spl) setSelectedLevels(spl.split(",").filter(Boolean)); else if (saved.selectedLevels) setSelectedLevels(saved.selectedLevels);
      // AJOUT: skills depuis URL/LS
      const spsk = searchParams.get("sk") ?? "";
      if (spsk) setSelectedSkills(spsk.split(",").filter(Boolean));
      else if (Array.isArray(saved.selectedSkills)) setSelectedSkills(saved.selectedSkills);
      const spmode = (searchParams.get("skmode") as "any" | "all" | null);
      if (spmode) setSkillsMatchMode(spmode);
      else if (saved.skillsMatchMode) setSkillsMatchMode(saved.skillsMatchMode);
      if (spsort) setSortBy(spsort); else if (saved.sortBy) setSortBy(saved.sortBy);
      if (spdir) setSortDir(spdir); else if (saved.sortDir) setSortDir(saved.sortDir);
      if (Array.isArray(saved.selectedIds)) setSelectedIds(saved.selectedIds);
      if (spsel === "1" || spsel === "true") setShowOnlySelected(true);
      else if (typeof saved.showOnlySelected === "boolean") setShowOnlySelected(saved.showOnlySelected);
      if (saved.pageSize) setPageSize(Number(saved.pageSize) || 12);
      if (typeof saved.filtersOpen === "boolean") setFiltersOpen(saved.filtersOpen);
    } catch (e) {
      // no-op
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Debounce de la recherche
  useEffect(() => {
    const id = setTimeout(() => {
      setDebouncedSearch(searchTerm.trim().toLowerCase());
    }, 250);
    return () => clearTimeout(id);
  }, [searchTerm]);

  // Persistance URL + localStorage sur changements
  useEffect(() => {
    const sp = new URLSearchParams();
    if (searchTerm) sp.set("q", searchTerm);
    if (selectedAgencies.length) sp.set("ag", selectedAgencies.join(","));
    if (selectedFunctions.length) sp.set("fn", selectedFunctions.join(","));
    if (selectedLevels.length) sp.set("lv", selectedLevels.join(","));
    // AJOUT: skills
    if (selectedSkills.length) sp.set("sk", selectedSkills.join(","));
    sp.set("sort", sortBy);
    sp.set("dir", sortDir);
    if (showOnlySelected) sp.set("sel", "1");
    sp.set("skmode", skillsMatchMode);
    setSearchParams(sp, { replace: true });

    localStorage.setItem(
      "teamV2State",
      JSON.stringify({
        searchTerm,
        selectedAgencies,
        selectedFunctions,
        selectedLevels,
        sortBy,
        sortDir,
        selectedIds,
        showOnlySelected,
        pageSize,
        filtersOpen,
        // AJOUT: skills
        selectedSkills,
        skillsMatchMode,
      })
    );
  }, [searchTerm, selectedAgencies, selectedFunctions, selectedLevels, sortBy, sortDir, selectedIds, showOnlySelected, pageSize, filtersOpen, setSearchParams]);

  const filteredAndSorted = useMemo(() => {
    const searched = employees.filter((e) => {
      if (!debouncedSearch) return true;
      const hay = `${e.name} ${e.function} ${e.agency} ${e.level} ${(e.skills || []).join(" ")}`.toLowerCase();
      return hay.includes(debouncedSearch);
    });

    const filtered = searched.filter((e) =>
      (selectedAgencies.length === 0 || selectedAgencies.includes(e.agency)) &&
      (selectedFunctions.length === 0 || selectedFunctions.includes(e.function)) &&
      (selectedLevels.length === 0 || selectedLevels.includes(e.level)) &&
      // AJOUT: filtre compétences
      (selectedSkills.length === 0 ||
        (skillsMatchMode === "any"
          ? (e.skills || []).some((sk) => selectedSkills.includes(sk))
          : selectedSkills.every((sk) => (e.skills || []).includes(sk))
        )
      )
    );

    const filteredBySelection = showOnlySelected
      ? filtered.filter((e) => selectedIds.includes(e.id))
      : filtered;

    const sorted = [...filteredBySelection].sort((a, b) => {
      let cmp = 0;
      switch (sortBy) {
        case "level":
          cmp = a.level.localeCompare(b.level, undefined, { sensitivity: "base" }) || a.name.localeCompare(b.name);
          break;
        case "function":
          cmp = a.function.localeCompare(b.function, undefined, { sensitivity: "base" }) || a.name.localeCompare(b.name);
          break;
        case "agency":
          cmp = a.agency.localeCompare(b.agency, undefined, { sensitivity: "base" }) || a.name.localeCompare(b.name);
          break;
        case "name":
        default:
          cmp = a.name.localeCompare(b.name);
          break;
      }
      return sortDir === "asc" ? cmp : -cmp;
    });

    return sorted;
  }, [employees, debouncedSearch, selectedAgencies, selectedFunctions, selectedLevels, sortBy, sortDir, showOnlySelected, selectedIds, selectedSkills, skillsMatchMode]);

  // Pagination helpers
  const pageCount = Math.max(1, Math.ceil(filteredAndSorted.length / pageSize));
  const safePage = Math.min(Math.max(1, page), pageCount);
  const pageStart = (safePage - 1) * pageSize;
  const pageEnd = Math.min(pageStart + pageSize, filteredAndSorted.length);
  const pageItems = filteredAndSorted.slice(pageStart, pageEnd);

  // Reset page when filters/sort/search/selection view changes
  useEffect(() => {
    setPage(1);
  }, [debouncedSearch, selectedAgencies, selectedFunctions, selectedLevels, sortBy, sortDir, showOnlySelected]);

  // Clamp page if pageSize or results change
  useEffect(() => {
    if (page !== safePage) setPage(safePage);
  }, [safePage]);

  const handleSelect = (id: string) => {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const handleReset = () => {
    setSelectedAgencies([]);
    setSelectedFunctions([]);
    setSelectedLevels([]);
    setSelectedIds([]);
    setSearchTerm("");
    setSortBy("name");
    setSortDir("asc");
    setShowOnlySelected(false);
    setOpenReset(false);
  };

  const handleValidate = () => {
    const selectedEmployees = employees.filter((emp) => selectedIds.includes(emp.id));
    setSelectedTeam(selectedEmployees);
    showSuccess(`Équipe de ${selectedEmployees.length} personnes validée !`);
    setTimeout(() => {
      navigate("/association"); // Aller directement à l'association
    }, 600);
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto py-10 px-3 bg-[hsl(var(--brand-lightblue))] min-h-screen">
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-brand-blue" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-6xl mx-auto py-10 px-3 bg-[hsl(var(--brand-lightblue))] min-h-screen">
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative" role="alert">
          <strong className="font-bold">Erreur : </strong>
          <span className="block sm:inline">{error}</span>
        </div>
      </div>
    );
  }

  const activeFiltersCount = selectedAgencies.length + selectedFunctions.length + selectedLevels.length + (searchTerm ? 1 : 0);

  return (
    <div className="max-w-6xl mx-auto py-8 px-3 bg-[hsl(var(--brand-lightblue))] min-h-screen">
      <h2 className="text-4xl font-extrabold mb-6 text-center text-[hsl(var(--brand-dark))] tracking-tight drop-shadow-sm">
        Constituer l'équipe
      </h2>

      {/* Barre de contrôles */}
      <div className="mb-4 grid grid-cols-1 md:grid-cols-12 gap-3">
        <div className="md:col-span-5 relative">
          <Input
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Escape") setSearchTerm(""); }}
            placeholder="Rechercher (nom, fonction, agence, niveau)"
            aria-label="Recherche globale"
            className="bg-white border-2 border-brand-dark focus-visible:ring-brand-yellow pr-10"
          />
          {searchTerm && (
            <button
              type="button"
              aria-label="Effacer la recherche"
              onClick={() => setSearchTerm("")}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-brand-dark/60 hover:text-brand-dark"
            >
              ×
            </button>
          )}
        </div>
        <div className="md:col-span-3">
          <div className="flex gap-2">
            <Select value={sortBy} onValueChange={(v) => setSortBy(v as SortKey)}>
              <SelectTrigger className="bg-white border-2 border-brand-dark focus:ring-brand-yellow">
                <SelectValue placeholder="Trier par" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="name">Nom</SelectItem>
                <SelectItem value="level">Niveau</SelectItem>
                <SelectItem value="function">Fonction</SelectItem>
                <SelectItem value="agency">Agence</SelectItem>
              </SelectContent>
            </Select>
            <Button
              type="button"
              variant="outline"
              onClick={() => setSortDir(sortDir === "asc" ? "desc" : "asc")}
              className="border-2 border-brand-dark text-brand-dark bg-white hover:bg-brand-pale"
              aria-label="Basculer l'ordre de tri"
            >
              {sortDir === "asc" ? "A→Z" : "Z→A"}
            </Button>
          </div>
        </div>
        <div className="md:col-span-4 flex items-stretch gap-2">
          <Button
            variant="outline"
            onClick={() => setOpenReset(true)}
            className="rounded-full px-6 border-2 border-brand-dark text-brand-dark bg-white hover:bg-brand-pale"
          >
            Réinitialiser
          </Button>
          <Button
            onClick={handleValidate}
            disabled={selectedIds.length === 0}
            className="rounded-full px-6 font-bold bg-[hsl(var(--brand-yellow))] text-[hsl(var(--brand-dark))] shadow-lg hover:bg-[hsl(var(--brand-yellow))/0.9] disabled:opacity-60"
          >
            Valider ({selectedIds.length})
          </Button>
        </div>
      </div>

      {/* Résumé des filtres actifs + bouton chevrons */}
      <div className="mb-2 flex items-center justify-between">
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary" className="rounded-full bg-brand-lightblue text-brand-dark border-none" aria-live="polite" aria-atomic="true">
            {filteredAndSorted.length} résultat{filteredAndSorted.length > 1 ? "s" : ""}
          </Badge>
          {activeFiltersCount > 0 && (
            <span className="text-sm text-brand-dark/70">
              {activeFiltersCount} filtre{activeFiltersCount > 1 ? "s" : ""} actif{activeFiltersCount > 1 ? "s" : ""}
            </span>
          )}
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          aria-expanded={filtersOpen}
          onClick={() => setFiltersOpen((v) => !v)}
          className="border-2 border-brand-dark text-brand-dark bg-white hover:bg-brand-pale"
          title={filtersOpen ? "Masquer les filtres" : "Afficher les filtres"}
        >
          {filtersOpen ? <ChevronUp className="h-4 w-4 mr-1" /> : <ChevronDown className="h-4 w-4 mr-1" />}
          {filtersOpen ? "Masquer" : "Afficher"} les filtres
        </Button>
      </div>

      {/* Bandeau de filtres */}
      <div
        className={`mb-6 overflow-hidden transition-all duration-300 ${
          filtersOpen ? "max-h-[800px] opacity-100" : "max-h-0 opacity-0"
        }`}
        aria-hidden={!filtersOpen}
      >
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <FilterChips options={agencies} selected={selectedAgencies} onChange={setSelectedAgencies} label="Agence" />
          <FilterChips options={functions} selected={selectedFunctions} onChange={setSelectedFunctions} label="Fonction" scrollable maxHeight="12rem" collapsible initialVisible={12} />
          <FilterChips options={levels} selected={selectedLevels} onChange={setSelectedLevels} label="Niveau" />
          {/* AJOUT: compétences */}
          <div className="lg:col-span-3">
            <div className="flex items-center justify-between mb-2">
              <div className="text-sm font-semibold text-[hsl(var(--brand-dark))]">Compétences</div>
              <Button
                type="button"
                variant="outline"
                onClick={() => setSkillsMatchMode((m) => (m === "any" ? "all" : "any"))}
                className="rounded-full px-4 py-1.5 border-2 border-[hsl(var(--brand-dark))] text-[hsl(var(--brand-dark))] bg-white hover:bg-[hsl(var(--brand-pale))]"
                title="Changer le mode de correspondance des compétences"
              >
                {skillsMatchMode === "any" ? "Au moins une" : "Toutes"}
              </Button>
            </div>
            <FilterChips options={skillsRef} selected={selectedSkills} onChange={setSelectedSkills} scrollable maxHeight="12rem" collapsible initialVisible={20} />
          </div>
        </div>
      </div>

      {/* Pagination top controls */}
      <div className="mb-4 flex items-center justify-between">
        <Badge variant="secondary" className="rounded-full bg-brand-lightblue text-brand-dark border-none" aria-live="polite" aria-atomic="true">
          {filteredAndSorted.length === 0 ? "0 résultat" : `${pageStart + 1}–${pageEnd} sur ${filteredAndSorted.length}`}
        </Badge>
        <div className="flex items-center gap-2">
          <span className="text-sm text-brand-dark/80">Par page</span>
          <Select value={String(pageSize)} onValueChange={(v) => setPageSize(Number(v))}>
            <SelectTrigger className="w-28 bg-white border-2 border-brand-dark focus:ring-brand-yellow">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="12">12</SelectItem>
              <SelectItem value="24">24</SelectItem>
              <SelectItem value="48">48</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex items-center gap-2 ml-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={safePage <= 1}
              className="border-2 border-brand-dark text-brand-dark bg-white hover:bg-brand-pale"
            >
              Précédent
            </Button>
            <span className="text-sm text-brand-dark/80">Page {safePage} / {pageCount}</span>
            <Button
              type="button"
              variant="outline"
              onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
              disabled={safePage >= pageCount}
              className="border-2 border-brand-dark text-brand-dark bg-white hover:bg-brand-pale"
            >
              Suivant
            </Button>
          </div>
        </div>
      </div>

      {/* Grille de cartes (paginée) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-10">
        {pageItems.map((employee) => (
          <EmployeeCard
            key={employee.id}
            employee={employee}
            selected={selectedIds.includes(employee.id)}
            onSelect={handleSelect}
          />
        ))}
        {filteredAndSorted.length === 0 && (
          <div className="col-span-full text-center text-brand-dark/60 py-10 text-lg font-medium">
            Aucun salarié ne correspond aux filtres.
          </div>
        )}
      </div>

      <div className="flex justify-end">
        <TeamCounter count={selectedIds.length} />
      </div>

      {/* Barre de sélection sticky */}
      <div className="fixed bottom-4 left-1/2 -translate-x-1/2 w-full max-w-6xl px-3 z-30">
        <div className="rounded-2xl border-2 border-brand-dark bg-white/95 shadow-lg px-4 py-3 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="text-sm text-brand-dark">
            <strong>{selectedIds.length}</strong> sélectionné{selectedIds.length > 1 ? "s" : ""} sur {filteredAndSorted.length} résultat{filteredAndSorted.length > 1 ? "s" : ""}
          </div>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => setSelectedIds(filteredAndSorted.map((e) => e.id))}
              className="rounded-full px-6 border-2 border-brand-dark text-brand-dark bg-white hover:bg-brand-pale"
            >
              Tout sélectionner
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setSelectedIds([])}
              className="rounded-full px-6 border-2 border-brand-dark text-brand-dark bg-white hover:bg-brand-pale"
            >
              Tout désélectionner
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowOnlySelected((v) => !v)}
              className="rounded-full px-6 border-2 border-brand-dark text-brand-dark bg-white hover:bg-brand-pale"
            >
              {showOnlySelected ? "Voir tout" : "Voir sélection"}
            </Button>
          </div>
          <div>
            <Button
              onClick={handleValidate}
              disabled={selectedIds.length === 0}
              className="rounded-full px-6 font-bold bg-[hsl(var(--brand-yellow))] text-[hsl(var(--brand-dark))] shadow-lg hover:bg-[hsl(var(--brand-yellow))/0.9] disabled:opacity-60"
            >
              Valider ({selectedIds.length})
            </Button>
          </div>
        </div>
      </div>

      <AlertDialog open={openReset} onOpenChange={setOpenReset}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Réinitialiser la sélection ?</AlertDialogTitle>
          </AlertDialogHeader>
          <div>Cette action va effacer tous les filtres, la recherche et la sélection en cours.</div>
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

export default TeamSelectionStepV2;