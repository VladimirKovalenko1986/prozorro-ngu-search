export function getEndOfDay(dateValue) {
  const date = new Date(dateValue);
  date.setHours(23, 59, 59, 999);

  return date;
}

export function isDateInPeriod(dateValue, dateFrom, dateTo) {
  if (!dateValue) return false;

  const date = new Date(dateValue);
  const from = new Date(dateFrom);
  const to = getEndOfDay(dateTo);

  return date >= from && date <= to;
}

export function formatInputDate(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
}

export function normalizeDateRange(firstDate, secondDate) {
  if (firstDate <= secondDate) {
    return { dateFrom: firstDate, dateTo: secondDate };
  }

  return { dateFrom: secondDate, dateTo: firstDate };
}

export function getDefaultDateFrom() {
  const today = new Date();

  return formatInputDate(new Date(today.getFullYear(), today.getMonth(), 1));
}

export function getDefaultDateTo() {
  return formatInputDate(new Date());
}

export function getDateFromTenderId(tenderID) {
  const match = tenderID?.match(/^UA-(\d{4})-(\d{2})-(\d{2})-/);

  if (!match) return null;

  return `${match[1]}-${match[2]}-${match[3]}`;
}
