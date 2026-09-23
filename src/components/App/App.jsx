import { useState } from "react";
import { BUYERS } from "../../constants/buyers.js";
import { STORAGE_KEYS } from "../../constants/storage.js";
import FilterSummary from "../FilterSummary/FilterSummary.jsx";
import PriceAnalysisResults from "../PriceAnalysisResults/PriceAnalysisResults.jsx";
import ResultsTable from "../ResultsTable/ResultsTable.jsx";
import ScrollToSearchButton from "../ScrollToSearchButton/ScrollToSearchButton.jsx";
import SearchPanel from "../SearchPanel/SearchPanel.jsx";
import ThemeToggle from "../ThemeToggle/ThemeToggle.jsx";
import { useProzorroSearch } from "../../hooks/useProzorroSearch.js";
import { usePriceAnalysisSearch } from "../../hooks/usePriceAnalysisSearch.js";
import { useTheme } from "../../hooks/useTheme.js";
import css from "./App.module.css";

const EDRPOU_SEARCH_OPTION = "edrpou-search";

function App() {
  const search = useProzorroSearch();
  const { theme, toggleTheme } = useTheme();
  const [activePage, setActivePage] = useState("search");
  const [analysisBuyer, setAnalysisBuyer] = useState(BUYERS[0].label);
  const [analysisEdrpou, setAnalysisEdrpou] = useState("");

  return (
    <main className={css.page}>
      <header className={css.appHeader}>
        <div className={css.brand}>
          <span className={css.brandMark} aria-hidden="true">P</span>
          <div>
            <span className={css.eyebrow}>Prozorro · договори</span>
            <h1 className={css.title}>Робочий простір</h1>
          </div>
        </div>

        <nav aria-label="Розділи застосунку" className={css.navigation}>
          <button
            aria-current={activePage === "search" ? "page" : undefined}
            className={`${css.navigationButton} ${activePage === "search" ? css.navigationButtonActive : ""}`}
            onClick={() => setActivePage("search")}
            type="button"
          >
            Пошук закупівель
          </button>
          <button
            aria-current={activePage === "prices" ? "page" : undefined}
            className={`${css.navigationButton} ${activePage === "prices" ? css.navigationButtonActive : ""}`}
            onClick={() => setActivePage("prices")}
            type="button"
          >
            Аналіз цін
          </button>
        </nav>

        <ThemeToggle onToggle={toggleTheme} theme={theme} />
      </header>

      {activePage === "search" ? (
        <SearchPage search={search} />
      ) : (
        <PriceAnalysisPage
          buyer={analysisBuyer}
          edrpou={analysisEdrpou}
          onBuyerChange={setAnalysisBuyer}
          onEdrpouChange={setAnalysisEdrpou}
        />
      )}
    </main>
  );
}

