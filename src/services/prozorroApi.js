const DETAILS_API_PREFIX = "/prozorro/api/2.5";
const SITE_API_PREFIX = "/prozorro-search/api";

function wait(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function fetchWithRetry(url, options = {}, retries = 3) {
  const response = await fetch(url, options);

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

function addOneDay(dateValue) {
  const [year, month, day] = dateValue.split("-").map(Number);
  const date = new Date(year, month - 1, day);

  date.setDate(date.getDate() + 1);

  const nextYear = date.getFullYear();
  const nextMonth = String(date.getMonth() + 1).padStart(2, "0");
  const nextDay = String(date.getDate()).padStart(2, "0");

  return `${nextYear}-${nextMonth}-${nextDay}`;
}

export async function fetchTenderSearchPage({ edrpou, dateFrom, dateTo, page }) {
  const params = new URLSearchParams();

  params.append("buyer[]", edrpou);
  params.append("date[tender][start]", dateFrom);
  params.append("date[tender][end]", addOneDay(dateTo));
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

  const response = await fetchWithRetry(`${DETAILS_API_PREFIX}/contracts/${id}`);

  if (!response.ok) {
    return null;
  }

  const json = await response.json();

  return json.data;
}
