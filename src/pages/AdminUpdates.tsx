import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { showError, showSuccess, showLoading, dismissToast } from "@/utils/toast";
import { ArrowLeft, GitBranch, RefreshCw, Download, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

type GitStatus = {
  currentCommit: string;
  currentBranch: string;
  isDirty: boolean;
  lastCommitDate: string;
  lastCommitMessage: string;
};

type UpdateStatus = {
  hasUpdates: boolean;
  behindBy: number;
  latestRemoteCommit: string;
  latestRemoteMessage: string;
};

type Commit = {
  hash: string;
  message: string;
  author: string;
  date: string;
};

export default function AdminUpdates() {
  const navigate = useNavigate();

  const [gitStatus, setGitStatus] = useState<GitStatus | null>(null);
  const [updateStatus, setUpdateStatus] = useState<UpdateStatus | null>(null);
  const [commits, setCommits] = useState<Commit[]>([]);
  const [loading, setLoading] = useState(false);
  const [checking, setChecking] = useState(false);
  const [pulling, setPulling] = useState(false);
  const [updateComplete, setUpdateComplete] = useState(false);

  const loadGitStatus = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${BACKEND_URL}/api/admin/git/status`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      setGitStatus(data);
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "inconnue";
      showError(`Erreur: ${message}`);
    } finally {
      setLoading(false);
    }
  };

  const checkForUpdates = async () => {
    setChecking(true);
    const t = showLoading("Vérification des mises à jour...");
    try {
      const r = await fetch(`${BACKEND_URL}/api/admin/git/check-updates`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      setUpdateStatus(data);
      if (data.hasUpdates) {
        showSuccess(`${data.behindBy} mise(s) à jour disponible(s)`);
      } else {
        showSuccess("L'application est à jour");
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "inconnue";
      showError(`Erreur: ${message}`);
    } finally {
      dismissToast(String(t));
      setChecking(false);
    }
  };

  const pullUpdates = async () => {
    if (!confirm("Appliquer les mises à jour ? L'application sera redémarrée.")) return;
    setPulling(true);
    const t = showLoading("Téléchargement des mises à jour...");
    try {
      const r = await fetch(`${BACKEND_URL}/api/admin/git/pull`, { method: "POST" });
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      dismissToast(String(t));
      setUpdateComplete(true);
      showSuccess("Mises à jour appliquées avec succès !");
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "inconnue";
      showError(`Erreur: ${message}`);
      dismissToast(String(t));
    } finally {
      setPulling(false);
    }
  };

  const loadCommits = async () => {
    try {
      const r = await fetch(`${BACKEND_URL}/api/admin/git/commits?limit=10`);
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const data = await r.json();
      setCommits(data.commits || []);
    } catch (e: unknown) {
      console.error("Erreur chargement commits:", e);
    }
  };

  useEffect(() => {
    loadGitStatus();
    loadCommits();
  }, []);

  return (
    <div className="max-w-5xl mx-auto py-8 px-4">
      {/* Message de redémarrage après mise à jour */}
      {updateComplete && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-8 max-w-md mx-4 shadow-2xl">
            <div className="flex flex-col items-center text-center">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-10 w-10 text-green-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-800 mb-2">
                Mise à jour terminée !
              </h2>
              <p className="text-gray-600 mb-6">
                Les mises à jour ont été appliquées avec succès.
                <br /><br />
                <strong className="text-gray-800">
                  Veuillez fermer complètement l'application et la redémarrer
                </strong>
                <br />
                pour que les changements prennent effet.
              </p>
              <div className="flex flex-col gap-3 w-full">
                <Button 
                  onClick={() => window.close()}
                  className="bg-green-600 hover:bg-green-700 text-white font-semibold shadow-md"
                >
                  Fermer l'application
                </Button>
                <Button 
                  variant="outline"
                  onClick={() => setUpdateComplete(false)}
                  className="border-gray-300 text-gray-700 hover:bg-gray-100 font-medium"
                >
                  Continuer sans redémarrer
                </Button>
              </div>
              <p className="text-sm text-gray-500 mt-4">
                Si le bouton "Fermer" ne fonctionne pas, fermez manuellement la fenêtre.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={() => navigate("/admin")} className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Retour Admin
          </Button>
          <h1 className="text-2xl md:text-3xl font-extrabold text-brand-dark flex items-center gap-2">
            <GitBranch className="h-6 w-6 text-brand-blue" />
            Mises à jour
          </h1>
        </div>
        <Button variant="ghost" size="icon" onClick={loadGitStatus} disabled={loading}>
          <RefreshCw className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
        </Button>
      </div>

      {/* Statut actuel */}
      <div className="bg-white border rounded-lg p-5 mb-6 shadow-sm">
        <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <GitBranch className="h-5 w-5 text-brand-blue" />
          Version actuelle
        </h2>
        {gitStatus ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="text-sm text-gray-500">Branche</div>
              <div className="font-mono text-lg">{gitStatus.currentBranch}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Commit actuel</div>
              <div className="font-mono text-sm">{gitStatus.currentCommit?.substring(0, 12)}...</div>
            </div>
            <div className="md:col-span-2">
              <div className="text-sm text-gray-500">Dernier message</div>
              <div className="text-sm">{gitStatus.lastCommitMessage}</div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Date</div>
              <div className="text-sm">{gitStatus.lastCommitDate}</div>
            </div>
            {gitStatus.isDirty && (
              <div className="md:col-span-2">
                <div className="text-orange-600 text-sm flex items-center gap-2">
                  <AlertCircle className="h-4 w-4" />
                  Des modifications locales non commitées sont présentes
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="text-gray-500 flex items-center gap-2">
            <RefreshCw className="h-4 w-4 animate-spin" />
            Chargement...
          </div>
        )}
      </div>

      {/* Vérification des mises à jour */}
      <div className="bg-white border rounded-lg p-5 mb-6 shadow-sm">
        <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <RefreshCw className="h-5 w-5 text-brand-blue" />
          Mises à jour disponibles
        </h2>
        
        <div className="flex flex-wrap gap-3 mb-4">
          <Button onClick={checkForUpdates} disabled={checking} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${checking ? "animate-spin" : ""}`} />
            Vérifier les mises à jour
          </Button>
          
          {updateStatus?.hasUpdates && (
            <Button 
              onClick={pullUpdates} 
              disabled={pulling}
              className="bg-green-600 hover:bg-green-700 text-white"
            >
              <Download className={`h-4 w-4 mr-2 ${pulling ? "animate-bounce" : ""}`} />
              Appliquer les mises à jour ({updateStatus.behindBy})
            </Button>
          )}
        </div>

        {updateStatus && (
          <div className={`p-4 rounded-lg ${updateStatus.hasUpdates ? "bg-yellow-50 border border-yellow-200" : "bg-green-50 border border-green-200"}`}>
            {updateStatus.hasUpdates ? (
              <div className="flex items-center gap-2 text-yellow-800">
                <AlertCircle className="h-5 w-5" />
                <span className="font-medium">{updateStatus.behindBy} mise(s) à jour disponible(s)</span>
              </div>
            ) : (
              <div className="flex items-center gap-2 text-green-800">
                <CheckCircle className="h-5 w-5" />
                <span className="font-medium">L'application est à jour</span>
              </div>
            )}
            {updateStatus.latestRemoteMessage && (
              <div className="mt-2 text-sm text-gray-600">
                Dernier commit distant: {updateStatus.latestRemoteMessage}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Historique des commits */}
      <div className="bg-white border rounded-lg p-5 shadow-sm">
        <h2 className="font-semibold text-gray-800 mb-3 flex items-center gap-2">
          <Clock className="h-5 w-5 text-brand-blue" />
          Historique des commits
        </h2>
        {commits.length > 0 ? (
          <div className="space-y-3">
            {commits.map((commit, index) => (
              <div key={commit.hash} className={`p-3 rounded-lg ${index === 0 ? "bg-blue-50 border border-blue-200" : "bg-gray-50"}`}>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-gray-800">{commit.message}</div>
                    <div className="text-sm text-gray-500 mt-1">
                      {commit.author} • {commit.date}
                    </div>
                  </div>
                  <div className="font-mono text-xs text-gray-400">{commit.hash.substring(0, 7)}</div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-gray-500">Aucun commit trouvé</div>
        )}
      </div>

      {/* Note de sécurité */}
      <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
        <div className="flex items-start gap-2">
          <AlertCircle className="h-5 w-5 text-amber-600 mt-0.5" />
          <div>
            <div className="font-medium text-amber-800">Note de sécurité</div>
            <div className="text-sm text-amber-700 mt-1">
              Cette fonctionnalité nécessite que Git soit installé sur le serveur et que le repository soit correctement configuré avec un remote origin.
              Assurez-vous que le serveur a les droits d'écriture sur le dossier du projet.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}