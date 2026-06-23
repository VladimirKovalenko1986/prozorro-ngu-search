import { useState } from "react";
import {
  fetchContractDetails,
  fetchTenderSearchPage,
  fetchTenderDetails,
  fetchTenderSummary,
} from "../../services/prozorroApi.js";
import { formatDate } from "../../utils/formatDate.js";
import { formatMoney } from "../../utils/formatMoney.js";
import ScrollToSearchButton from "../ScrollToSearchButton/ScrollToSearchButton.jsx";
import "./App.css";

const BUYERS = [
  { label: "ГУ НГУ", edrpou: "08803498" },
  { label: "НГУ", edrpou: "" },
];

const MAX_SEARCH_PAGES = 100;
const TENDER_REQUEST_DELAY_MS = 700;
const ADD_ROW_ANIMATION_MS = 450;

const STATUS_LABELS = {
  active: "Активний",
  complete: "Завершений",
  unsuccessful: "Не відбувся",
  cancelled: "Скасований",
  pending: "В процесі",
  pending_payment: "Очікує оплату",
};

function statusLabel(status) {
  return STATUS_LABELS[status] || status || "Немає статусу";
}

function getStatusTone(status) {
  if (status === "complete") return "success";
  if (status === "cancelled" || status === "unsuccessful") return "negative";
  if (status) return "progress";

  return "neutral";
}

function getEndOfDay(dateValue) {
  const date = new Date(dateValue);
  date.setHours(23, 59, 59, 999);

  return date;
}

function isDateInPeriod(dateValue, dateFrom, dateTo) {
  if (!dateValue) return false;

  const date = new Date(dateValue);
  const from = new Date(dateFrom);
  const to = getEndOfDay(dateTo);

  return date >= from && date <= to;
}

function getRelatedLotId(entity) {
  return entity?.lotID || entity?.relatedLot || entity?.relatedItem || null;
}

function findAwardForLot(details, lot) {
  if (!lot) return details.awards?.[0];

  return details.awards?.find((award) => getRelatedLotId(award) === lot.id);
}

function findContractForLot(details, lot, award) {
  if (!details.contracts?.length) return null;

  return (
    details.contracts.find(
      (contract) => lot?.id && getRelatedLotId(contract) === lot.id,
    ) ||
    details.contracts.find((contract) => contract.awardID === award?.id) ||
    details.contracts[0]
  );
}

function getLotItems(details, lot) {
  if (!details.items?.length) return [];
  if (!lot) return details.items;

  return details.items.filter((item) => item.relatedLot === lot.id);
}

function getTotalQuantity(items = []) {
  return items.reduce((total, item) => total + Number(item.quantity || 0), 0);
}

function getUnitName(items = []) {
  const units = items.map((item) => item.unit?.name).filter(Boolean);
  const uniqueUnits = [...new Set(units)];

  if (uniqueUnits.length === 1) return uniqueUnits[0];
  if (uniqueUnits.length > 1) return "різні одиниці";

  return "";
}

function getProcedureTitle(details) {
  return details.title || "Без назви";
}

function getLotTitle(lot, lotItems, contractDetails, contract) {
  return (
    lot?.title ||
    lotItems?.[0]?.description ||
    contractDetails?.title ||
    contract?.title ||
    "Без назви"
  );
}

function getLotExpectedValue(details, lot) {
  return {
    amount: lot?.value?.amount || details.value?.amount || null,
    currency: lot?.value?.currency || details.value?.currency || "UAH",
  };
}

function getContractValue(contractDetails, contract) {
  return {
    amount: contractDetails?.value?.amount || contract?.value?.amount || null,
    currency:
      contractDetails?.value?.currency || contract?.value?.currency || "UAH",
  };
}

function getContractDate(contractDetails, contract) {
  return (
    contractDetails?.dateCreated ||
    contractDetails?.date ||
    contract?.dateCreated ||
    contract?.date ||
    null
  );
}

function getContractSignedDate(contractDetails, contract) {
  return contractDetails?.dateSigned || contract?.dateSigned || null;
}

function getContractNumber(contractDetails, contract) {
  return (
    contractDetails?.contractNumber ||
    contractDetails?.number ||
    contract?.contractNumber ||
    contract?.number ||
    "Немає номера договору"
  );
}

