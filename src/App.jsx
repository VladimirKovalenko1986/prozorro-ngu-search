import { useState } from "react";
import "./App.css";

const DEFAULT_EDRPOU = "08803498";

function formatMoney(amount, currency = "UAH") {
  if (!amount) return "Немає ціни договору";

  return new Intl.NumberFormat("uk-UA", {
    style: "currency",
    currency,
  }).format(amount);
}

function App() {
  const [edrpou, setEdrpou] = useState(DEFAULT_EDRPOU);
  const [dateFrom, setDateFrom] = useState("2026-05-01");
  const [dateTo, setDateTo] = useState("2026-06-20");
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState("Готово до пошуку");
  const [isLoading, setIsLoading] = useState(false);

  async function getTenderDetails(id) {
    const response = await fetch(`/prozorro/api/0/tenders/${id}`);
    const json = await response.json();
    return json.data;
  }

  async function searchTenders() {
    setIsLoading(true);
    setResults([]);
    setStatus("Шукаю закупівлі...");

    const from = dateFrom ? new Date(`${dateFrom}T00:00:00`) : null;
    const to = dateTo ? new Date(`${dateTo}T23:59:59`) : null;

    let url =
      "/prozorro/api/0/tenders?descending=1&limit=1000&opt_fields=id,tenderID,status,dateCreated,procuringEntity";

    const found = [];
    let pagesChecked = 0;
    const maxPages = 200;

    try {
      while (url && pagesChecked < maxPages) {
        pagesChecked += 1;
        setStatus(`Перевіряю сторінку ${pagesChecked} з ${maxPages}`);

        const response = await fetch(url);
        const json = await response.json();

        const matches = json.data.filter((item) => {
          const buyerMatches = item.procuringEntity?.identifier?.id === edrpou;
          const createdAt = new Date(item.dateCreated);

          const afterFrom = from ? createdAt >= from : true;
          const beforeTo = to ? createdAt <= to : true;

          return buyerMatches && afterFrom && beforeTo;
        });

        for (const item of matches) {
          const details = await getTenderDetails(item.id);
          const contract = details.contracts?.[0];

          found.push({
            id: item.id,
            tenderID: details.tenderID,
            buyer: details.procuringEntity?.name,
            title: contract?.title || details.title,
            contractID: contract?.contractID || "Немає договору",
            amount: contract?.value?.amount,
            currency: contract?.value?.currency || "UAH",
            contractStatus: contract?.status || "Немає статусу",
            tenderStatus: details.status,
            dateCreated: details.dateCreated,
          });
        }

        setResults([...found]);

        url = json.next_page?.uri
          ? json.next_page.uri.replace(
              "https://public-api.prozorro.gov.ua",
              "/prozorro",
            )
          : "";
      }

      setStatus(
        `Готово. Знайдено: ${found.length} за період ${dateFrom} — ${dateTo}`,
      );
    } catch (error) {
      setStatus(`Помилка: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <main className="page">
      <section className="panel">
        <h1>Пошук договорів Prozorro</h1>

        <div className="controls">
          <label>
            ЄДРПОУ замовника
            <input
              value={edrpou}
              onChange={(event) => setEdrpou(event.target.value)}
            />
          </label>

          <label>
            З дати
            <input
              type="date"
              value={dateFrom}
              onChange={(event) => setDateFrom(event.target.value)}
            />
          </label>

          <label>
            По дату
            <input
              type="date"
              value={dateTo}
              onChange={(event) => setDateTo(event.target.value)}
            />
          </label>

          <button onClick={searchTenders} disabled={isLoading}>
            {isLoading ? "Шукаю..." : "Шукати"}
          </button>
        </div>

        <p className="status">{status}</p>
      </section>

      <section className="results">
        {results.length === 0 ? (
          <p className="empty">Поки немає результатів.</p>
        ) : (
          <table>
            <thead>
              <tr>
                <th>Предмет закупівлі</th>
                <th>Ціна договору</th>
                <th>Номер договору</th>
                <th>Тендер</th>
                <th>Статус</th>
              </tr>
            </thead>

            <tbody>
              {results.map((item) => (
                <tr key={item.id}>
                  <td>
                    <strong>{item.title}</strong>
                    <span>{item.buyer}</span>
                  </td>
                  <td>{formatMoney(item.amount, item.currency)}</td>
                  <td>{item.contractID}</td>
                  <td>
                    <a
                      href={`https://prozorro.gov.ua/tender/${item.tenderID}`}
                      target="_blank"
                    >
                      {item.tenderID}
                    </a>
                  </td>
                  <td>
                    {item.contractStatus}
                    <span>{item.tenderStatus}</span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </section>
    </main>
  );
}

export default App;
