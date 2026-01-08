export type SalarieCsv = {
  nom: string;
  prenom: string;
  agence?: string;
  fonction?: string;
  niveau?: string;
  email?: string;
  telephone?: string;
  actif?: boolean;
};

export function exportSalariesToCsv(salaries: SalarieCsv[]) {
  if (!Array.isArray(salaries) || salaries.length === 0) return;

  const headers = [
    "Nom",
    "Prenom",
    "Agence",
    "Fonction",
    "Niveau_Expertise",
    "Email",
    "Telephone",
    "Actif",
  ];

  const esc = (v: any) => {
    const s = v === null || v === undefined ? "" : String(v);
    return `"${s.replace(/"/g, '""')}"`;
  };

  const rows = salaries.map((s) =>
    [
      s.nom || "",
      s.prenom || "",
      s.agence || "",
      s.fonction || "",
      s.niveau || "",
      s.email || "",
      s.telephone || "",
      s.actif ? "1" : "0",
    ]
      .map(esc)
      .join(","),
  );

  const csv = headers.join(",") + "\n" + rows.join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `salaries_export_${new Date().toISOString().split("T")[0]}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}