import { formatDate } from "../../utils/formatDate.js";
import css from "./ExportExcelButton.module.css";

function getColumns(showBuyerColumn) {
  return [
    "Предмет закупівлі",
    "Вид процедури",
    ...(showBuyerColumn ? ["Замовник"] : []),
    "Процедура",
    "Дата процедури",
    "Лот / специфікація",
    "Очікувана / початкова вартість",
    "Контрагент",
    "Кількість",
    "Одиниця",
    "Ціна за одиницю",
    "Сума договору",
    "Дата підписання",
    "Номер договору",
    "Статус процедури",
    "Статус договору",
    "Статус Award",
  ];
}

function escapeCell(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

function textCell(value) {
  return {
    type: "text",
    value: value ?? "",
  };
}

function numberCell(value, format = "#,##0.00") {
  const number = Number(value);

  if (!Number.isFinite(number)) return textCell("");

  return {
    format,
    type: "number",
    value: number,
  };
}

function getLotAndSpecificationLabel(row) {
  const parts = [];

  if (row.lotNumber) {
    parts.push(`Лот ${row.lotNumber}. ${row.lotTitle}`);
  }

  if (row.specificationTitle) {
    parts.push(`Специфікація: ${row.specificationTitle}`);
  }

  return parts.join(" | ");
}

function getCalculatedContractTotal(rows) {
  const total = rows.reduce(
    (sum, row) => sum + (row.specificationTitle ? row.contractAmount || 0 : 0),
    0,
  );

  return total || null;
}

function buildExcelRows(results, showBuyerColumn) {
  return results.flatMap((procedure) =>
    [
      ...procedure.rows.map((row) => [
        textCell(procedure.title),
        textCell(procedure.procedureType),
        ...(showBuyerColumn ? [textCell(procedure.buyerUnit)] : []),
        textCell(procedure.tenderID),
        textCell(formatDate(procedure.procedureDate)),
        textCell(getLotAndSpecificationLabel(row)),
        numberCell(row.expectedAmount),
        textCell(row.supplierName),
        numberCell(row.quantity, "#,##0"),
        textCell(row.unitName),
        numberCell(row.unitPrice),
        numberCell(row.contractAmount),
        textCell(formatDate(row.dateSigned)),
        textCell(row.contractNumber),
        textCell(procedure.tenderStatus),
        textCell(row.contractStatus),
        textCell(row.awardStatus),
      ]),
      ...(procedure.rows.some((row) => row.specificationTitle)
        ? [
            [
              textCell("Сума договору за API"),
              textCell(""),
              ...(showBuyerColumn ? [textCell("")] : []),
              textCell(""),
              textCell(""),
              textCell(""),
              textCell(""),
              textCell(""),
              textCell(""),
              textCell(""),
              textCell(""),
              numberCell(procedure.rows[0]?.contractTotalAmount),
              textCell(""),
              textCell(""),
              textCell(""),
              textCell(""),
              textCell(""),
            ],
            [
              textCell("Сума по факту"),
              textCell(""),
              ...(showBuyerColumn ? [textCell("")] : []),
              textCell(""),
              textCell(""),
              textCell(""),
              textCell(""),
              textCell(""),
              textCell(""),
              textCell(""),
              textCell(""),
              numberCell(getCalculatedContractTotal(procedure.rows)),
              textCell(""),
              textCell(""),
              textCell(""),
              textCell(""),
              textCell(""),
            ],
          ]
        : []),
    ],
  );
}

function buildExcelHtml(results, showBuyerColumn) {
  const header = getColumns(showBuyerColumn)
    .map((column) => `<th>${escapeCell(column)}</th>`)
    .join("");
  const rows = buildExcelRows(results, showBuyerColumn)
    .map(
      (row) =>
        `<tr>${row
          .map((cell) => {
            if (cell.type === "number") {
              return `<td style="mso-number-format:'${cell.format}';">${cell.value}</td>`;
            }

            return `<td>${escapeCell(cell.value)}</td>`;
          })
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
  showBuyerColumn,
}) {
  function handleExport() {
    const excelHtml = buildExcelHtml(results, showBuyerColumn);
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
