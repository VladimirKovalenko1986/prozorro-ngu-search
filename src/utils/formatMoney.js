export function formatMoney(amount, currency = "UAH") {
  if (!amount) return "Немає ціни";

  return new Intl.NumberFormat("uk-UA", {
    style: "currency",
    currency,
  }).format(amount);
}
