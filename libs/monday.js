const MONDAY_API_URL = "https://api.monday.com/v2";

export async function postMonday(query) {
  const res = await fetch(MONDAY_API_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: process.env.MONDAY_API_KEY,
    },
    body: JSON.stringify({ query }),
  });
  if (!res.ok) {
    throw new Error(`Monday API error: ${res.status}`);
  }
  return await res.json();
}
