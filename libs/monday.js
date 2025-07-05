const MONDAY_API_URL = "https://api.monday.com/v2";

export async function mondayQuery(query, apiKey) {
  try {
    const res = await fetch(MONDAY_API_URL, {
      method: "POST",
      headers: {
        "user-agent": "Make/production",
        "api-version": "2024-10",
        "content-type": "application/json",
        authorization: apiKey || process.env.MONDAY_API_KEY,
      },
      body: JSON.stringify({ query }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    if (data.errors) {
      throw new Error(`Monday.com errors: ${JSON.stringify(data.errors)}`);
    }

    return data;
  } catch (error) {
    throw error;
  }
}

export const postMonday = mondayQuery;
