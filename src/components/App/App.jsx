import { useState } from "react";
import SearchPanel from "../SearchPanel/SearchPanel.jsx";
import StatusMessage from "../StatusMessage/StatusMessage.jsx";
import ResultsTable from "../ResultsTable/ResultsTable.jsx";
import {
  fetchTenderDetails,
  fetchTendersPage,
} from "../../services/prozorroApi.js";
import "./App.css";

const DEFAULT_EDRPOU = "08803498";

export default function App() {
  const [edrpou, setEdrpou] = useState(DEFAULT_EDRPOU);
  const [dateFrom, setDateFrom] = useState("2026-05-01");
  const [dateTo, setDateTo] = useState("2026-06-20");
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState("Готово до пошуку");
  const [isLoading, setIsLoading] = useState(false);

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

        const json = await fetchTendersPage(url);

        const matches = json.data.filter((item) => {
          const buyerMatches = item.procuringEntity?.identifier?.id === edrpou;
          const createdAt = new Date(item.dateCreated);

          const afterFrom = from ? createdAt >= from : true;
          const beforeTo = to ? createdAt <= to : true;

          return buyerMatches && afterFrom && beforeTo;
        });

        for (const item of matches) {
          const details = await fetchTenderDetails(item.id);
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
          });
        }

        setResults([...found]);
        url = json.next_page?.path ? "/prozorro" + json.next_page.path : "";
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
      <SearchPanel
        edrpou={edrpou}
        dateFrom={dateFrom}
        dateTo={dateTo}
        isLoading={isLoading}
        onChangeEdrpou={setEdrpou}
        onChangeDateFrom={setDateFrom}
        onChangeDateTo={setDateTo}
        onSearch={searchTenders}
      />

      <StatusMessage status={status} />
      <ResultsTable results={results} />
    </main>
  );
}
