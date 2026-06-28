import { useMemo, useState } from "react";
import {
  fetchContractDetails,
  fetchTenderSearchPage,
  fetchTenderDetails,
  fetchTenderSummary,
} from "../../services/prozorroApi.js";
import { formatDate } from "../../utils/formatDate.js";
import { formatMoney } from "../../utils/formatMoney.js";
import ExportExcelButton from "../ExportExcelButton/ExportExcelButton.jsx";
import ScrollToSearchButton from "../ScrollToSearchButton/ScrollToSearchButton.jsx";
import "./App.css";

const NGU_EDRPOUS = [
  "25575747",
  "23313871",
  "23316220",
  "25575569",
  "25575730",
  "08803589",
  "08803617",
  "45920055",
  "25575782",
  "08803543",
  "08803773",
  "08803595",
  "25575767",
  "14323416",
  "14323422",
  "08682683",
  "08803572",
  "08803796",
  "23316473",
  "14323385",
  "44862706",
  "44849762",
  "08803690",
  "08803715",
  "25575753",
  "23313859",
  "08803738",
  "25575871",
  "08803508",
  "43391217",
  "45526274",
  "08803678",
  "25575799",
  "23314215",
  "37760707",
  "23313888",
  "08803632",
  "23313925",
  "23313931",
  "24520810",
  "08803709",
  "14323646",
  "23313948",
  "08803649",
  "08803655",
  "08803661",
  "23313842",
  "45928368",
  "14322977",
  "08803781",
  "45120935",
  "39309315",
  "39806952",
  "23313902",
  "08803684",
  "08803498",
  "14323600",
  "14322859",
  "14323511",
  "14323534",
  "08803566",
  "40163246",
  "43811869",
  "40668589",
  "44709450",
  "45083595",
  "45134733",
  "45373095",
  "08803804",
  "25574423",
  "08803827",
  "44835131",
  "45842155",
  "46127109",
  "14322902",
  "14323563",
  "08610502",
  "44633214",
  "14323014",
  "35670224",
  "37727209",
  "45498515",
  "34462067",
];

const BUYERS = [
  { label: "ГУ НГУ", edrpous: ["08803498"] },
  { label: "НГУ", edrpous: [...new Set(NGU_EDRPOUS)] },
];

const MAX_SEARCH_PAGES = 100;
const TENDER_REQUEST_DELAY_MS = 700;
const ADD_ROW_ANIMATION_MS = 450;
const STORAGE_KEYS = {
  procedures: "prozorro-ngu-checked-procedures",
  lots: "prozorro-ngu-checked-lots",
};

const STATUS_LABELS = {
  active: "Активний",
  complete: "Завершений",
  unsuccessful: "Не відбувся",
  cancelled: "Скасований",
  pending: "В процесі",
  pending_payment: "Очікує оплату",
};

const TABLE_COLUMNS = [
  { key: "title", label: "Предмет закупівлі" },
  { key: "buyerUnit", label: "Замовник", className: "buyer-column" },
  { key: "lot", label: "Лоти / специфікація" },
  { key: "expectedAmount", label: "Очікувана / початкова вартість" },
  { key: "contractAmount", label: "Сума договору" },
  { key: "unitPrice", label: "Ціна за одиницю" },
  { key: "supplier", label: "Контрагент", className: "supplier-column" },
  { key: "quantity", label: "Кількість / одиниця" },
  { key: "dateSigned", label: "Дата підписання" },
  { key: "contractNumber", label: "Номер договору" },
  { key: "status", label: "Статус", className: "status-column" },
];

const FILTER_COLUMNS = [
  { key: "supplier", label: "Контрагент" },
  { key: "dateSigned", label: "Дата підписання" },
  { key: "contractNumber", label: "Номер договору" },
  { key: "status", label: "Статус" },
];

function statusLabel(status) {
  return STATUS_LABELS[status] || status || "Немає статусу";
}

function readStoredChecks(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || {};
  } catch {
    return {};
  }
}

