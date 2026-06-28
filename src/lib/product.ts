/** Gabungkan brand + nama + berat jadi satu nama tampilan, mis. "Royal Canin Adult 1kg". */
export function productDisplayName(p: { brand?: string | null; name: string; weight?: string | null }) {
  return [p.brand, p.name, p.weight].filter(Boolean).join(" ");
}
