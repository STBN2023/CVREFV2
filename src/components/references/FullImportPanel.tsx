"use client";

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { showError, showSuccess, showLoading, dismissToast } from "@/utils/toast";

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

type Props = {
  onDone?: () => void;
};

const FullImportPanel: React.FC<Props> = ({ onDone }) => {
  const [salariesFile, setSalariesFile] = useState<File | null>(null);
  const [referencesFile, setReferencesFile] = useState<File | null>(null);
  const [associationsFile, setAssociationsFile] = useState<File | null>(null);
  const [running, setRunning] = useState(false);

  const salRef = useRef<HTMLInputElement | null>(null);
  const refRef = useRef<HTMLInputElement | null>(null);
  const assocRef = useRef<HTMLInputElement | null>(null);

  const resetInputs = () => {
    if (salRef.current) salRef.current.value = "";
    if (refRef.current) refRef.current.value = "";
    if (assocRef.current) assocRef.current.value = "";
  };

  const upload = async (url: string, file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    const r = await fetch(url, { method: "POST", body: fd });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j?.error || j?.message || "Erreur import");
    return j;
  };

  const runImport = async () => {
    if (!salariesFile && !referencesFile && !associationsFile) {
      showError("Sélectionnez au moins un fichier à importer");
      return;
    }
    setRunning(true);
    const toastId = showLoading("Import global en cours...");
    try {
      // 1) Import Salaries d'abord si fourni
      if (salariesFile) {
        await upload(`${BACKEND_URL}/api/import-salaries`, salariesFile);
        showSuccess("Import des salariés terminé");
      }

      // 2) Import Références si fourni
      if (referencesFile) {
        await upload(`${BACKEND_URL}/api/import-references`, referencesFile);
        showSuccess("Import des références terminé");
      }

      // 3) Import Associations en dernier (nécessite que salaires/références existent)
      if (associationsFile) {
        // Vérifier qu'il y a des salariés en base
        const salRes = await fetch(`${BACKEND_URL}/api/salaries`);
        const salJson = await salRes.json().catch(() => ({}));
        const countSalaries = Array.isArray(salJson)
          ? salJson.length
          : (salJson?.salaries || []).length;
        if (countSalaries === 0) {
          showError("Aucun salarié en base. Importez d'abord les salariés avant les associations.");
        } else {
          await upload(`${BACKEND_URL}/api/import-associations`, associationsFile);
          showSuccess("Import des associations terminé");
        }
      }

      showSuccess("Import global terminé");
      if (onDone) onDone();
    } catch (e: any) {
      showError(e?.message || "Erreur pendant l'import global");
    } finally {
      dismissToast(String(toastId));
      setRunning(false);
      resetInputs();
    }
  };

  const box = (label: string, accept: string, onSelect: (f: File) => void, inputRef: React.RefObject<HTMLInputElement>, filename?: string) => (
    <div className="border rounded-md p-3 flex items-center justify-between gap-3 bg-muted/20">
      <div>
        <div className="text-sm font-medium">{label}</div>
        <div className="text-xs text-muted-foreground break-all">{filename || "Aucun fichier sélectionné"}</div>
      </div>
      <div className="flex gap-2">
        <Button variant="outline" onClick={() => inputRef.current?.click()} disabled={running}>
          Choisir…
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onSelect(f);
          }}
        />
      </div>
    </div>
  );

  return (
    <div className="rounded-lg border bg-white p-4 mb-6">
      <div className="font-semibold text-brand-dark mb-2">Import Global (Salaries, Références, Associations)</div>
      <div className="text-sm text-muted-foreground mb-4">
        Importez vos fichiers d’export global dans l’ordre recommandé: Salariés → Références → Associations.
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-4">
        {box("Fichier Salariés (.xlsx/.xls/.csv)", ".xlsx,.xls,.csv", (f) => setSalariesFile(f), salRef, salariesFile?.name)}
        {box("Fichier Références (.xlsx/.xls)", ".xlsx,.xls", (f) => setReferencesFile(f), refRef, referencesFile?.name)}
        {box("Fichier Associations (.csv/.xlsx/.xls)", ".csv,.xlsx,.xls", (f) => setAssociationsFile(f), assocRef, associationsFile?.name)}
      </div>
      <div className="flex flex-wrap gap-2">
        <Button onClick={runImport} disabled={running} className="bg-brand-blue text-white hover:bg-brand-blue/90">
          Lancer l’import
        </Button>
        <Button variant="outline" disabled={running} onClick={() => { setSalariesFile(null); setReferencesFile(null); setAssociationsFile(null); resetInputs(); }}>
          Réinitialiser
        </Button>
      </div>
    </div>
  );
};

export default FullImportPanel;