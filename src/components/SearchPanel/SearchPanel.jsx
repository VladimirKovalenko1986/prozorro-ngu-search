function SearchPanel({
  buyers,
  selectedBuyer,
  dateFrom,
  dateTo,
  loading,
  onBuyerChange,
  onDateFromChange,
  onDateToChange,
  onSearch,
}) {
  return (
    <section className="panel" id="search-panel">
      <h1>Пошук договорів Prozorro</h1>

      <form className="controls" onSubmit={onSearch}>
        <label>
          Замовник
          <select
            value={selectedBuyer}
            onChange={(event) => onBuyerChange(event.target.value)}
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
            onChange={(event) => onDateFromChange(event.target.value)}
          />
        </label>

        <label>
          По дату
          <input
            type="date"
            value={dateTo}
            onChange={(event) => onDateToChange(event.target.value)}
          />
        </label>

        <button type="submit" disabled={loading}>
          {loading ? "Шукаю..." : "Шукати"}
        </button>
      </form>
    </section>
  );
}

export default SearchPanel;