function getSupplier(contractDetails, contract, award) {
  return (
    contractDetails?.suppliers?.[0] ||
    contract?.suppliers?.[0] ||
    award?.suppliers?.[0] ||
    null
  );
}

function buildLotRow(details, lot, lotIndex, lotsCount, contractDetails) {
  const lotItems = getLotItems(details, lot);
  const award = findAwardForLot(details, lot);
  const contract = findContractForLot(details, lot, award);
  const contractItems = contractDetails?.items?.length
    ? contractDetails.items
    : lotItems;
  const quantity = getTotalQuantity(contractItems);
  const expected = getLotExpectedValue(details, lot);
  const contractValue = getContractValue(contractDetails, contract);
  const supplier = getSupplier(contractDetails, contract, award);
  const contractStatus = contractDetails?.status || contract?.status;
  const contractStatusTone = contractStatus === "active"
    ? "success"
    : getStatusTone(contractStatus);

  return {
    id: `${details.id}-${lot?.id || contract?.id || lotIndex}`,
    lotNumber: lot && lotsCount > 1 ? lotIndex + 1 : null,
    lotTitle:
      lot && lotsCount > 1
        ? getLotTitle(lot, lotItems, contractDetails, contract)
        : "",
    quantity: quantity || null,
    unitName: getUnitName(contractItems),
    supplierName: supplier?.name || "Немає контрагента",
    expectedAmount: expected.amount,
    expectedCurrency: expected.currency,
    contractAmount: contractValue.amount,
    contractCurrency: contractValue.currency,
    unitPrice:
      contractValue.amount && quantity ? contractValue.amount / quantity : null,
    contractNumber: getContractNumber(contractDetails, contract),
    contractDate: getContractDate(contractDetails, contract),
    dateSigned: getContractSignedDate(contractDetails, contract),
    contractStatus: statusLabel(contractStatus),
    contractStatusTone,
    awardStatus: statusLabel(award?.status),
    awardStatusTone: getStatusTone(award?.status),
  };
}

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function formatInputDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

function getDefaultDateFrom() {
  const today = new Date();

  return formatInputDate(new Date(today.getFullYear(), today.getMonth(), 1));
}

function getDefaultDateTo() {
  return formatInputDate(new Date());
}

function buildFallbackDetails(searchItem) {
  return {
    id: searchItem.tenderID,
    tenderID: searchItem.tenderID,
    title: searchItem.title,
    status: searchItem.status,
    value: searchItem.value,
    dateCreated:
      searchItem.tenderPeriod?.startDate || searchItem.dateCreated || null,
    tenderPeriod: searchItem.tenderPeriod || {},
    items: [],
    lots: [],
    awards: [],
    contracts: [],
  };
}

async function fetchFullTenderDetails(searchItem) {
  let summary;

  try {
    summary = await fetchTenderSummary(searchItem.tenderID);
  } catch {
    return buildFallbackDetails(searchItem);
  }

  try {
    return await fetchTenderDetails(summary.id);
  } catch {
    return {
      ...summary,
      dateCreated:
        summary.tenderPeriod?.startDate || searchItem.tenderPeriod?.startDate,
      items: [],
      lots: [],
      awards: [],
      contracts: [],
    };
  }
}

function buildProcedureResult(details, item, lotRows) {
  const procedureDate = details.dateCreated || item.dateCreated;
  const tenderStatus = details.status || item.status;

  return {
    id: details.id || item.id,
    tenderID: details.tenderID || item.tenderID,
    title: getProcedureTitle(details),
    procedureDate,
    tenderStatus: statusLabel(tenderStatus),
    tenderStatusTone: getStatusTone(tenderStatus),
    rows: lotRows,
  };
}

