"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";

type AssocStats = {
  lignes_traitees: number;
  associations_ajoutees: number;
  deja_associes: number;
  erreurs: number;
  manquants_salaries: number;
  manquants_references: number;
  total_base_associations: number;
  fichier: string;
};

type AssocImportDetails = {
  statistiques: AssocStats;
  erreurs_detaillees?: Array<{ ligne: number; erreur: string; row?: any }>;
  manquants_salaries?: Array<{ ligne: number; row: any }>;
  manquants_references?: Array<{ ligne: number; row: any }>;
  deja_associes?: Array<{ id_salarie: string; id_reference: string }>;
  ajoutes?: Array<{ id_salarie: string; id_reference: string; principal?: number }>;
};

type Props = {
  open: boolean;
  details: AssocImportDetails | null;
  onClose: () => void;
};

const AssociationsImportRecapDialog: React.FC<Props> = ({ open, details, onClose }) => {
  if (!details) return null;
  const s = details.statistiques;

  const exportCsv = (rows: any[], filePrefix: string, headers?: string[]) => {
    if (!rows || rows.length === 0) return;
    const keys = headers && headers.length ? headers : Array.from(
      rows.reduce((set: Set<string>, r: any) => {
        Object.keys(r).forEach((k) => set.add(k));
        return set;
      }, new Set<string>())
    );
    const esc = (v: any) => {
      const str = v === null || v === undefined ? "" : String(v);
      return '"' + str.replace(/"/g, '""') + '"';
    };
    const lines = [keys.join(",")].concat(
      rows.map((r: any) => keys.map((k) => esc(r[k])).join(","))
    );
    const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    const date = new Date().toISOString().split("T")[0];
    a.download = `${filePrefix}_${date}.csv`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    window.URL.revokeObjectURL(url);
  };

  const exportManquantsSalaries = () => {
    const rows = (details.manquants_salaries || []).map((m) => ({
      ligne: m.ligne,
      ...m.row,
    }));
    exportCsv(rows, "associations_manquants_salaries");
  };

  const exportManquantsReferences = () => {
    const rows = (details.manquants_references || []).map((m) => ({
      ligne: m.ligne,
      ...m.row,
    }));
    exportCsv(rows, "associations_manquants_references");
  };

  const exportErreurs = () => {
    const rows = (details.erreurs_detaillees || []).map((e) => ({
      ligne: e.ligne,
      erreur: e.erreur,
      ...(e.row ? e.row : {}),
    }));
    exportCsv(rows, "associations_erreurs", ["ligne", "erreur"]);
  };

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl">Import des associations — Récapitulatif</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="p-3 rounded border bg-muted/30">
              <div className="font-medium">Fichier</div>
              <div className="text-muted-foreground">{s.fichier}</div>
            </div>
            <div className="p-3 rounded border bg-muted/30">
              <div className="font-medium">Lignes traitées</div>
              <div className="text-muted-foreground">{s.lignes_traitees}</div>
            </div>
            <div className="p-3 rounded border bg-muted/30">
              <div className="font-medium">Ajouts</div>
              <div className="text-muted-foreground">{s.associations_ajoutees}</div>
            </div>
            <div className="p-3 rounded border bg-muted/30">
              <div className="font-medium">Déjà associées</div>
              <div className="text-muted-foreground">{s.deja_associes}</div>
            </div>
            <div className="p-3 rounded border bg-muted/30">
              <div className="font-medium">Manquants salariés</div>
              <div className="text-muted-foreground">{s.manquants_salaries}</div>
            </div>
            <div className="p-3 rounded border bg-muted/30">
              <div className="font-medium">Manquants références</div>
              <div className="text-muted-foreground">{s.manquants_references}</div>
            </div>
            <div className="p-3 rounded border bg-muted/30">
              <div className="font-medium">Erreurs</div>
              <div className="text-muted-foreground">{s.erreurs}</div>
            </div>
            <div className="p-3 rounded border bg-muted/30">
              <div className="font-medium">Total associations en base</div>
              <div className="text-muted-foreground">{s.total_base_associations}</div>
            </div>
          </div>

          {(details.manquants_salaries?.length || 0) > 0 && (
            <div className="rounded border p-3">
              <div className="font-medium mb-2">Salariés introuvables ({details.manquants_salaries?.length})</div>
              <div className="text-sm text-muted-foreground">
                Les lignes ci-dessous n’ont pas pu identifier un salarié (id/email/nom+prenom).
              </div>
              <ul className="list-disc pl-5 mt-2 space-y-1 max-h-40 overflow-auto">
                {details.manquants_salaries!.map((m, i) => (
                  <li key={i} className="text-sm">Ligne {m.ligne}</li>
                ))}
              </ul>
              <div className="mt-3">
                <Button variant="outline" size="sm" onClick={exportManquantsSalaries}>
                  Exporter les lignes (CSV)
                </Button>
              </div>
            </div>
          )}

          {(details.manquants_references?.length || 0) > 0 && (
            <div className="rounded border p-3">
              <div className="font-medium mb-2">Références introuvables ({details.manquants_references?.length})</div>
              <div className="text-sm text-muted-foreground">
                Les lignes ci-dessous n’ont pas pu identifier une référence (id ou nom_projet+client+annee).
              </div>
              <ul className="list-disc pl-5 mt-2 space-y-1 max-h-40 overflow-auto">
                {details.manquants_references!.map((m, i) => (
                  <li key={i} className="text-sm">Ligne {m.ligne}</li>
                ))}
              </ul>
              <div className="mt-3">
                <Button variant="outline" size="sm" onClick={exportManquantsReferences}>
                  Exporter les lignes (CSV)
                </Button>
              </div>
            </div>
          )}

          {(details.erreurs_detaillees?.length || 0) > 0 && (
            <div className="rounded border p-3">
              <div className="font-medium mb-2">Erreurs détaillées ({details.erreurs_detaillees?.length})</div>
              <ul className="list-disc pl-5 mt-2 space-y-1 max-h-40 overflow-auto">
                {details.erreurs_detaillees!.map((e, i) => (
                  <li key={i} className="text-sm">Ligne {e.ligne}: {e.erreur}</li>
                ))}
              </ul>
              <div className="mt-3">
                <Button variant="outline" size="sm" onClick={exportErreurs}>
                  Exporter les erreurs (CSV)
                </Button>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Fermer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default AssociationsImportRecapDialog;