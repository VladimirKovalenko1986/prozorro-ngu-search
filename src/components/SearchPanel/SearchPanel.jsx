import { useCallback, useMemo, useState } from "react";
import { BUYERS } from "../../constants/buyers.js";
import { loadDkCatalog } from "../../constants/dkCatalog.js";
import ExportExcelButton from "../ExportExcelButton/ExportExcelButton.jsx";
import StorageTransferButtons from "../StorageTransferButtons/StorageTransferButtons.jsx";
import ThemeToggle from "../ThemeToggle/ThemeToggle.jsx";
import css from "./SearchPanel.module.css";

export default function SearchPanel({
  addingProcedureTitle,
  buyer,
  contractSearch,
  selectedContractNumbers,
  dateFrom,
  dateTo,
  disabled,
  dkCode,
  selectedDkCodes,
  onBuyerChange,
  onContractNumberAdd,
  onContractNumbersClear,
  onContractNumberRemove,
  onContractSearch,
  onContractSearchChange,
  onDateFromChange,
  onDateToChange,
  onDkCodeAdd,
  onDkCodeChange,
  onDkCodeClear,
  onDkCodeRemove,
  onSearch,
  onStopSearch,
  onStorageImport,
  onThemeToggle,
  searchFinishedMessage,
  searchProgress,
  showBuyerColumn,
  status,
  storageKeys,
  tableResults,
  theme,
}) {
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

          <DkMultiSelect
            disabled={disabled}
            onAdd={onDkCodeAdd}
            onChange={onDkCodeChange}
            onClear={onDkCodeClear}
            onRemove={onDkCodeRemove}
            selectedCodes={selectedDkCodes}
            value={dkCode}
          />

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

          <ContractMultiSelect
            disabled={disabled}
            onAdd={onContractNumberAdd}
            onClear={onContractNumbersClear}
            onRemove={onContractNumberRemove}
            onSearch={onContractSearch}
            onValueChange={onContractSearchChange}
            placeholder="Наприклад: 529 або ПС/УТЗ"
            selectedNumbers={selectedContractNumbers}
            value={contractSearch}
          />
        </section>
      </form>

      <p className={css.status}>
        <span className={css.statusDot} aria-hidden="true" />
        {status}
      </p>

      {searchProgress.stage !== "idle" ? (
        <SearchProgress
          addingProcedureTitle={addingProcedureTitle}
          disabled={disabled}
          onStop={onStopSearch}
          progress={searchProgress}
        />
      ) : null}

      {searchFinishedMessage ? (
        <div className={css.searchFinished} aria-live="polite">
          {searchFinishedMessage}
        </div>
      ) : null}
    </section>
  );
}

function SearchProgress({ addingProcedureTitle, disabled, onStop, progress }) {
  const progressPercent = progress.stage === "completed"
    ? 100
    : progress.totalPages
      ? Math.min(100, Math.round((progress.currentPage / progress.totalPages) * 100))
      : 0;
  const stageLabels = {
    completed: "Пошук завершено",
    error: "Пошук перервано помилкою",
    running: "Пошук триває",
    stopped: "Пошук зупинено",
  };

  return (
    <section className={css.progressPanel} aria-live="polite">
      <div className={css.progressHeader}>
        <div className={css.progressTitle}>
          {disabled ? <span className={css.searchSpinner} aria-hidden="true" /> : null}
          <div>
            <strong>{stageLabels[progress.stage]}</strong>
            <span>
              {addingProcedureTitle
                ? `Додаю: ${addingProcedureTitle}`
                : progress.buyerIndex
                  ? `Замовник ${progress.buyerIndex} з ${progress.buyerCount} · сторінка ${progress.currentPage} з ${progress.totalPages}`
                  : "Готую дані для пошуку"}
            </span>
          </div>
        </div>

        {disabled ? (
          <button className={css.stopButton} onClick={onStop} type="button">
            <span aria-hidden="true">■</span>
            Зупинити
          </button>
        ) : null}
      </div>

      <div
        aria-label="Прогрес перевірки сторінок поточного замовника"
        aria-valuemax="100"
        aria-valuemin="0"
        aria-valuenow={progressPercent}
        className={css.progressTrack}
        role="progressbar"
      >
        <span style={{ width: `${progressPercent}%` }} />
      </div>

      <div className={css.progressStats}>
        <span>
          <strong>{progress.pagesChecked}</strong>
          Перевірено сторінок
        </span>
        <span>
          <strong>{progress.proceduresChecked}</strong>
          Перевірено процедур
        </span>
        <span>
          <strong>{progress.found}</strong>
          Знайдено
        </span>
      </div>
    </section>
  );
}

