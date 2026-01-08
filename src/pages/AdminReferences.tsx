import { useEffect, useMemo, useRef, useState, ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import ReferencesToolbar from "@/components/references/ReferencesToolbar";
import ReferencesTable from "@/components/references/ReferencesTable";
import ReferenceFormDialog from "@/components/references/ReferenceFormDialog";
import ImportProgressDialog from "@/components/references/ImportProgressDialog";
import ImportRecapDialog from "@/components/references/ImportRecapDialog";
import AssociationsImportRecapDialog from "@/components/references/AssociationsImportRecapDialog";
import { exportReferencesToCsv } from "@/components/references/exportUtils";
import type { ImportProgress, RecapStats, Reference, Salarie } from "@/components/references/types";
import { showError, showSuccess, showLoading, dismissToast } from "@/utils/toast";
import { parseCurrencyToNumber } from "@/utils/number";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ArrowLeft } from "lucide-react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

function AdminReferences() {
  const navigate = useNavigate();

  // Data
  const [references, setReferences] = useState<Reference[]>([]);
  const [salaries, setSalaries] = useState<Salarie[]>([]);

  // UI states
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Reference | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Import/Export states
  const [importProgress, setImportProgress] = useState<ImportProgress>({
    show: false,
    type: "references",
    step: "",
    current: 0,
    total: 0,
    status: "loading",
    details: [],
  });
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [recapStats, setRecapStats] = useState<RecapStats>({
    show: false,
    totalReferences: 0,
    totalSalaries: 0,
    totalAssociations: 0,
    importDetails: {
      total: 0,
      added: 0,
      existing: 0,
      errors: 0,
      associations: 0,
      errorDetails: [],
      missingSalaries: [],
      recommendations: [],
      erreurs_detaillees: [],
      doublons_detectes: [],
      references_ajoutees: [],
      recommandations: [],
      statistiques: {
        fichier: "Import Excel",
        lignes_traitees: 0,
        references_ajoutees: 0,
        references_existantes: 0,
        erreurs: 0,
        total_base: 0,
      },
    },
  });

  // Récap import associations
  const [assocRecapOpen, setAssocRecapOpen] = useState(false);
  const [assocRecapDetails, setAssocRecapDetails] = useState<any>(null);

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const normalizeReferences = (raw: any[]): Reference[] =>
    (raw || []).map((r: any) => ({
      id: (r.id ?? r.id_reference ?? r.idReference ?? "").toString(),
      nom_projet: r.nom_projet ?? r.nom ?? "",
      client: r.client ?? "",
      ville: r.ville ?? "",
      annee: Number(r.annee ?? new Date().getFullYear()),
      type_mission: r.type_mission ?? "",
      // Montant: convertir toute chaîne (ex: "300 KEUR", "250000.00 EUR") en nombre
      montant: parseCurrencyToNumber(r.montant),
      description_projet: r.description_projet ?? r.description_courte ?? r.description ?? "",
      duree_mois: r.duree_mois ?? undefined,
      surface: r.surface ?? undefined,
      salaries: Array.isArray(r.salaries) ? r.salaries.map((s: any) => s.toString()) : [],
    }));

  async function loadData() {
    try {
      const [refsRes, salRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/references`),
        fetch(`${BACKEND_URL}/api/salaries`),
      ]);

      if (refsRes.ok) {
        const refsJson = await refsRes.json();
        const raw = Array.isArray(refsJson) ? refsJson : refsJson.references || [];
        setReferences(normalizeReferences(raw));
      } else {
        setReferences([]);
      }

      if (salRes.ok) {
        const salJson = await salRes.json();
        const raw = Array.isArray(salJson) ? salJson : salJson.salaries || [];
        setSalaries(
          raw.map((s: any) => ({
            id: s.id_salarie?.toString?.() ?? s.id?.toString?.() ?? "",
            nom: s.nom,
            prenom: s.prenom,
            agence: s.agence,
            fonction: s.fonction,
            niveau: s.niveau_expertise || s.niveau,
            actif: s.actif,
            template: s.template,
          }))
        );
      } else {
        setSalaries([]);
      }

      // recalc recap counters
      setRecapStats((prev) => ({
        ...prev,
        totalReferences: (references || []).length,
        totalSalaries: (salaries || []).length,
        totalAssociations: (references || []).reduce((acc, r) => acc + (r.salaries?.length || 0), 0),
      }));
    } catch (e) {
      console.error("Erreur chargement:", e);
      showError("Erreur lors du chargement des données");
      setReferences([]);
      setSalaries([]);
    }
  }

  // Import des associations: CSV/XLSX
  const onImportAssociations = async (file: File) => {
    const t = showLoading("Import des associations en cours...");
    try {
      // Pré-check: s'il n'y a aucun salarié en base, avertir et proposer l'import global
      const salRes = await fetch(`${BACKEND_URL}/api/salaries`);
      const salJson = await salRes.json().catch(() => ({}));
      const countSalaries = Array.isArray(salJson)
        ? salJson.length
        : (salJson?.salaries || []).length;
      if (countSalaries === 0) {
        showError("Aucun salarié en base. Importez d'abord les salariés (via le bloc Import Global) avant les associations.");
        return;
      }
      
      const fd = new FormData();
      fd.append("file", file);
      const resp = await fetch(`${BACKEND_URL}/api/import-associations`, { method: "POST", body: fd });
      const json = await resp.json().catch(() => ({}));
      if (!resp.ok) {
        showError(json?.error || "Erreur lors de l'import des associations");
        return;
      }
      const stats = json?.stats || {};
      showSuccess(`Associations importées: ${stats.linked || 0} ajoutées, ${stats.skipped || 0} ignorées, ${stats.errors || 0} erreurs`);
      // Ouvrir le récap détaillé pour comprendre les lignes ignorées
      if (json?.importDetails) {
        setAssocRecapDetails(json.importDetails);
        setAssocRecapOpen(true);
      }
      await loadData();
    } catch {
      showError("Erreur réseau pendant l'import des associations");
    } finally {
      dismissToast(t);
    }
  };

  // Helpers
  const getSalarieNames = (ids: string[]) => {
    const setIds = new Set(ids.map(String));
    const names = salaries
      .filter((s) => setIds.has(String(s.id)))
      .map((s) => `${s.prenom} ${s.nom}`);
    return names.join(", ");
  };

  // CRUD
  const createReference = async (payload: Omit<Reference, "id">) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/references`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showError(err.message || "Erreur lors de l'ajout de la référence");
        return;
      }
      showSuccess("Référence ajoutée avec succès");
      setCreating(false);
      await loadData();
    } catch {
      showError("Erreur lors de l'ajout de la référence");
    }
  };

  const updateReference = async (payload: Omit<Reference, "id"> & { id?: string }) => {
    if (!payload.id) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/references/${payload.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        showError(err.message || "Erreur lors de la modification de la référence");
        return;
      }
      showSuccess("Référence modifiée avec succès");
      setEditing(null);
      await loadData();
    } catch {
      showError("Erreur lors de la modification de la référence");
    }
  };

  const deleteReference = async () => {
    if (!deletingId) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/references/${deletingId}`, { method: "DELETE" });
      if (!res.ok) {
        showError("Erreur lors de la suppression de la référence");
        return;
      }
      showSuccess("Référence supprimée avec succès");
      setDeletingId(null);
      await loadData();
    } catch {
      showError("Erreur lors de la suppression de la référence");
    }
  };

  // Import
  const onImportFile = async (file: File) => {
    setImporting(true);
    setImportProgress({
      show: true,
      type: "references",
      step: "Préparation du fichier...",
      current: 0,
      total: 0,
      status: "loading",
      details: [],
    });

    try {
      const formData = new FormData();
      formData.append("file", file);

      const resp = await fetch(`${BACKEND_URL}/api/import-references`, { method: "POST", body: formData });
      let result: any;
      try {
        result = await resp.json();
      } catch {
        result = { message: "Réponse non valide du serveur" };
      }

      const stats = result?.stats || {
        total: result?.total || 0,
        added: result?.added || 0,
        existing: result?.existing || 0,
        errors: result?.errors || 0,
      };

      if (resp.ok && (result?.stats || result?.total !== undefined)) {
        setImportProgress((p) => ({
          ...p,
          step: "Import terminé avec succès !",
          status: "success",
          stats,
          details: [
            `✅ ${stats.total || 0} références traitées`,
            `➕ ${stats.added || 0} nouvelles références ajoutées`,
            `🔄 ${stats.existing || 0} références existantes ignorées`,
            `❌ ${stats.errors || 0} erreurs rencontrées`,
          ],
        }));

        setImportProgress((p) => ({ ...p, show: false }));
        setRecapStats({
          show: true,
          importDetails:
            result.importDetails || {
              statistiques: {
                fichier: file.name,
                lignes_traitees: stats.total || 0,
                references_ajoutees: stats.added || 0,
                references_existantes: stats.existing || 0,
                erreurs: stats.errors || 0,
                total_base: (stats.total || 0) + (stats.existing || 0),
              },
              erreurs_detaillees: [],
              doublons_detectes: [],
              references_ajoutees: [],
              recommandations: [],
              total: stats.total,
              added: stats.added,
              existing: stats.existing,
              errors: stats.errors,
              associations: 0,
              errorDetails: [],
              missingSalaries: [],
              recommendations: [],
            },
        });
        await loadData();
      } else {
        setImportProgress((p) => ({
          ...p,
          step: "Erreur lors de l'import",
          status: "error",
          details: [result?.message || "Erreur inconnue"],
        }));
        showError(result?.message || "Erreur lors de l'import");
      }
    } catch (e) {
      setImportProgress((p) => ({
        ...p,
        step: "Erreur lors de l'import",
        status: "error",
        details: ["Erreur de connexion au serveur"],
      }));
      showError("Erreur lors de l'import des références");
    } finally {
      setImporting(false);
    }
  };

  // Export
  const handleExport = async () => {
    setExporting(true);
    try {
      const resp = await fetch(`${BACKEND_URL}/api/export-references`);
      if (resp.ok) {
        const blob = await resp.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `references_export_${new Date().toISOString().split("T")[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        showSuccess(`Export Excel réussi : ${references.length} références exportées`);
      } else if (resp.status === 404) {
        exportReferencesToCsv(references);
        showSuccess(`Export CSV réalisé (${references.length} lignes)`);
      } else {
        const txt = await resp.text();
        console.error("Erreur export références:", txt);
        showError("Erreur lors de l'export des références");
      }
    } catch (e) {
      exportReferencesToCsv(references);
      showSuccess(`Export CSV réalisé (${references.length} lignes)`);
    } finally {
      setExporting(false);
    }
  };

  // Recap errors export
  const exportImportErrorsCsv = () => {
    const details = recapStats.importDetails || ({} as any);
    const detailed = details.erreurs_detaillees || [];
    const simple = details.errorDetails || [];
    const esc = (v: any) => {
      const s = v === null || v === undefined ? "" : String(v);
      return '"' + s.replace(/"/g, '""') + '"';
    };
    let csv = "";
    if (detailed.length > 0) {
      const header = ["ligne", "erreur", "nom_projet", "client", "annee", "ville", "type_mission"];
      const rows = detailed.map((e: any) => {
        const d = e.donnees || {};
        const nom_projet = d.nom_projet || d.nom || "";
        const client = d.client || "";
        const annee = d.annee || d.année || "";
        const ville = d.ville || "";
        const type_mission = d.type_mission || "";
        return [e.ligne, e.erreur, nom_projet, client, annee, ville, type_mission].map(esc).join(",");
      });
      csv = header.join(",") + "\n" + rows.join("\n");
    } else if (simple.length > 0) {
      const header = ["message"];
      const rows = simple.map((m: any) => esc(m));
      csv = header.join(",") + "\n" + rows.join("\n");
    } else {
      showError("Aucune erreur à exporter");
      return;
    }
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `import_references_erreurs_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
    showSuccess("Export des erreurs réalisé");
  };

  // Nouvel export: doublons (numéros de ligne)
  const exportImportDuplicatesCsv = () => {
    const details = recapStats.importDetails || ({} as any);
    const duplicates = details.doublons_detectes || [];
    if (!duplicates || duplicates.length === 0) {
      showError("Aucun doublon à exporter");
      return;
    }
    const esc = (v: any) => {
      const s = v === null || v === undefined ? "" : String(v);
      return '"' + s.replace(/"/g, '""') + '"';
    };
    const header = ["ligne", "nom_projet", "client", "annee"];
    const rows = duplicates.map((d: any) => [d.ligne, d.nom_projet, d.client, d.annee].map(esc).join(","));
    const csv = header.join(",") + "\n" + rows.join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `import_references_doublons_${new Date().toISOString().split("T")[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
    showSuccess("Export des doublons réalisé");
  };

  // Memo counts for toolbar label if needed
  const refsCount = references.length;

  return (
    <div className="w-full py-10 px-2 sm:px-4 lg:px-8">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate("/admin")} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Retour Admin
          </Button>
          <h1 className="text-3xl font-bold text-brand-dark">Gestion des Références</h1>
        </div>
      </div>

      {/* Import Global pack */}
      {/* <FullImportPanel onDone={loadData} /> */}

      {/* Toolbar */}
      <ReferencesToolbar
        count={refsCount}
        importing={importing}
        exporting={exporting}
        onAdd={() => setCreating(true)}
        onImport={onImportFile}
        onExport={handleExport}
        onImportAssociations={onImportAssociations}
      />

      {/* Table */}
      <ReferencesTable
        references={references}
        getSalarieNames={getSalarieNames}
        onEdit={(ref) => setEditing(ref)}
        onDelete={(id) => setDeletingId(id)}
      />

      {/* Create dialog */}
      <ReferenceFormDialog
        open={creating}
        onOpenChange={setCreating}
        mode="create"
        initial={null}
        salaries={salaries}
        onSubmit={createReference}
      />

      {/* Edit dialog */}
      <ReferenceFormDialog
        open={!!editing}
        onOpenChange={(v) => !v && setEditing(null)}
        mode="edit"
        initial={editing}
        salaries={salaries}
        onSubmit={updateReference}
      />

      {/* Delete confirm */}
      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette référence ?</AlertDialogTitle>
          </AlertDialogHeader>
          <div>Cette action est irréversible.</div>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="outline">Annuler</Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button variant="destructive" onClick={deleteReference}>
                Supprimer
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Import progress */}
      <ImportProgressDialog progress={importProgress} onClose={() => setImportProgress((p) => ({ ...p, show: false }))} />

      {/* Import recap */}
      <ImportRecapDialog
        open={!!recapStats.show}
        recap={recapStats}
        onClose={() => setRecapStats((s) => ({ ...s, show: false }))}
        onExportErrorsCsv={exportImportErrorsCsv}
        onExportDuplicatesCsv={exportImportDuplicatesCsv}
        onGoSalaries={() => {
          setRecapStats((s) => ({ ...s, show: false }));
          navigate("/admin/salaries");
        }}
      />

      {/* Import associations recap */}
      <AssociationsImportRecapDialog
        open={assocRecapOpen}
        details={assocRecapDetails}
        onClose={() => setAssocRecapOpen(false)}
      />
    </div>
  );
}

export default AdminReferences;