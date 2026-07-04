import { BUYERS } from "../../constants/buyers.js";
import ExportExcelButton from "../ExportExcelButton/ExportExcelButton.jsx";
import StorageTransferButtons from "../StorageTransferButtons/StorageTransferButtons.jsx";
import css from "./SearchPanel.module.css";

export default function SearchPanel({
  addingProcedureTitle,
  buyer,
  contractSearch,
  dateFrom,
  dateTo,
  disabled,
  onBuyerChange,
  onContractSearch,
  onContractSearchChange,
  onDateFromChange,
  onDateToChange,
  onSearch,
  onStorageImport,
  onSubjectSearch,
  onSubjectSearchChange,
  searchFinishedMessage,
  showBuyerColumn,
  status,
  storageKeys,
  subjectSearch,
  tableResults,
}) {
  return (
    <section className={css.panel} id="search-panel">
      <h1 className={css.title}>Пошук договорів Prozorro</h1>

      <form className={css.controls} onSubmit={onSearch}>
        <label className={css.controlLabel}>
          Замовник
          <select
            className={css.control}
            value={buyer}
            onChange={(event) => onBuyerChange(event.target.value)}
          >
            {BUYERS.map((item) => (
              <option key={item.label} value={item.label}>
                {item.label}
              </option>
            ))}
          </select>
        </label>

        <label className={css.controlLabel}>
          З дати
          <input
            className={css.control}
            type="date"
            value={dateFrom}
            onChange={(event) => onDateFromChange(event.target.value)}
          />
        </label>

        <label className={css.controlLabel}>
          По дату
          <input
            className={css.control}
            type="date"
            value={dateTo}
            onChange={(event) => onDateToChange(event.target.value)}
          />
        </label>

        <button className={css.primaryButton} type="submit" disabled={disabled}>
          {disabled ? "Шукаю..." : "Шукати"}
        </button>

        <ExportExcelButton
          buyer={buyer}
          dateFrom={dateFrom}
          dateTo={dateTo}
          disabled={disabled}
          results={tableResults}
          showBuyerColumn={showBuyerColumn}
        />

        <StorageTransferButtons
          disabled={disabled}
          onImport={onStorageImport}
          storageKeys={storageKeys}
        />

        <SearchBox
          disabled={disabled}
          label="Пошук по номеру договору"
          onClear={() => onContractSearchChange("")}
          onSearch={onContractSearch}
          onValueChange={onContractSearchChange}
          placeholder="Наприклад: 529 або ПС/УТЗ"
          searchButtonLabel="Знайти договір"
          value={contractSearch}
        />

        <SearchBox
          disabled={disabled}
          label="Пошук по предмету закупівлі"
          onClear={() => onSubjectSearchChange("")}
          onSearch={onSubjectSearch}
          onValueChange={onSubjectSearchChange}
          placeholder="Наприклад: картопля або телефон"
          searchButtonLabel="Знайти предмет"
          value={subjectSearch}
        />
      </form>

      <p className={css.status}>{status}</p>

      {disabled ? (
        <div className={css.searchActivity} aria-live="polite">
          <span className={css.searchSpinner} aria-hidden="true" />
          <span>
            {addingProcedureTitle
              ? `Додаю рядок: ${addingProcedureTitle}`
              : "Шукаю процедури..."}
          </span>
        </div>
      ) : null}

      {searchFinishedMessage ? (
        <div className={css.searchFinished} aria-live="polite">
          {searchFinishedMessage}
        </div>
      ) : null}
    </section>
  );
}

function SearchBox({
  disabled,
  label,
  onClear,
  onSearch,
  onValueChange,
  placeholder,
  searchButtonLabel,
  value,
}) {
  return (
    <label className={`${css.controlLabel} ${css.remoteSearch}`}>
      {label}
      <span className={css.remoteSearchControl}>
        <input
          className={css.remoteSearchInput}
          disabled={disabled}
          onChange={(event) => onValueChange(event.target.value)}
          placeholder={placeholder}
          type="search"
          value={value}
        />
        <button
          className={css.secondaryButton}
          disabled={disabled || !value.trim()}
          onClick={onSearch}
          type="button"
        >
          {searchButtonLabel}
        </button>
        <button
          className={css.secondaryButton}
          disabled={disabled || !value}
          onClick={onClear}
          type="button"
        >
          Очистити
        </button>
      </span>
    </label>
  );
}
