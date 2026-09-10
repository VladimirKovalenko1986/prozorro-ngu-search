import { BUYERS } from "../../constants/buyers.js";
import { DK_OPTIONS } from "../../constants/dk.js";
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
  dkFilterEnabled,
  onBuyerChange,
  onContractSearch,
  onContractSearchChange,
  onDateFromChange,
  onDateToChange,
  onDkFilterEnabledChange,
  onDkFilterValueChange,
  onSearch,
  onStorageImport,
  searchFinishedMessage,
  showBuyerColumn,
  status,
  storageKeys,
  selectedDkCode,
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

        <label className={`${css.controlLabel} ${css.dkFilter}`}>
          <span className={css.dkCheckboxLabel}>
            <input
              checked={dkFilterEnabled}
              disabled={disabled}
              onChange={(event) =>
                onDkFilterEnabledChange(event.target.checked)
              }
              type="checkbox"
            />
            Пошук по ДК
          </span>
          <select
            className={css.control}
            disabled={disabled || !dkFilterEnabled}
            value={selectedDkCode}
            onChange={(event) => onDkFilterValueChange(event.target.value)}
          >
            {DK_OPTIONS.map((option) => (
              <option key={option.code} value={option.code}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

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
