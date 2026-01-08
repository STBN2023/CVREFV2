import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Clock, CheckCircle, XCircle, FileSpreadsheet } from "lucide-react";
import type { ImportProgress } from "./types";

type Props = {
  progress: ImportProgress;
  onClose: () => void;
};

export default function ImportProgressDialog({ progress, onClose }: Props) {
  return (
    <Dialog open={progress.show} onOpenChange={(open) => !open && onClose()}>
      <DialogContent aria-describedby={undefined} className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileSpreadsheet className="h-5 w-5 text-brand-blue" />
            Import Excel - Salariés
          </DialogTitle>
          <DialogDescription>Suivi en temps réel de l'import des données</DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="flex items-center gap-3">
            {progress.status === "loading" && <Clock className="h-5 w-5 text-blue-500 animate-spin" />}
            {progress.status === "success" && <CheckCircle className="h-5 w-5 text-green-500" />}
            {progress.status === "error" && <XCircle className="h-5 w-5 text-red-500" />}
            <span className="font-medium">{progress.step}</span>
          </div>

          {progress.details.length > 0 && (
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="space-y-1">
                {progress.details.map((detail, idx) => (
                  <div key={idx} className="text-sm text-gray-700">
                    {detail}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button onClick={onClose} disabled={progress.status === "loading"}>
            {progress.status === "loading" ? "En cours..." : "Fermer"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}