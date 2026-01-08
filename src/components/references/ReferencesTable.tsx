import { Button } from "@/components/ui/button";
import type { Reference } from "./types";
import { Pencil, Trash2 } from "lucide-react";

type Props = {
  references: Reference[];
  getSalarieNames: (ids: string[]) => string;
  onEdit: (ref: Reference) => void;
  onDelete: (id: string) => void;
};

export default function ReferencesTable({
  references,
  getSalarieNames,
  onEdit,
  onDelete,
}: Props) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full border-collapse table-fixed">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="px-3 py-3 text-left font-semibold text-gray-700 w-48">Projet</th>
            <th className="px-3 py-3 text-left font-semibold text-gray-700 w-40">Client</th>
            <th className="px-3 py-3 text-left font-semibold text-gray-700 w-32">Ville</th>
            <th className="px-3 py-3 text-left font-semibold text-gray-700 w-24">Année</th>
            <th className="px-3 py-3 text-left font-semibold text-gray-700 w-40">Type</th>
            <th className="px-3 py-3 text-left font-semibold text-gray-700 w-32">Montant</th>
            <th className="px-3 py-3 text-left font-semibold text-gray-700 w-[18rem]">Description</th>
            <th className="px-3 py-3 text-left font-semibold text-gray-700 w-[14rem]">Salariés</th>
            <th className="px-3 py-3 text-left font-semibold text-gray-700 w-32">Actions</th>
          </tr>
        </thead>
        <tbody>
          {references.map((reference) => (
            <tr key={reference.id} className="border-b border-gray-100 hover:bg-gray-50">
              <td className="px-3 py-3 font-medium whitespace-normal break-words">
                {reference.nom_projet || "-"}
              </td>
              <td className="px-3 py-3 whitespace-normal break-words">{reference.client || "-"}</td>
              <td className="px-3 py-3 whitespace-normal break-words">{reference.ville || "-"}</td>
              <td className="px-3 py-3 whitespace-nowrap">{reference.annee || "-"}</td>
              <td className="px-3 py-3 whitespace-normal break-words">{reference.type_mission || "-"}</td>
              <td className="px-3 py-3 whitespace-nowrap">
                {reference.montant != null ? `${reference.montant.toLocaleString("fr-FR")} €` : "-"}
              </td>
              <td className="px-3 py-3 whitespace-normal break-words">
                {reference.description_projet || "-"}
              </td>
              <td className="px-3 py-3 whitespace-normal break-words">
                {reference.salaries && reference.salaries.length > 0 ? getSalarieNames(reference.salaries) : "-"}
              </td>
              <td className="px-3 py-3">
                <div className="flex justify-end gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="shrink-0"
                    onClick={() => onEdit(reference)}
                    aria-label="Modifier la référence"
                  >
                    <Pencil className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onDelete(reference.id)}
                    className="text-red-600 hover:text-red-700 shrink-0"
                    aria-label="Supprimer la référence"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {references.length === 0 && (
        <div className="py-8 text-center text-gray-500">
          Aucune référence trouvée. Commencez par en ajouter une.
        </div>
      )}
    </div>
  );
}