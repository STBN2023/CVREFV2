import { useEffect, useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import type { Reference, Salarie } from "./types";
import { parseCurrencyToNumber } from "@/utils/number";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  mode: "create" | "edit";
  initial?: Reference | null;
  salaries: Salarie[];
  onSubmit: (payload: Omit<Reference, "id"> & { id?: string }) => void;
};

export default function ReferenceFormDialog({
  open,
  onOpenChange,
  mode,
  initial,
  salaries,
  onSubmit,
}: Props) {
  const [form, setForm] = useState<Omit<Reference, "id">>({
    nom_projet: "",
    client: "",
    ville: "",
    annee: new Date().getFullYear(),
    type_mission: "",
    montant: null,
    description_projet: "",
    duree_mois: 0,
    surface: 0,
    salaries: [],
  });

  useEffect(() => {
    if (mode === "edit" && initial) {
      const { id: _id, ...rest } = initial;
      setForm({
        nom_projet: rest.nom_projet || "",
        client: rest.client || "",
        ville: rest.ville || "",
        annee: rest.annee || new Date().getFullYear(),
        type_mission: rest.type_mission || "",
        // Montant normalisé (support des unités comme KEUR/MEUR)
        montant: parseCurrencyToNumber(rest.montant),
        description_projet: rest.description_projet || "",
        duree_mois: rest.duree_mois || 0,
        surface: rest.surface || 0,
        salaries: Array.isArray(rest.salaries) ? rest.salaries : [],
      });
    } else if (mode === "create") {
      setForm({
        nom_projet: "",
        client: "",
        ville: "",
        annee: new Date().getFullYear(),
        type_mission: "",
        montant: null,
        description_projet: "",
        duree_mois: 0,
        surface: 0,
        salaries: [],
      });
    }
  }, [mode, initial, open]);

  const handleSubmit = () => {
    if (!form.nom_projet.trim() || !form.client.trim()) return;
    onSubmit(mode === "edit" && initial ? { ...form, id: initial.id } : form);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined} className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{mode === "create" ? "Ajouter une référence" : "Modifier la référence"}</DialogTitle>
          <DialogDescription>
            {mode === "create"
              ? "Remplissez les informations de la nouvelle référence projet"
              : "Modifiez les informations de la référence projet"}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="nom_projet">Nom du projet *</Label>
              <Input
                id="nom_projet"
                value={form.nom_projet}
                onChange={(e) => setForm((f) => ({ ...f, nom_projet: e.target.value }))}
                placeholder="Nom du projet"
              />
            </div>
            <div>
              <Label htmlFor="client">Client *</Label>
              <Input
                id="client"
                value={form.client}
                onChange={(e) => setForm((f) => ({ ...f, client: e.target.value }))}
                placeholder="Nom du client"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="ville">Ville</Label>
              <Input
                id="ville"
                value={form.ville}
                onChange={(e) => setForm((f) => ({ ...f, ville: e.target.value }))}
                placeholder="Ville du projet"
              />
            </div>
            <div>
              <Label htmlFor="annee">Année</Label>
              <Input
                id="annee"
                type="number"
                value={form.annee}
                onChange={(e) =>
                  setForm((f) => ({ ...f, annee: parseInt(e.target.value) || new Date().getFullYear() }))
                }
                placeholder="Année"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="montant">Montant (€)</Label>
              <Input
                id="montant"
                type="number"
                // s'assurer que l'Input reçoit toujours un nombre ou chaîne vide
                value={form.montant ?? ""}
                onChange={(e) => {
                  const v = e.target.value;
                  // accepter vide => null, sinon convertir en nombre
                  setForm((f) => ({
                    ...f,
                    montant: v === "" ? null : parseCurrencyToNumber(v) ?? f.montant ?? null,
                  }));
                }}
                placeholder="Montant du projet"
              />
            </div>
            <div>
              <Label htmlFor="duree_mois">Durée (mois)</Label>
              <Input
                id="duree_mois"
                type="number"
                value={form.duree_mois || 0}
                onChange={(e) => setForm((f) => ({ ...f, duree_mois: parseInt(e.target.value) || 0 }))}
                placeholder="Durée en mois"
              />
            </div>
            <div>
              <Label htmlFor="surface">Surface (m²)</Label>
              <Input
                id="surface"
                type="number"
                value={form.surface || 0}
                onChange={(e) => setForm((f) => ({ ...f, surface: parseFloat(e.target.value) || 0 }))}
                placeholder="Surface en m²"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="type_mission">Type de mission</Label>
            <textarea
              id="type_mission"
              value={form.type_mission}
              onChange={(e) => setForm((f) => ({ ...f, type_mission: e.target.value }))}
              placeholder="Type de mission"
              className="w-full p-2 border border-gray-300 rounded-md h-24 resize-none"
            />
          </div>

          <div>
            <Label htmlFor="description_projet">Description</Label>
            <textarea
              id="description_projet"
              value={form.description_projet}
              onChange={(e) => setForm((f) => ({ ...f, description_projet: e.target.value }))}
              placeholder="Description du projet"
              className="w-full p-2 border border-gray-300 rounded-md h-24 resize-none"
            />
          </div>

          <div>
            <Label>Salariés associés</Label>
            <div className="max-h-32 overflow-y-auto border border-gray-300 rounded-md p-2">
              {salaries.map((s) => {
                const checked = form.salaries.includes(s.id);
                return (
                  <div key={s.id} className="flex items-center space-x-2 py-1">
                    <input
                      type="checkbox"
                      id={`salarie-${s.id}`}
                      checked={checked}
                      onChange={(e) => {
                        setForm((f) => {
                          const set = new Set(f.salaries);
                          if (e.target.checked) set.add(s.id);
                          else set.delete(s.id);
                          return { ...f, salaries: Array.from(set) };
                        });
                      }}
                      className="rounded border-gray-300"
                    />
                    <Label htmlFor={`salarie-${s.id}`} className="text-sm">
                      {s.prenom} {s.nom} ({s.fonction || "Sans fonction"})
                    </Label>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Annuler
          </Button>
          <Button onClick={handleSubmit} disabled={!form.nom_projet.trim() || !form.client.trim()}>
            {mode === "create" ? "Ajouter" : "Modifier"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}