import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, FileSpreadsheet, FileText, Layers, Package, Download, RefreshCw, CheckCircle2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import JSZip from "jszip";
import { showError, showSuccess, showLoading, dismissToast, dismissAllToasts } from "@/utils/toast";
import { exportSalariesToCsv } from "@/utils/exportSalaries";
import { exportReferencesToCsv } from "@/components/references/exportUtils";
import FullImportPanel from "@/components/references/FullImportPanel";

type Salarie = {
  id_salarie: number;
  nom: string;
  prenom: string;
  agence?: string;
  fonction?: string;
  niveau_expertise?: string;
  email?: string;
  telephone?: string;
};

type Reference = {
  id_reference: number;
  nom_projet: string;
  client: string;
  ville: string;
  annee: number;
  type_mission: string;
  montant: number | null;
  description_courte?: string;
  description_longue?: string;
  duree_mois?: number | null;
  surface?: number | null;
};

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

export default function AdminExports() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(false);
  const [salaries, setSalaries] = useState<Salarie[]>([]);
  const [references, setReferences] = useState<Reference[]>([]);
  const [associationsMap, setAssociationsMap] = useState<Record<number, Reference[]>>({});

  // Charger données de base (salaries + references)
  const loadData = async () => {
    setLoading(true);
    try {
      const [salRes, refRes] = await Promise.all([
        fetch(`${BACKEND_URL}/api/salaries`),
        fetch(`${BACKEND_URL}/api/references`),
      ]);
      if (!salRes.ok) throw new Error("Erreur chargement salariés");
      if (!refRes.ok) throw new Error("Erreur chargement références");
      const salJson = await salRes.json();
      const refJson = await refRes.json();
      setSalaries(salJson?.salaries ?? []);
      setReferences(refJson?.references ?? []);
    } catch (e: any) {
      showError(e?.message || "Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const salariesCount = salaries.length;
  const referencesCount = references.length;

  // Export CSV Salariés
  const exportSalariesCsv = () => {
    if (!salariesCount) return showError("Aucun salarié à exporter");
    exportSalariesToCsv(
      salaries.map((s) => ({
        nom: s.nom,
        prenom: s.prenom,
        agence: s.agence,
        fonction: s.fonction,
        niveau: s.niveau_expertise,
        email: s.email,
        telephone: s.telephone,
        actif: true, // champ informatif, non stocké disponible partout
      })),
    );
    showSuccess(`Export CSV salariés OK (${salariesCount})`);
  };

  // Export Salariés: Excel via backend, sinon CSV
  const exportSalariesExcelOrCsv = async () => {
    if (!salariesCount) return showError("Aucun salarié à exporter");
    const t = showLoading("Export des salariés…");
    try {
      const resp = await fetch(`${BACKEND_URL}/api/export-salaries`);
      if (resp.ok) {
        const blob = await resp.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `salaries_export_${new Date().toISOString().split("T")[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        dismissToast(String(t));
        showSuccess(`Export Excel salariés OK (${salariesCount})`);
      } else {
        exportSalariesCsv();
        dismissToast(String(t));
        showSuccess(`Export CSV salariés OK (${salariesCount})`);
      }
    } catch (e: any) {
      dismissToast(String(t));
      // Fallback CSV en cas d'erreur
      exportSalariesCsv();
    } finally {
      dismissAllToasts();
    }
  };

  // Export Références: Excel du backend si dispo sinon CSV
  const exportReferencesExcelOrCsv = async () => {
    if (!referencesCount) return showError("Aucune référence à exporter");
    const t = showLoading("Export des références…");
    try {
      const resp = await fetch(`${BACKEND_URL}/api/export-references`);
      if (resp.ok) {
        const blob = await resp.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `references_export_${new Date().toISOString().split("T")[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        dismissToast(String(t));
        showSuccess(`Export Excel références OK (${referencesCount})`);
      } else {
        // Fallback CSV
        exportReferencesToCsv(
          references.map((r) => ({
            id: String(r.id_reference),
            nom_projet: r.nom_projet,
            client: r.client,
            ville: r.ville,
            annee: r.annee,
            type_mission: r.type_mission,
            montant: r.montant,
            description_projet: r.description_courte || r.description_longue || "",
            duree_mois: r.duree_mois ?? undefined,
            surface: r.surface ?? undefined,
            salaries: [], // non utilisé dans ce CSV
          })) as any,
        );
        dismissToast(String(t));
        showSuccess(`Export CSV références OK (${referencesCount})`);
      }
    } catch (e: any) {
      dismissToast(String(t));
      showError(e?.message || "Erreur export références");
    } finally {
      dismissAllToasts();
    }
  };

  // Charger toutes les associations (un appel par salarié)
  const loadAllAssociations = async () => {
    const map: Record<number, Reference[]> = {};
    for (const s of salaries) {
      try {
        const r = await fetch(`${BACKEND_URL}/api/salaries/${s.id_salarie}/references`);
        if (r.ok) {
          const j = await r.json();
          map[s.id_salarie] = j?.references ?? [];
        } else {
          map[s.id_salarie] = [];
        }
      } catch {
        map[s.id_salarie] = [];
      }
    }
    setAssociationsMap(map);
    return map;
  };

  // Export Associations: Excel via backend, sinon CSV
  const exportAssociationsExcelOrCsv = async () => {
    if (!salariesCount) return showError("Aucun salarié");
    const t = showLoading("Export des associations…");
    try {
      const resp = await fetch(`${BACKEND_URL}/api/export-associations`);
      if (resp.ok) {
        const blob = await resp.blob();
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `associations_export_${new Date().toISOString().split("T")[0]}.xlsx`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        dismissToast(String(t));
        showSuccess("Export Excel associations OK");
      } else {
        await exportAssociationsCsv();
        dismissToast(String(t));
        showSuccess("Export CSV associations OK");
      }
    } catch (e: any) {
      dismissToast(String(t));
      await exportAssociationsCsv();
    } finally {
      dismissAllToasts();
    }
  };

  // Export associations en CSV (salarie x reference)
  const exportAssociationsCsv = async () => {
    if (!salariesCount) return showError("Aucun salarié");
    const t = showLoading("Préparation des associations…");
    try {
      const map = await loadAllAssociations();

      // Construire CSV
      const headers = [
        "Salarie_ID",
        "Nom",
        "Prenom",
        "Agence",
        "Fonction",
        "Niveau",
        "Reference_ID",
        "Nom_Projet",
        "Client",
        "Ville",
        "Annee",
        "Type_Mission",
        "Montant",
      ];
      const esc = (v: any) => {
        const s = v === null || v === undefined ? "" : String(v);
        return `"${s.replace(/"/g, '""')}"`;
      };

      const rows: string[] = [];
      for (const s of salaries) {
        const refs = map[s.id_salarie] || [];
        if (refs.length === 0) {
          rows.push(
            [
              s.id_salarie,
              `${s.nom}`,
              `${s.prenom}`,
              s.agence || "",
              s.fonction || "",
              s.niveau_expertise || "",
              "",
              "",
              "",
              "",
              "",
              "",
              "",
            ]
              .map(esc)
              .join(","),
          );
        } else {
          for (const r of refs) {
            rows.push(
              [
                s.id_salarie,
                `${s.nom}`,
                `${s.prenom}`,
                s.agence || "",
                s.fonction || "",
                s.niveau_expertise || "",
                r.id_reference,
                r.nom_projet || "",
                r.client || "",
                r.ville || "",
                r.annee ?? "",
                r.type_mission || "",
                r.montant != null ? r.montant.toLocaleString("fr-FR") : "",
              ]
                .map(esc)
                .join(","),
            );
          }
        }
      }

      const csv = headers.join(",") + "\n" + rows.join("\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `associations_export_${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      dismissToast(String(t));
      showSuccess("Export CSV associations OK");
    } catch (e: any) {
      dismissToast(String(t));
      showError(e?.message || "Erreur export associations");
    } finally {
      dismissAllToasts();
    }
  };

  // Export complet en ZIP (salaries.csv, references.csv, associations.csv, metadata.json)
  const exportAllZip = async () => {
    if (!salariesCount && !referencesCount) return showError("Pas de données à exporter");
    const t = showLoading("Construction de l'archive ZIP…");
    try {
      const zip = new JSZip();

      // 1) salaries.csv
      if (salariesCount) {
        const headers = [
          "Nom",
          "Prenom",
          "Agence",
          "Fonction",
          "Niveau_Expertise",
          "Email",
          "Telephone",
        ];
        const esc = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`;
        const rows = salaries.map((s) =>
          [
            s.nom || "",
            s.prenom || "",
            s.agence || "",
            s.fonction || "",
            s.niveau_expertise || "",
            s.email || "",
            s.telephone || "",
          ]
            .map(esc)
            .join(","),
        );
        const csv = headers.join(",") + "\n" + rows.join("\n");
        zip.file("salaries.csv", csv);
      }

      // 2) references.csv
      if (referencesCount) {
        const headers = [
          "Nom_Projet",
          "Client",
          "Ville",
          "Annee",
          "Type_Mission",
          "Montant",
          "Description",
          "Duree_Mois",
          "Surface",
        ];
        const esc = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`;
        const rows = references.map((r) =>
          [
            r.nom_projet,
            r.client,
            r.ville,
            r.annee,
            r.type_mission,
            r.montant != null ? r.montant.toLocaleString("fr-FR") : "",
            r.description_courte || r.description_longue || "",
            r.duree_mois ?? "",
            r.surface ?? "",
          ]
            .map(esc)
            .join(","),
        );
        const csv = headers.join(",") + "\n" + rows.join("\n");
        zip.file("references.csv", csv);
      }

      // 3) associations.csv (charge associations)
      const map = await loadAllAssociations();
      const assocHeaders = [
        "Salarie_ID",
        "Nom",
        "Prenom",
        "Reference_ID",
        "Nom_Projet",
        "Client",
        "Annee",
        "Type_Mission",
      ];
      const esc = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`;
      const assocRows: string[] = [];
      for (const s of salaries) {
        const refs = map[s.id_salarie] || [];
        for (const r of refs) {
          assocRows.push(
            [
              s.id_salarie,
              s.nom || "",
              s.prenom || "",
              r.id_reference,
              r.nom_projet || "",
              r.client || "",
              r.annee ?? "",
              r.type_mission || "",
            ]
              .map(esc)
              .join(","),
          );
        }
      }
      const assocCsv =
        assocHeaders.join(",") + "\n" + (assocRows.length ? assocRows.join("\n") : "");
      zip.file("associations.csv", assocCsv);

      // 4) metadata.json
      const meta = {
        generatedAt: new Date().toISOString(),
        counts: {
          salaries: salariesCount,
          references: referencesCount,
          associations: assocRows.length,
        },
        backend: BACKEND_URL,
      };
      zip.file("metadata.json", JSON.stringify(meta, null, 2));

      // Générer le ZIP
      const blob = await zip.generateAsync({ type: "blob" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `export_global_${new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19)}.zip`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);

      dismissToast(String(t));
      showSuccess("Archive ZIP générée");
    } catch (e: any) {
      dismissToast(String(t));
      showError(e?.message || "Erreur export ZIP");
    } finally {
      dismissAllToasts();
    }
  };

  const stats = useMemo(
    () => ({
      salaries: salariesCount,
      references: referencesCount,
    }),
    [salariesCount, referencesCount],
  );

  return (
    <div className="max-w-5xl mx-auto py-10 px-4">
      {/* Header */}
      <div className="mb-8 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => navigate("/admin/tools")} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Retour Outils
          </Button>
          <h1 className="text-2xl md:text-3xl font-extrabold text-brand-dark flex items-center gap-2">
            <Layers className="h-6 w-6 text-brand-blue" />
            Exports Globaux
          </h1>
        </div>
        <Button variant="outline" onClick={loadData} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
          Actualiser
        </Button>
      </div>

      {/* Import global en tête de page */}
      <FullImportPanel onDone={loadData} />

      {/* Résumé */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-white border rounded-lg p-4">
          <div className="text-sm text-gray-500">Salariés</div>
          <div className="text-2xl font-bold">{stats.salaries}</div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-sm text-gray-500">Références</div>
          <div className="text-2xl font-bold">{stats.references}</div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-sm text-gray-500">Associations</div>
          <div className="text-2xl font-bold">
            {Object.values(associationsMap).reduce((acc, arr) => acc + (arr?.length || 0), 0)}
          </div>
        </div>
      </div>

      {/* Actions d'export */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center gap-2 mb-3">
            <FileText className="h-5 w-5 text-brand-blue" />
            <h2 className="font-semibold text-gray-800">Salariés (Excel/CSV)</h2>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Tente un export Excel via le backend, sinon bascule en CSV.
          </p>
          <Button onClick={exportSalariesExcelOrCsv} disabled={!salariesCount}>
            <Download className="h-4 w-4 mr-2" />
            Exporter salariés
          </Button>
        </div>

        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center gap-2 mb-3">
            <FileSpreadsheet className="h-5 w-5 text-green-600" />
            <h2 className="font-semibold text-gray-800">Références (Excel/CSV)</h2>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Tente un export Excel via le backend, sinon bascule en CSV.
          </p>
          <Button onClick={exportReferencesExcelOrCsv} disabled={!referencesCount}>
            <Download className="h-4 w-4 mr-2" />
            Exporter références
          </Button>
        </div>

        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center gap-2 mb-3">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <h2 className="font-semibold text-gray-800">Associations (Excel/CSV)</h2>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Export des liens salariés ↔ références au format Excel (repli en CSV si nécessaire).
          </p>
          <Button onClick={exportAssociationsExcelOrCsv} disabled={!salariesCount}>
            <Download className="h-4 w-4 mr-2" />
            Exporter associations
          </Button>
        </div>

        <div className="bg-white border rounded-lg p-6">
          <div className="flex items-center gap-2 mb-3">
            <Package className="h-5 w-5 text-purple-600" />
            <h2 className="font-semibold text-gray-800">Export complet (ZIP)</h2>
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Génère une archive ZIP contenant les CSV de toutes les données et un fichier metadata.json.
          </p>
          <Button onClick={exportAllZip} disabled={!salariesCount && !referencesCount}>
            <Download className="h-4 w-4 mr-2" />
            Exporter tout (ZIP)
          </Button>
        </div>
      </div>
    </div>
  );
}