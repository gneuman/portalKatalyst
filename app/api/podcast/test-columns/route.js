import { NextResponse } from "next/server";
import { postMonday } from "@/libs/monday";

const PODCAST_BOARD_ID = process.env.MONDAY_PODCAST_BOARD_ID;

export async function GET() {
  try {
    console.log("[TEST-COLUMNS] Verificando columnas del board...");
    console.log("[TEST-COLUMNS] Board ID:", PODCAST_BOARD_ID);

    // Query simple para obtener información del board
    const query = `
      query {
        boards(ids: [${PODCAST_BOARD_ID}]) {
          id
          name
          columns {
            id
            title
            type
          }
        }
      }
    `;

    console.log("[TEST-COLUMNS] Ejecutando query...");
    const response = await postMonday(query);
    console.log(
      "[TEST-COLUMNS] Response recibida:",
      JSON.stringify(response, null, 2)
    );

    const board = response?.data?.boards?.[0];

    if (!board) {
      return NextResponse.json(
        { error: "No se pudo obtener información del board" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      boardInfo: {
        id: board.id,
        name: board.name,
        totalColumns: board.columns.length,
      },
      allColumns: board.columns.map((col) => ({
        id: col.id,
        title: col.title,
        type: col.type,
      })),
    });
  } catch (error) {
    console.error("[TEST-COLUMNS] Error:", error);
    return NextResponse.json(
      { error: "Error verificando columnas", details: error.message },
      { status: 500 }
    );
  }
}
