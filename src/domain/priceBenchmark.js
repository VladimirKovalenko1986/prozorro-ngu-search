import { normalizeText } from "../utils/text.js";

export function getPriceBenchmarkTarget(row) {
  const classificationIds = [...new Set(row.classificationIds || [])].filter(Boolean);
  const unitKey = normalizeText(row.unitName);
  const currency = row.expectedCurrency || "UAH";

  if (classificationIds.length !== 1 || !unitKey) {
    return null;
  }

  const dkCode = classificationIds[0];

  return {
    currency,
    dkCode,
    key: `${dkCode}|${unitKey}|${currency}`,
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
