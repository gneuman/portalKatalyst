import { postMonday } from "@/libs/monday";

export async function POST(req) {
  try {
    // Consulta para obtener todos los boards
    const query = `query { 
      boards {
        id 
        name 
        board_kind
        description
        state
        permissions
        owner {
          id
          name
        }
        updated_at
        columns {
          id
          title
          type
        }
      } 
    }`;

    const mondayRes = await postMonday(query);

    if (!mondayRes?.data?.boards) {
      return new Response(
        JSON.stringify({ error: "No se pudieron obtener los boards" }),
        {
          status: 404,
        }
      );
    }

    const boards = mondayRes.data.boards.map((board) => ({
      id: board.id,
      name: board.name,
      board_kind: board.board_kind,
      description: board.description,
      state: board.state,
      permissions: board.permissions,
      owner: board.owner,
      updated_at: board.updated_at,
      columns_count: board.columns?.length || 0,
    }));

    const result = {
      boards: boards,
      total: boards.length,
    };

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error Monday boards:", error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
    });
  }
}
