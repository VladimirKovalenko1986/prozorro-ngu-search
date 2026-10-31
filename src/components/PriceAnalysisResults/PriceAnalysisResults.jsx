import { Fragment, useEffect, useRef } from "react";
import { PRICE_ANALYSIS_PROCEDURES_PER_BATCH } from "../../constants/search.js";
import { getPriceBenchmarkTarget } from "../../domain/priceBenchmark.js";
import { usePriceBenchmarks } from "../../hooks/usePriceBenchmarks.js";
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
  const { benchmarks, progress: benchmarkProgress } = usePriceBenchmarks(
    procedures,
    !loading && procedures.length > 0,
  );
  const hasBenchmarkProgress = benchmarkProgress.total > 0;
  const benchmarkPercent = hasBenchmarkProgress
    ? Math.round((benchmarkProgress.completed / benchmarkProgress.total) * 100)
    : 0;

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

      {hasBenchmarkProgress ? (
        <div className={css.benchmarkProgress}>
          {benchmarkProgress.completed < benchmarkProgress.total ? (
            <span className={css.benchmarkProgressSpinner} aria-hidden="true" />
          ) : null}
          <span>
            Аналіз цін: {benchmarkProgress.completed} з {benchmarkProgress.total} позицій ДК
          </span>
          <div className={css.benchmarkProgressTrack}>
            <span style={{ width: `${benchmarkPercent}%` }} />
          </div>
        </div>
      ) : null}

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
                <th>Порівняння з договорами НГУ</th>
              </tr>
            </thead>
            <tbody>
              {procedures.map((procedure, procedureIndex) => (
                <ProcedureRows
                  key={procedure.id}
                  procedure={procedure}
                  procedureIndex={procedureIndex}
                  benchmarks={benchmarks}
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
            {loadingMore
              ? `Завантажую ще ${PRICE_ANALYSIS_PROCEDURES_PER_BATCH}…`
              : `Завантажити ще ${PRICE_ANALYSIS_PROCEDURES_PER_BATCH}`}
          </button>
        </div>
      ) : null}
    </section>
  );
}

function ProcedureRows({ benchmarks, procedure, procedureIndex, showBuyerColumn }) {
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
          <td className={css.benchmarkCell}>
            <PriceBenchmark
              benchmark={benchmarks[getPriceBenchmarkTarget(procedure, row)?.key]}
              procedure={procedure}
              row={row}
            />
          </td>
        </tr>
      ))}
    </Fragment>
  );
}

function PriceBenchmark({ benchmark, procedure, row }) {
  const target = getPriceBenchmarkTarget(procedure, row);

  if (!target) {
    return <span className={css.benchmarkMuted}>Немає точного ДК або одиниці</span>;
  }

  if (!benchmark || benchmark.status === "loading") {
    const checked = benchmark?.checked || 0;
    const total = benchmark?.total || 0;
    const percent = total ? Math.min(100, Math.round((checked / total) * 100)) : 0;

    return (
      <div className={css.benchmarkLoading}>
        <span className={css.benchmarkLoadingTitle}>
          <span className={css.benchmarkCellSpinner} aria-hidden="true" />
          Шукаю аналоги{total ? ` · ${percent}%` : "…"}
        </span>
        {total ? (
          <>
            <span className={css.benchmarkLoadingDetails}>
              Перевірено {checked} з {total} закупівель
            </span>
            <span className={css.benchmarkCellTrack} aria-label={`Перевірено ${percent}%`}>
              <span style={{ width: `${percent}%` }} />
            </span>
          </>
        ) : null}
      </div>
    );
  }

  if (benchmark.status === "error") {
    return <span className={css.benchmarkMuted}>Не вдалося отримати аналоги</span>;
  }

  if (benchmark.status === "insufficient") {
    return (
      <span className={css.benchmarkMuted}>
        Немає аналогів за {benchmark.months} міс.
      </span>
    );
  }

  const difference = row.expectedUnitPrice && benchmark.averageUnitPrice
    ? ((row.expectedUnitPrice - benchmark.averageUnitPrice) / benchmark.averageUnitPrice) * 100
    : null;
  const differenceClass = difference > 0
    ? css.benchmarkHigher
    : difference < 0
      ? css.benchmarkLower
      : css.benchmarkNeutral;
  const differenceLabel = difference > 0
    ? "Вище"
    : difference < 0
      ? "Нижче"
      : "Без різниці";

  return (
    <div className={css.benchmarkResult}>
      <strong>
        Середня: {formatMoney(benchmark.averageUnitPrice, target.currency)} {getCurrencyLabel(target.currency)}/{row.unitName}
      </strong>
      {difference !== null ? (
        <span className={differenceClass}>
          {differenceLabel} на {formatPercentage(Math.abs(difference))}
        </span>
      ) : null}
      <small>{benchmark.contractCount} договорів · {benchmark.months} міс. · ДК + назва</small>
    </div>
  );
}

function getCurrencyLabel(currency) {
  return currency === "UAH" ? "грн" : currency;
}

function formatPercentage(value) {
  return new Intl.NumberFormat("uk-UA", {
    maximumFractionDigits: 1,
    minimumFractionDigits: 1,
  }).format(value) + "%";
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
