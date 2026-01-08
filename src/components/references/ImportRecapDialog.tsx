"use client";

import React from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import type { RecapStats } from "./types";

type Props = {
  open: boolean;
  recap: RecapStats;
  onClose: () => void;
  onExportErrorsCsv: () => void;
  onExportDuplicatesCsv?: () => void;
  onGoSalaries: () => void;
};

const ImportRecapDialog: React.FC<Props> = ({ open, recap, onClose, onExportErrorsCsv, onExportDuplicatesCsv, onGoSalaries }) => {
  const details = recap.importDetails || {};
  const stats = details.statistiques;
  const erreurs_detaillees = details.erreurs_detaillees || [];
  const doublons_detectes = details.doublons_detectes || [];
  const references_ajoutees = details.references_ajoutees || [];
  const recommandations = details.recommandations || details.recommandations || [];

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle className="text-xl">Récapitulatif d'import</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {stats && (
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="p-3 rounded border bg-muted/30">
                <div className="font-medium">Fichier</div>
                <div className="text-muted-foreground">{stats.fichier}</div>
              </div>
              <div className="p-3 rounded border bg-muted/30">
                <div className="font-medium">Lignes traitées</div>
                <div className="text-muted-foreground">{stats.lignes_traitees}</div>
              </div>
              <div className="p-3 rounded border bg-muted/30">
                <div className="font-medium">Ajouts</div>
                <div className="text-muted-foreground">{stats.references_ajoutees}</div>
              </div>
              <div className="p-3 rounded border bg-muted/30">
                <div className="font-medium">Doublons</div>
                <div className="text-muted-foreground">{stats.references_existantes}</div>
              </div>
              <div className="p-3 rounded border bg-muted/30">
                <div className="font-medium">Erreurs</div>
                <div className="text-muted-foreground">{stats.erreurs}</div>
              </div>
              <div className="p-3 rounded border bg-muted/30">
                <div className="font-medium">Total en base</div>
                <div className="text-muted-foreground">{stats.total_base}</div>
              </div>
            </div>
          )}

          {doublons_detectes.length > 0 && (
            <div className="rounded border p-3">
              <div className="font-medium mb-2">Doublons détectés ({doublons_detectes.length})</div>
              <div className="text-sm text-muted-foreground">
                Les lignes suivantes existent déjà (même nom_projet + client + année) :
              </div>
              <ul className="list-disc pl-5 mt-2 space-y-1 max-h-40 overflow-auto">
                {doublons_detectes.map((d: any, idx: number) => (
                  <li key={idx} className="text-sm">
                    Ligne {d.ligne}: {d.nom_projet} — {d.client} ({d.annee})
                  </li>
                ))}
              </ul>
              {onExportDuplicatesCsv && (
                <div className="mt-3">
                  <Button variant="outline" size="sm" onClick={onExportDuplicatesCsv}>
                    Exporter les doublons (CSV)
                  </Button>
                </div>
              )}
            </div>
          )}

          {erreurs_detaillees.length > 0 && (
            <div className="rounded border p-3">
              <div className="font-medium mb-2">Erreurs détaillées ({erreurs_detaillees.length})</div>
              <ul className="list-disc pl-5 mt-2 space-y-1 max-h-40 overflow-auto">
                {erreurs_detaillees.map((e: any, idx: number) => (
                  <li key={idx} className="text-sm">
                    Ligne {e.ligne}: {e.erreur}
                  </li>
                ))}
              </ul>
              <div className="mt-3">
                <Button variant="outline" size="sm" onClick={onExportErrorsCsv}>
                  Exporter les erreurs (CSV)
                </Button>
              </div>
            </div>
          )}

          {references_ajoutees.length > 0 && (
            <div className="rounded border p-3">
              <div className="font-medium mb-2">Références ajoutées ({references_ajoutees.length})</div>
              <ul className="list-disc pl-5 mt-2 space-y-1 max-h-40 overflow-auto">
                {references_ajoutees.map((r: any, idx: number) => (
                  <li key={idx} className="text-sm">
                    {r.nom_projet} — {r.client} ({r.annee}) {r.ville ? `• ${r.ville}` : ""} {r.type_mission ? `• ${r.type_mission}` : ""}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {recommandations && recommandations.length > 0 && (
            <div className="rounded border p-3">
              <div className="font-medium mb-2">Recommandations</div>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                {recommandations.map((r: string, idx: number) => (
                  <li key={idx} className="text-sm">{r}</li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <DialogFooter className="flex gap-2 justify-between">
          <Button variant="outline" onClick={onClose}>Fermer</Button>
          <div className="flex gap-2">
            <Button onClick={onGoSalaries} variant="secondary">Voir les salariés</Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default ImportRecapDialog;