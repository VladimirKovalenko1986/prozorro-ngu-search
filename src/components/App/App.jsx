import { STORAGE_KEYS } from "../../constants/storage.js";
import FilterSummary from "../FilterSummary/FilterSummary.jsx";
import ResultsTable from "../ResultsTable/ResultsTable.jsx";
import ScrollToSearchButton from "../ScrollToSearchButton/ScrollToSearchButton.jsx";
import SearchPanel from "../SearchPanel/SearchPanel.jsx";
import { useProzorroSearch } from "../../hooks/useProzorroSearch.js";
import { useTheme } from "../../hooks/useTheme.js";
import css from "./App.module.css";

function App() {
  const search = useProzorroSearch();
  const { theme, toggleTheme } = useTheme();

  return (
    <main className={css.page}>
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
        onDkCodeAdd={search.addDkCode}
        onDkCodeClear={search.clearDkCodes}
        onBuyerChange={search.handleBuyerChange}
        onContractNumberAdd={search.addContractNumber}
        onContractNumbersClear={search.clearContractNumbers}
        onContractNumberRemove={search.removeContractNumber}
        onContractSearch={search.handleContractRemoteSearch}
        onContractSearchChange={search.setContractSearch}
        onDateFromChange={search.setDateFrom}
        onDateToChange={search.setDateTo}
        onDkCodeChange={search.setDkCode}
        onDkCodeRemove={search.removeDkCode}
        onSearch={search.handleSearch}
        onStopSearch={search.handleStopSearch}
        onStorageImport={search.handleStorageImport}
        onThemeToggle={toggleTheme}
        searchFinishedMessage={search.searchFinishedMessage}
        searchProgress={search.searchProgress}
        showBuyerColumn={search.showBuyerColumn}
        status={search.status}
        storageKeys={STORAGE_KEYS}
        tableResults={search.filteredResults}
        theme={theme}
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
    </main>
  );
}

export default App;
