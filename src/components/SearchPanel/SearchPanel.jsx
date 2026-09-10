import { useMemo } from "react";
import { BUYERS } from "../../constants/buyers.js";
import { getDkSuggestions } from "../../constants/dk.js";
import ExportExcelButton from "../ExportExcelButton/ExportExcelButton.jsx";
import StorageTransferButtons from "../StorageTransferButtons/StorageTransferButtons.jsx";
import ThemeToggle from "../ThemeToggle/ThemeToggle.jsx";
import css from "./SearchPanel.module.css";

export default function SearchPanel({
  addingProcedureTitle,
  buyer,
  contractSearch,
  dateFrom,
  dateTo,
  disabled,
  dkCode,
  onBuyerChange,
  onContractSearch,
  onContractSearchChange,
  onDateFromChange,
  onDateToChange,
  onDkCodeChange,
  onSearch,
  onStorageImport,
  onThemeToggle,
  searchFinishedMessage,
  showBuyerColumn,
  status,
  storageKeys,
  tableResults,
  theme,
}) {
  const dkSuggestions = useMemo(() => getDkSuggestions(dkCode), [dkCode]);

  return (
    <section className={css.panel} id="search-panel">
      <div className={css.header}>
        <div className={css.brand}>
          <span className={css.brandMark} aria-hidden="true">P</span>
          <div>
            <span className={css.eyebrow}>Prozorro · договори</span>
            <h1 className={css.title}>Пошук закупівель</h1>
          </div>
        </div>
        <ThemeToggle onToggle={onThemeToggle} theme={theme} />
      </div>

      <form className={css.controls} onSubmit={onSearch}>
        <section className={`${css.searchCard} ${css.mainSearchCard}`}>
          <div className={css.sectionHeading}>
            <span className={css.sectionNumber}>01</span>
            <div>
              <h2>Основний пошук</h2>
              <p>Замовник, період і код закупівлі</p>
            </div>
          </div>

          <div className={css.primaryControls}>
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
              <span>{disabled ? "Шукаю..." : "Шукати"}</span>
              <span aria-hidden="true" className={css.buttonArrow}>→</span>
            </button>
          </div>

          <label className={`${css.controlLabel} ${css.dkSearch}`}>
            Пошук по ДК
            <input
              className={css.control}
              disabled={disabled}
              list="dk-021-options"
              onChange={(event) => onDkCodeChange(event.target.value)}
              placeholder="Введіть 3–4 цифри або частину назви"
              type="search"
              value={dkCode}
            />
            <datalist id="dk-021-options">
              {dkSuggestions.map((option) => (
                <option key={option.code} value={option.code}>
                  {option.label}
                </option>
              ))}
            </datalist>
          </label>

          <div className={css.utilityRow}>
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
          </div>
        </section>

        <section className={`${css.searchCard} ${css.contractSearchCard}`}>
          <div className={css.sectionHeading}>
            <span className={css.sectionNumber}>02</span>
            <div>
              <h2>Точний пошук</h2>
              <p>Знайдіть конкретний договір за номером</p>
            </div>
          </div>

          <SearchBox
            disabled={disabled}
            label="Номер договору"
            onClear={() => onContractSearchChange("")}
            onSearch={onContractSearch}
            onValueChange={onContractSearchChange}
            placeholder="Наприклад: 529 або ПС/УТЗ"
            searchButtonLabel="Знайти договір"
            value={contractSearch}
          />
        </section>
      </form>

      <p className={css.status}>
        <span className={css.statusDot} aria-hidden="true" />
        {status}
      </p>

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
