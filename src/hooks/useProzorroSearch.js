import { useMemo, useState } from "react";
import { fetchTenderSearchPage } from "../services/prozorroApi.js";
import { BUYERS } from "../constants/buyers.js";
import { DK_LABELS, getDkCodePrefix, normalizeDkCode } from "../constants/dk.js";
import { ADD_ROW_ANIMATION_MS, MAX_SEARCH_PAGES, TENDER_REQUEST_DELAY_MS } from "../constants/search.js";
import { STORAGE_KEYS } from "../constants/storage.js";
import { FILTER_COLUMNS, TABLE_COLUMNS } from "../constants/table.js";
import { getDefaultDateFrom, getDefaultDateTo, isDateInPeriod, normalizeDateRange } from "../utils/dateHelpers.js";
import { readStoredChecks, writeStoredChecks } from "../utils/storageChecks.js";
import { normalizeText } from "../utils/text.js";
import { wait } from "../utils/async.js";
import {
  buildFallbackDetails,
  buildFilterOptions,
  buildLotRow,
  buildProcedureForItem,
  buildProcedureResult,
  fetchFullTenderDetails,
  filterResults,
  filterResultsByContractNumber,
  getProcedureDate,
  getSearchItemProcedureDate,
} from "../domain/prozorroRows.js";

