"use client";

export function parseCurrencyToNumber(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  if (typeof value === "number" && Number.isFinite(value)) return value;

  const raw = String(value).trim().toLowerCase();
  if (raw.length === 0) return null;

  // Détecter multiplicateurs (k=milliers, m=millions)
  let multiplier = 1;
  if (/\bmeur\b|\bm€\b|\bmillions?\b/.test(raw)) multiplier = 1_000_000;
  else if (/\bkeur\b|\bk€\b|\bmilliers?\b|\bk\b/.test(raw)) multiplier = 1_000;

  // Nettoyer: garder chiffres, '.', ',', '-' ; enlever les lettres/symboles monétaires
  const cleaned = raw
    .replace(/€/g, "")
    .replace(/eur/g, "")
    .replace(/[a-z]/g, "")
    .replace(/\s+/g, "")
    .replace(/,/g, "."); // convertir virgules en points

  // Extraire le premier nombre valide dans la chaîne
  const match = cleaned.match(/-?\d+(\.\d+)?/);
  if (!match) return null;

  const num = Number(match[0]);
  if (!Number.isFinite(num)) return null;

  const result = num * multiplier;
  return Number.isFinite(result) ? result : null;
}