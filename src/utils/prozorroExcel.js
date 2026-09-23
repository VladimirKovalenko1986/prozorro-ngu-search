import { formatDate } from "./formatDate.js";
import { createXlsxFile } from "./xlsx.js";

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

function buildExcelRows(results, showBuyerColumn) {
  return results.flatMap((procedure) =>
    procedure.rows.map((row) => [
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
  );
}

function buildFileName({ buyer, dateFrom, dateTo }) {
  return `prozorro-${buyer}-${dateFrom}-${dateTo}.xlsx`
    .replaceAll(" ", "-")
    .toLowerCase();
}

export async function downloadProzorroExcel({
  buyer,
  dateFrom,
  dateTo,
  results,
  showBuyerColumn,
}) {
  const file = await createXlsxFile({
    columns: getColumns(showBuyerColumn),
    rows: buildExcelRows(results, showBuyerColumn),
  });
  const blob = new Blob([file], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");

  link.href = url;
  link.download = buildFileName({ buyer, dateFrom, dateTo });
  document.body.append(link);
  link.click();
  link.remove();

  // Safari can produce an empty download if this temporary URL is revoked
  // immediately after the click.
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
