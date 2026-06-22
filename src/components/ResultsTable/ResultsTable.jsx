import ResultRow from "../ResultRow/ResultRow.jsx";

function ResultsTable({ results }) {
  if (results.length === 0) {
    return (
      <section className="table-panel empty-panel">
        Поки немає результатів.
      </section>
    );
  }

  return (
    <section className="table-panel">
      <table>
        <thead>
          <tr>
            <th>Лот</th>
            <th>Предмет закупівлі</th>
            <th>Очікувана / початкова вартість</th>
            <th>Дата договору</th>
            <th>Сума договору</th>
            <th>Ціна за одиницю</th>
            <th>Контрагент</th>
            <th>Кількість / одиниця</th>
            <th>Дата підписання</th>
            <th>Номер договору</th>
            <th>Процедура</th>
            <th>Статус</th>
          </tr>
        </thead>

        <tbody>
          {results.map((item) => (
            <ResultRow key={item.id} item={item} />
          ))}
        </tbody>
      </table>
    </section>
  );
}

export default ResultsTable;
