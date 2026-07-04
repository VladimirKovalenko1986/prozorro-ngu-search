const DETAILS_API_PREFIX = "/prozorro/api/2.5";
const SITE_API_PREFIX = "/prozorro-search/api";
const FETCH_TIMEOUT_MS = 15000;

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(url, options = {}, retries = 3) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  const response = await fetch(url, {
    ...options,
    signal: controller.signal,
  }).finally(() => clearTimeout(timeoutId));

  if (response.status !== 429 || retries === 0) {
    return response;
  }

  const retryAfter = Number(response.headers.get("Retry-After"));
  const delay = Number.isFinite(retryAfter) && retryAfter > 0
    ? retryAfter * 1000
    : 5000;

  await wait(delay);

  return fetchWithRetry(url, options, retries - 1);
}

async function fetchJson(url, options) {
  const response = await fetchWithRetry(url, options);

  if (!response.ok) {
    throw new Error(`HTTP error ${response.status}`);
  }

  return response.json();
}

export async function fetchTenderSearchPage({ edrpou, page, searchText = "" }) {
  const params = new URLSearchParams();

  params.append("buyer[]", edrpou);
  if (searchText.trim()) {
    params.append("text", searchText.trim());
  }
  params.append("page", String(page));

  return fetchJson(`${SITE_API_PREFIX}/search/tenders?${params}`, {
    method: "POST",
  });
}

export async function fetchTenderSummary(tenderID) {
  return fetchJson(`${SITE_API_PREFIX}/tenders/${tenderID}/summary`);
}

export async function fetchTendersPage(url) {
  return fetchJson(url);
}

export async function fetchTenderDetails(id) {
  const json = await fetchJson(`${DETAILS_API_PREFIX}/tenders/${id}`);

  return json.data;
}

export async function fetchContractDetails(id) {
  if (!id) return null;

  try {
    const response = await fetchWithRetry(`${DETAILS_API_PREFIX}/contracts/${id}`);

    if (!response.ok) {
      return null;
    }

    const json = await response.json();

    return json.data;
  } catch {
    return null;
  }
}
