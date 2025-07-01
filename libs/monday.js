const MONDAY_API_URL = "https://api.monday.com/v2";

export async function mondayQuery(query, apiKey) {
  console.log("=== INICIO DE LLAMADA A MONDAY API ===");
  console.log("Query a ejecutar:", query);
  console.log("API Key presente:", !!(apiKey || process.env.MONDAY_API_KEY));

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

    console.log("Status de la respuesta:", res.status);

    const data = await res.json();
    console.log("Respuesta de Monday:", JSON.stringify(data, null, 2));

    if (!res.ok) {
      throw new Error(`HTTP error! status: ${res.status}`);
    }

    if (data.errors) {
      console.error("Errores de Monday.com:", data.errors);
      throw new Error(`Monday.com errors: ${JSON.stringify(data.errors)}`);
    }

    console.log("=== FIN DE LLAMADA A MONDAY API ===");
    return data;
  } catch (error) {
    console.error("Error en Monday API:", error);
    throw error;
  }
}

// Alias para mantener compatibilidad con el código existente
export const postMonday = mondayQuery;
