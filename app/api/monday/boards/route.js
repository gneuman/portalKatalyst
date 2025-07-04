import { postMonday } from "@/libs/monday";

export async function POST(req) {
  try {
    const { page = 1, limit = 50 } = await req.json();

    // Consulta para obtener todos los boards con paginación
    const query = `query { 
      boards(limit: ${limit}, page: ${page}) {
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
        workspace {
          id
          name
          kind
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
      workspace: board.workspace,
      updated_at: board.updated_at,
      columns_count: board.columns?.length || 0,
    }));

    const result = {
      boards: boards,
      page: page,
      limit: limit,
      hasMore: boards.length === limit,
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
