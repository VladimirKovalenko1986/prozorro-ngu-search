import { STORAGE_KEYS } from "../../constants/storage.js";
import FilterSummary from "../FilterSummary/FilterSummary.jsx";
import ResultsTable from "../ResultsTable/ResultsTable.jsx";
import ScrollToSearchButton from "../ScrollToSearchButton/ScrollToSearchButton.jsx";
import SearchPanel from "../SearchPanel/SearchPanel.jsx";
import { useProzorroSearch } from "../../hooks/useProzorroSearch.js";
import css from "./App.module.css";

function App() {
  const search = useProzorroSearch();

  return (
    <main className={css.page}>
      <SearchPanel
        addingProcedureTitle={search.addingProcedureTitle}
        buyer={search.selectedBuyer}
        contractSearch={search.contractSearch}
        dateFrom={search.dateFrom}
        dateTo={search.dateTo}
        disabled={search.loading}
        dkFilterEnabled={search.dkFilterEnabled}
        onBuyerChange={search.handleBuyerChange}
        onContractSearch={search.handleContractRemoteSearch}
        onContractSearchChange={search.setContractSearch}
        onDateFromChange={search.setDateFrom}
        onDateToChange={search.setDateTo}
        onDkFilterEnabledChange={search.setDkFilterEnabled}
        onDkFilterValueChange={search.setSelectedDkCode}
        onSearch={search.handleSearch}
        onStorageImport={search.handleStorageImport}
        searchFinishedMessage={search.searchFinishedMessage}
        showBuyerColumn={search.showBuyerColumn}
        status={search.status}
        storageKeys={STORAGE_KEYS}
        selectedDkCode={search.selectedDkCode}
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
    </main>
  );
}

export default App;
