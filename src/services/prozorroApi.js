export async function fetchTendersPage(url) {
  const response = await fetch(url);

  if (!response.ok) {
    throw new Error(`HTTP error ${response.status}`);
  }

  return response.json();
}

export async function fetchTenderDetails(id) {
  const response = await fetch(`/prozorro/api/0/tenders/${id}`);

  if (!response.ok) {
    throw new Error(`HTTP error ${response.status}`);
  }

  const json = await response.json();
  return json.data;
}

export async function fetchContractDetails(id) {
  if (!id) return null;

  const response = await fetch(`/prozorro/api/0/contracts/${id}`);

  if (!response.ok) {
    return null;
  }

  const json = await response.json();
  return json.data;
}
