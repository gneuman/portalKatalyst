const MONDAY_API_URL = "https://api.monday.com/v2";

export async function mondayQuery(query) {
  // console.log("=== INICIO DE LLAMADA A MONDAY API ===");
  // console.log("Query a ejecutar:", query);

  try {
    const res = await fetch(MONDAY_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: process.env.MONDAY_API_KEY,
      },
      body: JSON.stringify({ query }),
    });

    // console.log("Status de la respuesta:", res.status);

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    const data = await res.json();

    // console.log("Respuesta de Monday:", data);
    // console.log("=== FIN DE LLAMADA A MONDAY API ===");

    return data;
  } catch (error) {
    console.error("Error en Monday API:", error);
    throw error;
  }
}
