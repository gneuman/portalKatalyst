import { NextResponse } from "next/server";
import { postMonday } from "@/libs/monday";

const PODCAST_BOARD_ID = process.env.MONDAY_PODCAST_BOARD_ID;

export async function GET() {
  try {
    console.log("[TEST-MONDAY] Iniciando prueba de conexión...");
    console.log("[TEST-MONDAY] Variables de entorno:");
    console.log(
      "  - MONDAY_PODCAST_BOARD_ID:",
      PODCAST_BOARD_ID || "NO CONFIGURADO"
    );
    console.log(
      "  - MONDAY_API_KEY:",
      process.env.MONDAY_API_KEY ? "Configurada" : "NO CONFIGURADA"
    );

    if (!PODCAST_BOARD_ID) {
      return NextResponse.json(
        { error: "MONDAY_PODCAST_BOARD_ID no está configurado" },
        { status: 500 }
      );
    }

    if (!process.env.MONDAY_API_KEY) {
      return NextResponse.json(
        { error: "MONDAY_API_KEY no está configurada" },
        { status: 500 }
      );
    }

    // Prueba 1: Obtener información del board
    console.log("[TEST-MONDAY] Prueba 1: Obteniendo información del board...");
    const boardQuery = `
      query {
        boards(ids: [${PODCAST_BOARD_ID}]) {
          id
          name
          items_page(limit: 10) {
            items {
              id
              name
            }
          }
        }
      }
    `;

    const boardResponse = await postMonday(boardQuery);
    console.log("[TEST-MONDAY] Respuesta del board:", boardResponse);

    // Prueba 2: Crear un item de prueba
    console.log("[TEST-MONDAY] Prueba 2: Creando item de prueba...");
    const testItemQuery = `
      mutation {
        create_item(
          board_id: ${PODCAST_BOARD_ID},
          item_name: "Test Item - ${new Date().toISOString()}"
        ) {
          id
          name
        }
      }
    `;

    const createResponse = await postMonday(testItemQuery);
    console.log("[TEST-MONDAY] Respuesta de creación:", createResponse);

    return NextResponse.json({
      success: true,
      message: "Pruebas completadas",
      boardInfo: boardResponse?.data?.boards?.[0],
      testItem: createResponse?.data?.create_item,
      boardResponse,
      createResponse,
    });
  } catch (error) {
    console.error("[TEST-MONDAY] Error:", error);
    return NextResponse.json(
      {
        error: "Error en las pruebas de Monday.com",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
