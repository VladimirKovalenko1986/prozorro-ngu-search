import { useState } from "react";
import { STORAGE_KEYS } from "../../constants/storage.js";
import FilterSummary from "../FilterSummary/FilterSummary.jsx";
import ResultsTable from "../ResultsTable/ResultsTable.jsx";
import ScrollToSearchButton from "../ScrollToSearchButton/ScrollToSearchButton.jsx";
import SearchPanel from "../SearchPanel/SearchPanel.jsx";
import ThemeToggle from "../ThemeToggle/ThemeToggle.jsx";
import { useProzorroSearch } from "../../hooks/useProzorroSearch.js";
import { useTheme } from "../../hooks/useTheme.js";
import css from "./App.module.css";

function App() {
  const search = useProzorroSearch();
  const { theme, toggleTheme } = useTheme();
  const [activePage, setActivePage] = useState("search");

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

      {activePage === "search" ? <SearchPage search={search} /> : <PriceAnalysisPage />}
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

function PriceAnalysisPage() {
  return (
    <section className={css.priceAnalysis}>
      <span className={css.priceAnalysisBadge}>Нова сторінка</span>
      <h2>Аналіз цін</h2>
      <p>
        Тут з’явиться порівняння цін за договорами, кодами ДК і періодами.
      </p>
    </section>
  );
}

export default App;
