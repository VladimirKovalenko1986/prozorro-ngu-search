const DETAILS_API_PREFIX = "/prozorro/api/2.5";
const SITE_API_PREFIX = "/prozorro-search/api";
const FETCH_TIMEOUT_MS = 15000;

function wait(ms, signal) {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(signal.reason || new DOMException("Aborted", "AbortError"));
      return;
    }

    const timeoutId = setTimeout(() => {
      signal?.removeEventListener("abort", handleAbort);
      resolve();
    }, ms);

    function handleAbort() {
      clearTimeout(timeoutId);
      reject(signal.reason || new DOMException("Aborted", "AbortError"));
    }

    signal?.addEventListener("abort", handleAbort, { once: true });
  });
}

async function fetchWithRetry(url, options = {}, retries = 3) {
  const controller = new AbortController();
  const externalSignal = options.signal;
  const abortRequest = () => controller.abort(externalSignal.reason);

  if (externalSignal?.aborted) abortRequest();
  externalSignal?.addEventListener("abort", abortRequest, { once: true });

  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  const response = await fetch(url, {
    ...options,
    signal: controller.signal,
  }).finally(() => {
    clearTimeout(timeoutId);
    externalSignal?.removeEventListener("abort", abortRequest);
  });

  if (response.status !== 429 || retries === 0) {
    return response;
  }

  const retryAfter = Number(response.headers.get("Retry-After"));
  const delay = Number.isFinite(retryAfter) && retryAfter > 0
    ? retryAfter * 1000
    : 5000;

  await wait(delay, externalSignal);

  return fetchWithRetry(url, options, retries - 1);
}

async function fetchJson(url, options) {
  const response = await fetchWithRetry(url, options);

  if (!response.ok) {
    throw new Error(`HTTP error ${response.status}`);
  }

  return response.json();
}

export async function fetchTenderSearchPage({ edrpou, page, signal }) {
  const params = new URLSearchParams();

  params.append("buyer[]", edrpou);
  params.append("page", String(page));

  return fetchJson(`${SITE_API_PREFIX}/search/tenders?${params}`, {
    method: "POST",
    signal,
  });
}

export async function fetchTenderSummary(tenderID, signal) {
  return fetchJson(`${SITE_API_PREFIX}/tenders/${tenderID}/summary`, { signal });
}

export async function fetchTendersPage(url) {
  return fetchJson(url);
}

export async function fetchTenderDetails(id, signal) {
  const json = await fetchJson(`${DETAILS_API_PREFIX}/tenders/${id}`, { signal });

  return json.data;
}

export async function fetchContractDetails(id, signal) {
  if (!id) return null;

  try {
    const response = await fetchWithRetry(`${DETAILS_API_PREFIX}/contracts/${id}`, {
      signal,
    });

    if (!response.ok) {
      return null;
    }

    const json = await response.json();

    return json.data;
  } catch (error) {
    if (signal?.aborted) throw error;
    return null;
  }
}
