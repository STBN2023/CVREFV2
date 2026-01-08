import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { showError, showSuccess, showLoading, dismissToast } from "@/utils/toast";
import { ArrowLeft, Settings, Server, RefreshCw, Save, Link as LinkIcon, Database, Eye, EyeOff, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

type Stats = {
  salaries: number;
  references: number;
  associations: number;
  dbSize: number;
  downloads: number;
  dbPath: string;
};

function formatSize(bytes: number) {
  if (!bytes) return "0 B";
  const k = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

function getDefaultBackendUrl() {
  return import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
}
function getBackendUrl() {
  const ls = localStorage.getItem("app.backendUrl");
  return (ls && ls.trim()) || getDefaultBackendUrl();
}

export default function AdminConfig() {
  const navigate = useNavigate();

  const [backendUrl, setBackendUrl] = useState<string>(getBackendUrl());
  const [pingStatus, setPingStatus] = useState<"idle" | "ok" | "fail" | "loading">("idle");

  const [showBackendBadge, setShowBackendBadge] = useState<boolean>(() => {
    const v = localStorage.getItem("app.showBackendStatus");
    return v === null ? true : v === "1";
  });

  const [autoRefreshDownloads, setAutoRefreshDownloads] = useState<boolean>(() => {
    const v = localStorage.getItem("app.autoRefreshDownloads");
    return v === "1";
  });

  const [stats, setStats] = useState<Stats | null>(null);
  const [loadingStats, setLoadingStats] = useState(false);

  const effectiveBackend = useMemo(() => backendUrl.trim() || getDefaultBackendUrl(), [backendUrl]);

  const saveSettings = () => {
    localStorage.setItem("app.backendUrl", effectiveBackend);
    localStorage.setItem("app.showBackendStatus", showBackendBadge ? "1" : "0");
    localStorage.setItem("app.autoRefreshDownloads", autoRefreshDownloads ? "1" : "0");
    showSuccess("Configuration enregistrée. Rafraîchissez la page si nécessaire.");
  };

  const pingBackend = async () => {
    setPingStatus("loading");
    const t = showLoading("Test connexion backend…");
    try {
      const r = await fetch(`${effectiveBackend}/health`, { cache: "no-store" });
      if (r.ok) {
        setPingStatus("ok");
        showSuccess("Backend OK");
      } else {
        setPingStatus("fail");
        showError(`Backend répond ${r.status}`);
      }
    } catch (e: any) {
      setPingStatus("fail");
      showError(e?.message || "Erreur de connexion");
    } finally {
      dismissToast(String(t));
    }
  };

  const loadStats = async () => {
    setLoadingStats(true);
    try {
      const r = await fetch(`${effectiveBackend}/api/admin/db/stats`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const j = await r.json();
      setStats(j);
    } catch (e: any) {
      setStats(null);
      showError(`Erreur stats: ${e?.message || "inconnue"}`);
    } finally {
      setLoadingStats(false);
    }
  };

  useEffect(() => {
    // Essayez de charger les stats automatiquement
    loadStats();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => navigate("/admin")} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Retour Admin
          </Button>
          <h1 className="text-2xl md:text-3xl font-extrabold text-brand-dark flex items-center gap-2">
            <Settings className="h-6 w-6 text-brand-blue" />
            Configuration
          </h1>
        </div>
      </div>

      {/* Backend config */}
      <div className="bg-white border rounded-lg p-5 mb-6">
        <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <Server className="h-5 w-5 text-brand-blue" />
          Backend
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-end">
          <div className="md:col-span-9">
            <Label htmlFor="backendUrl">URL du backend</Label>
            <div className="flex gap-2">
              <Input
                id="backendUrl"
                value={backendUrl}
                onChange={(e) => setBackendUrl(e.target.value)}
                placeholder="http://localhost:4000"
              />
              <Button
                variant="outline"
                onClick={() => setBackendUrl(getDefaultBackendUrl())}
                title="Valeur par défaut"
              >
                <LinkIcon className="h-4 w-4 mr-2" />
                Défaut
              </Button>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Override runtime (localStorage). Certaines pages pourront nécessiter un rafraîchissement.
            </div>
          </div>
          <div className="md:col-span-3 flex gap-2">
            <Button onClick={pingBackend} className="flex-1">
              <RefreshCw className={`h-4 w-4 mr-2 ${pingStatus === "loading" ? "animate-spin" : ""}`} />
              Tester
            </Button>
            <Button onClick={saveSettings} className="flex-1 bg-brand-blue hover:bg-brand-blue/90 text-white">
              <Save className="h-4 w-4 mr-2" />
              Enregistrer
            </Button>
          </div>
        </div>
        {pingStatus !== "idle" && (
          <div className="mt-3 text-sm">
            Statut:{" "}
            {pingStatus === "ok" ? (
              <span className="text-green-600">OK</span>
            ) : pingStatus === "fail" ? (
              <span className="text-red-600">Erreur</span>
            ) : (
              <span className="text-gray-600">En cours…</span>
            )}
          </div>
        )}
      </div>

      {/* Options UI */}
      <div className="bg-white border rounded-lg p-5 mb-6">
        <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <Settings className="h-5 w-5 text-brand-blue" />
          Options d’interface
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-center justify-between border rounded-md p-3">
            <div>
              <div className="font-medium text-gray-800 flex items-center gap-2">
                {showBackendBadge ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                Badge statut backend
              </div>
              <div className="text-xs text-gray-500">Affiche l’état du backend en bas à gauche.</div>
            </div>
            <Button
              variant="outline"
              onClick={() => setShowBackendBadge((v) => !v)}
            >
              {showBackendBadge ? "Masquer" : "Afficher"}
            </Button>
          </div>

          <div className="flex items-center justify-between border rounded-md p-3">
            <div>
              <div className="font-medium text-gray-800 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Auto‑actualisation Téléchargements
              </div>
              <div className="text-xs text-gray-500">Actualise la page Téléchargements toutes les 15 secondes.</div>
            </div>
            <Button
              variant="outline"
              onClick={() => setAutoRefreshDownloads((v) => !v)}
            >
              {autoRefreshDownloads ? "Désactiver" : "Activer"}
            </Button>
          </div>
        </div>

        <div className="mt-4">
          <Button onClick={saveSettings} className="bg-brand-blue hover:bg-brand-blue/90 text-white">
            <Save className="h-4 w-4 mr-2" />
            Enregistrer les options
          </Button>
        </div>
      </div>

      {/* Stats backend */}
      <div className="bg-white border rounded-lg p-5">
        <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <Database className="h-5 w-5 text-brand-blue" />
          Statistiques Backend
        </h2>
        <div className="flex items-center gap-2 mb-3">
          <Button variant="outline" onClick={loadStats} disabled={loadingStats}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loadingStats ? "animate-spin" : ""}`} />
            Actualiser
          </Button>
          <div className="text-xs text-gray-500">URL: {effectiveBackend}</div>
        </div>
        {stats ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="border rounded-md p-3">
              <div className="text-xs text-gray-500">Salariés</div>
              <div className="text-xl font-bold">{stats.salaries}</div>
            </div>
            <div className="border rounded-md p-3">
              <div className="text-xs text-gray-500">Références</div>
              <div className="text-xl font-bold">{stats.references}</div>
            </div>
            <div className="border rounded-md p-3">
              <div className="text-xs text-gray-500">Associations</div>
              <div className="text-xl font-bold">{stats.associations}</div>
            </div>
            <div className="border rounded-md p-3">
              <div className="text-xs text-gray-500">Taille base</div>
              <div className="text-xl font-bold">{formatSize(stats.dbSize)}</div>
              <div className="text-xs text-gray-500 break-all mt-1">{stats.dbPath}</div>
            </div>
            <div className="border rounded-md p-3">
              <div className="text-xs text-gray-500">Fichiers générés</div>
              <div className="text-xl font-bold">{stats.downloads}</div>
            </div>
          </div>
        ) : (
          <div className="text-sm text-gray-600">Aucune donnée. Cliquez sur Actualiser.</div>
        )}
      </div>
    </div>
  );
}