import { useEffect, useMemo, useRef, useState } from "react";
import { BUYERS } from "../constants/buyers.js";
import { TENDER_REQUEST_DELAY_MS } from "../constants/search.js";
import {
  buildProcedureForItem,
  getSearchItemProcedureDate,
} from "../domain/prozorroRows.js";
import { fetchTenderSearchPage } from "../services/prozorroApi.js";
import { wait } from "../utils/async.js";

const PROCEDURES_PER_BATCH = 50;

function getBuyerCodes(buyer, edrpou) {
  if (buyer === "edrpou-search") {
    return /^\d{8}$/.test(edrpou) ? [edrpou] : [];
  }

  return BUYERS.find((item) => item.label === buyer)?.edrpous || [];
}

function isCurrentRequest(requestId, requestIdRef) {
  return requestId === requestIdRef.current;
}

export function usePriceAnalysisSearch({ buyer, edrpou }) {
  const [procedures, setProcedures] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState({ checked: 0, total: 0 });
  const proceduresRef = useRef([]);
  const pendingItemsRef = useRef([]);
  const seenTenderIdsRef = useRef(new Set());
  const nextPageRef = useRef(1);
  const totalPagesRef = useRef(null);
  const controllerRef = useRef(null);
  const requestIdRef = useRef(0);
  const loadingRef = useRef(false);
  const buyerCodes = useMemo(() => getBuyerCodes(buyer, edrpou), [buyer, edrpou]);
  const buyerCodesKey = buyerCodes.join(",");

  function clearResults() {
    proceduresRef.current = [];
    pendingItemsRef.current = [];
    seenTenderIdsRef.current = new Set();
    nextPageRef.current = 1;
    totalPagesRef.current = null;
    setProcedures([]);
    setHasMore(false);
    setError("");
    setProgress({ checked: 0, total: 0 });
  }

  async function loadBatch({ buyerCodes: codes, replace, requestId }) {
    if (!codes.length || loadingRef.current) return;

    const controller = new AbortController();
    const { signal } = controller;

    controllerRef.current?.abort();
    controllerRef.current = controller;
    loadingRef.current = true;
    setLoading(true);
    setLoadingMore(!replace);
    setError("");

    try {
      while (
        pendingItemsRef.current.length < PROCEDURES_PER_BATCH &&
        (totalPagesRef.current === null || nextPageRef.current <= totalPagesRef.current)
      ) {
        const page = nextPageRef.current;
        const json = await fetchTenderSearchPage({
          edrpous: codes,
          page,
          signal,
        });

        if (!isCurrentRequest(requestId, requestIdRef)) return;

        const rows = json.data || [];
        const total = json.total || rows.length;
        const perPage = json.per_page || rows.length || 20;

        totalPagesRef.current = Math.max(1, Math.ceil(total / perPage));
        nextPageRef.current = page + 1;

        rows.forEach((item) => {
          if (!item.tenderID || seenTenderIdsRef.current.has(item.tenderID)) return;

          seenTenderIdsRef.current.add(item.tenderID);
          pendingItemsRef.current.push(item);
        });

        pendingItemsRef.current.sort((first, second) =>
          (getSearchItemProcedureDate(second) || "").localeCompare(
            getSearchItemProcedureDate(first) || "",
          ),
        );

        if (rows.length === 0) break;
      }

      const batch = pendingItemsRef.current.splice(0, PROCEDURES_PER_BATCH);
      const baseProcedures = replace ? [] : proceduresRef.current;
      const loadedProcedures = [];

      setProgress({ checked: 0, total: batch.length });

      for (const [index, item] of batch.entries()) {
        if (!isCurrentRequest(requestId, requestIdRef)) return;

        try {
          const procedure = await buildProcedureForItem(item, () => true, null, signal);

          if (procedure) {
            loadedProcedures.push(procedure);
            proceduresRef.current = [...baseProcedures, ...loadedProcedures];
            setProcedures(proceduresRef.current);
          }
        } catch {
          if (signal.aborted) throw signal.reason;
        }

        setProgress({ checked: index + 1, total: batch.length });

        if (index < batch.length - 1) {
          await wait(TENDER_REQUEST_DELAY_MS, signal);
        }
      }

      if (!isCurrentRequest(requestId, requestIdRef)) return;

      setHasMore(
        pendingItemsRef.current.length > 0 ||
          nextPageRef.current <= totalPagesRef.current,
      );
    } catch {
      if (!signal.aborted && isCurrentRequest(requestId, requestIdRef)) {
        setError("Не вдалося завантажити закупівлі. Спробуйте ще раз.");
      }
    } finally {
      if (isCurrentRequest(requestId, requestIdRef)) {
        loadingRef.current = false;
        setLoading(false);
        setLoadingMore(false);
      }
    }
  }

  useEffect(() => {
    const resetTimeout = window.setTimeout(() => {
      requestIdRef.current += 1;
      controllerRef.current?.abort();
      controllerRef.current = null;
      loadingRef.current = false;
      clearResults();
      setHasStarted(false);
    }, 0);

    return () => {
      window.clearTimeout(resetTimeout);
      controllerRef.current?.abort();
    };
  }, [buyer, buyerCodes, buyerCodesKey]);

  function startAnalysis() {
    if (!buyerCodes.length || loadingRef.current) return;

    const requestId = requestIdRef.current + 1;

    requestIdRef.current = requestId;
    controllerRef.current?.abort();
    loadingRef.current = false;
    clearResults();
    setHasStarted(true);
    void loadBatch({ buyerCodes, replace: true, requestId });
  }

  function loadMore() {
    if (loadingRef.current || !hasMore) return;

    void loadBatch({
      buyerCodes,
      replace: false,
      requestId: requestIdRef.current,
    });
  }

  return {
    error,
    hasMore,
    hasStarted,
    loading,
    loadingMore,
    loadMore,
    procedures,
    progress,
    startAnalysis,
  };
}
