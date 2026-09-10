export function normalizeDkCode(value = "") {
  const match = value.trim().match(/^(\d{8}-\d)/);

  return match?.[1] || "";
}

export function getDkCodePrefix(code) {
  const digits = code.slice(0, 8);

  return digits.replace(/0+$/, "");
}
