import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { Salarie } from "./types";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  mode: "create" | "edit";
  initial?: Salarie | null;
  agences: string[];
  fonctions: string[];
  niveaux: string[];
  onSubmit: (payload: Omit<Salarie, "id" | "actif"> & { id?: string; actif: boolean }) => void;
  competencesRef?: string[];
};

export default function SalarieFormDialog({
  open,
  onOpenChange,
  mode,
  initial,
  agences,
  fonctions,
  niveaux,
  onSubmit,
  competencesRef = [],
}: Props) {
  const [form, setForm] = useState<Omit<Salarie, "id">>({
    nom: "",
    prenom: "",
    agence: "",
    fonction: "",
    niveau: "",
    actif: true,
    email: "",
    telephone: "",
    competences: [],
  });

  useEffect(() => {
    if (mode === "edit" && initial) {
      const { id: _id, template: _t, ...rest } = initial;
      setForm({
        nom: rest.nom || "",
        prenom: rest.prenom || "",
        agence: rest.agence || "",
        fonction: rest.fonction || "",
        niveau: rest.niveau || "",
        actif: !!rest.actif,
        email: rest.email || "",
        telephone: rest.telephone || "",
        competences: rest.competences || [],
      });
    } else if (mode === "create") {
      setForm({
        nom: "",
        prenom: "",
        agence: "",
        fonction: "",
        niveau: "",
        actif: true,
        email: "",
        telephone: "",
        competences: [],
      });
    }
  }, [mode, initial, open]);

  const handleSubmit = () => {
    if (!form.nom.trim() || !form.prenom.trim()) return;
    const payload = mode === "edit" && initial ? { ...form, id: initial.id } : { ...form };
    onSubmit(payload as any);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined} className="max-w-md">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Ajouter un salarié" : "Modifier le salarié"}</DialogTitle>
          <DialogDescription>
            {mode === "create" ? "Remplissez les informations du nouveau salarié" : "Modifiez les informations du salarié"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div>
            <Label htmlFor="nom">Nom *</Label>
            <Input id="nom" value={form.nom} onChange={(e) => setForm((f) => ({ ...f, nom: e.target.value }))} />
          </div>

          <div>
            <Label htmlFor="prenom">Prénom *</Label>
            <Input id="prenom" value={form.prenom} onChange={(e) => setForm((f) => ({ ...f, prenom: e.target.value }))} />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="agence">Agence</Label>
              <select
                id="agence"
                value={form.agence || ""}
                onChange={(e) => setForm((f) => ({ ...f, agence: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">Sélectionner</option>
                {agences.map((a) => (
                  <option key={a} value={a}>
                    {a}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="fonction">Fonction</Label>
              <select
                id="fonction"
                value={form.fonction || ""}
                onChange={(e) => setForm((f) => ({ ...f, fonction: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">Sélectionner</option>
                {fonctions.map((f) => (
                  <option key={f} value={f}>
                    {f}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="niveau">Niveau</Label>
              <select
                id="niveau"
                value={form.niveau || ""}
                onChange={(e) => setForm((f) => ({ ...f, niveau: e.target.value }))}
                className="w-full p-2 border border-gray-300 rounded-md"
              >
                <option value="">Sélectionner</option>
                {niveaux.map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" value={form.email || ""} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} />
          </div>

          <div>
            <Label htmlFor="telephone">Téléphone</Label>
            <Input id="telephone" value={form.telephone || ""} onChange={(e) => setForm((f) => ({ ...f, telephone: e.target.value }))} />
          </div>

          <div>
            <Label>Compétences (multi‑choix)</Label>
            <div className="mt-1 grid grid-cols-2 gap-2">
              {competencesRef.map((c) => {
                const checked = (form.competences || []).includes(c);
                return (
                  <label key={c} className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={checked}
                      onChange={(e) => {
                        setForm((f) => {
                          const curr = new Set(f.competences || []);
                          if (e.target.checked) curr.add(c);
                          else curr.delete(c);
                          return { ...f, competences: Array.from(curr) };
                        });
                      }}
                      className="rounded border-gray-300"
                    />
                    {c}
                  </label>
                );
              })}
              {competencesRef.length === 0 && (
                <div className="text-xs text-gray-500">Aucune compétence définie dans les référentiels.</div>
              )}
            </div>
          </div>

          <div className="flex items-center space-x-2">
            <input
              id="actif"
              type="checkbox"
              checked={form.actif}
              onChange={(e) => setForm((f) => ({ ...f, actif: e.target.checked }))}
              className="rounded border-gray-300"
            />
            <Label htmlFor="actif">Salarié actif</Label>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={!form.nom.trim() || !form.prenom.trim()}>
            {mode === "create" ? "Ajouter" : "Modifier"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}