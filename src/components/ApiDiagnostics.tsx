import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

function computeBackendUrl() {
  const override = localStorage.getItem("app.backendUrl");
  if (override && override.trim()) return override.trim();
  return import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";
}

type RouteInfo = { method: string; path: string };

export default function ApiDiagnostics() {
  const [backendUrl, setBackendUrl] = useState<string>(computeBackendUrl());
  const [pingOk, setPingOk] = useState<boolean | null>(null);
  const [routes, setRoutes] = useState<RouteInfo[] | null>(null);
  const [getCompetencesStatus, setGetCompetencesStatus] = useState<number | null>(null);
  const [postCompetenceStatus, setPostCompetenceStatus] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [scanning, setScanning] = useState(false);

  const runPing = async () => {
    try {
      const res = await fetch(`${backendUrl}/api/_ping`);
      setPingOk(res.ok);
    } catch {
      setPingOk(false);
    }
  };

  const loadRoutes = async () => {
    try {
      const res = await fetch(`${backendUrl}/api/_debug_routes`);
      if (!res.ok) {
        setRoutes(null);
        return;
      }
      const json = await res.json();
      setRoutes(json.routes || []);
    } catch {
      setRoutes(null);
    }
  };

  const testCompetences = async () => {
    setBusy(true);
    try {
      const getRes = await fetch(`${backendUrl}/api/competences`);
      setGetCompetencesStatus(getRes.status);

      // POST test minimal, sans persister: nom aléatoire
      const postRes = await fetch(`${backendUrl}/api/competences`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nom: `Test ${Date.now()}`, description: 'diag' }),
      });
      setPostCompetenceStatus(postRes.status);
    } catch {
      setGetCompetencesStatus(null);
      setPostCompetenceStatus(null);
    } finally {
      setBusy(false);
    }
  };

  const scanServers = async () => {
    setScanning(true);
    try {
      const candidates = Array.from(
        new Set([
          computeBackendUrl(),
          import.meta.env.VITE_BACKEND_URL || "",
          "http://localhost:4000",
          "http://127.0.0.1:4000",
          "http://localhost:3000",
          "http://127.0.0.1:3000",
        ])
      ).filter(Boolean);

      let found: string | null = null;
      for (const base of candidates) {
        try {
          // Essayer /api/_ping puis /health
          const r1 = await fetch(`${base}/api/_ping`, { cache: "no-store" }).catch(() => null);
          const r2 = r1 && r1.ok ? r1 : await fetch(`${base}/health`, { cache: "no-store" }).catch(() => null);
          if (r2 && r2.ok) {
            found = base;
            break;
          }
        } catch {
          /* continue */
        }
      }
      if (found) {
        localStorage.setItem("app.backendUrl", found);
        setBackendUrl(found);
        // Recharger les statuts avec l'URL trouvée
        await runPing();
        await loadRoutes();
      }
    } finally {
      setScanning(false);
    }
  };

  useEffect(() => {
    runPing();
    loadRoutes();
  }, [backendUrl]);

  const hasCompetenceRoutes =
    Array.isArray(routes) &&
    routes.some(r => r.path === '/api/competences' && r.method === 'GET') &&
    routes.some(r => r.path === '/api/competences' && r.method === 'POST');

  return (
    <Card className="p-4 mb-6 border-2 border-brand-dark/30">
      <div className="flex items-center justify-between mb-3">
        <div className="font-semibold">Diagnostic Backend</div>
        <div className="text-xs text-brand-dark/60">URL: {backendUrl}</div>
      </div>

      <div className="flex flex-wrap gap-2 items-center mb-3">
        <Badge variant={pingOk ? 'default' : 'destructive'}>
          Ping: {pingOk === null ? '...' : pingOk ? 'OK' : 'KO'}
        </Badge>
        <Badge variant={routes ? 'default' : 'destructive'}>
          Routes: {routes ? `${routes.length} trouvées` : 'indisponible'}
        </Badge>
        <Badge variant={hasCompetenceRoutes ? 'default' : 'destructive'}>
          /api/competences: {hasCompetenceRoutes ? 'présent' : 'absent'}
        </Badge>
        <Badge variant={getCompetencesStatus === 200 ? 'default' : 'destructive'}>
          GET competences: {getCompetencesStatus ?? '...'}
        </Badge>
        <Badge variant={postCompetenceStatus && postCompetenceStatus < 300 ? 'default' : 'destructive'}>
          POST competences: {postCompetenceStatus ?? '...'}
        </Badge>
      </div>

      <div className="flex gap-2">
        <Button variant="outline" onClick={runPing}>Re‑tester Ping</Button>
        <Button variant="outline" onClick={loadRoutes}>Recharger Routes</Button>
        <Button onClick={testCompetences} disabled={busy}>
          {busy ? 'Test en cours...' : 'Tester /api/competences'}
        </Button>
        <Button onClick={scanServers} disabled={scanning}>
          {scanning ? 'Scan…' : 'Scanner serveurs'}
        </Button>
      </div>

      {Array.isArray(routes) && (
        <div className="mt-4 max-h-48 overflow-auto border rounded p-2 text-sm">
          {routes.map((r, i) => (
            <div key={`${r.method}-${r.path}-${i}`} className="flex justify-between">
              <span className="font-mono">{r.method}</span>
              <span className="font-mono">{r.path}</span>
            </div>
          ))}
          {routes.length === 0 && <div>Aucune route.</div>}
        </div>
      )}
    </Card>
  );
}