import { NextResponse } from "next/server";

export async function GET() {
  try {
    console.log("=== PRUEBA DE CONEXIÓN CON MONDAY ===");
    console.log("MONDAY_API_KEY configurado:", !!process.env.MONDAY_API_KEY);
    console.log("MONDAY_BOARD_ID configurado:", !!process.env.MONDAY_BOARD_ID);

    // Prueba simple de la API de Monday
    const response = await fetch("https://api.monday.com/v2", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: process.env.MONDAY_API_KEY,
      },
      body: JSON.stringify({
        query: "query { me { name email } }",
      }),
    });

    console.log("Status de la respuesta:", response.status);
    console.log("Headers:", Object.fromEntries(response.headers.entries()));

    const responseText = await response.text();
    console.log("Respuesta raw:", responseText);

    let data;
    try {
      data = JSON.parse(responseText);
    } catch (parseError) {
      console.error("Error al parsear JSON:", parseError);
      return NextResponse.json(
        {
          error: "Error al parsear JSON",
          details: parseError.message,
          rawResponse: responseText,
          status: response.status,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      data,
      status: response.status,
      apiKeyConfigured: !!process.env.MONDAY_API_KEY,
      boardIdConfigured: !!process.env.MONDAY_BOARD_ID,
    });
  } catch (error) {
    console.error("Error en prueba de Monday:", error);
    return NextResponse.json(
      {
        error: "Error en prueba de Monday",
        details: error.message,
        stack: error.stack,
      },
      { status: 500 }
    );
  }
}
