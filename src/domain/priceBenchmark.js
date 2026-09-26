import { normalizeText } from "../utils/text.js";

const GENERIC_PRODUCT_WORDS = new Set([
  "або",
  "каша",
  "крупа",
  "крупи",
  "для",
  "з",
  "за",
  "закупівля",
  "комплект",
  "лот",
  "на",
  "по",
  "послуга",
  "предмет",
  "придбання",
  "поставка",
  "та",
  "товар",
  "у",
]);

function getProductName(procedure, row) {
  return (row.specificationTitle || row.lotTitle || procedure.title || "").replace(
    /^\d+\.\s*/,
    "",
  );
}

function getProductTokens(value) {
  return normalizeText(value)
    .split(" ")
    .filter((token) => token.length > 1 && !GENERIC_PRODUCT_WORDS.has(token));
}

function getWordRoot(token) {
  if (/^\d/.test(token)) return token;

  return token.slice(0, Math.min(token.length, 4));
}

function getRequiredNumbers(value) {
  return normalizeText(value).match(/\d+(?:[.,]\d+)?/g) || [];
}

function getNameSignature(value) {
  const tokens = getProductTokens(value);
  const roots = [...new Set(tokens.map(getWordRoot))];
  const numbers = [...new Set(getRequiredNumbers(value))];

  return {
    numbers,
    roots,
  };
}

function isMatchingProductName(target, procedure, row) {
  const candidate = getNameSignature(getProductName(procedure, row));

  if (target.nameNumbers.some((number) => !candidate.numbers.includes(number))) {
    return false;
  }

  const matchedRoots = target.nameRoots.filter((root) => candidate.roots.includes(root));
  const requiredMatches = Math.max(1, Math.ceil(target.nameRoots.length * 0.6));

  return matchedRoots.length >= requiredMatches;
}

export function getPriceBenchmarkTarget(procedure, row) {
  const classificationIds = [...new Set(row.classificationIds || [])].filter(Boolean);
  const unitKey = normalizeText(row.unitName);
  const currency = row.expectedCurrency || "UAH";
  const nameSignature = getNameSignature(getProductName(procedure, row));

  if (classificationIds.length !== 1 || !unitKey || nameSignature.roots.length === 0) {
    return null;
  }

  const dkCode = classificationIds[0];

  return {
    currency,
    dkCode,
    key: `${dkCode}|${unitKey}|${currency}|${nameSignature.roots.join(",")}|${nameSignature.numbers.join(",")}`,
    nameNumbers: nameSignature.numbers,
    nameRoots: nameSignature.roots,
    unitKey,
  };
}

export function getPriceBenchmarkSample(procedure, row, target) {
  const quantity = Number(row.quantity);
  const amount = Number(row.contractAmount);
  const contractCurrency = row.contractCurrency || "UAH";

  if (
    !row.classificationIds?.includes(target.dkCode) ||
    normalizeText(row.unitName) !== target.unitKey ||
    contractCurrency !== target.currency ||
    !isMatchingProductName(target, procedure, row) ||
    !row.dateSigned ||
    !Number.isFinite(quantity) ||
    quantity <= 0 ||
    !Number.isFinite(amount) ||
    amount <= 0
  ) {
    return null;
  }

  return {
    amount,
    contractKey: `${procedure.tenderID}|${row.contractNumber}|${row.dateSigned}`,
    dateSigned: row.dateSigned,
    quantity,
  };
}

export function getDateMonthsAgo(months, now = new Date()) {
  const date = new Date(now);

  date.setMonth(date.getMonth() - months);

  return date;
}

export function getWeightedPriceBenchmark(samples, months, now = new Date()) {
  const cutoff = getDateMonthsAgo(months, now);
  const relevantSamples = samples.filter((sample) => new Date(sample.dateSigned) >= cutoff);
  const totalAmount = relevantSamples.reduce((total, sample) => total + sample.amount, 0);
  const totalQuantity = relevantSamples.reduce((total, sample) => total + sample.quantity, 0);
  const contractCount = new Set(relevantSamples.map((sample) => sample.contractKey)).size;

  if (!contractCount || !totalQuantity) {
    return null;
  }

  return {
    averageUnitPrice: totalAmount / totalQuantity,
    contractCount,
    months,
  };
}