function SearchPage({ search }) {
  return (
    <>
      <SearchPanel
        addingProcedureTitle={search.addingProcedureTitle}
        buyer={search.selectedBuyer}
        contractSearch={search.contractSearch}
        selectedContractNumbers={search.selectedContractNumbers}
        dateFrom={search.dateFrom}
        dateTo={search.dateTo}
        disabled={search.loading}
        dkCode={search.dkCode}
        selectedDkCodes={search.selectedDkCodes}
        onBuyerChange={search.handleBuyerChange}
        onContractNumberAdd={search.addContractNumber}
        onContractNumbersClear={search.clearContractNumbers}
        onContractNumberRemove={search.removeContractNumber}
        onContractSearch={search.handleContractRemoteSearch}
        onContractSearchChange={search.setContractSearch}
        onDateFromChange={search.setDateFrom}
        onDateToChange={search.setDateTo}
        onDkCodeAdd={search.addDkCode}
        onDkCodeChange={search.setDkCode}
        onDkCodeClear={search.clearDkCodes}
        onDkCodeRemove={search.removeDkCode}
        onSearch={search.handleSearch}
        onStopSearch={search.handleStopSearch}
        onStorageImport={search.handleStorageImport}
        searchFinishedMessage={search.searchFinishedMessage}
        searchProgress={search.searchProgress}
        showBuyerColumn={search.showBuyerColumn}
        status={search.status}
        storageKeys={STORAGE_KEYS}
        tableResults={search.filteredResults}
      />

      <FilterSummary
        disabled={search.loading}
        filteredCount={search.filteredResults.length}
        hasActiveFilters={search.hasActiveFilters}
        onClear={search.clearFilters}
        totalCount={search.results.length}
      />

      {search.results.length === 0 ? (
        <ResultsTable
          checkedLots={search.checkedLots}
          checkedProcedures={search.checkedProcedures}
          filterOptions={search.filterOptions}
          filters={search.filters}
          loading={search.loading}
          onFilterToggle={search.toggleFilterValue}
          onLotChecked={search.toggleLotChecked}
          onProcedureChecked={search.toggleProcedureChecked}
          recentlyAddedProcedureId={search.recentlyAddedProcedureId}
          results={[]}
          showBuyerColumn={search.showBuyerColumn}
          tableColumns={search.tableColumns}
        />
      ) : search.filteredResults.length === 0 ? (
        <section className={css.emptyPanel}>
          За цими фільтрами немає результатів.
        </section>
      ) : (
        <ResultsTable
          checkedLots={search.checkedLots}
          checkedProcedures={search.checkedProcedures}
          filterOptions={search.filterOptions}
          filters={search.filters}
          loading={search.loading}
          onFilterToggle={search.toggleFilterValue}
          onLotChecked={search.toggleLotChecked}
          onProcedureChecked={search.toggleProcedureChecked}
          recentlyAddedProcedureId={search.recentlyAddedProcedureId}
          results={search.filteredResults}
          showBuyerColumn={search.showBuyerColumn}
          tableColumns={search.tableColumns}
        />
      )}

      <ScrollToSearchButton />
    </>
  );
}

function PriceAnalysisPage({ buyer, edrpou, onBuyerChange, onEdrpouChange }) {
  const isEdrpouSearch = buyer === EDRPOU_SEARCH_OPTION;
  const hasCompleteEdrpou = edrpou.length === 8;
  const analysisSearch = usePriceAnalysisSearch({ buyer, edrpou });

  return (
    <section className={css.priceAnalysis} id="price-analysis">
      <div className={css.priceAnalysisHeader}>
        <div>
          <span className={css.priceAnalysisBadge}>Аналіз цін</span>
          <h2>Пошук закупівель</h2>
          <p>Оберіть замовника для майбутнього порівняння цін.</p>
        </div>

        <form className={css.priceSearchForm} onSubmit={(event) => event.preventDefault()}>
          <label className={css.priceControl}>
            Замовник
            <select value={buyer} onChange={(event) => onBuyerChange(event.target.value)}>
              {BUYERS.map((item) => (
                <option key={item.label} value={item.label}>
                  {item.label}
                </option>
              ))}
              <option value={EDRPOU_SEARCH_OPTION}>Пошук по ЄДРПОУ</option>
            </select>
          </label>

          {isEdrpouSearch ? (
            <div className={css.priceEdrpouForm}>
              <label className={css.priceControl}>
                Код ЄДРПОУ
                <input
                  inputMode="numeric"
                  maxLength="8"
                  onChange={(event) =>
                    onEdrpouChange(event.target.value.replace(/\D/g, "").slice(0, 8))
                  }
                  placeholder="Наприклад: 08803498"
                  type="text"
                  value={edrpou}
                />
              </label>
              <p className={css.priceSearchHint}>
                {hasCompleteEdrpou
                  ? `Буде використано ЄДРПОУ: ${edrpou}.`
                  : "Введіть восьмизначний код ЄДРПОУ."}
              </p>
            </div>
          ) : null}
        </form>
      </div>

      {(!isEdrpouSearch || hasCompleteEdrpou) ? (
        <PriceAnalysisResults
          error={analysisSearch.error}
          hasMore={analysisSearch.hasMore}
          loading={analysisSearch.loading}
          loadingMore={analysisSearch.loadingMore}
          onLoadMore={analysisSearch.loadMore}
          procedures={analysisSearch.procedures}
          progress={analysisSearch.progress}
          showBuyerColumn={buyer === "НГУ"}
        />
      ) : null}

      <ScrollToSearchButton
        ariaLabel="Повернутись на початок аналізу цін"
        targetId="price-analysis"
      />
    </section>
  );
}

export default App;
