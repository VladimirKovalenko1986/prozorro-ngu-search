export function formatMoney(amount) {
  if (!amount) return "Немає ціни";

  return new Intl.NumberFormat("uk-UA", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
}
