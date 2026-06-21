export default function SearchPanel({
  edrpou,
  dateFrom,
  dateTo,
  isLoading,
  onChangeEdrpou,
  onChangeDateFrom,
  onChangeDateTo,
  onSearch,
}) {
  return (
    <section className="panel">
      <h1>Пошук договорів Prozorro</h1>

      <div className="controls">
        <label>
          ЄДРПОУ замовника
          <input
            value={edrpou}
            onChange={(event) => onChangeEdrpou(event.target.value)}
          />
        </label>

        <label>
          З дати
          <input
            type="date"
            value={dateFrom}
            onChange={(event) => onChangeDateFrom(event.target.value)}
          />
        </label>

        <label>
          По дату
          <input
            type="date"
            value={dateTo}
            onChange={(event) => onChangeDateTo(event.target.value)}
          />
        </label>

        <button onClick={onSearch} disabled={isLoading}>
          {isLoading ? "Шукаю..." : "Шукати"}
        </button>
      </div>
    </section>
  );
}
