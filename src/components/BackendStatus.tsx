import { useEffect, useState } from "react";

function computeBackendUrl() {
  const override = localStorage.getItem("app.backendUrl");
  if (override && override.trim()) return override.trim();
  return import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
}

type Status = "unknown" | "ok" | "down" | "checking";

export default function BackendStatus() {
  const [enabled, setEnabled] = useState<boolean>(() => {
    const v = localStorage.getItem("app.showBackendStatus");
    return v === null ? true : v === "1";
  });
  const [backendUrl, setBackendUrl] = useState<string>(computeBackendUrl());
  const [status, setStatus] = useState<Status>("checking");
  const [lastChecked, setLastChecked] = useState<string>("");

  const check = async () => {
    setStatus("checking");
    try {
      const res = await fetch(`${backendUrl}/health`, { cache: "no-store" });
      setStatus(res.ok ? "ok" : "down");
    } catch {
      setStatus("down");
    } finally {
      setLastChecked(new Date().toLocaleTimeString());
    }
  };

  useEffect(() => {
    // Recharger dynamiquement si l’override change
    const id = setInterval(() => {
      setBackendUrl(computeBackendUrl());
      const v = localStorage.getItem("app.showBackendStatus");
      setEnabled(v === null ? true : v === "1");
    }, 3000);
    return () => clearInterval(id);
  }, []);

  useEffect(() => {
    if (!enabled) return;
    check();
    const id = setInterval(check, 15000);
    return () => clearInterval(id);
  }, [backendUrl, enabled]);

  if (!enabled) return null;

  const color =
    status === "ok" ? "bg-green-500" :
    status === "checking" ? "bg-amber-500" :
    "bg-red-500";

  const label =
    status === "ok" ? "Backend OK" :
    status === "checking" ? "Vérif..." :
    "Backend hors ligne";

  return (
    <div className="fixed bottom-4 left-4 z-50">
      <div className="flex items-center gap-2 rounded-full bg-white/90 border border-gray-200 shadow px-3 py-2">
        <div className={`h-2.5 w-2.5 rounded-full ${color}`} aria-hidden />
        <div className="text-xs text-gray-700">
          {label}
          <span className="text-gray-400"> • {backendUrl.replace(/^https?:\/\//, "")}</span>
          {lastChecked && <span className="text-gray-400"> • {lastChecked}</span>}
          {status !== "ok" && (
            <span className="ml-2 text-[10px] text-gray-500">
              Mode local actif: génération dans le navigateur
            </span>
          )}
        </div>
        <button
          onClick={check}
          className="text-xs px-2 py-1 rounded border border-gray-300 hover:bg-gray-50"
          aria-label="Rafraîchir le statut backend"
        >
          Test
        </button>
      </div>
    </div>
  );
}