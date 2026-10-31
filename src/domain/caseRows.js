import { getDkCodePrefix } from "../constants/dk.js";
import { toNumber } from "../utils/numbers.js";
import {
  buildProcedureResult,
  findAwardForLot,
  findContractForLot,
  fetchFullTenderDetails,
  getClassificationIds,
  getItemDescription,
  getItemUnitName,
  getLotExpectedValue,
  getLotItems,
  getProcedureTitle,
} from "./prozorroRows.js";

const CLOSED_TENDER_STATUSES = new Set(["complete", "cancelled", "unsuccessful"]);
const CONCLUDED_CONTRACT_STATUSES = new Set(["active", "terminated"]);
const MAX_SERVER_CPV_CODES = 50;

// Статуси процедур "в процесі" для фільтра пошукового API Prozorro.
export const CASE_SEARCH_STATUSES = [
  "active.enquiries",
  "active.tendering",
  "active.pre-qualification",
  "active.pre-qualification.stand-still",
  "active.auction",
  "active.qualification",
  "active.qualification.stand-still",
  "active.awarded",
  "active.stage2.pending",
  "active.stage2.waiting",
];

export function getCaseSearchRange(today = new Date()) {
  const year = today.getFullYear();

  return { dateFrom: `${year}-01-01`, dateTo: `${year}-12-31`, year };
}

// Процедура ще "в процесі": не завершена, не скасована, не відхилена і не чернетка.
// Якщо статусу немає, не відсікаємо: остаточно вирішують повні деталі процедури.
export function isTenderInProgress(status) {
  if (!status) return true;

  return !CLOSED_TENDER_STATUSES.has(status) && !status.startsWith("draft");
}

// Сервер порівнює коди ДК точно, тому вибраний код розгортаємо на всі вкладені.
// Якщо кодів забагато для адреси запиту, повертаємо [] і фільтруємо лише локально.
export function getServerCpvCodes(selectedDkCodes, catalog) {
  const codes = new Set();

  for (const { code } of selectedDkCodes) {
    const nested = catalog.getCodesByPrefix(getDkCodePrefix(code));

    (nested.length > 0 ? nested : [code]).forEach((item) => codes.add(item));
  }

  return codes.size <= MAX_SERVER_CPV_CODES ? [...codes] : [];
}

function isLotInProgress(details, lot) {
  if (lot?.status && lot.status !== "active") return false;

  const award = findAwardForLot(details, lot);
  const contract = findContractForLot(details, lot, award);

  return !CONCLUDED_CONTRACT_STATUSES.has(contract?.status);
}

export function buildCaseRows(details) {
  const lots = details.lots?.length ? details.lots : [null];
  const rows = [];

  for (const [lotIndex, lot] of lots.entries()) {
    if (!isLotInProgress(details, lot)) continue;

    const lotKey = `${details.id}-${lot?.id || lotIndex}`;
    const expected = getLotExpectedValue(details, lot);
    const fallbackName = lot?.title || getProcedureTitle(details);
    const lotRowBase = {
      lotKey,
      expectedAmount: expected.amount,
      expectedCurrency: expected.currency,
    };
    const items = getLotItems(details, lot);

    if (items.length === 0) {
      rows.push({
        ...lotRowBase,
        id: lotKey,
        name: fallbackName,
        quantity: null,
        unitName: "",
        classificationIds: [],
      });
      continue;
    }

    items.forEach((item, itemIndex) => {
      rows.push({
        ...lotRowBase,
        id: `${lotKey}-${item.id || itemIndex}`,
        name: getItemDescription(item) || fallbackName,
        quantity: toNumber(item.quantity),
        unitName: getItemUnitName(item),
        classificationIds: getClassificationIds([item]),
      });
    });
  }

  return rows;
}

export function buildCaseProcedureResult(details, item, rowMatcher = () => true) {
  if (!isTenderInProgress(details.status || item.status)) return null;

  const rows = buildCaseRows(details).filter((row) => rowMatcher(row));

  if (rows.length === 0) return null;

  return buildProcedureResult(details, item, rows);
}

export async function buildCaseProcedureForItem(
  item,
  rowMatcher,
  loadedDetails = null,
  signal,
) {
  const details = loadedDetails || await fetchFullTenderDetails(item, signal);

  return buildCaseProcedureResult(details, item, rowMatcher);
}

// Очікувана вартість належить лоту, а не позиції, тому показуємо її один раз на лот.
export function flattenCaseResults(results) {
  return results.flatMap((procedure) => {
    const shownLots = new Set();

    return procedure.rows.map((row) => {
      const isFirstOfLot = !shownLots.has(row.lotKey);

      shownLots.add(row.lotKey);

      return {
        id: row.id,
        tenderID: procedure.tenderID,
        procedureDate: procedure.procedureDate,
        buyerUnit: procedure.buyerUnit,
        name: row.name,
        expectedAmount: isFirstOfLot ? row.expectedAmount : null,
        expectedCurrency: row.expectedCurrency,
        showExpectedAmount: isFirstOfLot,
        quantity: row.quantity,
        unitName: row.unitName,
      };
    });
  });
}
