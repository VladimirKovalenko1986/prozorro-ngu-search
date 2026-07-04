import { Fragment, useMemo, useState } from "react";
import {
  fetchContractDetails,
  fetchTenderSearchPage,
  fetchTenderDetails,
  fetchTenderSummary,
} from "../../services/prozorroApi.js";
import { formatDate } from "../../utils/formatDate.js";
import { formatMoney } from "../../utils/formatMoney.js";
import { formatQuantity } from "../../utils/formatQuantity.js";
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
const TENDER_REQUEST_DELAY_MS = 250;
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

const PROCEDURE_TYPE_LABELS = {
  belowThreshold: "Спрощена закупівля",
  closeFrameworkAgreementUA: "Укладання рамкової угоди",
  closeFrameworkAgreementSelectionUA: "Відбір для закупівлі за рамковою угодою",
  competitiveDialogueEU: "Конкурентний діалог з публікацією англійською мовою",
  competitiveDialogueUA: "Конкурентний діалог",
  esco: "Закупівля енергосервісу",
  negotiation: "Переговорна процедура",
  "negotiation.quick": "Переговорна процедура скорочена",
  priceQuotation: "Запит (ціни) пропозицій",
  reporting: "Звіт про договір про закупівлю",
  simple: "Спрощена закупівля",
  "simple.defense": "Спрощена закупівля для потреб оборони",
  aboveThresholdEU: "Відкриті торги з публікацією англійською мовою",
  aboveThresholdUA: "Відкриті торги",
  "aboveThresholdUA.defense": "Відкриті торги для потреб оборони",
};

const TABLE_COLUMNS = [
  { key: "title", label: "Предмет закупівлі" },
  { key: "procedureType", label: "Вид процедури", className: "procedure-type-column" },
  { key: "buyerUnit", label: "Замовник", className: "buyer-column" },
  { key: "lot", label: "Лоти / специфікація" },
  { key: "expectedAmount", label: "Очікувана / початкова вартість" },
  { key: "supplier", label: "Контрагент", className: "supplier-column" },
  { key: "quantity", label: "Кількість / одиниця" },
  { key: "unitPrice", label: "Ціна за одиницю" },
  { key: "contractAmount", label: "Сума договору" },
  { key: "dateSigned", label: "Дата підписання" },
  { key: "contractNumber", label: "Номер договору" },
  { key: "status", label: "Статус", className: "status-column" },
];

const FILTER_COLUMNS = [
  { key: "buyerUnit", label: "Замовник" },
  { key: "supplier", label: "Контрагент" },
  { key: "dateSigned", label: "Дата підписання" },
  { key: "contractNumber", label: "Номер договору" },
  { key: "status", label: "Статус" },
];

function statusLabel(status) {
  return STATUS_LABELS[status] || status || "Немає статусу";
}

function procedureTypeLabel(type) {
  return PROCEDURE_TYPE_LABELS[type] || type || "Немає виду";
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
  const awards = lot
    ? details.awards?.filter((award) => getRelatedLotId(award) === lot.id)
    : details.awards;

  if (!awards?.length) return null;

  return (
    awards.find((award) => award.status === "active") ||
    awards.find(
      (award) => award.status !== "unsuccessful" && award.status !== "cancelled",
    ) ||
    awards[0]
  );
}

