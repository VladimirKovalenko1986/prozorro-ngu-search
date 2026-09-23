import { Fragment, useEffect, useRef } from "react";
import { formatDate } from "../../utils/formatDate.js";
import { formatMoney } from "../../utils/formatMoney.js";
import { formatQuantity } from "../../utils/formatQuantity.js";
import css from "./PriceAnalysisResults.module.css";

export default function PriceAnalysisResults({
  error,
  hasMore,
  loading,
  loadingMore,
  onLoadMore,
  procedures,
  progress,
  showBuyerColumn,
}) {
  const isInitialLoading = loading && procedures.length === 0;
  const nextBatchIndexRef = useRef(null);

  useEffect(() => {
    const nextBatchIndex = nextBatchIndexRef.current;

    if (nextBatchIndex === null || loadingMore) {
      return;
    }

    nextBatchIndexRef.current = null;

    if (procedures.length <= nextBatchIndex) {
      return;
    }

    const firstNewProcedure = document.querySelector(
      `[data-analysis-procedure-index="${nextBatchIndex}"]`,
    );

    firstNewProcedure?.scrollIntoView({
      behavior: "smooth",
      block: "start",
    });
  }, [loadingMore, procedures.length]);

  function handleLoadMore() {
    nextBatchIndexRef.current = procedures.length;
    onLoadMore();
  }

  return (
    <section className={css.section} aria-live="polite">
      <header className={css.header}>
        <div>
          <h3>Закупівлі для аналізу</h3>
          <p>
            {loading
              ? `Опрацьовую процедури: ${progress.checked} з ${progress.total}`
              : `Показано процедур: ${procedures.length}`}
          </p>
        </div>
        {loading ? <span className={css.loadingBadge}>Оновлюю</span> : null}
      </header>

      {error ? <p className={css.error}>{error}</p> : null}

      {isInitialLoading ? <LoadingRows /> : null}

      {procedures.length > 0 ? (
        <div className={css.tableWrap}>
          <table className={css.table}>
            <thead>
              <tr>
                <th>Предмет закупівлі</th>
                <th>Вид процедури</th>
                {showBuyerColumn ? <th>Замовник</th> : null}
                <th>Лот</th>
                <th>Очікувана вартість</th>
                <th>Кількість</th>
                <th>Ціна за одиницю</th>
                <th>Номер договору</th>
              </tr>
            </thead>
            <tbody>
              {procedures.map((procedure, procedureIndex) => (
                <ProcedureRows
                  key={procedure.id}
                  procedure={procedure}
                  procedureIndex={procedureIndex}
                  showBuyerColumn={showBuyerColumn}
                />
              ))}
            </tbody>
          </table>
        </div>
      ) : null}

      {hasMore ? (
        <div className={css.loadMoreWrap}>
          <button
            className={css.loadMoreButton}
            disabled={loading}
            onClick={handleLoadMore}
            type="button"
          >
            {loadingMore ? <span className={css.buttonSpinner} aria-hidden="true" /> : null}
            {loadingMore ? "Завантажую ще 50…" : "Завантажити ще 50"}
          </button>
        </div>
      ) : null}
    </section>
  );
}

function ProcedureRows({ procedure, procedureIndex, showBuyerColumn }) {
  return (
    <Fragment>
      {procedure.rows.map((row, rowIndex) => (
        <tr
          data-analysis-procedure-index={rowIndex === 0 ? procedureIndex : undefined}
          key={row.id}
        >
          {rowIndex === 0 ? (
            <td className={css.subjectCell} rowSpan={procedure.rows.length}>
              <a
                href={`https://prozorro.gov.ua/tender/${procedure.tenderID}`}
                rel="noreferrer"
                target="_blank"
              >
                {procedure.tenderID}
              </a>
              <strong>{procedure.title}</strong>
              <span>Дата процедури: {formatDate(procedure.procedureDate)}</span>
            </td>
          ) : null}

          {rowIndex === 0 ? (
            <td rowSpan={procedure.rows.length}>{procedure.procedureType}</td>
          ) : null}

          {showBuyerColumn && rowIndex === 0 ? (
            <td rowSpan={procedure.rows.length}>{procedure.buyerUnit}</td>
          ) : null}

          <td>{getLotLabel(row)}</td>
          <td>{formatMoney(row.expectedAmount, row.expectedCurrency)}</td>
          <td>
            {row.quantity
              ? `${formatQuantity(row.quantity)}${row.unitName ? ` ${row.unitName}` : ""}`
              : "Немає кількості"}
          </td>
          <td>{formatMoney(row.expectedUnitPrice, row.expectedCurrency)}</td>
          <td>{row.contractNumber}</td>
        </tr>
      ))}
    </Fragment>
  );
}

function getLotLabel(row) {
  if (row.lotNumber) {
    return `Лот ${row.lotNumber}${row.lotTitle ? `. ${row.lotTitle}` : ""}`;
  }

  return row.specificationTitle || "Без лотів";
}

function LoadingRows() {
  return (
    <div className={css.loadingRows} aria-label="Завантажую закупівлі">
      <span />
      <span />
      <span />
    </div>
  );
}
