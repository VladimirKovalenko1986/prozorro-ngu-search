import { useState } from "react";
import { downloadProzorroExcel } from "../../utils/prozorroExcel.js";
import css from "./ExportExcelButton.module.css";

export default function ExportExcelButton({
  buyer,
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
      await downloadProzorroExcel({
        buyer,
        dateFrom,
        dateTo,
        results,
        showBuyerColumn,
      });
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
