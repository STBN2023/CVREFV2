import { useEffect, useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { showError, showSuccess, showLoading, dismissToast } from "@/utils/toast";
import { ArrowLeft, Database, CheckCircle, Shield, RefreshCw, Save, Download as DownloadIcon, Trash2 } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import ApiDiagnostics from '@/components/ApiDiagnostics';

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

type Stats = {
  salaries: number;
  references: number;
  associations: number;
  dbSize: number;
  downloads: number;
  dbPath: string;
};

type BackupFile = {
  filename: string;
  sizeBytes: number;
  createdAt: number;
};

function formatSize(bytes: number) {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

function formatDate(ms: number) {
  return new Date(ms).toLocaleString("fr-FR", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminMaintenance() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState<string | null>(null);
  const [integrity, setIntegrity] = useState<string | null>(null);

  const [backups, setBackups] = useState<BackupFile[]>([]);
  const [loadingBackups, setLoadingBackups] = useState(false);

  const loadStats = async () => {
    try {
      setLoading(true);
      const r = await fetch(`${BACKEND_URL}/api/admin/db/stats`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j = await r.json();
      setStats(j);
    } catch (e: any) {
      showError(`Erreur stats: ${e?.message || "inconnue"}`);
    } finally {
      setLoading(false);
    }
  };

  const loadBackups = async () => {
    try {
      setLoadingBackups(true);
      const r = await fetch(`${BACKEND_URL}/api/admin/db/backups`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j = await r.json();
      setBackups(j?.backups || []);
    } catch (e: any) {
      showError(`Erreur chargement sauvegardes: ${e?.message || "inconnue"}`);
    } finally {
      setLoadingBackups(false);
    }
  };

  useEffect(() => {
    loadStats();
    loadBackups();
  }, []);

  const run = async (
    label: string,
    url: string,
    method: "POST" | "GET" = "POST",
    onOk?: (res: any) => void
  ) => {
    const t = showLoading(`${label}...`);
    setRunning(label);
    try {
      const r = await fetch(`${BACKEND_URL}${url}`, { method });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        showError(j?.error || `Erreur ${label.toLowerCase()}`);
      } else {
        showSuccess(`${label} terminé`);
        onOk?.(j);
        await loadStats();
      }
    } catch (e: any) {
      showError(e?.message || `Erreur ${label.toLowerCase()}`);
    } finally {
      dismissToast(String(t));
      setRunning(null);
    }
  };

  const createBackup = async () => {
    const t = showLoading("Création de la sauvegarde...");
    try {
      const r = await fetch(`${BACKEND_URL}/api/admin/db/backup`, { method: "POST" });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        showError(j?.error || "Erreur création sauvegarde");
      } else {
        showSuccess(`Sauvegarde créée (${j.filename})`);
        await loadBackups();
      }
    } catch (e: any) {
      showError(e?.message || "Erreur réseau");
    } finally {
      dismissToast(String(t));
    }
  };

  const downloadBackup = async (filename: string) => {
    const t = showLoading(`Téléchargement ${filename}...`);
    try {
      const r = await fetch(`${BACKEND_URL}/api/admin/db/backup/${encodeURIComponent(filename)}`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const blob = await r.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
      showSuccess("Téléchargement terminé");
    } catch (e: any) {
      showError(e?.message || "Erreur téléchargement");
    } finally {
      dismissToast(String(t));
    }
  };

  const deleteBackup = async (filename: string) => {
    if (!confirm(`Supprimer la sauvegarde "${filename}" ?`)) return;
    const t = showLoading("Suppression...");
    try {
      const r = await fetch(`${BACKEND_URL}/api/admin/db/backup/${encodeURIComponent(filename)}`, {
        method: "DELETE",
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        showError(j?.error || "Erreur suppression sauvegarde");
      } else {
        showSuccess("Sauvegarde supprimée");
        await loadBackups();
      }
    } catch (e: any) {
      showError(e?.message || "Erreur suppression");
    } finally {
      dismissToast(String(t));
    }
  };

  // Importer une base locale et la charger
  const triggerUploadDb = () => fileInputRef.current?.click();
  const onUploadDbChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const t = showLoading("Import de la base en cours...");
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await fetch(`${BACKEND_URL}/api/admin/db/restore-upload`, {
        method: "POST",
        body: fd,
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        showError(j?.error || "Échec de l'import de la base");
      } else {
        showSuccess("Base importée et chargée");
        await loadStats();
        await loadBackups();
      }
    } catch (e: any) {
      showError(e?.message || "Erreur réseau");
    } finally {
      dismissToast(String(t));
      // reset pour permettre de re-sélectionner le même fichier si besoin
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  // === NOUVELLE FONCTION: RESTAURER SAUVEGARDE ===
  const restoreBackup = async (filename: string) => {
    if (!confirm(`Restaurer la base depuis "${filename}" ?\nCette opération écrasera les données actuelles.`)) return;
    const t = showLoading("Restauration de la base...");
    try {
      const r = await fetch(`${BACKEND_URL}/api/admin/db/restore`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename }),
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) {
        showError(j?.error || "Erreur lors de la restauration");
      } else {
        showSuccess("Base restaurée avec succès");
        await loadStats();
      }
    } catch (e: any) {
      showError(e?.message || "Erreur réseau");
    } finally {
      dismissToast(String(t));
    }
  };

  const tooltipClass =
    "bg-gray-900 text-white border border-black/20 shadow-lg rounded-md px-3 py-1.5 z-50";

  return (
    <div className="container mx-auto px-4 py-8">
      {/* AJOUT: panneau diagnostic backend */}
      <ApiDiagnostics />
      
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            onClick={() => navigate("/admin")}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            Retour Admin
          </Button>
          <h1 className="text-2xl md:text-3xl font-extrabold text-brand-dark flex items-center gap-2">
            <Database className="h-6 w-6 text-brand-blue" />
            Maintenance base
          </h1>
        </div>
        <Button
          variant="outline"
          onClick={() => {
            loadStats();
            loadBackups();
          }}
          disabled={loading || loadingBackups}
        >
          <RefreshCw
            className={`h-4 w-4 mr-2 ${
              loading || loadingBackups ? "animate-spin" : ""
            }`}
          />
          Actualiser
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        <div className="bg-white border rounded-lg p-4">
          <div className="text-sm text-gray-500">Salariés</div>
          <div className="text-2xl font-bold">{stats?.salaries ?? "-"}</div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-sm text-gray-500">Références</div>
          <div className="text-2xl font-bold">{stats?.references ?? "-"}</div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-sm text-gray-500">Associations</div>
          <div className="text-2xl font-bold">{stats?.associations ?? "-"}</div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-sm text-gray-500">Taille base</div>
          <div className="text-2xl font-bold">{formatSize(stats?.dbSize || 0)}</div>
          <div className="text-xs text-gray-500 mt-1 break-all">{stats?.dbPath}</div>
        </div>
        <div className="bg-white border rounded-lg p-4">
          <div className="text-sm text-gray-500">Fichiers générés</div>
          <div className="text-2xl font-bold">{stats?.downloads ?? "-"}</div>
        </div>
      </div>

      {/* Carte pleine largeur: Intégrité puis Sauvegardes (superposées) */}
      <div className="bg-white border rounded-lg p-5">
        {/* Bloc Intégrité */}
        <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <Shield className="h-5 w-5 text-brand-blue" />
          Intégrité & maintenance
        </h2>
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() =>
              run("Integrity check", "/api/admin/db/integrity", "POST", (j) =>
                setIntegrity(j?.result)
              )
            }
            disabled={!!running}
            className="bg-brand-blue hover:bg-brand-blue/90 text-white"
          >
            Vérifier l'intégrité
          </Button>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={() => run("VACUUM", "/api/admin/db/vacuum")}
                disabled={!!running}
                className="bg-emerald-600 hover:bg-emerald-700 text-white"
              >
                VACUUM
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={8} className={tooltipClass}>
              Compacte la base SQLite et récupère de l'espace disque
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={() => run("ANALYZE", "/api/admin/db/analyze")}
                disabled={!!running}
                variant="outline"
              >
                ANALYZE
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={8} className={tooltipClass}>
              Met à jour les statistiques de l'optimiseur SQLite
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                onClick={() => run("REINDEX", "/api/admin/db/reindex")}
                disabled={!!running}
                variant="outline"
              >
                REINDEX
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" sideOffset={8} className={tooltipClass}>
              Reconstruit les index pour améliorer les performances
            </TooltipContent>
          </Tooltip>
        </div>

        {integrity && (
          <div className="mt-4 text-sm flex items-center gap-2">
            <CheckCircle
              className={`h-4 w-4 ${
                integrity === "ok" ? "text-green-600" : "text-orange-600"
              }`}
            />
            Résultat intégrité: <span className="font-medium">{integrity}</span>
          </div>
        )}

        {/* Séparateur */}
        <div className="h-px bg-gray-200 my-6" />

        {/* Bloc Sauvegardes */}
        <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <Save className="h-5 w-5 text-brand-blue" />
          Sauvegardes de la base
        </h2>
        <div className="flex flex-wrap gap-2 mb-3">
          <Button
            onClick={createBackup}
            className="bg-brand-blue hover:bg-brand-blue/90 text-white"
          >
            Créer une sauvegarde
          </Button>
          <Button variant="outline" onClick={loadBackups} disabled={loadingBackups}>
            <RefreshCw
              className={`h-4 w-4 mr-2 ${
                loadingBackups ? "animate-spin" : ""
              }`}
            />
            Actualiser la liste
          </Button>
          <Button variant="secondary" onClick={triggerUploadDb}>
            Importer une base
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            accept=".db,.sqlite,.sqlite3"
            className="hidden"
            onChange={onUploadDbChange}
          />
        </div>

        {backups.length === 0 ? (
          <div className="text-sm text-gray-600">
            Aucune sauvegarde encore disponible.
          </div>
        ) : (
          <div className="border rounded-md overflow-hidden">
            <div className="overflow-x-auto">
              {/* Hauteur max locale: évite d'étirer la carte, tout en gardant de l'air sous le bloc */}
              <div className="max-h-[50vh] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-white z-10">
                    <tr className="text-left text-gray-700 border-b">
                      <th className="py-2 px-3">Nom</th>
                      <th className="py-2 px-3">Taille</th>
                      <th className="py-2 px-3">Date</th>
                      <th className="py-2 px-3 w-40">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {backups.map((b) => (
                      <tr key={b.filename} className="border-b hover:bg-gray-50">
                        <td className="py-2 px-3 break-all">{b.filename}</td>
                        <td className="py-2 px-3 whitespace-nowrap">
                          {formatSize(b.sizeBytes)}
                        </td>
                        <td className="py-2 px-3 whitespace-nowrap">
                          {formatDate(b.createdAt)}
                        </td>
                        <td className="py-2 px-3">
                          <div className="flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => downloadBackup(b.filename)}
                            >
                              <DownloadIcon className="h-4 w-4 mr-2" />
                              Télécharger
                            </Button>
                            <Button
                              size="sm"
                              variant="secondary"
                              onClick={() => restoreBackup(b.filename)}
                            >
                              <RefreshCw className="h-4 w-4 mr-2" />
                              Restaurer
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => deleteBackup(b.filename)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Supprimer
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}