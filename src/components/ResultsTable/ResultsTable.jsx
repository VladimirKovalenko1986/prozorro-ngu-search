import ResultRow from "../ResultRow/ResultRow.jsx";

export default function ResultsTable({ results }) {
  return (
    <section className="results">
      {results.length === 0 ? (
        <p className="empty">Поки немає результатів.</p>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Предмет закупівлі</th>
              <th>Кількість</th>
              <th>Контрагент</th>
              <th>Очікувана вартість</th>
              <th>Ціна договору</th>
              <th>Ціна за одиницю</th>
              <th>Номер договору</th>
              <th>Дата укладання</th>
              <th>Тендер</th>
              <th>Статус</th>
            </tr>
          </thead>

          <tbody>
            {results.map((item) => (
              <ResultRow key={item.id} item={item} />
            ))}
          </tbody>
        </table>
      )}
    </section>
  );
}