function findContractForLot(details, lot, award) {
  if (!details.contracts?.length) return null;

  const contractByAward = details.contracts.find(
    (contract) => contract.awardID === award?.id,
  );

  if (contractByAward) return contractByAward;

  if (lot) {
    const lotAwardIds = new Set(
      details.awards
        ?.filter((item) => getRelatedLotId(item) === lot.id)
        .map((item) => item.id) || [],
    );

    return (
      details.contracts.find(
        (contract) => lot.id && getRelatedLotId(contract) === lot.id,
      ) ||
      details.contracts.find((contract) => lotAwardIds.has(contract.awardID)) ||
      null
    );
  }

  return (
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

function toNumber(value) {
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  if (value === null || value === undefined || value === "") return null;

  const normalized = String(value)
    .replace(/\s/g, "")
    .replace(",", ".");
  const number = Number(normalized);

  return Number.isFinite(number) ? number : null;
}

function getItemUnitPrice(item) {
  return toNumber(
    item?.unit?.value?.amount ||
    item?.unit?.value?.value ||
    item?.value?.amount ||
    null,
  );
}

function getSpecificationAmount(quantity, unitPrice) {
  if (!quantity || !unitPrice) return null;

  const amount = toNumber(quantity) * toNumber(unitPrice);

  return Number.isFinite(amount) ? amount : null;
}

function addVat(amount) {
  const number = toNumber(amount);

  return number ? number * 1.2 : null;
}

function getItemDescription(item) {
  return item?.description || item?.title || "";
}

function getSpecificationTitle(items) {
  return items
    .map((item, index) => `${index + 1}. ${getItemDescription(item)}`)
    .join("\n");
}

function getSpecificationQuantities(items) {
  return items
    .map((item, index) => {
      const quantity = toNumber(item.quantity);
      const unitName = getItemUnitName(item);

      if (!quantity) return null;

      return `${index + 1}. ${formatQuantity(quantity)}${unitName ? ` ${unitName}` : ""}`;
    })
    .filter(Boolean);
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

  return row.unitName
    ? `${formatQuantity(row.quantity)} ${row.unitName}`
    : formatQuantity(row.quantity);
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

function getCalculatedContractTotal(rows) {
  const total = rows.reduce(
    (sum, row) =>
      sum + (row.specificationTitle ? toNumber(row.contractAmount) || 0 : 0),
    0,
  );

  return total || null;
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

function buildLotRow(
  details,
  lot,
  lotIndex,
  lotsCount,
  award,
  contract,
  contractDetails,
) {
  const lotItems = getLotItems(details, lot);
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
    contractTotalAmount: contractValue.amount,
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
    const itemUnitPrices = visibleSpecificationItems.map((item) =>
      addVat(getItemUnitPrice(item)),
    );
    const hasAllUnitPrices = itemUnitPrices.every(Boolean);

    if (!hasAllUnitPrices) {
      return [
        {
          ...baseRow,
          id: `${details.id}-${lot?.id || contract?.id || lotIndex}`,
          specificationTitle: getSpecificationTitle(visibleSpecificationItems),
          specificationQuantities: getSpecificationQuantities(
            visibleSpecificationItems,
          ),
          quantity: quantity || null,
          unitPrice:
            contractValue.amount && quantity
              ? contractValue.amount / quantity
              : null,
          contractAmount: contractValue.amount,
        },
      ];
    }

    return visibleSpecificationItems.map((item, itemIndex) => {
      const itemQuantity = toNumber(item.quantity);
      const itemUnitPrice = itemUnitPrices[itemIndex];

      return {
        ...baseRow,
        id: `${details.id}-${lot?.id || contract?.id || lotIndex}-${item.id || itemIndex}`,
        specificationTitle: getItemDescription(item),
        quantity: itemQuantity,
        unitName: getItemUnitName(item),
        contractAmount: getSpecificationAmount(itemQuantity, itemUnitPrice),
        unitPrice: itemUnitPrice,
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

function normalizeDateRange(firstDate, secondDate) {
  if (firstDate <= secondDate) {
    return { dateFrom: firstDate, dateTo: secondDate };
  }

  return { dateFrom: secondDate, dateTo: firstDate };
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
    procurementMethodType: searchItem.procurementMethodType,
    value: searchItem.value,
    procuringEntity: searchItem.procuringEntity,
    buyer: searchItem.buyer,
    dateCreated: searchItem.dateCreated || getDateFromTenderId(searchItem.tenderID),
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
        summary.dateCreated ||
        searchItem.dateCreated ||
        getDateFromTenderId(summary.tenderID || searchItem.tenderID),
      items: [],
      lots: [],
      awards: [],
      contracts: [],
    };
  }
}

function getDateFromTenderId(tenderID) {
  const match = tenderID?.match(/^UA-(\d{4})-(\d{2})-(\d{2})-/);

  if (!match) return null;

  return `${match[1]}-${match[2]}-${match[3]}`;
}

function getSearchItemProcedureDate(item) {
  return getDateFromTenderId(item.tenderID) || item.dateCreated?.slice(0, 10) || null;
}

function getProcedureDate(details, item) {
  return (
    details.dateCreated ||
    item.dateCreated ||
    getDateFromTenderId(details.tenderID || item.tenderID)
  );
}

function buildProcedureResult(details, item, lotRows) {
  const procedureDate = getProcedureDate(details, item);
  const tenderStatus = details.status || item.status;
  const procedureType = details.procurementMethodType || item.procurementMethodType;

  return {
    id: details.id || item.id,
    tenderID: details.tenderID || item.tenderID,
    buyerUnit: getBuyerUnit(details, item),
    title: getProcedureTitle(details),
    procedureType: procedureTypeLabel(procedureType),
    procedureDate,
    tenderStatus: statusLabel(tenderStatus),
    tenderStatusTone: getStatusTone(tenderStatus),
    rows: lotRows,
  };
}

function getFilterValue(procedure, row, key) {
  const values = {
    title: procedure.title,
    buyerUnit: procedure.buyerUnit,
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
  const filterColumns = useMemo(
    () =>
      FILTER_COLUMNS.filter(
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
      filterColumns.reduce(
        (options, column) => ({
          ...options,
          [column.key]: buildFilterOptions(results, column.key),
        }),
        {},
      ),
    [results, filterColumns],
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

  function handleBuyerChange(value) {
    setSelectedBuyer(value);

    if (value !== "НГУ") {
      setFilters((current) => {
        if (!current.buyerUnit?.length) return current;

        const next = { ...current };
        delete next.buyerUnit;

        return next;
      });
    }
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
    const searchRange = normalizeDateRange(dateFrom, dateTo);

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

    try {
      for (const [edrpouIndex, edrpou] of buyer.edrpous.entries()) {
        let page = 1;
        let totalPages = 1;

        while (page <= totalPages && page <= MAX_SEARCH_PAGES) {
          const json = await fetchTenderSearchPage({
            edrpou,
            page,
          });
          const rows = json.data || [];
          const edrpouTotal = json.total || rows.length;
          const pageProcedureDates = rows
            .map((item) => getSearchItemProcedureDate(item))
            .filter(Boolean);

          totalPages = Math.max(1, Math.ceil(edrpouTotal / (json.per_page || 20)));

          setStatus(
            `ЄДРПОУ ${edrpouIndex + 1} з ${buyer.edrpous.length}: ${edrpou}. Перевіряю сторінку ${page} з ${totalPages}. Уже показано: ${found.length}`,
          );

          if (
            pageProcedureDates.length === rows.length &&
            pageProcedureDates.every((procedureDate) => procedureDate < searchRange.dateFrom)
          ) {
            break;
          }

          for (const [itemIndex, item] of rows.entries()) {
            if (foundTenderIds.has(item.tenderID)) {
              continue;
            }

            const itemProcedureDate = getSearchItemProcedureDate(item);

            if (
              itemProcedureDate &&
              !isDateInPeriod(itemProcedureDate, searchRange.dateFrom, searchRange.dateTo)
            ) {
              continue;
            }

            setStatus(
              `ЄДРПОУ ${edrpouIndex + 1} з ${buyer.edrpous.length}: ${edrpou}. Обробляю процедуру ${itemIndex + 1} з ${rows.length}. Уже показано: ${found.length}`,
            );

            let procedureResult;

            try {
              const details = await fetchFullTenderDetails(item);
              const procedureDate = getProcedureDate(details, item);

              if (!isDateInPeriod(procedureDate, searchRange.dateFrom, searchRange.dateTo)) {
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
                    award,
                    contract,
                    contractDetails,
                  ),
                );
              }

              procedureResult = buildProcedureResult(details, item, lotRows);
            } catch {
              const fallbackDetails = buildFallbackDetails(item);
              const fallbackRows = buildLotRow(
                fallbackDetails,
                null,
                0,
                1,
                null,
                null,
                null,
              );

              procedureResult = buildProcedureResult(
                fallbackDetails,
                item,
                fallbackRows,
              );
            }

            if (!procedureResult) {
              continue;
            }

            setAddingProcedureTitle(procedureResult.title);
            await wait(ADD_ROW_ANIMATION_MS);

            foundTenderIds.add(procedureResult.tenderID);
            found.push(procedureResult);
            setRecentlyAddedProcedureId(procedureResult.id);
            setResults([...found]);
            setAddingProcedureTitle("");

            await wait(TENDER_REQUEST_DELAY_MS);
          }

          if (
            pageProcedureDates.length === rows.length &&
            pageProcedureDates[pageProcedureDates.length - 1] < searchRange.dateFrom
          ) {
            break;
          }

          page += 1;
        }
      }

      setStatus(
        `Готово. Показано процедур: ${found.length}. Перевірено за датою оприлюднення ${searchRange.dateFrom} - ${searchRange.dateTo}`,
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
              onChange={(event) => handleBuyerChange(event.target.value)}
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
                            <span>Фільтр</span>
                            {filters[column.key]?.length ? (
                              <span className="filter-count">
                                {filters[column.key].length}
                              </span>
                            ) : null}
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
                {
                  const hasSpecificationRows = procedure.rows.some(
                    (row) => row.specificationTitle,
                  );
                  const calculatedContractTotal =
                    getCalculatedContractTotal(procedure.rows);
                  const totalColSpan = tableColumns.length - 4;

                  return (
                    <Fragment key={procedure.id}>
                      {procedure.rows.map((row, rowIndex) => {
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
                                <span>
                                  Дата процедури:{" "}
                                  {formatDate(procedure.procedureDate)}
                                </span>
                                <span>Статус: {procedure.tenderStatus}</span>
                              </td>
                            ) : null}

                            {rowIndex === 0 ? (
                              <td
                                className="procedure-type-cell"
                                rowSpan={procedure.rows.length}
                              >
                                {procedure.procedureType}
                              </td>
                            ) : null}

                            {showBuyerColumn && rowIndex === 0 ? (
                              <td
                                className="buyer-cell"
                                rowSpan={procedure.rows.length}
                              >
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
                              {formatMoney(
                                row.expectedAmount,
                                row.expectedCurrency,
                              )}
                            </td>

                            <td className="supplier-cell">{row.supplierName}</td>

                            <td>
                              {row.quantity ? (
                                <>
                                  <strong>
                                    {formatQuantity(row.quantity)}
                                    {row.unitName ? (
                                      <span> {row.unitName}</span>
                                    ) : null}
                                  </strong>
                                  {row.specificationQuantities?.length ? (
                                    <span className="specification-quantities">
                                      {row.specificationQuantities.map((item) => (
                                        <span key={item}>{item}</span>
                                      ))}
                                    </span>
                                  ) : null}
                                </>
                              ) : (
                                "Немає кількості"
                              )}
                            </td>

                            <td>
                              {formatMoney(row.unitPrice, row.contractCurrency)}
                            </td>

                            <td>
                              {formatMoney(
                                row.contractAmount,
                                row.contractCurrency,
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
                      })}

                      {hasSpecificationRows ? (
                        <>
                          <tr className="contract-total-row">
                            <td colSpan={totalColSpan}>
                              Сума договору за API
                            </td>
                            <td>
                              {formatMoney(
                                procedure.rows[0]?.contractTotalAmount,
                                procedure.rows[0]?.contractCurrency,
                              )}
                            </td>
                            <td colSpan="3" />
                          </tr>
                          <tr className="contract-total-row contract-total-row-fact">
                            <td colSpan={totalColSpan}>Сума по факту</td>
                            <td>
                              {formatMoney(
                                calculatedContractTotal,
                                procedure.rows[0]?.contractCurrency,
                              )}
                            </td>
                            <td colSpan="3" />
                          </tr>
                        </>
                      ) : null}
                    </Fragment>
                  );
                },
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
