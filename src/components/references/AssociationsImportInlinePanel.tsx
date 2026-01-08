"use client";

import React, { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { showError, showSuccess, showLoading, dismissToast } from "@/utils/toast";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

type Props = {
  onImported?: (details: any) => void;
  disabled?: boolean;
};

const AssociationsImportInlinePanel: React.FC<Props> = ({ onImported, disabled }) => {
  const fileRef = useRef<HTMLInputElement | null>(null);
  const [running, setRunning] = useState(false);

  const handleChoose = () => fileRef.current?.click();

  const handleFile = async (file: File) => {
    setRunning(true);
    const t = showLoading("Import des associations (défauts) en cours...");
    try {
      // Pré-check rapide: si aucun salarié en base, prévenir
      const salRes = await fetch(`${BACKEND_URL}/api/salaries`);
      const salJson = await salRes.json().catch(() => ({}));
      const countSalaries = Array.isArray(salJson) ? salJson.length : (salJson?.salaries || []).length;
      if (countSalaries === 0) {
        showError("Aucun salarié en base. Importez d'abord les salariés (export global) avant les associations.");
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
      if (onImported && json?.importDetails) onImported(json.importDetails);
    } catch {
      showError("Erreur réseau pendant l'import des associations");
    } finally {
      dismissToast(t);
      setRunning(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="mb-6 rounded-lg border bg-white p-4">
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="font-semibold text-gray-800">Importer des Associations (Export Global)</div>
          <div className="text-sm text-gray-600">
            Chargez le fichier d’associations (CSV/Excel) pour lier automatiquement les références par défaut des salariés.
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleChoose} disabled={running || disabled}>
            Choisir un fichier…
          </Button>
          <input
            ref={fileRef}
            type="file"
            accept=".csv,.xlsx,.xls"
            hidden
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) handleFile(f);
            }}
          />
        </div>
      </div>
    </div>
  );
};

export default AssociationsImportInlinePanel;