export function useProzorroSearch() {
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
  const [contractSearch, setContractSearch] = useState("");
  const [dkCode, setDkCode] = useState("");
  const [selectedDkCodes, setSelectedDkCodes] = useState([]);
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
  const filteredBySelects = useMemo(
    () => filterResults(results, filters),
    [results, filters],
  );
  const filteredResults = useMemo(
    () => filterResultsByContractNumber(filteredBySelects, contractSearch),
    [filteredBySelects, contractSearch],
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
    setContractSearch("");
  }

  function getActiveDkCodes() {
    const draftCode = normalizeDkCode(dkCode);

    if (!DK_LABELS[draftCode] || selectedDkCodes.includes(draftCode)) {
      return selectedDkCodes;
    }

    return [...selectedDkCodes, draftCode];
  }

  function addDkCode(value) {
    const code = normalizeDkCode(value);

    if (!DK_LABELS[code]) return false;

    setSelectedDkCodes((current) =>
      current.includes(code) ? current : [...current, code],
    );
    setDkCode("");
    return true;
  }

  function removeDkCode(code) {
    setSelectedDkCodes((current) => current.filter((item) => item !== code));
  }

  function clearDkCodes() {
    setSelectedDkCodes([]);
    setDkCode("");
  }

  function getDkRowMatcher(row) {
    const activeDkCodes = getActiveDkCodes();

    if (activeDkCodes.length === 0) return true;

    return activeDkCodes.some((selectedCode) => {
      const prefix = getDkCodePrefix(selectedCode);

      return row.classificationIds?.some((code) => code.startsWith(prefix));
    });
  }

  function hasInvalidDkCode() {
    const draftCode = normalizeDkCode(dkCode);

    if (!dkCode.trim() || DK_LABELS[draftCode]) return false;

    setStatus("Оберіть код ДК зі списку підказок");
    setSearchFinishedMessage("");
    return true;
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

  function handleStorageImport({ procedures, lots }) {
    writeStoredChecks(STORAGE_KEYS.procedures, procedures);
    writeStoredChecks(STORAGE_KEYS.lots, lots);
    setCheckedProcedures(procedures);
    setCheckedLots(lots);
    setStatus("Готово. Прогрес з файлу імпортовано.");
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

    if (hasInvalidDkCode()) return;

    const activeDkCodes = getActiveDkCodes();

    if (activeDkCodes.length > selectedDkCodes.length) {
      setSelectedDkCodes(activeDkCodes);
      setDkCode("");
    }

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

              procedureResult = await buildProcedureForItem(
                item,
                getDkRowMatcher,
                details,
              );
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
              ).filter(getDkRowMatcher);

              if (fallbackRows.length === 0) {
                continue;
              }

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
        `Готово. Показано процедур: ${found.length}. Перевірено за датою оприлюднення ${searchRange.dateFrom} - ${searchRange.dateTo}${activeDkCodes.length ? `. ДК-кодів: ${activeDkCodes.length}` : ""}`,
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

  async function handleContractRemoteSearch() {
    const query = normalizeText(contractSearch);
    const buyer = BUYERS.find((item) => item.label === selectedBuyer);

    if (hasInvalidDkCode()) return;

    const activeDkCodes = getActiveDkCodes();

    if (activeDkCodes.length > selectedDkCodes.length) {
      setSelectedDkCodes(activeDkCodes);
      setDkCode("");
    }

    if (!query) {
      setStatus("Введіть номер договору або його частину");
      return;
    }

    if (!buyer?.edrpous?.length) {
      setStatus("Для цього замовника ще не додано ЄДРПОУ");
      setResults([]);
      setSearchFinishedMessage("");
      return;
    }

    setLoading(true);
    setResults([]);
    setFilters({});
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
          const json = await fetchTenderSearchPage({ edrpou, page });
          const rows = json.data || [];
          const edrpouTotal = json.total || rows.length;

          totalPages = Math.max(1, Math.ceil(edrpouTotal / (json.per_page || 20)));
          setStatus(
            `Пошук договору "${contractSearch}". ЄДРПОУ ${edrpouIndex + 1} з ${buyer.edrpous.length}: ${edrpou}. Сторінка ${page} з ${totalPages}. Знайдено: ${found.length}`,
          );

          for (const [itemIndex, item] of rows.entries()) {
            if (foundTenderIds.has(item.tenderID)) {
              continue;
            }

            setStatus(
              `Пошук договору "${contractSearch}". Перевіряю процедуру ${itemIndex + 1} з ${rows.length}. Знайдено: ${found.length}`,
            );

            try {
              const procedureResult = await buildProcedureForItem(item, (row) =>
                normalizeText(row.contractNumber).includes(query) &&
                getDkRowMatcher(row),
              );

              if (!procedureResult) {
                await wait(TENDER_REQUEST_DELAY_MS);
                continue;
              }

              setAddingProcedureTitle(procedureResult.title);
              await wait(ADD_ROW_ANIMATION_MS);

              foundTenderIds.add(procedureResult.tenderID);
              found.push(procedureResult);
              setRecentlyAddedProcedureId(procedureResult.id);
              setResults([...found]);
              setAddingProcedureTitle("");
            } catch {
              setStatus(
                `Пошук договору "${contractSearch}". Prozorro не відповів по ${item.tenderID || "процедурі"}. Продовжую.`,
              );
            }

            await wait(TENDER_REQUEST_DELAY_MS);
          }

          page += 1;
        }
      }

      setStatus(
        `Готово. За номером договору "${contractSearch}" знайдено: ${found.length} процедур.`,
      );
      setSearchFinishedMessage(
        `Пошук договору завершено. Знайдено: ${found.length} процедур.`,
      );
    } catch (error) {
      setStatus(`Помилка: ${error.message}`);
      setSearchFinishedMessage("");
    } finally {
      setLoading(false);
      setAddingProcedureTitle("");
    }
  }

  return {
    addingProcedureTitle,
    checkedLots,
    checkedProcedures,
    addDkCode,
    clearDkCodes,
    clearFilters,
    contractSearch,
    dateFrom,
    dateTo,
    dkCode,
    filterOptions,
    filteredResults,
    filters,
    handleBuyerChange,
    handleContractRemoteSearch,
    handleSearch,
    handleStorageImport,
    hasActiveFilters,
    loading,
    recentlyAddedProcedureId,
    results,
    removeDkCode,
    searchFinishedMessage,
    selectedBuyer,
    selectedDkCodes,
    setContractSearch,
    setDateFrom,
    setDateTo,
    setDkCode,
    showBuyerColumn,
    status,
    tableColumns,
    toggleFilterValue,
    toggleLotChecked,
    toggleProcedureChecked,
  };
}
