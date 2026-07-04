export function readStoredChecks(key) {
  try {
    return JSON.parse(localStorage.getItem(key)) || {};
  } catch {
    return {};
  }
}

export function writeStoredChecks(key, value) {
  localStorage.setItem(key, JSON.stringify(value));
}