function writeStoredChecks(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
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

function getItemUnitName(item) {
  return item?.unit?.name || "";
}

function getItemUnitPrice(item) {
  return (
    item?.unit?.value?.amount ||
    item?.unit?.value?.value ||
    item?.value?.amount ||
    null
  );
}

function getItemDescription(item) {
  return item?.description || item?.title || "";
}

function normalizeText(value) {
  return String(value || "")
    .toLowerCase()
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
}

function isSameSpecificationTitle(specTitle, titles) {
  const normalizedSpec = normalizeText(specTitle);

  if (!normalizedSpec) return true;

  return titles.some((title) => normalizeText(title) === normalizedSpec);
}

function getQuantityLabel(row) {
  if (!row.quantity) return "Немає кількості";

  return row.unitName ? `${row.quantity} ${row.unitName}` : String(row.quantity);
}

function getLotAndSpecificationLabel(row) {
  const parts = [];

  if (row.lotNumber) {
    parts.push(`Лот ${row.lotNumber}. ${row.lotTitle}`);
  }

  if (row.specificationTitle) {
    parts.push(`Специфікація: ${row.specificationTitle}`);
  }

  return parts.join(" | ") || "Без лотів";
}

function getBuyerName(details, item) {
  return (
    details.procuringEntity?.name ||
    details.buyer?.name ||
    item.procuringEntity?.name ||
    item.buyer?.name ||
    ""
  );
}

function getBuyerUnit(details, item) {
  const buyerName = getBuyerName(details, item);
  const unitMatch = buyerName.match(
    /(?:військова\s+частина|в\/ч|частина)\s*([A-ZА-ЯІЇЄҐ]?\d{3,6})/i,
  );

  if (unitMatch) return unitMatch[1];

  const numberMatch = buyerName.match(/\b\d{3,6}\b/);

  return numberMatch?.[0] || buyerName || "Немає замовника";
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
  const lotTitle = lot && lotsCount > 1
    ? getLotTitle(lot, lotItems, contractDetails, contract)
    : "";
  const specificationItems = contractDetails?.items?.length
    ? contractDetails.items
    : [];
  const quantity = getTotalQuantity(contractItems);
  const expected = getLotExpectedValue(details, lot);
  const contractValue = getContractValue(contractDetails, contract);
  const supplier = getSupplier(contractDetails, contract, award);
  const contractStatus = contractDetails?.status || contract?.status;
  const contractStatusTone = contractStatus === "active"
    ? "success"
    : getStatusTone(contractStatus);

  const baseRow = {
    lotNumber: lot && lotsCount > 1 ? lotIndex + 1 : null,
    lotTitle,
    unitName: getUnitName(contractItems),
    supplierName: supplier?.name || "Немає контрагента",
    expectedAmount: expected.amount,
    expectedCurrency: expected.currency,
    contractAmount: contractValue.amount,
    contractCurrency: contractValue.currency,
    contractNumber: getContractNumber(contractDetails, contract),
    dateSigned: getContractSignedDate(contractDetails, contract),
    contractStatus: statusLabel(contractStatus),
    contractStatusTone,
    awardStatus: statusLabel(award?.status),
    awardStatusTone: getStatusTone(award?.status),
  };

  const visibleSpecificationItems = specificationItems.filter((item) => {
    const specTitle = getItemDescription(item);

    return (
      specificationItems.length > 1 ||
      !isSameSpecificationTitle(specTitle, [
        lotTitle,
        details.title,
        lotItems[0]?.description,
      ])
    );
  });

  if (visibleSpecificationItems.length > 0) {
    return visibleSpecificationItems.map((item, itemIndex) => {
      const itemQuantity = Number(item.quantity || 0);

      return {
        ...baseRow,
        id: `${details.id}-${lot?.id || contract?.id || lotIndex}-${item.id || itemIndex}`,
        specificationTitle: getItemDescription(item),
        quantity: itemQuantity || null,
        unitName: getItemUnitName(item),
        unitPrice: getItemUnitPrice(item),
      };
    });
  }

  return [
    {
      ...baseRow,
      id: `${details.id}-${lot?.id || contract?.id || lotIndex}`,
      specificationTitle: "",
      quantity: quantity || null,
      unitPrice:
        contractValue.amount && quantity ? contractValue.amount / quantity : null,
    },
  ];
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
    procuringEntity: searchItem.procuringEntity,
    buyer: searchItem.buyer,
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
    buyerUnit: getBuyerUnit(details, item),
    title: getProcedureTitle(details),
    procedureDate,
    tenderStatus: statusLabel(tenderStatus),
    tenderStatusTone: getStatusTone(tenderStatus),
    rows: lotRows,
  };
}

function getFilterValue(procedure, row, key) {
  const values = {
    title: procedure.title,
    lot: getLotAndSpecificationLabel(row),
    expectedAmount: formatMoney(row.expectedAmount, row.expectedCurrency),
    contractAmount: formatMoney(row.contractAmount, row.contractCurrency),
    unitPrice: formatMoney(row.unitPrice, row.contractCurrency),
    supplier: row.supplierName,
    quantity: getQuantityLabel(row),
    dateSigned: formatDate(row.dateSigned),
    contractNumber: row.contractNumber,
  };

  return values[key] || "";
}

function getStatusFilterValues(procedure, row) {
  return [
    `Процедура: ${procedure.tenderStatus}`,
    `Договір: ${row.contractStatus}`,
    `Award: ${row.awardStatus}`,
  ];
}

