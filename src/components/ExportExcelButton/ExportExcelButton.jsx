import { formatDate } from "../../utils/formatDate.js";
import { formatMoney } from "../../utils/formatMoney.js";
import css from "./ExportExcelButton.module.css";

const COLUMNS = [
  "Предмет закупівлі",
  "Процедура",
  "Дата процедури",
  "Лот",
  "Очікувана / початкова вартість",
  "Дата договору",
  "Сума договору",
  "Ціна за одиницю",
  "Контрагент",
  "Кількість",
  "Одиниця",
  "Дата підписання",
  "Номер договору",
  "Статус процедури",
  "Статус договору",
  "Статус Award",
];

function escapeCell(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function buildExcelRows(results) {
  return results.flatMap((procedure) =>
    procedure.rows.map((row) => [
      procedure.title,
      procedure.tenderID,
      formatDate(procedure.procedureDate),
      row.lotNumber ? `Лот ${row.lotNumber}. ${row.lotTitle}` : "",
      formatMoney(row.expectedAmount, row.expectedCurrency),
      formatDate(row.contractDate),
      formatMoney(row.contractAmount, row.contractCurrency),
      formatMoney(row.unitPrice, row.contractCurrency),
      row.supplierName,
      row.quantity || "Немає кількості",
      row.unitName,
      formatDate(row.dateSigned),
      row.contractNumber,
      procedure.tenderStatus,
      row.contractStatus,
      row.awardStatus,
    ]),
  );
}

function buildExcelHtml(results) {
  const header = COLUMNS.map((column) => `<th>${escapeCell(column)}</th>`).join(
    "",
  );
  const rows = buildExcelRows(results)
    .map(
      (row) =>
        `<tr>${row
          .map((cell) => `<td>${escapeCell(cell)}</td>`)
          .join("")}</tr>`,
    )
    .join("");

  return `
    <!doctype html>
    <html>
      <head>
        <meta charset="utf-8" />
      </head>
      <body>
        <table border="1">
          <thead>
            <tr>${header}</tr>
          </thead>
          <tbody>${rows}</tbody>
        </table>
      </body>
    </html>
  `;
}

function buildFileName({ buyer, dateFrom, dateTo }) {
  return `prozorro-${buyer}-${dateFrom}-${dateTo}.xls`
    .replaceAll(" ", "-")
    .toLowerCase();
}

export default function ExportExcelButton({
  buyer,
  dateFrom,
  dateTo,
  disabled,
  results,
}) {
  function handleExport() {
    const excelHtml = buildExcelHtml(results);
    const blob = new Blob(["\ufeff", excelHtml], {
      type: "application/vnd.ms-excel;charset=utf-8",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = buildFileName({ buyer, dateFrom, dateTo });
    document.body.append(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <button
      className={css.button}
      disabled={disabled || results.length === 0}
      onClick={handleExport}
      type="button"
    >
      <span className={css.icon} aria-hidden="true">
        X
      </span>
      Export Excel
    </button>
  );
}
