export function formatQuantity(value) {
  if (!value) return "Немає кількості";

  return new Intl.NumberFormat("uk-UA", {
    maximumFractionDigits: 3,
  }).format(value);
}
