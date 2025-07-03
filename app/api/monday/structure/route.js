import { postMonday } from "@/libs/monday";

export async function POST(req) {
  try {
    const { boardId } = await req.json();
    if (!boardId) {
      return new Response(JSON.stringify({ error: "Falta el boardId" }), {
        status: 400,
      });
    }

    // Consulta a Monday API usando la misma lógica que funciona
    const query = `query { 
      boards(ids: [${boardId}]) { 
        id 
        name 
        board_kind
        columns { 
          id 
          title 
          type 
          settings_str 
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
    const result = {
      board: {
        id: board.id,
        name: board.name,
        board_kind: board.board_kind,
      },
      columns: board.columns,
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error Monday structure:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}
