import { postMonday } from "@/libs/monday";

export async function POST(req) {
  try {
    const { boardId, page = 1, limit = 10 } = await req.json();

    if (!boardId) {
      return new Response(JSON.stringify({ error: "Falta el boardId" }), {
        status: 400,
      });
    }

    // Consulta para obtener items paginados con columnas básicas
    const query = `query { 
      boards(ids: [${boardId}]) { 
        id 
        name 
        items_page(limit: ${limit}) {
          items {
            id 
            name 
            updated_at 
            column_values { 
              id 
              text 
              value 
              column {
                id 
                title 
                type 
                settings_str 
              }
              ...on StatusValue {
                label
                updated_at
                label_style {
                  color
                }
              }
              ...on BoardRelationValue {
                display_value
              }
              ...on LocationValue {
                address
                lat
                lng
              }
              ...on DateValue {
                date
              }
              ...on NumbersValue {
                number
              }
              ...on CheckboxValue {
                checked
              }
            }
            subitems {
              id
              name
            }
          }
          cursor
        }
      } 
    }`;

    const mondayRes = await postMonday(query);

    if (!mondayRes?.data?.boards?.length) {
      return new Response(
        JSON.stringify({ error: "No se encontró la tabla" }),
        {
          status: 404,
        }
      );
    }

    const board = mondayRes.data.boards[0];
    const itemsPage = board.items_page;

    const result = {
      board: {
        id: board.id,
        name: board.name,
      },
      items: itemsPage.items || [],
      pagination: {
        limit: parseInt(limit),
        cursor: itemsPage.cursor,
        hasMore: !!itemsPage.cursor,
      },
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error Monday items:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}
