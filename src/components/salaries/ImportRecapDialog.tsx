import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import type { ImportRecap } from "./types";
import { Users, XCircle, CheckCircle, Info } from "lucide-react";

type Props = {
  open: boolean;
  recap: ImportRecap;
  onClose: () => void;
};

export default function ImportRecapDialog({ open, recap, onClose }: Props) {
  const d = recap.importDetails || {};
  return (
    <Dialog open={open} onOpenChange={(open) => !open && onClose()}>
      <DialogContent aria-describedby={undefined} className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-6 w-6 text-brand-blue" />
            Récapitulatif d'Import - Salariés
          </DialogTitle>
          <DialogDescription>Analyse détaillée de l'import Excel</DialogDescription>
        </DialogHeader>

        <div className="space-y-6 text-sm">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatBox label="Lignes traitées" value={d.statistiques?.lignes_traitees || 0} color="blue" />
            <StatBox label="Salariés ajoutés" value={d.statistiques?.salaries_ajoutes || 0} color="green" />
            <StatBox label="Déjà existants" value={d.statistiques?.salaries_existants || 0} color="orange" />
            <StatBox label="Erreurs" value={d.statistiques?.erreurs || 0} color="red" />
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h3 className="font-semibold text-gray-800 mb-2 flex items-center gap-2">
              <Info className="h-4 w-4" /> État actuel
            </h3>
            <div className="text-gray-700">
              <div>📁 Fichier: {d.statistiques?.fichier || "Import Excel"}</div>
              <div>📊 Total salariés: {d.statistiques?.total_base || 0}</div>
            </div>
          </div>

          {(d.erreurs_detaillees?.length || 0) > 0 && (
            <div className="bg-red-50 p-4 rounded-lg border border-red-200">
              <h4 className="font-semibold text-red-800 mb-2 flex items-center gap-2">
                <XCircle className="h-4 w-4" />
                Erreurs détectées ({d.erreurs_detaillees.length})
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {d.erreurs_detaillees.map((e: any, idx: number) => (
                  <div key={idx} className="bg-white p-3 rounded border-l-4 border-red-400">
                    <div className="font-medium text-red-700">Ligne {e.ligne}</div>
                    <div className="text-sm text-red-600">{e.erreur}</div>
                    {e.donnees && (
                      <div className="text-xs text-gray-500 mt-1">Données: {JSON.stringify(e.donnees)}</div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {(d.doublons_detectes?.length || 0) > 0 && (
            <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
              <h4 className="font-semibold text-yellow-800 mb-2 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Doublons détectés ({d.doublons_detectes.length})
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {d.doublons_detectes.map((e: any, idx: number) => (
                  <div key={idx} className="bg-white p-3 rounded border-l-4 border-yellow-400">
                    <div className="font-medium text-yellow-700">{e.nom}</div>
                    {e.email && <div className="text-xs text-gray-500">Email: {e.email}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}

          {(d.salaries_ajoutes?.length || 0) > 0 && (
            <div className="bg-green-50 p-4 rounded-lg border border-green-200">
              <h4 className="font-semibold text-green-800 mb-2 flex items-center gap-2">
                <CheckCircle className="h-4 w-4" />
                Salariés ajoutés ({d.salaries_ajoutes.length})
              </h4>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {d.salaries_ajoutes.map((s: any, idx: number) => (
                  <div key={idx} className="bg-white p-3 rounded border-l-4 border-green-400">
                    <div className="font-medium text-green-700">{s.nom}</div>
                    <div className="text-xs text-gray-600">
                      {[s.agence, s.fonction, s.niveau_expertise].filter(Boolean).join(" • ") || "—"}
                    </div>
                    {s.email && <div className="text-xs text-gray-500">{s.email}</div>}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={onClose}>Fermer</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function StatBox({ label, value, color }: { label: string; value: number; color: "blue" | "green" | "orange" | "red" }) {
  const colorMap = {
    blue: "bg-blue-50 border-blue-200 text-blue-700",
    green: "bg-green-50 border-green-200 text-green-700",
    orange: "bg-orange-50 border-orange-200 text-orange-700",
    red: "bg-red-50 border-red-200 text-red-700",
  } as const;
  return (
    <div className={`p-3 rounded-lg border text-center ${colorMap[color]}`}>
      <div className={`text-2xl font-bold ${color === "blue" ? "text-blue-600" : color === "green" ? "text-green-600" : color === "orange" ? "text-orange-600" : "text-red-600"}`}>
        {value}
      </div>
      <div className="text-xs">{label}</div>
    </div>
  );
}