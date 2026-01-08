import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Upload, Download, UserPlus } from "lucide-react";

type Props = {
  count: number;
  importing: boolean;
  exporting: boolean;
  onAdd: () => void;
  onImport: (file: File) => void;
  onExport: () => void;
};

export default function SalariesToolbar({
  count,
  importing,
  exporting,
  onAdd,
  onImport,
  onExport,
}: Props) {
  const fileInputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between mb-6">
      <div className="flex items-center gap-3">
        <svg viewBox="0 0 24 24" className="h-6 w-6 text-brand-blue" fill="currentColor" aria-hidden>
          <path d="M12 12a5 5 0 100-10 5 5 0 000 10zM4 22a8 8 0 1116 0H4z" />
        </svg>
        <h2 className="text-2xl font-semibold text-brand-dark">Salariés ({count})</h2>
      </div>

      <div className="flex flex-wrap md:flex-nowrap items-center gap-3 overflow-x-auto md:overflow-visible max-w-full py-1">
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls"
          hidden
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) onImport(f);
            e.currentTarget.value = "";
          }}
        />
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                className="border-orange-500 text-orange-600 hover:bg-orange-50"
                onClick={() => fileInputRef.current?.click()}
                disabled={importing}
              >
                {importing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-orange-600 mr-2" />
                    Import...
                  </>
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" />
                    Importer Excel
                  </>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Importer des salariés depuis un fichier Excel</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="outline"
                className="border-green-500 text-green-600 hover:bg-green-50"
                onClick={onExport}
                disabled={exporting}
              >
                {exporting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-green-600 mr-2" />
                    Export...
                  </>
                ) : (
                  <>
                    <Download className="mr-2 h-4 w-4" />
                    Exporter Excel
                  </>
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Exporter tous les salariés (fallback CSV si l’API est indisponible)</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <Button onClick={onAdd} className="bg-brand-blue hover:bg-brand-blue/90 text-white">
          <UserPlus className="mr-2 h-4 w-4" />
          Ajouter Salarié
        </Button>
      </div>
    </div>
  );
}