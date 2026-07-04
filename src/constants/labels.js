export const STATUS_LABELS = {
  active: "Активний",
  complete: "Завершений",
  unsuccessful: "Не відбувся",
  cancelled: "Скасований",
  pending: "В процесі",
  pending_payment: "Очікує оплату",
};

export const PROCEDURE_TYPE_LABELS = {
  belowThreshold: "Спрощена закупівля",
  closeFrameworkAgreementUA: "Укладання рамкової угоди",
  closeFrameworkAgreementSelectionUA: "Відбір для закупівлі за рамковою угодою",
  competitiveDialogueEU: "Конкурентний діалог з публікацією англійською мовою",
  competitiveDialogueUA: "Конкурентний діалог",
  esco: "Закупівля енергосервісу",
  negotiation: "Переговорна процедура",
  "negotiation.quick": "Переговорна процедура скорочена",
  priceQuotation: "Запит (ціни) пропозицій",
  reporting: "Звіт про договір про закупівлю",
  simple: "Спрощена закупівля",
  "simple.defense": "Спрощена закупівля для потреб оборони",
  aboveThresholdEU: "Відкриті торги з публікацією англійською мовою",
  aboveThresholdUA: "Відкриті торги",
  "aboveThresholdUA.defense": "Відкриті торги для потреб оборони",
};

export function statusLabel(status) {
  return STATUS_LABELS[status] || status || "Немає статусу";
}

export function procedureTypeLabel(type) {
  return PROCEDURE_TYPE_LABELS[type] || type || "Немає виду";
}

export function getStatusTone(status) {
  if (status === "complete") return "success";
  if (status === "cancelled" || status === "unsuccessful") return "negative";
  if (status) return "progress";

  return "neutral";
}
