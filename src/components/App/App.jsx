import { useState } from "react";
import SearchPanel from "../SearchPanel/SearchPanel.jsx";
import StatusMessage from "../StatusMessage/StatusMessage.jsx";
import ResultsTable from "../ResultsTable/ResultsTable.jsx";
import {
  fetchContractDetails,
  fetchTenderDetails,
  fetchTendersPage,
} from "../../services/prozorroApi.js";
import "./App.css";

const BUYERS = [
  {
    label: "ГУ НГУ",
    edrpou: "08803498",
  },
  {
    label: "НГУ",
    edrpou: "",
  },
];

export default function App() {
  const [selectedBuyer, setSelectedBuyer] = useState(BUYERS[0].label);
  const [dateFrom, setDateFrom] = useState("2026-05-01");
  const [dateTo, setDateTo] = useState("2026-06-20");
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState("Готово до пошуку");
  const [isLoading, setIsLoading] = useState(false);

  const selectedBuyerData = BUYERS.find(
    (buyer) => buyer.label === selectedBuyer,
  );
  const edrpou = selectedBuyerData?.edrpou || "";

  async function searchTenders() {
    if (!edrpou) {
      setStatus("Для цього замовника ще не вказано ЄДРПОУ");
      return;
    }

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

          const itemInfo = details.items?.[0];
          const contract = details.contracts?.[0];
          const contractDetails = await fetchContractDetails(contract?.id);

          const award = details.awards?.find(
            (award) => award.id === contract?.awardID,
          );

          const supplier =
            contractDetails?.suppliers?.[0] ||
            contract?.suppliers?.[0] ||
            award?.suppliers?.[0];

          const quantity =
            contractDetails?.items?.[0]?.quantity || itemInfo?.quantity;

          const contractAmount =
            contractDetails?.value?.amount || contract?.value?.amount;

          found.push({
            id: item.id,
            tenderID: details.tenderID,
            buyer: details.procuringEntity?.name,
            title: contractDetails?.title || contract?.title || details.title,

            quantity,
            unitName:
              contractDetails?.items?.[0]?.unit?.name ||
              itemInfo?.unit?.name ||
              "",

            expectedAmount: details.value?.amount,
            expectedCurrency: details.value?.currency || "UAH",

            contractAmount,
            contractCurrency:
              contractDetails?.value?.currency ||
              contract?.value?.currency ||
              "UAH",

            unitPrice:
              contractAmount && quantity ? contractAmount / quantity : null,

            contractNumber:
              contractDetails?.contractNumber ||
              contractDetails?.number ||
              contract?.contractNumber ||
              contract?.number ||
              "Немає номера договору",

            dateSigned:
              contractDetails?.dateSigned ||
              contractDetails?.date ||
              contract?.dateSigned ||
              contract?.date ||
              "Немає дати",

            supplierName: supplier?.name || "Немає контрагента",

            contractStatus:
              contractDetails?.status || contract?.status || "Немає статусу",

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
        buyers={BUYERS}
        selectedBuyer={selectedBuyer}
        dateFrom={dateFrom}
        dateTo={dateTo}
        isLoading={isLoading}
        onChangeBuyer={setSelectedBuyer}
        onChangeDateFrom={setDateFrom}
        onChangeDateTo={setDateTo}
        onSearch={searchTenders}
      />

      <StatusMessage status={status} />
      <ResultsTable results={results} />
    </main>
  );
}
