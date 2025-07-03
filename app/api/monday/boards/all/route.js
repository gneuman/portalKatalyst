import { postMonday } from "@/libs/monday";

export async function POST(req) {
  try {
    const allBoards = [];
    let page = 1;
    const limit = 50;
    let hasMore = true;

    console.log("[MONDAY-BOARDS] Iniciando obtención de todos los boards...");

    // Obtener todos los boards usando paginación
    while (hasMore) {
      console.log(`[MONDAY-BOARDS] Obteniendo página ${page}...`);

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
        console.error(
          "[MONDAY-BOARDS] No se pudieron obtener los boards en la página",
          page
        );
        break;
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

      allBoards.push(...boards);

      // Verificar si hay más páginas
      hasMore = boards.length === limit;
      page++;

      // Evitar bucles infinitos
      if (page > 100) {
        console.warn("[MONDAY-BOARDS] Límite de páginas alcanzado (100)");
        break;
      }
    }

    console.log(
      `[MONDAY-BOARDS] Total de boards obtenidos: ${allBoards.length}`
    );

    // Agrupar por workspace para estadísticas
    const workspaces = {};
    allBoards.forEach((board) => {
      const workspaceId = board.workspace?.id || "unknown";
      const workspaceName = board.workspace?.name || "Sin workspace";

      if (!workspaces[workspaceId]) {
        workspaces[workspaceId] = {
          id: workspaceId,
          name: workspaceName,
          kind: board.workspace?.kind || "unknown",
          boards: [],
          count: 0,
        };
      }

      workspaces[workspaceId].boards.push(board);
      workspaces[workspaceId].count++;
    });

    const result = {
      boards: allBoards,
      total: allBoards.length,
      workspaces: Object.values(workspaces),
      workspacesCount: Object.keys(workspaces).length,
      statistics: {
        public: allBoards.filter((b) => b.board_kind === "public").length,
        private: allBoards.filter((b) => b.board_kind === "private").length,
        share: allBoards.filter((b) => b.board_kind === "share").length,
        active: allBoards.filter((b) => b.state === "active").length,
        archived: allBoards.filter((b) => b.state === "archived").length,
      },
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
