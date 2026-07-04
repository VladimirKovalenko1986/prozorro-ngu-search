import css from "./FilterSummary.module.css";

export default function FilterSummary({
  disabled,
  filteredCount,
  hasActiveFilters,
  onClear,
  totalCount,
}) {
  if (totalCount === 0) return null;

  return (
    <div className={css.summary}>
      <span>
        Показано після фільтрів: {filteredCount} з {totalCount}
      </span>
      <button
        className={css.clearButton}
        disabled={disabled || !hasActiveFilters}
        onClick={onClear}
        type="button"
      >
        Скинути фільтри
      </button>
    </div>
  );
}