function App() {
  const [selectedBuyer, setSelectedBuyer] = useState(BUYERS[0].label);
  const [dateFrom, setDateFrom] = useState(getDefaultDateFrom);
  const [dateTo, setDateTo] = useState(getDefaultDateTo);
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState("Готово до пошуку");
  const [loading, setLoading] = useState(false);
  const [checkedProcedures, setCheckedProcedures] = useState({});
  const [checkedLots, setCheckedLots] = useState({});
  const [addingProcedureTitle, setAddingProcedureTitle] = useState("");
  const [recentlyAddedProcedureId, setRecentlyAddedProcedureId] = useState("");
  const [searchFinishedMessage, setSearchFinishedMessage] = useState("");

  function toggleProcedureChecked(procedureId) {
    setCheckedProcedures((current) => ({
      ...current,
      [procedureId]: !current[procedureId],
    }));
  }

  function toggleLotChecked(lotId) {
    setCheckedLots((current) => ({
      ...current,
      [lotId]: !current[lotId],
    }));
  }

  async function handleSearch(event) {
    event.preventDefault();

    const buyer = BUYERS.find((item) => item.label === selectedBuyer);

    if (!buyer?.edrpou) {
      setStatus("Для цього замовника ще не додано ЄДРПОУ");
      setResults([]);
      setSearchFinishedMessage("");
      return;
    }

    setLoading(true);
    setResults([]);
    setCheckedProcedures({});
    setCheckedLots({});
    setAddingProcedureTitle("");
    setRecentlyAddedProcedureId("");
    setSearchFinishedMessage("");

    const found = [];
    let page = 1;
    let total = 0;
    let totalPages = 1;

    try {
      while (page <= totalPages && page <= MAX_SEARCH_PAGES) {
        const json = await fetchTenderSearchPage({
          edrpou: buyer.edrpou,
          dateFrom,
          dateTo,
          page,
        });
        const rows = json.data || [];

        total = json.total || rows.length;
        totalPages = Math.max(1, Math.ceil(total / (json.per_page || 20)));

        setStatus(
          `Перевіряю сторінку ${page} з ${totalPages}. Знайдено процедур у пошуку: ${total}`,
        );

        for (const [itemIndex, item] of rows.entries()) {
          setStatus(
            `Сторінка ${page} з ${totalPages}. Обробляю процедуру ${itemIndex + 1} з ${rows.length}. Уже показано: ${found.length} з ${total}`,
          );

          const details = await fetchFullTenderDetails(item);
          const procedureDate = details.dateCreated || item.dateCreated;

          if (!isDateInPeriod(procedureDate, dateFrom, dateTo)) {
            await wait(TENDER_REQUEST_DELAY_MS);
            continue;
          }

          const lots = details.lots?.length ? details.lots : [null];
          const lotRows = [];

          for (const [lotIndex, lot] of lots.entries()) {
            const award = findAwardForLot(details, lot);
            const contract = findContractForLot(details, lot, award);
            const contractDetails = await fetchContractDetails(contract?.id);

            lotRows.push(
              buildLotRow(
                details,
                lot,
                lotIndex,
                lots.length,
                contractDetails,
              ),
            );
          }

          const procedureResult = buildProcedureResult(details, item, lotRows);

          setAddingProcedureTitle(procedureResult.title);
          await wait(ADD_ROW_ANIMATION_MS);

          found.push(procedureResult);
          setRecentlyAddedProcedureId(procedureResult.id);
          setResults([...found]);
          setAddingProcedureTitle("");

          await wait(TENDER_REQUEST_DELAY_MS);
        }

        page += 1;
      }

      setStatus(
        `Готово. Показано процедур: ${found.length}. API знайшов ${total} за тендерним періодом ${dateFrom} - ${dateTo}`,
      );
      setSearchFinishedMessage(
        `Пошук завершено. Усе знайдено: ${found.length} процедур.`,
      );
    } catch (error) {
      setStatus(`Помилка: ${error.message}`);
      setSearchFinishedMessage("");
    } finally {
      setLoading(false);
      setAddingProcedureTitle("");
    }
  }

  return (
    <main className="page">
      <section className="panel" id="search-panel">
        <h1>Пошук договорів Prozorro</h1>

        <form className="controls" onSubmit={handleSearch}>
          <label>
            Замовник
            <select
              value={selectedBuyer}
              onChange={(event) => setSelectedBuyer(event.target.value)}
            >
              {BUYERS.map((buyer) => (
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

          <button type="submit" disabled={loading}>
            {loading ? "Шукаю..." : "Шукати"}
          </button>
        </form>

        <p className="status">{status}</p>

        {loading ? (
          <div className="search-activity" aria-live="polite">
            <span className="search-spinner" aria-hidden="true" />
            <span>
              {addingProcedureTitle
                ? `Додаю рядок: ${addingProcedureTitle}`
                : "Шукаю процедури..."}
            </span>
          </div>
        ) : null}

        {searchFinishedMessage ? (
          <div className="search-finished" aria-live="polite">
            {searchFinishedMessage}
          </div>
        ) : null}
      </section>

      {results.length === 0 ? (
        <section className="table-panel empty-panel">
          Поки немає результатів.
        </section>
      ) : (
        <section className="table-panel">
          <table>
            <thead>
              <tr>
                <th>Предмет закупівлі</th>
                <th>Лоти</th>
                <th>Очікувана / початкова вартість</th>
                <th>Дата договору</th>
                <th>Сума договору</th>
                <th>Ціна за одиницю</th>
                <th>Контрагент</th>
                <th>Кількість / одиниця</th>
                <th>Дата підписання</th>
                <th>Номер договору</th>
                <th>Статус</th>
              </tr>
            </thead>

            <tbody>
              {results.map((procedure) =>
                procedure.rows.map((row, rowIndex) => {
                  const isProcedureChecked = Boolean(
                    checkedProcedures[procedure.id],
                  );
                  const isLotChecked = Boolean(checkedLots[row.id]);
                  const isChecked = isProcedureChecked || isLotChecked;
                  const hasMultipleLots = procedure.rows.length > 1;
                  const isRecentlyAdded =
                    procedure.id === recentlyAddedProcedureId;

                  return (
                  <tr
                    className={[
                      isChecked ? "processed-row" : "",
                      isRecentlyAdded ? "row-added" : "",
                    ]
                      .filter(Boolean)
                      .join(" ")}
                    key={row.id}
                  >
                    {rowIndex === 0 ? (
                      <td
                        className="procedure-cell"
                        rowSpan={procedure.rows.length}
                      >
                        <label className="processed-check">
                          <input
                            checked={isProcedureChecked}
                            onChange={() => toggleProcedureChecked(procedure.id)}
                            type="checkbox"
                          />
                          <strong>{procedure.title}</strong>
                        </label>
                        <a
                          href={`https://prozorro.gov.ua/tender/${procedure.tenderID}`}
                          target="_blank"
                          rel="noreferrer"
                        >
                          {procedure.tenderID}
                        </a>
                        <span>Дата процедури: {formatDate(procedure.procedureDate)}</span>
                        <span>Статус: {procedure.tenderStatus}</span>
                      </td>
                    ) : null}

                    <td className="status-cell">
                      {row.lotNumber ? (
                        <label className="lot-check">
                          {hasMultipleLots ? (
                            <input
                              checked={isLotChecked}
                              disabled={isProcedureChecked}
                              onChange={() => toggleLotChecked(row.id)}
                              type="checkbox"
                            />
                          ) : null}
                          <span>
                            <strong>Лот {row.lotNumber}</strong>
                            <span>{row.lotTitle}</span>
                          </span>
                        </label>
                      ) : (
                        ""
                      )}
                    </td>

                    <td>
                      {formatMoney(row.expectedAmount, row.expectedCurrency)}
                    </td>

                    <td>{formatDate(row.contractDate)}</td>

                    <td>
                      {formatMoney(row.contractAmount, row.contractCurrency)}
                    </td>

                    <td>{formatMoney(row.unitPrice, row.contractCurrency)}</td>

                    <td>{row.supplierName}</td>

                    <td>
                      {row.quantity ? (
                        <>
                          {row.quantity}
                          {row.unitName ? <span> {row.unitName}</span> : null}
                        </>
                      ) : (
                        "Немає кількості"
                      )}
                    </td>

                    <td>{formatDate(row.dateSigned)}</td>

                    <td>{row.contractNumber}</td>

                    <td>
                      <div
                        className={`status-badge status-badge-${procedure.tenderStatusTone}`}
                      >
                        {procedure.tenderStatus}
                      </div>
                      <span
                        className={`status-badge status-badge-${row.contractStatusTone}`}
                      >
                        Договір: {row.contractStatus}
                      </span>
                      <span
                        className={`status-badge status-badge-${row.awardStatusTone}`}
                      >
                        Award: {row.awardStatus}
                      </span>
                    </td>
                  </tr>
                  );
                }),
              )}
            </tbody>
          </table>
        </section>
      )}

      <ScrollToSearchButton />
    </main>
  );
}

export default App;
