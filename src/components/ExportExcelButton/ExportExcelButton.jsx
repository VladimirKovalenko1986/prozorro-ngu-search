import { useState } from "react";
import { flattenCaseResults } from "../../domain/caseRows.js";
import { formatDate } from "../../utils/formatDate.js";
import { createXlsxFile } from "../../utils/xlsx.js";
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

function getCaseColumns(showBuyerColumn) {
  return [
    "Дата",
    ...(showBuyerColumn ? ["Військова частина"] : []),
    "Найменування",
    "Очікувана вартість",
    "Кількість",
    "Одиниця виміру",
  ];
}

function textCell(value) {
  return {
    type: "text",
    value: value ?? "",
  };
}

function procedureLinkCell(tenderID) {
  return {
    type: "link",
    url: `https://prozorro.gov.ua/tender/${tenderID}`,
    value: tenderID ?? "",
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
      procedureLinkCell(procedure.tenderID),
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

function buildCaseExcelRows(results, showBuyerColumn) {
  return flattenCaseResults(results).map((row) => [
    textCell(formatDate(row.procedureDate)),
    ...(showBuyerColumn ? [textCell(row.buyerUnit)] : []),
    {
      type: "link",
      url: `https://prozorro.gov.ua/tender/${row.tenderID}`,
      value: row.name ?? "",
    },
    numberCell(row.expectedAmount),
    numberCell(row.quantity, "#,##0"),
    textCell(row.unitName),
  ]);
}

function buildFileName({ buyer, caseMode, dateFrom, dateTo }) {
  if (caseMode) {
    return `prozorro-case-${buyer}-${new Date().getFullYear()}.xlsx`
      .replaceAll(" ", "-")
      .toLowerCase();
  }

  return `prozorro-${buyer}-${dateFrom}-${dateTo}.xlsx`
    .replaceAll(" ", "-")
    .toLowerCase();
}

export default function ExportExcelButton({
  buyer,
  caseMode,
  dateFrom,
  dateTo,
  disabled,
  results,
  showBuyerColumn,
}) {
  const [isExporting, setIsExporting] = useState(false);

  async function handleExport() {
    setIsExporting(true);

    try {
      const file = await createXlsxFile({
        columns: caseMode ? getCaseColumns(showBuyerColumn) : getColumns(showBuyerColumn),
        rows: caseMode
          ? buildCaseExcelRows(results, showBuyerColumn)
          : buildExcelRows(results, showBuyerColumn),
      });
      const blob = new Blob([file], {
        type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");

      link.href = url;
      link.download = buildFileName({ buyer, caseMode, dateFrom, dateTo });
      document.body.append(link);
      link.click();
      link.remove();

      // Safari can produce an empty download if this temporary URL is revoked
      // immediately after the click.
      window.setTimeout(() => URL.revokeObjectURL(url), 1000);
    } finally {
      setIsExporting(false);
    }
  }

  return (
    <button
      className={css.button}
      disabled={disabled || isExporting || results.length === 0}
      onClick={handleExport}
      type="button"
    >
      <span className={css.icon} aria-hidden="true">
        X
      </span>
      {isExporting ? "Готую файл..." : "Export Excel"}
    </button>
  );
}
