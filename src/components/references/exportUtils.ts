import type { Reference } from "./types";

export function exportReferencesToCsv(references: Reference[]) {
  if (!references || references.length === 0) return;
  const headers = ["Nom_Projet", "Client", "Ville", "Annee", "Type_Mission", "Montant", "Description", "Duree_Mois", "Surface"];
  const esc = (v: any) => {
    const s = v === null || v === undefined ? "" : String(v);
    return `"${s.replace(/"/g, '""')}"`;
    };
  const rows = references.map((r) =>
    [
      r.nom_projet,
      r.client,
      r.ville,
      r.annee,
      r.type_mission,
      r.montant != null ? r.montant.toLocaleString("fr-FR") : "",
      r.description_projet || "",
      r.duree_mois ?? "",
      r.surface ?? "",
    ]
      .map(esc)
      .join(",")
  );
  const csv = headers.join(",") + "\n" + rows.join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `references_export_${new Date().toISOString().split("T")[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}