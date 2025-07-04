import { NextResponse } from "next/server";
import { postMonday } from "@/libs/monday";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const itemId = searchParams.get("itemId");
    const boardId = process.env.MONDAY_PODCAST_BOARD_ID;

    // Traer todos los items (Monday no soporta items(ids: ...))
    const query = `
      query {
        boards(ids: ${boardId}) {
          id
          name
          items_page(limit: 500) {
            items {
              id
              name
              column_values {
                id
                text
                value
              }
            }
          }
        }
      }
    `;
    const response = await postMonday(query);
    const items = response.data.boards[0].items_page.items.map((item) => {
      // Forzar los campos numéricos a string numérico correcto
      const newItem = { ...item };
      newItem.column_values = item.column_values.map((col) => {
        if (col.id === "numeric_mkshtg2f" || col.id === "numeric_mkshy1xp") {
          let numStr = "0";
          try {
            if (
              typeof col.value === "string" &&
              col.value.startsWith('"') &&
              col.value.endsWith('"')
            ) {
              numStr = col.value.replace(/"/g, "");
            } else if (typeof col.value === "string") {
              numStr = col.value;
            } else if (typeof col.value === "number") {
              numStr = String(col.value);
            }
          } catch (e) {
            numStr = "0";
          }
          return { ...col, text: numStr, value: numStr };
        }
        return col;
      });
      return newItem;
    });

    if (itemId) {
      const item = items.find((i) => i.id === itemId);
      return NextResponse.json({ success: true, item });
    }

    return NextResponse.json({ success: true, items, total: items.length });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 500 }
    );
  }
}
