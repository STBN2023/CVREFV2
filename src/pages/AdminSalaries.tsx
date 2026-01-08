import { useEffect, useMemo, useRef, useState, ChangeEvent } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import SalariesToolbar from "@/components/salaries/SalariesToolbar";
import SalariesTable from "@/components/salaries/SalariesTable";
import SalarieFormDialog from "@/components/salaries/SalarieFormDialog";
import ImportProgressDialog from "@/components/salaries/ImportProgressDialog";
import ImportRecapDialog from "@/components/salaries/ImportRecapDialog";
import type { Salarie, ImportProgress, ImportRecap } from "@/components/salaries/types";
import { showError, showSuccess } from "@/utils/toast";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { ArrowLeft, Info, XCircle, Download, Upload } from "lucide-react";
import { exportSalariesToCsv } from "@/utils/exportSalaries";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

function AdminSalaries() {
  const navigate = useNavigate();

  // Données
  const [salaries, setSalaries] = useState<Salarie[]>([]);
  const [agences, setAgences] = useState<string[]>([]);
  const [fonctions, setFonctions] = useState<string[]>([]);
  const [niveaux, setNiveaux] = useState<string[]>([]);
  // AJOUT: référentiel compétences + map nom→id
  const [competences, setCompetences] = useState<string[]>([]);
  const [competenceNameToId, setCompetenceNameToId] = useState<Record<string, number>>({});

  // UI states
  const [creating, setCreating] = useState(false);
  const [editing, setEditing] = useState<Salarie | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Import/Export
  const [importing, setImporting] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [importProgress, setImportProgress] = useState<ImportProgress>({
    show: false,
    type: "salaries",
    step: "",
    current: 0,
    total: 0,
    status: "loading",
    details: [],
  });
  const [recap, setRecap] = useState<ImportRecap>({ show: false, importDetails: null });

  // Preview pane
  const [selectedForPreview, setSelectedForPreview] = useState<Salarie | null>(null);
  const [previewStatus, setPreviewStatus] = useState<"idle" | "checking" | "exists" | "existsNoEmbed" | "missing">("idle");
  const [previewEmbedUrl, setPreviewEmbedUrl] = useState<string | null>(null);

  // Map présence CV par salarié
  const [cvPresence, setCvPresence] = useState<Record<string, "exists" | "missing" | "checking">>({});

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      const [salRes, refRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/salaries`),
        fetch(`${BACKEND_URL}/api/referentials`),
      ]);

      if (salRes.ok) {
        const json = await salRes.json();
        const raw = Array.isArray(json) ? json : json.salaries || [];
        setSalaries(
          raw.map((s: any) => ({
            id: s.id_salarie?.toString?.() ?? s.id?.toString?.() ?? "",
            nom: s.nom,
            prenom: s.prenom,
            agence: s.agence,
            fonction: s.fonction,
            niveau: s.niveau_expertise || s.niveau,
            actif: !!s.actif,
            email: s.email,
            telephone: s.telephone,
          }))
        );
      } else {
        setSalaries([]);
      }

      if (refRes.ok) {
        const data = await refRes.json();
        setAgences((data.agences || []).map((a: any) => a.nom || a));
        setFonctions((data.fonctions || []).map((f: any) => f.nom || f));
        setNiveaux((data.niveaux_expertise || []).map((n: any) => n.nom || n));
        // AJOUT: compétences
        const comps = (data.competences || []).filter((c: any) => c.actif !== 0).map((c: any) => ({ id: c.id_competence, nom: c.nom }));
        setCompetences(comps.map((c: any) => c.nom));
        setCompetenceNameToId(Object.fromEntries(comps.map((c: any) => [c.nom, c.id])));
      } else {
        setAgences(["Paris", "Lyon", "Marseille", "Toulouse", "Nice"]);
        setFonctions(["Ingénieur", "Architecte", "Chef de projet", "Technicien", "Consultant"]);
        setNiveaux(["Junior", "Confirmé", "Senior", "Expert"]);
        // AJOUT: fallback compétences
        setCompetences(["Structure", "Fluide", "Thermique"]);
        setCompetenceNameToId({ Structure: 1, Fluide: 2, Thermique: 3 });
      }
    } catch (e) {
      console.error("Erreur chargement:", e);
      showError("Erreur lors du chargement des données");
      setSalaries([]);
      setAgences(["Paris", "Lyon", "Marseille", "Toulouse", "Nice"]);
      setFonctions(["Ingénieur", "Architecte", "Chef de projet", "Technicien", "Consultant"]);
      setNiveaux(["Junior", "Confirmé", "Senior", "Expert"]);
    }
  }

  // Upload / Download CV
  const getPptxUrl = (s: Salarie) => {
    const sanitize = (str: string) =>
      (str || "").toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/g, "");
    const slug = `${sanitize(s.prenom)}_${sanitize(s.nom)}.pptx`;
    return `${BACKEND_URL}/data/${slug}`;
  };

  // Vérifier la présence du CV pour chaque salarié (pastille verte/rouge/grise)
  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (salaries.length === 0) {
        setCvPresence({});
        return;
      }
      // marquer checking d'abord
      setCvPresence((prev) => {
        const next: Record<string, "exists" | "missing" | "checking"> = { ...prev };
        salaries.forEach((s) => {
          next[s.id] = next[s.id] || "checking";
        });
        return next;
      });

      const entries = await Promise.all(
        salaries.map(async (s) => {
          try {
            const resp = await fetch(getPptxUrl(s), { method: "HEAD" });
            return [s.id, resp.ok ? "exists" : "missing"] as const;
          } catch {
            return [s.id, "missing"] as const;
          }
        })
      );
      if (cancelled) return;
      const map: Record<string, "exists" | "missing" | "checking"> = {};
      entries.forEach(([id, st]) => (map[id] = st));
      setCvPresence(map);
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [salaries]);

  const handleUploadCV = async (s: Salarie) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation";
    input.onchange = async () => {
      const file = input.files?.[0];
      if (!file) return;
      if (!file.name.toLowerCase().endsWith(".pptx")) {
        showError("Veuillez sélectionner un fichier .pptx");
        return;
      }
      const formData = new FormData();
      formData.append("file", file);
      try {
        const resp = await fetch(`${BACKEND_URL}/api/salaries/${s.id}/template`, { method: "POST", body: formData });
        if (resp.ok) {
          showSuccess("Modèle PPTX téléversé avec succès");
          // Re-check présence
          setCvPresence((prev) => ({ ...prev, [s.id]: "exists" }));
        } else {
          const err = await resp.json().catch(() => ({}));
          showError(err.error || "Échec du téléversement du modèle");
        }
      } catch {
        showError("Erreur réseau lors du téléversement");
      }
    };
    input.click();
  };

  const handleDownloadCV = async (s: Salarie) => {
    const url = getPptxUrl(s);
    try {
      const head = await fetch(url, { method: "HEAD" });
      if (!head.ok) {
        showError("Fichier PPTX introuvable pour ce salarié");
        return;
      }
      const a = document.createElement("a");
      a.href = url;
      a.download = url.split("/").pop() || "cv.pptx";
      document.body.appendChild(a);
      a.click();
      a.remove();
    } catch {
      showError("Erreur lors du téléchargement du PPTX");
    }
  };

  // Import
  const handleImport = async (file: File) => {
    setImporting(true);
    setImportProgress({
      show: true,
      type: "salaries",
      step: "Préparation du fichier...",
      current: 0,
      total: 0,
      status: "loading",
      details: [],
    });

    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${BACKEND_URL}/api/import-salaries`, { method: "POST", body: formData });
      let result: any;
      try {
        result = await response.json();
      } catch {
        result = { message: "Erreur de communication avec le serveur" };
      }

      if (response.ok && result && result.stats) {
        setImportProgress((p) => ({
          ...p,
          step: "Import terminé avec succès !",
          status: "success",
          stats: result.stats,
          details: [
            `✅ ${result.stats.total || 0} salariés traités`,
            `➕ ${result.stats.added || 0} nouveaux salariés ajoutés`,
            `🔄 ${result.stats.existing || 0} salariés existants ignorés`,
            `❌ ${result.stats.errors || 0} erreurs rencontrées`,
          ],
        }));

        setImportProgress((p) => ({ ...p, show: false }));
        if (result.importDetails) {
          setRecap({ show: true, importDetails: result.importDetails });
        } else {
          showSuccess(
            `Import terminé : ${result.stats.added || 0} salariés ajoutés sur ${result.stats.total || 0} traités`
          );
        }
        await loadData();
      } else {
        const errMsg =
          (result && (result.message || result.error || (typeof result.details === "string" ? result.details : ""))) ||
          "Erreur inconnue";
        setImportProgress((p) => ({ ...p, step: "Erreur lors de l'import", status: "error", details: [errMsg] }));
        showError(errMsg);
      }
    } catch {
      setImportProgress((p) => ({
        ...p,
        step: "Erreur lors de l'import",
        status: "error",
        details: ["Erreur de connexion au serveur"],
      }));
      showError("Erreur lors de l'import des salariés");
    } finally {
      setImporting(false);
    }
  };

  // Export
  const handleExport = async () => {
    setExporting(true);
    try {
      const response = await fetch(`${BACKEND_URL}/api/export-salaries`);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `salaries_export_${new Date().toISOString().split("T")[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        showSuccess(`Export Excel réussi : ${salaries.length} salariés exportés`);
      } else if (response.status === 404) {
        exportSalariesToCsv(
          salaries.map((s) => ({
            nom: s.nom,
            prenom: s.prenom,
            agence: s.agence,
            fonction: s.fonction,
            niveau: s.niveau,
            email: s.email,
            telephone: s.telephone,
            actif: s.actif,
          }))
        );
        showSuccess(`Export CSV réalisé (${salaries.length} lignes)`);
      } else {
        const errorText = await response.text();
        console.error("Erreur export salariés:", errorText);
        showError("Erreur lors de l'export des salariés");
      }
    } catch {
      exportSalariesToCsv(
        salaries.map((s) => ({
          nom: s.nom,
          prenom: s.prenom,
          agence: s.agence,
          fonction: s.fonction,
          niveau: s.niveau,
          email: s.email,
          telephone: s.telephone,
          actif: s.actif,
        }))
      );
      showSuccess(`Export CSV réalisé (${salaries.length} lignes)`);
    } finally {
      setExporting(false);
    }
  };

  // CRUD
  const createSalarie = async (payload: Omit<Salarie, "id" | "actif"> & { actif: boolean }) => {
    try {
      const res = await fetch(`${BACKEND_URL}/api/salaries`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, niveau_expertise: payload.niveau }),
      });
      if (!res.ok) {
        showError("Erreur lors de l'ajout du salarié");
        return;
      }
      const created = await res.json();
      const newId = created?.id?.toString?.();
      // AJOUT: envoyer compétences si présentes
      if (newId && Array.isArray((payload as any).competences) && (payload as any).competences.length > 0) {
        const ids = ((payload as any).competences as string[])
          .map((name) => competenceNameToId[name])
          .filter((n) => Number.isInteger(n));
        if (ids.length > 0) {
          await fetch(`${BACKEND_URL}/api/salaries/${newId}/competences`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ competenceIds: ids }),
          });
        }
      }
      showSuccess("Salarié ajouté avec succès");
      setCreating(false);
      await loadData();
    } catch {
      showError("Erreur lors de l'ajout du salarié");
    }
  };

  const updateSalarie = async (payload: Omit<Salarie, "id" | "actif"> & { id?: string; actif: boolean }) => {
    if (!payload.id) return;
    try {
      const res = await fetch(`${BACKEND_URL}/api/salaries/${payload.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, niveau_expertise: payload.niveau }),
      });
      if (!res.ok) {
        showError("Erreur lors de la modification du salarié");
        return;
      }
      // AJOUT: envoyer compétences si présentes
      if (Array.isArray((payload as any).competences)) {
        const ids = ((payload as any).competences as string[])
          .map((name) => competenceNameToId[name])
          .filter((n) => Number.isInteger(n));
        await fetch(`${BACKEND_URL}/api/salaries/${payload.id}/competences`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ competenceIds: ids }),
        });
      }
      showSuccess("Salarié modifié avec succès");
      setEditing(null);
      await loadData();
    } catch {
      showError("Erreur lors de la modification du salarié");
    }
  };

  const deleteSalarie = async () => {
    if (!deletingId) return;
    try {
      const response = await fetch(`${BACKEND_URL}/api/salaries/${deletingId}`, { method: "DELETE" });
      if (response.ok) {
        showSuccess("Salarié supprimé avec succès");
        setDeletingId(null);
        await loadData();
      } else {
        showError("Erreur lors de la suppression du salarié");
      }
    } catch {
      showError("Erreur lors de la suppression du salarié");
    }
  };

  // Preview pane effects
  useEffect(() => {
    let cancelled = false;
    const check = async () => {
      if (!selectedForPreview) {
        setPreviewStatus("idle");
        setPreviewEmbedUrl(null);
        return;
      }
      const url = getPptxUrl(selectedForPreview);
      setPreviewStatus("checking");
      try {
        const resp = await fetch(url, { method: "HEAD" });
        if (cancelled) return;
        if (resp.ok) {
          const u = new URL(url);
          const isLocal = ["localhost", "127.0.0.1"].includes(u.hostname) || /^192\.168\./.test(u.hostname);
          const isHttps = u.protocol === "https:";
          if (isHttps && !isLocal) {
            setPreviewStatus("exists");
            setPreviewEmbedUrl(`https://view.officeapps.live.com/op/embed.aspx?src=${encodeURIComponent(url)}`);
          } else {
            setPreviewStatus("existsNoEmbed");
            setPreviewEmbedUrl(null);
          }
        } else {
          setPreviewStatus("missing");
          setPreviewEmbedUrl(null);
        }
      } catch {
        if (!cancelled) {
          setPreviewStatus("missing");
          setPreviewEmbedUrl(null);
        }
      }
    };
    check();
    return () => {
      cancelled = true;
    };
  }, [selectedForPreview]);

  const count = salaries.length;

  return (
    <div className="max-w-screen-2xl mx-auto py-10 px-2">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate("/admin")} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Retour Admin
          </Button>
          <h1 className="text-3xl font-bold text-brand-dark">Gestion des Salariés</h1>
        </div>
      </div>

      {/* Toolbar */}
      <SalariesToolbar
        count={count}
        importing={importing}
        exporting={exporting}
        onAdd={() => setCreating(true)}
        onImport={handleImport}
        onExport={handleExport}
      />

      {/* Main content */}
      <div className="grid grid-cols-12 gap-6 mb-8">
        <div className="col-span-12 xl:col-span-9">
          <div className="bg-white rounded-lg shadow-sm border p-6">
            <SalariesTable
              salaries={salaries}
              onRowSelect={setSelectedForPreview}
              onUploadCv={handleUploadCV}
              onDownloadCv={handleDownloadCV}
              onEdit={(s) => setEditing(s)}
              onDelete={(id) => setDeletingId(id)}
              cvStatusMap={cvPresence}
            />
          </div>
        </div>

        {/* Preview pane */}
        <div className="col-span-12 xl:col-span-3">
          <div className="bg-white rounded-lg shadow-sm border p-6 sticky top-4">
            <h2 className="text-2xl font-semibold text-brand-dark mb-2">Prévisualisation PPTX</h2>
            {!selectedForPreview && <div className="text-gray-500 text-sm">Sélectionnez un salarié dans la liste.</div>}

            {selectedForPreview && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="font-medium text-brand-dark">
                      {selectedForPreview.prenom} {selectedForPreview.nom}
                    </div>
                    <div className="text-xs text-gray-500">
                      {[selectedForPreview.fonction, selectedForPreview.agence].filter(Boolean).join(" • ") || "—"}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" onClick={() => handleDownloadCV(selectedForPreview)}>
                      <Download className="mr-2 h-4 w-4" /> Télécharger
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        const url = getPptxUrl(selectedForPreview);
                        window.open(url, "_blank");
                      }}
                    >
                      Ouvrir
                    </Button>
                  </div>
                </div>

                {previewStatus === "checking" && (
                  <div className="h-[60vh] flex items-center justify-center text-gray-500">
                    <div className="flex items-center gap-2 text-sm">
                      <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-gray-400"></div>
                      Chargement de l'aperçu...
                    </div>
                  </div>
                )}

                {previewStatus === "missing" && (
                  <div className="text-sm text-gray-700 space-y-3">
                    <div className="flex items-start gap-2">
                      <XCircle className="h-4 w-4 text-red-500 mt-0.5" />
                      <div>
                        Aucun fichier PPTX trouvé pour ce salarié.
                        <div className="text-xs text-gray-500">Fichier attendu: {getPptxUrl(selectedForPreview).split("/").pop()}</div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleUploadCV(selectedForPreview!)}>
                        <Upload className="mr-2 h-4 w-4" /> Téléverser un PPTX
                      </Button>
                    </div>
                  </div>
                )}

                {previewStatus === "existsNoEmbed" && (
                  <div className="text-sm text-gray-700 space-y-3">
                    <div className="flex items-start gap-2">
                      <Info className="h-4 w-4 text-blue-500 mt-0.5" />
                      <div>
                        Aperçu local via conversion PDF.
                        <div className="text-xs text-gray-500">
                          Assurez-vous que LibreOffice est installé. Sinon, utilisez « Ouvrir » ou « Télécharger ».
                        </div>
                      </div>
                    </div>
                    <iframe
                      title="pptx-pdf-preview"
                      src={`${BACKEND_URL}/api/pptx/preview?file=${(() => {
                        const sanitize = (str: string) =>
                          (str || "")
                            .toLowerCase()
                            .normalize("NFD")
                            .replace(/[\u0300-\u036f]/g, "")
                            .replace(/[^a-z0-9]/g, "");
                        const slug = `${sanitize(selectedForPreview!.prenom)}_${sanitize(selectedForPreview!.nom)}.pptx`;
                        return encodeURIComponent(slug);
                      })()}`}
                      className="w-full h-[65vh] border rounded"
                    />
                  </div>
                )}

                {previewStatus === "exists" && (
                  <div>
                    <div className="mb-2 text-xs text-gray-500">
                      Si l'aperçu ne s'affiche pas en local, utilisez « Ouvrir » ou « Télécharger ».
                    </div>
                    <iframe
                      title="pptx-preview"
                      src={previewEmbedUrl || undefined}
                      className="w-full h-[65vh] border rounded"
                      allowFullScreen
                    />
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dialogs */}
      <SalarieFormDialog
        open={creating}
        onOpenChange={setCreating}
        mode="create"
        initial={null}
        agences={agences}
        fonctions={fonctions}
        niveaux={niveaux}
        // AJOUT: référentiel compétences
        competencesRef={competences}
        onSubmit={createSalarie}
      />
      <SalarieFormDialog
        open={!!editing}
        onOpenChange={(v) => !v && setEditing(null)}
        mode="edit"
        initial={editing}
        agences={agences}
        fonctions={fonctions}
        niveaux={niveaux}
        // AJOUT: référentiel compétences
        competencesRef={competences}
        onSubmit={updateSalarie}
      />

      <AlertDialog open={!!deletingId} onOpenChange={(open) => !open && setDeletingId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer ce salarié ?</AlertDialogTitle>
          </AlertDialogHeader>
          <div>Cette action est irréversible.</div>
          <AlertDialogFooter>
            <AlertDialogCancel asChild>
              <Button variant="outline">Annuler</Button>
            </AlertDialogCancel>
            <AlertDialogAction asChild>
              <Button variant="destructive" onClick={deleteSalarie}>
                Supprimer
              </Button>
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <ImportProgressDialog progress={importProgress} onClose={() => setImportProgress((p) => ({ ...p, show: false }))} />
      <ImportRecapDialog open={!!recap.show} recap={recap} onClose={() => setRecap({ show: false, importDetails: null })} />
    </div>
  );
}

export default AdminSalaries;