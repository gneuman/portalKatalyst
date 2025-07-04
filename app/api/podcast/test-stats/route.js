import { NextResponse } from "next/server";
import { postMonday } from "@/libs/monday";

const PODCAST_BOARD_ID = process.env.MONDAY_PODCAST_BOARD_ID;

export async function POST(request) {
  try {
    const { itemId, views, likes } = await request.json();
    if (!itemId) {
      return NextResponse.json({ error: "Falta itemId" }, { status: 400 });
    }
    // Construir el objeto column_values SOLO con vistas y likes
    const columnValues = {
      numeric_mkshtg2f: String(views),
      numeric_mkshy1xp: String(likes),
    };
    const mutation = `
      mutation {
        change_multiple_column_values (
          board_id: ${PODCAST_BOARD_ID},
          item_id: ${itemId},
          column_values: "${JSON.stringify(columnValues).replace(/\"/g, '\\"')}"
        ) {
          id
          name
        }
      }
    `;
    const response = await postMonday(mutation);
    return NextResponse.json({ success: true, response });
  } catch (error) {
    console.error("[TEST-STATS-POST] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET() {
  try {
    // Consulta simple para ver los valores actuales
    const query = `
      query {
        boards(ids: [${PODCAST_BOARD_ID}]) {
          items_page(limit: 5) {
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
    const items = response?.data?.boards?.[0]?.items_page?.items || [];

    // Buscar el item específico
    const targetItem = items.find((item) => item.id === "9523576243");

    return NextResponse.json({
      success: true,
      item: targetItem,
      totalItems: items.length,
    });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
