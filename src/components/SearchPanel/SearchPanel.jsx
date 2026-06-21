export default function SearchPanel({
  buyers,
  selectedBuyer,
  dateFrom,
  dateTo,
  isLoading,
  onChangeBuyer,
  onChangeDateFrom,
  onChangeDateTo,
  onSearch,
}) {
  return (
    <section className="panel" id="search-panel">
      <h1>Пошук договорів Prozorro</h1>

      <div className="controls">
        <label>
          Замовник
          <select
            value={selectedBuyer}
            onChange={(event) => onChangeBuyer(event.target.value)}
          >
            {buyers.map((buyer) => (
              <option key={buyer.label} value={buyer.label}>
                {buyer.label}
              </option>
            ))}
          </select>
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
