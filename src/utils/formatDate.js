export function formatDate(value) {
  if (!value || value === "Немає дати") return "Немає дати";

  return new Intl.DateTimeFormat("uk-UA", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  }).format(new Date(value));
}
