const MONDAY_API_URL = "https://api.monday.com/v2";

export async function mondayQuery(query) {
  console.log("=== INICIO DE LLAMADA A MONDAY API ===");
  console.log("Query a ejecutar:", query);
  console.log("MONDAY_API_KEY configurado:", !!process.env.MONDAY_API_KEY);
  console.log("MONDAY_API_KEY length:", process.env.MONDAY_API_KEY?.length);

  try {
    const res = await fetch(MONDAY_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: process.env.MONDAY_API_KEY,
      },
      body: JSON.stringify({ query }),
    });

    console.log("Status de la respuesta:", res.status);
    console.log(
      "Headers de la respuesta:",
      Object.fromEntries(res.headers.entries())
    );

    if (!res.ok) {
      const errorText = await res.text();
      console.error("Error response text:", errorText);
      throw new Error(`HTTP error! status: ${res.status}, body: ${errorText}`);
    }

    // Intentar leer la respuesta como texto primero
    const responseText = await res.text();
    console.log("Respuesta raw de Monday:", responseText);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Error al parsear JSON:", parseError);
      console.error("Respuesta que causó el error:", responseText);
      throw new Error(`Error al parsear JSON: ${parseError.message}`);
    }

    console.log("Respuesta parseada de Monday:", data);
    console.log("=== FIN DE LLAMADA A MONDAY API ===");

    return data;
  } catch (error) {
    console.error("Error en Monday API:", error);
    throw error;
  }
}

// Alias para mantener compatibilidad con el código existente
export const postMonday = mondayQuery;