function DkMultiSelect({
  disabled,
  onAdd,
  onChange,
  onClear,
  onRemove,
  selectedCodes,
  value,
}) {
  const [catalog, setCatalog] = useState(null);
  const [catalogError, setCatalogError] = useState(false);
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const ensureCatalog = useCallback(async () => {
    if (catalog || catalogLoading) return catalog;

    setCatalogLoading(true);
    setCatalogError(false);

    try {
      const loadedCatalog = await loadDkCatalog();

      setCatalog(loadedCatalog);
      return loadedCatalog;
    } catch {
      setCatalogError(true);
      return null;
    } finally {
      setCatalogLoading(false);
    }
  }, [catalog, catalogLoading]);
  const suggestions = useMemo(
    () =>
      (catalog?.getSuggestions(value, 8) || []).filter(
        (option) => !selectedCodes.some((item) => item.code === option.code),
      ),
    [catalog, selectedCodes, value],
  );
  const hasQuery = value.trim().length > 0;
  const showSuggestions = isOpen && hasQuery && suggestions.length > 0;

  function selectCode(option) {
    if (option && onAdd(option)) {
      setIsOpen(false);
      setActiveIndex(0);
    }
  }

  function handleKeyDown(event) {
    if (event.key === "ArrowDown" && suggestions.length) {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((current) => (current + 1) % suggestions.length);
      return;
    }

    if (event.key === "ArrowUp" && suggestions.length) {
      event.preventDefault();
      setIsOpen(true);
      setActiveIndex((current) =>
        current === 0 ? suggestions.length - 1 : current - 1,
      );
      return;
    }

    if (event.key === "Enter") {
      event.preventDefault();

      if (showSuggestions) {
        selectCode(suggestions[activeIndex]);
        return;
      }
      return;
    }

    if (event.key === "Escape") setIsOpen(false);
  }

  return (
    <div className={css.dkSearch}>
      <div className={css.dkHeading}>
        <label className={css.controlLabel} htmlFor="dk-code-search">
          Пошук по ДК
        </label>
        {selectedCodes.length > 0 ? (
          <span className={css.dkCount}>Обрано: {selectedCodes.length}</span>
        ) : null}
      </div>

      {selectedCodes.length > 0 ? (
        <div className={css.dkChips} aria-label="Вибрані коди ДК">
          {selectedCodes.map(({ code, label }) => (
            <span className={css.dkChip} key={code}>
              <span className={css.dkChipCode}>{code}</span>
              <span className={css.dkChipLabel}>{label}</span>
              <button
                aria-label={`Вилучити ${code} — ${label}`}
                disabled={disabled}
                onClick={() => onRemove(code)}
                type="button"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      ) : null}

      <div className={css.dkInputWrap}>
        <input
          aria-autocomplete="list"
          aria-controls="dk-code-suggestions"
          aria-expanded={showSuggestions}
          className={css.control}
          disabled={disabled}
          id="dk-code-search"
          onBlur={() => window.setTimeout(() => setIsOpen(false), 120)}
          onChange={(event) => {
            onChange(event.target.value);
            setActiveIndex(0);
            setIsOpen(true);
            void ensureCatalog();
          }}
          onFocus={() => {
            setIsOpen(true);
            void ensureCatalog();
          }}
          onKeyDown={handleKeyDown}
          placeholder="Введіть 3–4 цифри або частину назви"
          role="combobox"
          type="search"
          value={value}
        />

        {showSuggestions ? (
          <div className={css.dkSuggestions} id="dk-code-suggestions" role="listbox">
            {suggestions.map((option, index) => (
              <button
                aria-selected={index === activeIndex}
                className={`${css.dkSuggestion} ${index === activeIndex ? css.dkSuggestionActive : ""}`}
                key={option.code}
                onMouseDown={(event) => event.preventDefault()}
                onMouseEnter={() => setActiveIndex(index)}
                onClick={() => selectCode(option)}
                role="option"
                type="button"
              >
                <span>{option.code}</span>
                <span>{option.label}</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>

      {catalogLoading ? (
        <p className={css.dkLoading} aria-live="polite">Завантажую довідник ДК…</p>
      ) : null}
      {catalogError ? (
        <button className={css.dkRetry} onClick={() => void ensureCatalog()} type="button">
          Не вдалося завантажити довідник. Спробувати ще раз
        </button>
      ) : null}

      <div className={css.dkHint}>
        <span>
          {selectedCodes.length
            ? "Буде знайдено закупівлі, що відповідають хоча б одному вибраному коду."
            : "Якщо нічого не вибрати, пошук виконується за всіма кодами ДК."}
        </span>
        {selectedCodes.length > 0 ? (
          <button disabled={disabled} onClick={onClear} type="button">
            Очистити всі
          </button>
        ) : null}
      </div>
    </div>
  );
}

function ContractMultiSelect({
  disabled,
  onAdd,
  onClear,
  onRemove,
  onSearch,
  onValueChange,
  placeholder,
  selectedNumbers,
  value,
}) {
  function handleKeyDown(event) {
    if (event.key !== "Enter") return;

    event.preventDefault();
    onAdd(value);
  }

  return (
    <div className={css.remoteSearch}>
      <div className={css.dkHeading}>
        <label className={css.controlLabel} htmlFor="contract-number-search">
          Номери договорів
        </label>
        {selectedNumbers.length > 0 ? (
          <span className={css.dkCount}>Обрано: {selectedNumbers.length}</span>
        ) : null}
      </div>

      {selectedNumbers.length > 0 ? (
        <div className={css.dkChips} aria-label="Вибрані номери договорів">
          {selectedNumbers.map(({ normalized, value: contractNumber }) => (
            <span className={css.dkChip} key={normalized}>
              <span className={css.dkChipLabel}>{contractNumber}</span>
              <button
                aria-label={`Вилучити номер договору ${contractNumber}`}
                disabled={disabled}
                onClick={() => onRemove(normalized)}
                type="button"
              >
                ×
              </button>
            </span>
          ))}
        </div>
      ) : null}

      <span className={css.remoteSearchControl}>
        <input
          className={css.remoteSearchInput}
          disabled={disabled}
          id="contract-number-search"
          onChange={(event) => onValueChange(event.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder}
          type="search"
          value={value}
        />
        <button
          className={css.secondaryButton}
          disabled={disabled || (!value.trim() && selectedNumbers.length === 0)}
          onClick={onSearch}
          type="button"
        >
          Знайти договори
        </button>
        <button
          className={css.secondaryButton}
          disabled={disabled || (!value && selectedNumbers.length === 0)}
          onClick={onClear}
          type="button"
        >
          Очистити
        </button>
      </span>

      <div className={css.dkHint}>
        <span>
          {selectedNumbers.length
            ? "Пошук виконується за кожним вибраним номером у вказаному періоді."
            : "Введіть номер і натисніть Enter, щоб додати його до пошуку."}
        </span>
        {selectedNumbers.length > 0 ? (
          <button disabled={disabled} onClick={onClear} type="button">
            Очистити всі
          </button>
        ) : null}
      </div>
    </div>
  );
}
