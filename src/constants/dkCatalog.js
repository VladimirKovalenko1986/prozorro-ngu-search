import { normalizeText } from "../utils/text.js";

let catalogPromise;

export function loadDkCatalog() {
  if (!catalogPromise) {
    catalogPromise = import("../data/dk021_uk.json").then(({ default: labels }) => {
      const options = Object.entries(labels).map(([code, label]) => ({
        code,
        label,
        searchLabel: normalizeText(label),
      }));

      return {
        getSuggestions(query, limit = 50) {
          const trimmedQuery = query.trim();
          const digitQuery = trimmedQuery.replace(/\D/g, "");
          const textQuery = normalizeText(trimmedQuery);

          if (digitQuery.length >= 3) {
            return options.filter((option) =>
              option.code.startsWith(digitQuery),
            ).slice(0, limit);
          }

          if (textQuery.length >= 3) {
            return options.filter((option) =>
              option.searchLabel.includes(textQuery),
            ).slice(0, limit);
          }

          return [];
        },
      };
    });
  }

  return catalogPromise;
}