function buildFilterOptions(results, key) {
  const values = new Set();

  for (const procedure of results) {
    for (const row of procedure.rows) {
      if (key === "status") {
        getStatusFilterValues(procedure, row).forEach((value) =>
          values.add(value),
        );
      } else {
        const value = getFilterValue(procedure, row, key);

        if (value) values.add(value);
      }
    }
  }

  return [...values].sort((a, b) => a.localeCompare(b, "uk"));
}

function filterResults(results, filters) {
  const activeFilters = Object.entries(filters).filter(
    ([, values]) => values.length > 0,
  );

  if (activeFilters.length === 0) return results;

  return results
    .map((procedure) => {
      const rows = procedure.rows.filter((row) =>
        activeFilters.every(([key, values]) => {
          if (key === "status") {
            return getStatusFilterValues(procedure, row).some((value) =>
              values.includes(value),
            );
          }

          return values.includes(getFilterValue(procedure, row, key));
        }),
      );

      return { ...procedure, rows };
    })
    .filter((procedure) => procedure.rows.length > 0);
}

function App() {
  const [selectedBuyer, setSelectedBuyer] = useState(BUYERS[0].label);
  const [dateFrom, setDateFrom] = useState(getDefaultDateFrom);
  const [dateTo, setDateTo] = useState(getDefaultDateTo);
  const [results, setResults] = useState([]);
  const [status, setStatus] = useState("Готово до пошуку");
  const [loading, setLoading] = useState(false);
  const [checkedProcedures, setCheckedProcedures] = useState(() =>
    readStoredChecks(STORAGE_KEYS.procedures),
  );
  const [checkedLots, setCheckedLots] = useState(() =>
    readStoredChecks(STORAGE_KEYS.lots),
  );
  const [addingProcedureTitle, setAddingProcedureTitle] = useState("");
  const [recentlyAddedProcedureId, setRecentlyAddedProcedureId] = useState("");
  const [searchFinishedMessage, setSearchFinishedMessage] = useState("");
  const [filters, setFilters] = useState({});
  const showBuyerColumn = selectedBuyer === "НГУ";
  const tableColumns = useMemo(
    () =>
      TABLE_COLUMNS.filter(
        (column) => column.key !== "buyerUnit" || showBuyerColumn,
      ),
    [showBuyerColumn],
  );
  const filteredResults = useMemo(
    () => filterResults(results, filters),
    [results, filters],
  );
  const filterOptions = useMemo(
    () =>
      FILTER_COLUMNS.reduce(
        (options, column) => ({
          ...options,
          [column.key]: buildFilterOptions(results, column.key),
        }),
        {},
      ),
    [results],
  );
  const hasActiveFilters = Object.values(filters).some(
    (values) => values.length > 0,
  );

  function toggleFilterValue(key, value) {
    setFilters((current) => ({
      ...current,
      [key]: current[key]?.includes(value)
        ? current[key].filter((item) => item !== value)
        : [...(current[key] || []), value],
    }));
  }

  function clearFilters() {
    setFilters({});
  }

  function toggleProcedureChecked(procedureId) {
    setCheckedProcedures((current) => {
      const next = { ...current };

      if (next[procedureId]) {
        delete next[procedureId];
      } else {
        next[procedureId] = true;
      }

      writeStoredChecks(STORAGE_KEYS.procedures, next);

      return next;
    });
  }

  function toggleLotChecked(lotId) {
    setCheckedLots((current) => {
      const next = { ...current };

      if (next[lotId]) {
        delete next[lotId];
      } else {
        next[lotId] = true;
      }

      writeStoredChecks(STORAGE_KEYS.lots, next);

      return next;
    });
  }

  async function handleSearch(event) {
    event.preventDefault();

    const buyer = BUYERS.find((item) => item.label === selectedBuyer);

    if (!buyer?.edrpous?.length) {
      setStatus("Для цього замовника ще не додано ЄДРПОУ");
      setResults([]);
      setSearchFinishedMessage("");
      return;
    }

    setLoading(true);
    setResults([]);
    setAddingProcedureTitle("");
    setRecentlyAddedProcedureId("");
    setSearchFinishedMessage("");

    const found = [];
    const foundTenderIds = new Set();
    let total = 0;

    try {
      for (const [edrpouIndex, edrpou] of buyer.edrpous.entries()) {
        let page = 1;
        let totalPages = 1;

        while (page <= totalPages && page <= MAX_SEARCH_PAGES) {
          const json = await fetchTenderSearchPage({
            edrpou,
            dateFrom,
            dateTo,
            page,
          });
          const rows = json.data || [];
          const edrpouTotal = json.total || rows.length;

          total += page === 1 ? edrpouTotal : 0;
          totalPages = Math.max(1, Math.ceil(edrpouTotal / (json.per_page || 20)));

          setStatus(
            `ЄДРПОУ ${edrpouIndex + 1} з ${buyer.edrpous.length}: ${edrpou}. Сторінка ${page} з ${totalPages}. API знайшов: ${edrpouTotal}. Уже показано: ${found.length}`,
          );

          for (const [itemIndex, item] of rows.entries()) {
            if (foundTenderIds.has(item.tenderID)) {
              continue;
            }

            setStatus(
              `ЄДРПОУ ${edrpouIndex + 1} з ${buyer.edrpous.length}: ${edrpou}. Обробляю процедуру ${itemIndex + 1} з ${rows.length}. Уже показано: ${found.length}`,
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
                ...buildLotRow(
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

            foundTenderIds.add(procedureResult.tenderID);
            found.push(procedureResult);
            setRecentlyAddedProcedureId(procedureResult.id);
            setResults([...found]);
            setAddingProcedureTitle("");

            await wait(TENDER_REQUEST_DELAY_MS);
          }

          page += 1;
        }
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

          <ExportExcelButton
            buyer={selectedBuyer}
            dateFrom={dateFrom}
            dateTo={dateTo}
            disabled={loading}
            results={filteredResults}
            showBuyerColumn={showBuyerColumn}
          />
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

      {results.length > 0 ? (
        <div className="filter-summary">
          <span>
            Показано після фільтрів: {filteredResults.length} з {results.length}
          </span>
          <button
            className="clear-filters"
            disabled={loading || !hasActiveFilters}
            onClick={clearFilters}
            type="button"
          >
            Скинути фільтри
          </button>
        </div>
      ) : null}

      {results.length === 0 ? (
        <section className="table-panel empty-panel">
          Поки немає результатів.
        </section>
      ) : filteredResults.length === 0 ? (
        <section className="table-panel empty-panel">
          За цими фільтрами немає результатів.
        </section>
      ) : (
        <section className="table-panel">
          <table>
            <thead>
              <tr>
                {tableColumns.map((column) => (
                  <th className={column.className || ""} key={column.key}>
                    <span className="column-title">{column.label}</span>

                    {filterOptions[column.key] ? (
                      loading ? (
                        <button
                          className="filter-trigger"
                          disabled
                          type="button"
                        >
                          Фільтр
                        </button>
                      ) : (
                        <details className="filter-menu">
                          <summary>
                            Фільтр
                            {filters[column.key]?.length
                              ? ` (${filters[column.key].length})`
                              : ""}
                          </summary>

                          <div className="filter-options">
                            {filterOptions[column.key].map((option) => (
                              <label className="filter-option" key={option}>
                                <input
                                  checked={Boolean(
                                    filters[column.key]?.includes(option),
                                  )}
                                  onChange={() =>
                                    toggleFilterValue(column.key, option)
                                  }
                                  type="checkbox"
                                />
                                <span>{option}</span>
                              </label>
                            ))}
                          </div>
                        </details>
                      )
                    ) : null}
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {filteredResults.map((procedure) =>
                procedure.rows.map((row, rowIndex) => {
                  const isProcedureChecked = Boolean(
                    checkedProcedures[procedure.tenderID],
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
                            onChange={() =>
                              toggleProcedureChecked(procedure.tenderID)
                            }
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

                    {showBuyerColumn && rowIndex === 0 ? (
                      <td className="buyer-cell" rowSpan={procedure.rows.length}>
                        {procedure.buyerUnit}
                      </td>
                    ) : null}

                    <td>
                      {row.lotNumber || row.specificationTitle ? (
                        <label className="lot-check">
                          {row.lotNumber && hasMultipleLots ? (
                            <input
                              checked={isLotChecked}
                              disabled={isProcedureChecked}
                              onChange={() => toggleLotChecked(row.id)}
                              type="checkbox"
                            />
                          ) : null}
                          <span>
                            {row.lotNumber ? (
                              <>
                                <strong>Лот {row.lotNumber}</strong>
                                <span>{row.lotTitle}</span>
                              </>
                            ) : null}
                            {row.specificationTitle ? (
                              <span className="specification-title">
                                <strong>Специфікація</strong>
                                <span>{row.specificationTitle}</span>
                              </span>
                            ) : null}
                          </span>
                        </label>
                      ) : (
                        ""
                      )}
                    </td>

                    <td>
                      {formatMoney(row.expectedAmount, row.expectedCurrency)}
                    </td>

                    <td>
                      {formatMoney(row.contractAmount, row.contractCurrency)}
                    </td>

                    <td>{formatMoney(row.unitPrice, row.contractCurrency)}</td>

                    <td className="supplier-cell">{row.supplierName}</td>

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

                    <td className="status-cell">
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
