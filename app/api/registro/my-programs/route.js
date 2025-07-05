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

    console.log(
      `[MY-PROGRAMS] Buscando programas para katalystId:`,
      katalystId
    );

    // PASO 1: Obtener todos los programas del board de programas
    const programasQuery = `query {
      boards(ids: [${PROGRAMAS_BOARD}]) {
        id
        name
        columns {
          id
          title
          type
        }
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

    const programasRes = await postMonday(programasQuery);
    const board = programasRes?.data?.boards?.[0];

    if (!board) {
      return NextResponse.json(
        { error: "No se encontró el board de programas" },
        { status: 404 }
      );
    }

    // PASO 2: Buscar columnas importantes
    const mondayIdContactoCol = board.columns.find(
      (col) =>
        col.title.toLowerCase().includes("mondayid contacto") ||
        col.title.toLowerCase().includes("monday id contacto")
    );

    const tipoCol = board.columns.find((col) =>
      col.title.toLowerCase().includes("tipo")
    );

    const boardDestinoCol = board.columns.find((col) =>
      col.title.toLowerCase().includes("board destino")
    );

    const nombreCol = board.columns.find(
      (col) =>
        col.title.toLowerCase().includes("nombre") ||
        col.title.toLowerCase().includes("título") ||
        col.title.toLowerCase().includes("titulo")
    );

    console.log(`[MY-PROGRAMS] Columnas encontradas:`, {
      mondayIdContacto: mondayIdContactoCol?.title,
      tipo: tipoCol?.title,
      boardDestino: boardDestinoCol?.title,
      nombre: nombreCol?.title,
    });

    // PASO 3: Buscar programas donde el usuario esté presente
    const misProgramas = [];

    for (const item of board.items_page?.items || []) {
      // Verificar si el usuario está en este programa
      let usuarioPresente = false;

      if (mondayIdContactoCol) {
        const mondayIdValue = item.column_values.find(
          (col) => col.column?.id === mondayIdContactoCol.id
        );
        if (mondayIdValue && mondayIdValue.text === katalystId) {
          usuarioPresente = true;
        }
      }

      if (usuarioPresente) {
        // Obtener información del programa
        const tipo = tipoCol
          ? item.column_values.find((col) => col.column?.id === tipoCol.id)
              ?.text
          : "formulario";

        const boardDestino = boardDestinoCol
          ? item.column_values.find(
              (col) => col.column?.id === boardDestinoCol.id
            )?.text
          : null;

        const nombre = nombreCol
          ? item.column_values.find((col) => col.column?.id === nombreCol.id)
              ?.text
          : item.name;

        // Solo incluir si no es de tipo "info" y tiene board destino
        if (tipo !== "info" && boardDestino) {
          // Buscar el status del usuario en el board destino
          try {
            const statusRes = await fetch(
              `${process.env.NEXTAUTH_URL}/api/registro/person-status?katalystId=${katalystId}&boardId=${boardDestino}`
            );
            const statusData = await statusRes.json();

            if (statusData.success && statusData.encontrado) {
              misProgramas.push({
                programaId: item.id,
                programaNombre: nombre,
                boardId: boardDestino,
                boardName: statusData.boardName,
                itemId: statusData.itemId,
                itemName: statusData.itemName,
                status: statusData.status,
                tieneOnboarding: statusData.tieneOnboarding,
                tieneRazon: statusData.tieneRazon,
                subitems: statusData.subitems,
              });
            }
          } catch (error) {
            console.error(
              `[MY-PROGRAMS] Error al obtener status para board ${boardDestino}:`,
              error
            );
          }
        }
      }
    }

    console.log(`[MY-PROGRAMS] Programas encontrados:`, misProgramas.length);

    return NextResponse.json({
      success: true,
      programas: misProgramas,
      total: misProgramas.length,
    });
  } catch (error) {
    console.error(`[MY-PROGRAMS] Error:`, error);
    return NextResponse.json(
      { error: "Error interno del servidor", details: error.message },
      { status: 500 }
    );
  }
}
