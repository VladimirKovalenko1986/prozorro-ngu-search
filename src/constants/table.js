export const TABLE_COLUMNS = [
  { key: "title", label: "Предмет закупівлі" },
  { key: "procedureType", label: "Вид процедури", className: "procedure-type-column" },
  { key: "buyerUnit", label: "Замовник", className: "buyer-column" },
  { key: "lot", label: "Лоти / специфікація" },
  { key: "expectedAmount", label: "Очікувана / початкова вартість" },
  { key: "supplier", label: "Контрагент", className: "supplier-column" },
  { key: "quantity", label: "Кількість / одиниця" },
  { key: "unitPrice", label: "Ціна за одиницю" },
  { key: "contractAmount", label: "Сума договору" },
  { key: "dateSigned", label: "Дата підписання" },
  { key: "contractNumber", label: "Номер договору" },
  { key: "status", label: "Статус", className: "status-column" },
];

export const FILTER_COLUMNS = [
  { key: "buyerUnit", label: "Замовник" },
  { key: "supplier", label: "Контрагент" },
  { key: "dateSigned", label: "Дата підписання" },
  { key: "contractNumber", label: "Номер договору" },
  { key: "status", label: "Статус" },
];
