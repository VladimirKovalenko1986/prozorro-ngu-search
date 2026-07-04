import {
  fetchContractDetails,
  fetchTenderDetails,
  fetchTenderSummary,
} from "../services/prozorroApi.js";
import { getDateFromTenderId } from "../utils/dateHelpers.js";
import { formatDate } from "../utils/formatDate.js";
import { formatMoney } from "../utils/formatMoney.js";
import { formatQuantity } from "../utils/formatQuantity.js";
import { addVat, toNumber } from "../utils/numbers.js";
import { normalizeText } from "../utils/text.js";
import { getStatusTone, procedureTypeLabel, statusLabel } from "../constants/labels.js";

export function getRelatedLotId(entity) {
  return entity?.lotID || entity?.relatedLot || entity?.relatedItem || null;
}

export function findAwardForLot(details, lot) {
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

export function findContractForLot(details, lot, award) {
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

  return details.contracts[0];
}

export function getLotItems(details, lot) {
  if (!details.items?.length) return [];
  if (!lot) return details.items;

  return details.items.filter((item) => item.relatedLot === lot.id);
}

export function getTotalQuantity(items = []) {
  return items.reduce((total, item) => total + Number(item.quantity || 0), 0);
}

export function getUnitName(items = []) {
  const units = items.map((item) => item.unit?.name).filter(Boolean);
  const uniqueUnits = [...new Set(units)];

  if (uniqueUnits.length === 1) return uniqueUnits[0];
  if (uniqueUnits.length > 1) return "різні одиниці";

  return "";
}

export function getItemUnitName(item) {
  return item?.unit?.name || "";
}

export function getItemUnitPrice(item) {
  return toNumber(
    item?.unit?.value?.amount ||
      item?.unit?.value?.value ||
      item?.value?.amount ||
      null,
  );
}

export function getSpecificationAmount(quantity, unitPrice) {
  if (!quantity || !unitPrice) return null;

  const amount = toNumber(quantity) * toNumber(unitPrice);

  return Number.isFinite(amount) ? amount : null;
}

export function isFopSupplier(name) {
  const normalized = normalizeText(name);

  return (
    /\bфоп\b/.test(normalized) ||
    normalized.includes("фізична особа підприємець") ||
    normalized.includes("фiзична особа підприємець")
  );
}

export function getUnitPriceWithTaxRule(item, supplierName) {
  const unitPrice = getItemUnitPrice(item);

  return isFopSupplier(supplierName) ? unitPrice : addVat(unitPrice);
}

export function getItemDescription(item) {
  return item?.description || item?.title || "";
}

export function getSpecificationTitle(items) {
  return items
    .map((item, index) => `${index + 1}. ${getItemDescription(item)}`)
    .join("\n");
}

export function getSpecificationQuantities(items) {
  return items
    .map((item, index) => {
      const quantity = toNumber(item.quantity);
      const unitName = getItemUnitName(item);

      if (!quantity) return null;

      return `${index + 1}. ${formatQuantity(quantity)}${unitName ? ` ${unitName}` : ""}`;
    })
    .filter(Boolean);
}

export function isSameSpecificationTitle(specTitle, titles) {
  const normalizedSpec = normalizeText(specTitle);

  if (!normalizedSpec) return true;

  return titles.some((title) => normalizeText(title) === normalizedSpec);
}

export function getQuantityLabel(row) {
  if (!row.quantity) return "Немає кількості";

  return row.unitName
    ? `${formatQuantity(row.quantity)} ${row.unitName}`
    : formatQuantity(row.quantity);
}

export function getLotAndSpecificationLabel(row) {
  const parts = [];

  if (row.lotNumber) {
    parts.push(`Лот ${row.lotNumber}. ${row.lotTitle}`);
  }

  if (row.specificationTitle) {
    parts.push(`Специфікація: ${row.specificationTitle}`);
  }

  return parts.join(" | ") || "Без лотів";
}

export function getCalculatedContractTotal(rows) {
  const total = rows.reduce(
    (sum, row) =>
      sum + (row.specificationTitle ? toNumber(row.contractAmount) || 0 : 0),
    0,
  );

  return total || null;
}

export function getBuyerName(details, item) {
  return (
    details.procuringEntity?.name ||
    details.buyer?.name ||
    item.procuringEntity?.name ||
    item.buyer?.name ||
    ""
  );
}

export function getBuyerUnit(details, item) {
  const buyerName = getBuyerName(details, item);
  const unitMatch = buyerName.match(
    /(?:військова\s+частина|в\/ч|частина)\s*([A-ZА-ЯІЇЄҐ]?\d{3,6})/i,
  );

  if (unitMatch) return unitMatch[1];

  const numberMatch = buyerName.match(/\b\d{3,6}\b/);

  return numberMatch?.[0] || buyerName || "Немає замовника";
}

export function getProcedureTitle(details) {
  return details.title || "Без назви";
}

export function getLotTitle(lot, lotItems, contractDetails, contract) {
  return (
    lot?.title ||
    lotItems?.[0]?.description ||
    contractDetails?.title ||
    contract?.title ||
    "Без назви"
  );
}

export function getLotExpectedValue(details, lot) {
  return {
    amount: lot?.value?.amount || details.value?.amount || null,
    currency: lot?.value?.currency || details.value?.currency || "UAH",
  };
}

export function getContractValue(contractDetails, contract) {
  return {
    amount: contractDetails?.value?.amount || contract?.value?.amount || null,
    currency:
      contractDetails?.value?.currency || contract?.value?.currency || "UAH",
  };
}

export function getContractSignedDate(contractDetails, contract) {
  return contractDetails?.dateSigned || contract?.dateSigned || null;
}

export function getContractNumber(contractDetails, contract) {
  return (
    contractDetails?.contractNumber ||
    contractDetails?.number ||
    contract?.contractNumber ||
    contract?.number ||
    "Немає номера договору"
  );
}

export function getSupplier(contractDetails, contract, award) {
  return (
    contractDetails?.suppliers?.[0] ||
    contract?.suppliers?.[0] ||
    award?.suppliers?.[0] ||
    null
  );
}

export function buildLotRow(
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
      getUnitPriceWithTaxRule(item, baseRow.supplierName),
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

export function buildFallbackDetails(searchItem) {
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

export async function fetchFullTenderDetails(searchItem) {
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

export function getSearchItemProcedureDate(item) {
  return getDateFromTenderId(item.tenderID) || item.dateCreated?.slice(0, 10) || null;
}

export function getProcedureDate(details, item) {
  return (
    details.dateCreated ||
    item.dateCreated ||
    getDateFromTenderId(details.tenderID || item.tenderID)
  );
}

export function buildProcedureResult(details, item, lotRows) {
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

export async function buildProcedureForItem(
  item,
  rowMatcher = () => true,
  loadedDetails = null,
) {
  const details = loadedDetails || await fetchFullTenderDetails(item);
  const lots = details.lots?.length ? details.lots : [null];
  const lotRows = [];

  for (const [lotIndex, lot] of lots.entries()) {
    const award = findAwardForLot(details, lot);
    const contract = findContractForLot(details, lot, award);
    const contractDetails = await fetchContractDetails(contract?.id);
    const rows = buildLotRow(
      details,
      lot,
      lotIndex,
      lots.length,
      award,
      contract,
      contractDetails,
    ).filter((row) => rowMatcher(row));

    lotRows.push(...rows);
  }

  if (lotRows.length === 0) return null;

  return buildProcedureResult(details, item, lotRows);
}

export function getFilterValue(procedure, row, key) {
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

export function getStatusFilterValues(procedure, row) {
  return [
    `Процедура: ${procedure.tenderStatus}`,
    `Договір: ${row.contractStatus}`,
    `Award: ${row.awardStatus}`,
  ];
}

export function buildFilterOptions(results, key) {
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

export function filterResults(results, filters) {
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

export function filterResultsByContractNumber(results, contractSearch) {
  const query = normalizeText(contractSearch);

  if (!query) return results;

  return results
    .map((procedure) => {
      const rows = procedure.rows.filter((row) =>
        normalizeText(row.contractNumber).includes(query),
      );

      return { ...procedure, rows };
    })
    .filter((procedure) => procedure.rows.length > 0);
}
