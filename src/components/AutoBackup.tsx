import { useEffect } from "react";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

export default function AutoBackup() {
  useEffect(() => {
    // Ne lancer qu'une fois par session de navigation
    const KEY = "autoBackup.v1";
    if (sessionStorage.getItem(KEY) === "1") return;

    let aborted = false;

    const run = async () => {
      try {
        // Vérifier que le backend est joignable avant toute requête
        const pingResp = await fetch(`${BACKEND_URL}/health`, { cache: "no-store" }).catch(() => null);
        if (!pingResp || !pingResp.ok) return;

        // 1) Création d'une sauvegarde (ignorer silencieusement les erreurs réseau)
        await fetch(`${BACKEND_URL}/api/admin/db/backup`, { method: "POST" }).catch(() => {});

        if (aborted) return;

        // 2) Rotation: ne garder que les 5 plus récentes (protéger contre erreurs réseau)
        const resp = await fetch(`${BACKEND_URL}/api/admin/db/backups`, { cache: "no-store" }).catch(() => null);
        if (!resp || !resp.ok) return;

        const data = await resp.json();
        const backups: Array<{ filename: string; createdAt: number }> = Array.isArray(data?.backups) ? data.backups : [];

        // Tri décroissant par date
        backups.sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));

        // Conserver les 5 premières, supprimer le reste
        const toDelete = backups.slice(5);
        await Promise.all(
          toDelete.map((b) =>
            fetch(`${BACKEND_URL}/api/admin/db/backup/${encodeURIComponent(b.filename)}`, {
              method: "DELETE",
            }).catch(() => {})
          )
        );
      } catch {
        // Éviter toute propagation d'erreurs réseau dans l'effet
      } finally {
        // Marquer comme exécuté pour cette session
        sessionStorage.setItem(KEY, "1");
      }
    };

    run();

    return () => {
      aborted = true;
    };
  }, []);

  return null;
}