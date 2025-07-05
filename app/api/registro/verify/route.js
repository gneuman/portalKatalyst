import { postMonday } from "@/libs/monday";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const katalystId = searchParams.get("katalystId");
    const boardId = searchParams.get("boardId");

    if (!katalystId || !boardId) {
      return NextResponse.json(
        { error: "katalystId y boardId son requeridos" },
        { status: 400 }
      );
    }

    console.log(
      `[VERIFY] Verificando katalystId ${katalystId} en board ${boardId}`
    );

    // Buscar items en el board que tengan el contacto
    const query = `query {
      boards(ids: [${boardId}]) {
        id
        name
        items_page(limit: 100) {
          items {
            id
            name
            column_values {
              id
              text
              value
              column {
                id
                title
                type
              }
            }
          }
        }
      }
    }`;

    const res = await postMonday(query);
    const board = res?.data?.boards?.[0];

    if (!board) {
      return NextResponse.json(
        { error: "Board no encontrado" },
        { status: 404 }
      );
    }

    const items = board.items_page?.items || [];
    let encontrado = false;
    let itemInfo = null;

    for (const item of items) {
      // Buscar columna de contacto
      const contactColumn = item.column_values.find(
        (col) =>
          col.column?.type === "board_relation" ||
          col.column?.title.toLowerCase().includes("contacto") ||
          col.column?.title.toLowerCase().includes("contact")
      );

      if (contactColumn && contactColumn.value) {
        try {
          const contactIds = JSON.parse(contactColumn.value);
          if (
            contactIds.item_ids &&
            contactIds.item_ids.includes(parseInt(katalystId))
          ) {
            encontrado = true;
            itemInfo = {
              itemId: item.id,
              itemName: item.name,
              boardId: board.id,
              boardName: board.name,
            };
            break;
          }
        } catch (e) {
          console.log(`[VERIFY] Error parsing contact column:`, e);
        }
      }
    }

    return NextResponse.json({
      success: true,
      encontrado,
      itemInfo,
      boardName: board.name,
    });
  } catch (error) {
    console.error(`[VERIFY] Error:`, error);
    return NextResponse.json(
      { error: "Error interno del servidor", details: error.message },
      { status: 500 }
    );
  }
}
