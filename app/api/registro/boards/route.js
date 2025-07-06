import { postMonday } from "@/libs/monday";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    // Obtener información de boards de programas
    const programasRes = await fetch(
      `${process.env.NEXTAUTH_URL}/api/programas`
    );
    const programasData = await programasRes.json();

    if (!programasData.programas) {
      return NextResponse.json(
        { error: "No se pudieron obtener los programas" },
        { status: 500 }
      );
    }

    // Extraer todos los boardIds únicos de los programas
    const boardIds = [];
    const boardIdCol = programasData.columns.find(
      (c) => c.title === "Board destino"
    );

    if (boardIdCol) {
      programasData.programas.forEach((prog) => {
        const boardId = prog[boardIdCol.id];
        if (boardId && !boardIds.includes(boardId)) {
          boardIds.push(boardId);
        }
      });
    }

    if (boardIds.length === 0) {
      return NextResponse.json({
        success: true,
        boards: [],
      });
    }

    // PASO 2: Obtener información detallada de cada board
    const boardsQuery = `query {
      boards(ids: [${boardIds.join(",")}]) {
        id
        name
        description
        columns {
          id
          title
          type
          settings_str
        }
        items_page(limit: 1) {
          cursor
        }
      }
    }`;

    const boardsRes = await postMonday(boardsQuery);
    const boards = boardsRes?.data?.boards || [];

    // PASO 3: Mapear información de cada board
    const boardsInfo = boards.map((board) => {
      const tieneContacto = board.columns.some(
        (col) =>
          col.title.toLowerCase().includes("contacto") ||
          col.title.toLowerCase().includes("contact") ||
          col.type === "board_relation"
      );

      const tieneStatus = board.columns.some(
        (col) =>
          col.type === "status" ||
          col.title.toLowerCase().includes("status") ||
          col.title.toLowerCase().includes("estado")
      );

      return {
        id: board.id,
        name: board.name,
        description: board.description,
        tieneContacto,
        tieneStatus,
        estructuraValida: tieneContacto && tieneStatus,
        columnas: board.columns.map((col) => ({
          id: col.id,
          title: col.title,
          type: col.type,
        })),
      };
    });

    return NextResponse.json({
      success: true,
      boards: boardsInfo,
      total: boardsInfo.length,
    });
  } catch (error) {
    console.error(`[BOARDS] Error:`, error);
    return NextResponse.json(
      { error: "Error interno del servidor", details: error.message },
      { status: 500 }
    );
  }
}
