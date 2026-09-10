import dk021Uk from "../data/dk021_uk.json";
import { normalizeText } from "../utils/text.js";

export const DK_LABELS = dk021Uk;

export const DK_OPTIONS = Object.entries(DK_LABELS).map(([code, label]) => ({
  code,
  label,
  searchLabel: normalizeText(label),
}));

export function getDkSuggestions(query, limit = 50) {
  const trimmedQuery = query.trim();
  const digitQuery = trimmedQuery.replace(/\D/g, "");
  const textQuery = normalizeText(trimmedQuery);

  if (digitQuery.length >= 3) {
    return DK_OPTIONS.filter((option) =>
      option.code.startsWith(digitQuery),
    ).slice(0, limit);
  }

  if (textQuery.length >= 3) {
    return DK_OPTIONS.filter((option) =>
      option.searchLabel.includes(textQuery),
    ).slice(0, limit);
  }

  return [];
}

export function normalizeDkCode(value = "") {
  const match = value.trim().match(/^(\d{8}-\d)/);

  return match?.[1] || "";
}

export function getDkCodePrefix(code) {
  const digits = code.slice(0, 8);

  return digits.replace(/0+$/, "");
}
