import { postMonday } from "@/libs/monday";
import { NextResponse } from "next/server";

const PROGRAMAS_BOARD = process.env.PROGRAMAS_BOARD;

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const katalystId = searchParams.get("katalystId");

    if (!katalystId) {
      return NextResponse.json(
        { error: "katalystId es requerido" },
        { status: 400 }
      );
    }

    // PASO 1: Obtener la lista de boards de programas desde la configuración
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

    // PASO 2: Consultar status en todos los boards de programas
    const boardIds = programas.map((p) => p.boardId).filter(Boolean);

    if (boardIds.length === 0) {
      return NextResponse.json({
        success: true,
        programas: [],
        message: "No hay programas configurados",
      });
    }

    // Consultar status en cada board
    const boardsQuery = `query {
      boards(ids: [${boardIds.join(",")}]) {
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
            subitems {
              id
              name
            }
          }
        }
      }
    }`;

    const boardsRes = await postMonday(boardsQuery);
    const boards = boardsRes?.data?.boards || [];

    const aplicaciones = [];

    for (const board of boards) {
      const items = board.items_page?.items || [];

      for (const item of items) {
        // Buscar si este item tiene el contacto del usuario
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
              // Buscar columna de status
              const statusColumn = item.column_values.find(
                (col) =>
                  col.column?.type === "status" ||
                  col.column?.title.toLowerCase().includes("status") ||
                  col.column?.title.toLowerCase().includes("estado")
              );

              const status = statusColumn?.text || "En revisión";

              // Verificar si tiene subitem de onboarding
              const tieneOnboarding = item.subitems?.some((sub) =>
                sub.name.toLowerCase().includes("onboarding")
              );

              aplicaciones.push({
                boardId: board.id,
                boardName: board.name,
                itemId: item.id,
                itemName: item.name,
                status: status,
                tieneOnboarding: tieneOnboarding,
                fechaCreacion: item.created_at,
              });
            }
          } catch (e) {
            console.log(`[STATUS] Error parsing contact column:`, e);
          }
        }
      }
    }

    console.log(`[STATUS] Aplicaciones encontradas:`, aplicaciones.length);

    return NextResponse.json({
      success: true,
      aplicaciones,
      total: aplicaciones.length,
    });
  } catch (error) {
    console.error(`[STATUS] Error:`, error);
    return NextResponse.json(
      { error: "Error interno del servidor", details: error.message },
      { status: 500 }
    );
  }
}
