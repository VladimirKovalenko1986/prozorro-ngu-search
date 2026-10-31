import { useEffect, useMemo, useRef, useState } from "react";
import { NGU_EDRPOUS } from "../constants/buyers.js";
import { TENDER_REQUEST_DELAY_MS } from "../constants/search.js";
import {
  getDateMonthsAgo,
  getPriceBenchmarkSample,
  getPriceBenchmarkTarget,
  getWeightedPriceBenchmark,
} from "../domain/priceBenchmark.js";
import {
  buildProcedureForItem,
  getSearchItemProcedureDate,
} from "../domain/prozorroRows.js";
import { fetchTenderSearchPage } from "../services/prozorroApi.js";
import { wait } from "../utils/async.js";

const BENCHMARK_PERIODS_MONTHS = [3, 6, 12];
const BENCHMARK_MIN_CONTRACTS = 1;
const BENCHMARK_MAX_PAGES = 8;
const BENCHMARK_SEARCH_GRACE_DAYS = 45;
const benchmarkCache = new Map();

function getTargets(procedures) {
  const targets = new Map();

  for (const procedure of procedures) {
    for (const row of procedure.rows) {
      const target = getPriceBenchmarkTarget(procedure, row);

      if (!target) continue;

      const existing = targets.get(target.key) || {
        ...target,
        excludedTenderIds: new Set(),
      };

      existing.excludedTenderIds.add(procedure.tenderID);
      targets.set(target.key, existing);
    }
  }

  return [...targets.values()];
}

function getSearchCutoff(now) {
  const cutoff = getDateMonthsAgo(BENCHMARK_PERIODS_MONTHS.at(-1), now);

  cutoff.setDate(cutoff.getDate() - BENCHMARK_SEARCH_GRACE_DAYS);

  return cutoff;
}

function hasReachedPeriodBoundary(items, months, now) {
  const procedureDates = items
    .map(getSearchItemProcedureDate)
    .filter(Boolean)
    .map((date) => new Date(date));

  if (procedureDates.length === 0) return false;

  const cutoff = getDateMonthsAgo(months, now);

  cutoff.setDate(cutoff.getDate() - BENCHMARK_SEARCH_GRACE_DAYS);

  return procedureDates.some((date) => date < cutoff);
}

async function findPriceBenchmark(target, signal, onProgress) {
  const now = new Date();
  const searchCutoff = getSearchCutoff(now);
  const seenTenderIds = new Set();
  const samples = [];
  let checkedItems = 0;

  for (let page = 1; page <= BENCHMARK_MAX_PAGES; page += 1) {
    const json = await fetchTenderSearchPage({
      cpv: target.dkCode,
      edrpous: NGU_EDRPOUS,
      page,
      signal,
    });
    const items = json.data || [];
    const pageSize = json.per_page || items.length || 1;
    const totalItems = Number(json.total) || pageSize * BENCHMARK_MAX_PAGES;

    const plannedItems = Math.min(totalItems, pageSize * BENCHMARK_MAX_PAGES);
    onProgress({ checked: checkedItems, total: plannedItems });

    const pageReachedFinalBoundary = items.some((item) => {
      const procedureDate = getSearchItemProcedureDate(item);

      return procedureDate && new Date(procedureDate) < searchCutoff;
    });

    for (const item of items) {
      const procedureDate = getSearchItemProcedureDate(item);

      if (
        !item.tenderID ||
        seenTenderIds.has(item.tenderID) ||
        target.excludedTenderIds.has(item.tenderID) ||
        (procedureDate && new Date(procedureDate) < searchCutoff)
      ) {
        checkedItems += 1;
        onProgress({ checked: checkedItems, total: plannedItems });
        continue;
      }

      seenTenderIds.add(item.tenderID);

      try {
        const procedure = await buildProcedureForItem(item, () => true, null, signal);

        procedure?.rows.forEach((row) => {
          const sample = getPriceBenchmarkSample(procedure, row, target);

          if (sample) samples.push(sample);
        });
      } catch (error) {
        if (signal.aborted) throw error;
      }

      const immediateBenchmark = getWeightedPriceBenchmark(samples, 3, now);

      if (immediateBenchmark?.contractCount >= BENCHMARK_MIN_CONTRACTS) {
        return { status: "ready", ...immediateBenchmark };
      }

      checkedItems += 1;
      onProgress({ checked: checkedItems, total: plannedItems });
      await wait(TENDER_REQUEST_DELAY_MS, signal);
    }

    for (const months of BENCHMARK_PERIODS_MONTHS) {
      if (!hasReachedPeriodBoundary(items, months, now)) continue;

      const benchmark = getWeightedPriceBenchmark(samples, months, now);

      if (benchmark?.contractCount >= BENCHMARK_MIN_CONTRACTS) {
        return { status: "ready", ...benchmark };
      }
    }

    if (items.length === 0 || pageReachedFinalBoundary) break;
  }

  const finalBenchmark = getWeightedPriceBenchmark(
    samples,
    BENCHMARK_PERIODS_MONTHS.at(-1),
    now,
  );

  return {
    contractCount: finalBenchmark?.contractCount || 0,
    months: BENCHMARK_PERIODS_MONTHS.at(-1),
    status: "insufficient",
  };
}

export function usePriceBenchmarks(procedures, enabled) {
  const [benchmarks, setBenchmarks] = useState({});
  const [progress, setProgress] = useState({ completed: 0, total: 0 });
  const requestIdRef = useRef(0);
  const targets = useMemo(() => getTargets(procedures), [procedures]);
  const targetsKey = targets.map((target) => target.key).join(",");

  useEffect(() => {
    if (!enabled || targets.length === 0) return undefined;

    const requestId = requestIdRef.current + 1;
    const controller = new AbortController();
    const startTimeout = window.setTimeout(() => {
      requestIdRef.current = requestId;
      const cachedTargetsCount = targets.filter((target) => benchmarkCache.has(target.key)).length;

      setProgress({
        completed: cachedTargetsCount,
        total: targets.length,
      });
      setBenchmarks((current) => {
        const next = { ...current };

        targets.forEach((target) => {
          if (benchmarkCache.has(target.key)) {
            next[target.key] = benchmarkCache.get(target.key);
          } else if (!next[target.key]) {
            next[target.key] = { status: "loading", checked: 0, total: 0 };
          }
        });

        return next;
      });

      void (async () => {
        let completed = cachedTargetsCount;

        for (const target of targets) {
          if (requestId !== requestIdRef.current || controller.signal.aborted) return;

          if (benchmarkCache.has(target.key)) continue;

          try {
            const benchmark = await findPriceBenchmark(
              target,
              controller.signal,
              (targetProgress) => {
                if (requestId !== requestIdRef.current || controller.signal.aborted) return;

                setBenchmarks((current) => ({
                  ...current,
                  [target.key]: {
                    status: "loading",
                    ...targetProgress,
                  },
                }));
              },
            );

            if (requestId !== requestIdRef.current || controller.signal.aborted) return;

            benchmarkCache.set(target.key, benchmark);
            setBenchmarks((current) => ({ ...current, [target.key]: benchmark }));
          } catch {
            if (controller.signal.aborted) return;

            setBenchmarks((current) => ({
              ...current,
              [target.key]: {
                status: "error",
              },
            }));
          }

          completed += 1;
          setProgress({ completed, total: targets.length });
        }
      })();
    }, 0);

    return () => {
      window.clearTimeout(startTimeout);
      controller.abort();
    };
  }, [enabled, targets, targetsKey]);

  return {
    benchmarks,
    progress: enabled ? progress : { completed: 0, total: 0 },
  };
}
