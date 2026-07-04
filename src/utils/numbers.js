export function toNumber(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (value === null || value === undefined || value === "") return null;

  const normalized = String(value)
    .replace(/\s/g, "")
    .replace(",", ".");
  const number = Number(normalized);

  return Number.isFinite(number) ? number : null;
}

export function addVat(amount) {
  const number = toNumber(amount);

  return number ? number * 1.2 : null;
}
