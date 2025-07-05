import { postMonday } from "@/libs/monday";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const { katalystId, boardId, itemId, razon } = await req.json();

    if (!katalystId || !boardId || !itemId || !razon) {
      return NextResponse.json(
        { error: "katalystId, boardId, itemId y razon son requeridos" },
        { status: 400 }
      );
    }

    console.log(
      `[UPDATE-RAZON] Actualizando razón para ${katalystId} en item ${itemId}`
    );

    // PASO 1: Obtener las columnas del board para encontrar la columna de razón
    const boardQuery = `query {
      boards(ids: [${boardId}]) {
        id
        name
        columns {
          id
          title
          type
        }
      }
    }`;

    const boardRes = await postMonday(boardQuery);
    const board = boardRes?.data?.boards?.[0];

    if (!board) {
      return NextResponse.json(
        { error: "Board no encontrado" },
        { status: 404 }
      );
    }

    // Buscar la columna de razón
    const razonColumn = board.columns.find(
      (col) =>
        col.title.toLowerCase().includes("razón") ||
        col.title.toLowerCase().includes("razon") ||
        col.title.toLowerCase().includes("reason")
    );

    if (!razonColumn) {
      return NextResponse.json(
        { error: "No se encontró la columna de razón en el board" },
        { status: 404 }
      );
    }

    // PASO 2: Actualizar el item con la razón
    const updateQuery = `mutation {
      change_multiple_column_values(
        board_id: ${boardId},
        item_id: ${itemId},
        column_values: "${JSON.stringify({
          [razonColumn.id]: razon,
        }).replace(/"/g, '\\"')}"
      ) {
        id
        name
      }
    }`;

    const updateRes = await postMonday(updateQuery);

    if (updateRes?.data?.change_multiple_column_values) {
      console.log(`[UPDATE-RAZON] Razón actualizada exitosamente`);

      return NextResponse.json({
        success: true,
        message: "Razón actualizada exitosamente",
      });
    } else {
      throw new Error("Error al actualizar la razón");
    }
  } catch (error) {
    console.error(`[UPDATE-RAZON] Error:`, error);
    return NextResponse.json(
      { error: "Error interno del servidor", details: error.message },
      { status: 500 }
    );
  }
}
