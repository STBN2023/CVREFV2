import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import type { Salarie } from "./types";
import { Upload, Download, Pencil, Trash2, Search, X } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

type Props = {
  salaries: Salarie[];
  onRowSelect?: (s: Salarie) => void;
  onUploadCv: (s: Salarie) => void;
  onDownloadCv: (s: Salarie) => void;
  onEdit: (s: Salarie) => void;
  onDelete: (id: string) => void;
  cvStatusMap?: Record<string, "exists" | "missing" | "checking">;
};

export default function SalariesTable({
  salaries,
  onRowSelect,
  onUploadCv,
  onDownloadCv,
  onEdit,
  onDelete,
  cvStatusMap,
}: Props) {
  const [globalFilter, setGlobalFilter] = useState("");

  // Filtrer les salariés selon le filtre global
  const filteredSalaries = salaries.filter((s) => {
    if (!globalFilter.trim()) return true;
    const searchTerm = globalFilter.toLowerCase().trim();
    return (
      (s.nom || "").toLowerCase().includes(searchTerm) ||
      (s.prenom || "").toLowerCase().includes(searchTerm) ||
      (s.agence || "").toLowerCase().includes(searchTerm) ||
      (s.fonction || "").toLowerCase().includes(searchTerm) ||
      (s.niveau || "").toLowerCase().includes(searchTerm) ||
      (s.email || "").toLowerCase().includes(searchTerm) ||
      (s.telephone || "").toLowerCase().includes(searchTerm)
    );
  });

  return (
    <div>
      {/* Filtre global */}
      <div className="mb-4">
        <div className="relative max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            type="text"
            placeholder="Rechercher un salarié (nom, prénom, agence, fonction...)"
            value={globalFilter}
            onChange={(e) => setGlobalFilter(e.target.value)}
            className="pl-10 pr-10"
          />
          {globalFilter && (
            <button
              onClick={() => setGlobalFilter("")}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
        {globalFilter && (
          <div className="mt-2 text-sm text-gray-500">
            {filteredSalaries.length} résultat(s) sur {salaries.length} salarié(s)
          </div>
        )}
      </div>

      {/* Tableau */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-gray-200">
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Nom</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Prénom</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Agence</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Fonction</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Niveau</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Statut</th>
              <th className="text-left py-3 px-4 font-semibold text-gray-700">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredSalaries.map((s) => {
              const status = cvStatusMap?.[s.id];
              const dotColor =
                status === "exists" ? "bg-green-500" : status === "missing" ? "bg-red-500" : "bg-gray-300";
              const dotTitle =
                status === "exists" ? "CV présent" : status === "missing" ? "CV absent" : "Vérification...";
              return (
                <tr
                  key={s.id}
                  className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                  onClick={() => onRowSelect?.(s)}
                >
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-2">
                      <span className={`inline-block w-2.5 h-2.5 rounded-full ${dotColor}`} title={dotTitle} />
                      {s.nom}
                    </div>
                  </td>
                  <td className="py-3 px-4">{s.prenom}</td>
                  <td className="py-3 px-4">{s.agence || "-"}</td>
                  <td className="py-3 px-4">{s.fonction || "-"}</td>
                  <td className="py-3 px-4">{s.niveau || "-"}</td>
                  <td className="py-3 px-4">
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        s.actif ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"
                      }`}
                    >
                      {s.actif ? "Actif" : "Inactif"}
                    </span>
                  </td>
                  <td className="py-3 px-4" onClick={(e) => e.stopPropagation()}>
                    <div className="flex gap-2">
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onUploadCv(s)}
                              aria-label="Téléverser le modèle PPTX"
                            >
                              <Upload className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Upload</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onDownloadCv(s)}
                              aria-label="Télécharger le PPTX"
                            >
                              <Download className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Download</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onEdit(s)}
                              aria-label="Modifier le salarié"
                            >
                              <Pencil className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Modifier</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>

                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => onDelete(s.id)}
                              className="text-red-600 hover:text-red-700"
                              aria-label="Supprimer le salarié"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </TooltipTrigger>
                          <TooltipContent>Supprimer</TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {filteredSalaries.length === 0 && globalFilter && (
          <div className="text-center py-8 text-gray-500">
            Aucun salarié ne correspond à la recherche "{globalFilter}".
          </div>
        )}

        {filteredSalaries.length === 0 && !globalFilter && (
          <div className="text-center py-8 text-gray-500">Aucun salarié trouvé. Commencez par en ajouter un.</div>
        )}
      </div>
    </div>
  );
}