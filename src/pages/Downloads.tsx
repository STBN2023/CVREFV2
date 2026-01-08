import { useEffect, useMemo, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Download,
  Trash2,
  FileText,
  Calendar,
  HardDrive,
  RefreshCw,
  CheckSquare,
  Square,
  ArrowUpDown,
  FileDown,
} from "lucide-react";
import {
  showSuccess,
  showError,
  showLoading,
  dismissToast,
  dismissAllToasts,
} from "@/utils/toast";

interface DownloadFile {
  filename: string;
  sizeBytes: number;
  createdAt: number; // epoch ms
}

type SortKey = "date" | "size" | "name";
type SortDir = "asc" | "desc";
type DownloadFormat = "pptx" | "pdf";

const BACKEND_URL = import.meta.env.MODE === "production" ? "" : "http://localhost:4000";

function formatFileSize(bytes: number) {
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

// Extrait le nom du membre depuis le nom de fichier cv_prenom_nom_YYYY-... .pptx
function extractMember(filename: string) {
  try {
    const base = filename.replace(/\.pptx$/i, "");
    const withoutPrefix = base.startsWith("cv_") ? base.slice(3) : base;
    const lastUnderscore = withoutPrefix.lastIndexOf("_");
    if (lastUnderscore === -1) return "";
    const namePart = withoutPrefix.slice(0, lastUnderscore);
    return namePart.replace(/_/g, " ");
  } catch {
    return "";
  }
}

export default function Downloads() {
  const [files, setFiles] = useState<DownloadFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);

  // Gestion
  const [sortKey, setSortKey] = useState<SortKey>("date");
  const [sortDir, setSortDir] = useState<SortDir>("desc");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [autoRefresh, setAutoRefresh] = useState(false);
  const refreshTimer = useRef<number | null>(null);

  const loadFiles = async () => {
    try {
      setLoading(true);
      const apiUrl = `${BACKEND_URL}/api/downloads`;
      const response = await fetch(apiUrl);
      if (response.ok) {
        const data = await response.json();
        setFiles(data.files || []);
      } else {
        showError(`Erreur ${response.status}: ${response.statusText}`);
      }
    } catch (error: any) {
      showError(`Erreur de connexion: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Init autoRefresh depuis localStorage
    const v = localStorage.getItem("app.autoRefreshDownloads");
    if (v) setAutoRefresh(v === "1");
    loadFiles();
  }, []);

  // Persister le flag à chaque changement
  useEffect(() => {
    localStorage.setItem("app.autoRefreshDownloads", autoRefresh ? "1" : "0");
  }, [autoRefresh]);

  // Auto-refresh toggle
  useEffect(() => {
    if (autoRefresh) {
      refreshTimer.current = window.setInterval(() => {
        loadFiles();
      }, 15000) as unknown as number;
    } else if (refreshTimer.current) {
      clearInterval(refreshTimer.current);
      refreshTimer.current = null;
    }
    return () => {
      if (refreshTimer.current) clearInterval(refreshTimer.current);
    };
  }, [autoRefresh]);

  // Sélection
  const toggleSelected = (filename: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(filename)) next.delete(filename);
      else next.add(filename);
      return next;
    });
  };
  const selectAll = () => setSelected(new Set(files.map((f) => f.filename)));
  const clearSelection = () => setSelected(new Set());

  // Tri simple
  const sorted = useMemo(() => {
    const list = [...files];
    list.sort((a, b) => {
      switch (sortKey) {
        case "name": {
          const cmp = a.filename.localeCompare(b.filename);
          return sortDir === "asc" ? cmp : -cmp;
        }
        case "size": {
          const cmp = a.sizeBytes - b.sizeBytes;
          return sortDir === "asc" ? cmp : -cmp;
        }
        case "date":
        default: {
          const cmp = (a.createdAt || 0) - (b.createdAt || 0);
          return sortDir === "asc" ? cmp : -cmp;
        }
      }
    });
    return list;
  }, [files, sortKey, sortDir]);

  const totalSize = useMemo(
    () => sorted.reduce((acc, f) => acc + (f.sizeBytes || 0), 0),
    [sorted]
  );

  // Actions
  const handleRefresh = async () => {
    await loadFiles();
    showSuccess("Liste actualisée");
  };

  const handleDownloadOne = async (filename: string, format: DownloadFormat = "pptx") => {
    const isPdf = format === "pdf";
    const targetFilename = isPdf ? filename.replace(/\.pptx$/i, ".pdf") : filename;
    const downloadKey = `${filename}:${format}`;
    setDownloading(downloadKey);
    const loadingToast = showLoading(`Téléchargement de ${targetFilename}...`);
    try {
      const endpointSuffix =
        format === "pdf"
          ? `${encodeURIComponent(filename)}/pdf`
          : encodeURIComponent(filename);
      const apiUrl = `${BACKEND_URL}/api/download/${endpointSuffix}`.replace(/^\/\//, "/");
      const response = await fetch(apiUrl);
      if (response.ok) {
        const blob = await response.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = targetFilename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        window.URL.revokeObjectURL(url);
        dismissToast(String(loadingToast));
        dismissAllToasts();
        showSuccess(`✅ ${targetFilename} téléchargé`);
      } else {
        dismissToast(String(loadingToast));
        dismissAllToasts();
        showError(`Erreur lors du téléchargement de ${targetFilename}`);
      }
    } catch (error: any) {
      dismissToast(String(loadingToast));
      dismissAllToasts();
      showError(`Erreur de connexion: ${error.message}`);
    } finally {
      setDownloading(null);
    }
  };

  const handleDeleteOne = async (filename: string) => {
    if (!confirm(`Supprimer "${filename}" ? Cette action est irréversible.`)) return;
    setDeleting(filename);
    const loadingToast = showLoading(`Suppression de ${filename}...`);
    try {
      const apiUrl = `${BACKEND_URL}/api/download/${encodeURIComponent(filename)}`.replace(/^\/\//, "/");
      const response = await fetch(apiUrl, { method: "DELETE" });
      if (response.ok) {
        dismissToast(String(loadingToast));
        dismissAllToasts();
        showSuccess(`✅ ${filename} supprimé`);
        await loadFiles();
        setSelected((prev) => {
          const next = new Set(prev);
          next.delete(filename);
          return next;
        });
      } else {
        dismissToast(String(loadingToast));
        dismissAllToasts();
        showError(`Erreur lors de la suppression de ${filename}`);
      }
    } catch (error: any) {
      dismissToast(String(loadingToast));
      dismissAllToasts();
      showError(`Erreur de connexion: ${error.message}`);
    } finally {
      setDeleting(null);
    }
  };

  const handleDownloadSelected = async () => {
    if (selected.size === 0) {
      showError("Aucun fichier sélectionné");
      return;
    }
    const toastId = showLoading(`Téléchargement (${selected.size})...`);
    try {
      for (const name of selected) {
        await handleDownloadOne(name);
      }
      dismissToast(String(toastId));
      dismissAllToasts();
      showSuccess("Téléchargements terminés");
    } catch {
      dismissToast(String(toastId));
      dismissAllToasts();
    }
  };

  const handleDeleteSelected = async () => {
    if (selected.size === 0) {
      showError("Aucun fichier sélectionné");
      return;
    }
    if (!confirm(`Supprimer ${selected.size} fichier(s) ?\n\nCette action est irréversible.`)) {
      return;
    }
    const toastId = showLoading(`Suppression (${selected.size})...`);
    try {
      for (const name of selected) {
        await fetch(`${BACKEND_URL}/api/download/${encodeURIComponent(name)}`.replace(/^\/\//, "/"), {
          method: "DELETE",
        });
      }
      dismissToast(String(toastId));
      dismissAllToasts();
      showSuccess("Suppressions terminées");
      await loadFiles();
      clearSelection();
    } catch (e: any) {
      dismissToast(String(toastId));
      dismissAllToasts();
      showError("Erreur lors de la suppression groupée");
    }
  };

  const handleDeleteAll = async () => {
    if (files.length === 0) {
      showError("Aucun fichier à supprimer");
      return;
    }
    if (!confirm(`Supprimer TOUS les fichiers (${files.length}) ?\n\nAction irréversible.`)) {
      return;
    }
    const toastId = showLoading("Suppression de tous les fichiers...");
    try {
      for (const f of files) {
        await fetch(`${BACKEND_URL}/api/download/${encodeURIComponent(f.filename)}`.replace(/^\/\//, "/"), {
          method: "DELETE",
        });
      }
      dismissToast(String(toastId));
      dismissAllToasts();
      showSuccess("Tous les fichiers ont été supprimés");
      await loadFiles();
      clearSelection();
    } catch {
      dismissToast(String(toastId));
      dismissAllToasts();
      showError("Erreur lors de la suppression de masse");
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-10 px-4">
      {/* En-tête */}
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
        <h1 className="text-2xl md:text-3xl font-extrabold text-brand-dark">📁 Gestion des Téléchargements</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setAutoRefresh((v) => !v)}
            className={autoRefresh ? "border-green-500 text-green-700" : ""}
            title="Auto-actualisation 15s"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${autoRefresh ? "animate-spin" : ""}`} />
            {autoRefresh ? "Auto (15s)" : "Auto OFF"}
          </Button>
          <Button onClick={handleRefresh} disabled={loading} className="bg-brand-blue hover:bg-brand-blue/90 text-white">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`} />
            Actualiser
          </Button>
        </div>
      </div>

      {/* Toolbar (tri + actions) */}
      <div className="mb-4 grid grid-cols-1 md:grid-cols-12 gap-3">
        {/* Tri */}
        <div className="md:col-span-6 flex items-center gap-2 relative z-10">
          <ArrowUpDown className="h-4 w-4 text-brand-dark/70" />
          <select
            value={`${sortKey}:${sortDir}`}
            onChange={(e) => {
              const [k, d] = e.target.value.split(":") as [SortKey, SortDir];
              setSortKey(k);
              setSortDir(d);
            }}
            className="w-full max-w-sm p-2 border border-gray-300 rounded-md bg-white"
            title="Trier"
          >
            <option value="date:desc">Date (récent → ancien)</option>
            <option value="date:asc">Date (ancien → récent)</option>
            <option value="size:desc">Taille (grande → petite)</option>
            <option value="size:asc">Taille (petite → grande)</option>
            <option value="name:asc">Nom (A → Z)</option>
            <option value="name:desc">Nom (Z → A)</option>
          </select>
        </div>

        {/* Actions */}
        <div className="md:col-span-6 flex flex-wrap md:flex-nowrap items-center gap-2 justify-start md:justify-end z-0">
          <Button variant="outline" onClick={() => (selected.size ? clearSelection() : selectAll())}>
            {selected.size ? (
              <>
                <Square className="h-4 w-4 mr-2" /> Désélectionner
              </>
            ) : (
              <>
                <CheckSquare className="h-4 w-4 mr-2" /> Tout sélectionner
              </>
            )}
          </Button>
          <Button variant="outline" onClick={handleDownloadSelected} disabled={selected.size === 0}>
            <Download className="h-4 w-4 mr-2" />
            Télécharger ({selected.size})
          </Button>
          <Button variant="destructive" onClick={handleDeleteSelected} disabled={selected.size === 0}>
            <Trash2 className="h-4 w-4 mr-2" />
            Supprimer ({selected.size})
          </Button>
        </div>
      </div>

      {/* Statistiques */}
      <div className="mb-4 flex items-center justify-between text-sm text-gray-700">
        <div>
          <span className="font-semibold">{sorted.length}</span> fichier
          {sorted.length > 1 ? "s" : ""} • Total{" "}
          <span className="font-semibold">{formatFileSize(totalSize)}</span>
        </div>
        <div>
          <Button variant="outline" onClick={handleDeleteAll} disabled={files.length === 0}>
            <Trash2 className="h-4 w-4 mr-2" />
            Supprimer tout
          </Button>
        </div>
      </div>

      {/* Liste */}
      {loading ? (
        <div className="text-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-brand-blue mx-auto mb-4"></div>
          <p className="text-gray-600">Chargement des fichiers...</p>
        </div>
      ) : sorted.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-gray-700 mb-2">Aucun fichier disponible</h3>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="bg-gray-50 px-6 py-3 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-800">📊 {sorted.length} élément(s)</h2>
          </div>
          <div className="divide-y divide-gray-200">
            {sorted.map((file) => {
              const isSel = selected.has(file.filename);
              const member = extractMember(file.filename);
              return (
                <div key={file.filename} className="p-4 md:p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-3">
                    {/* Infos */}
                    <div className="flex items-start gap-3 md:gap-4">
                      <button
                        aria-label={isSel ? "Désélectionner" : "Sélectionner"}
                        onClick={() => toggleSelected(file.filename)}
                        className="mt-1 md:mt-0"
                      >
                        {isSel ? <CheckSquare className="h-5 w-5 text-brand-blue" /> : <Square className="h-5 w-5 text-gray-400" />}
                      </button>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <FileText className="h-5 w-5 text-blue-600" />
                          <h3 className="font-medium text-gray-900 break-all">{file.filename}</h3>
                          {member && (
                            <span className="text-xs bg-brand-lightblue text-brand-dark px-2 py-0.5 rounded-full">
                              {member}
                            </span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-4 mt-1 text-sm text-gray-600">
                          <div className="flex items-center gap-1">
                            <HardDrive className="h-4 w-4" />
                            <span>{formatFileSize(file.sizeBytes)}</span>
                          </div>
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            <span>{formatDate(file.createdAt)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2 shrink-0 flex-wrap justify-end">
                      <Button
                        onClick={() => handleDownloadOne(file.filename, "pptx")}
                        disabled={downloading === `${file.filename}:pptx`}
                        className="bg-green-600 hover:bg-green-700 text-white"
                        size="sm"
                      >
                        {downloading === `${file.filename}:pptx` ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                            PPTX...
                          </>
                        ) : (
                          <>
                            <Download className="h-4 w-4 mr-2" />
                            PPTX
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={() => handleDownloadOne(file.filename, "pdf")}
                        disabled={downloading === `${file.filename}:pdf`}
                        variant="outline"
                        size="sm"
                        className="text-purple-600 border-purple-300 hover:bg-purple-50"
                      >
                        {downloading === `${file.filename}:pdf` ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-600 mr-2" />
                            PDF...
                          </>
                        ) : (
                          <>
                            <FileDown className="h-4 w-4 mr-2" />
                            PDF
                          </>
                        )}
                      </Button>
                      <Button
                        onClick={() => handleDeleteOne(file.filename)}
                        disabled={deleting === file.filename}
                        variant="outline"
                        size="sm"
                        className="text-red-600 border-red-300 hover:bg-red-50"
                      >
                        {deleting === file.filename ? (
                          <>
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2" />
                            Suppression...
                          </>
                        ) : (
                          <>
                            <Trash2 className="h-4 w-4 mr-2" />
                            Supprimer
                          </>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}