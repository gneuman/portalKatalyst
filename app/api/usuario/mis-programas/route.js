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

    // 1. Obtener todos los programas del board de programas
    const programasQuery = `query {
      boards(ids: [${PROGRAMAS_BOARD}]) {
        id
        name
        columns { id title type }
        items_page(limit: 100) {
          items {
            id
            name
            column_values {
              id
              text
              value
              column { id title type }
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

    // 2. Filtrar programas de tipo formulario y obtener boards destino
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

    const boardsDestino = [];
    const programasInfo = {};
    for (const item of board.items_page?.items || []) {
      const tipo = tipoCol
        ? item.column_values.find((col) => col.column?.id === tipoCol.id)?.text
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
      if (tipo !== "info" && boardDestino) {
        boardsDestino.push(boardDestino);
        programasInfo[boardDestino] = { nombre, programaId: item.id };
      }
    }

    // 3. Buscar en cada board destino si el usuario está en MondayId Contacto o Contacto
    const misProgramas = [];
    for (const boardId of boardsDestino) {
      // Obtener columnas y items del board destino
      const boardQuery = `query {
        boards(ids: [${boardId}]) {
          id
          name
          columns { id title type }
          items_page(limit: 100) {
            items {
              id
              name
              column_values {
                id
                text
                value
                column { id title type }
              }
              subitems { id name }
            }
          }
        }
      }`;
      const boardRes = await postMonday(boardQuery);
      const progBoard = boardRes?.data?.boards?.[0];
      if (!progBoard) continue;
      const mondayIdContactoCol = progBoard.columns.find(
        (col) =>
          col.title.toLowerCase().includes("mondayid contacto") ||
          col.title.toLowerCase().includes("monday id contacto")
      );
      const contactoCol = progBoard.columns.find(
        (col) =>
          col.type === "board_relation" ||
          col.title.toLowerCase().includes("contacto")
      );
      for (const item of progBoard.items_page?.items || []) {
        let match = false;
        // Buscar por MondayId Contacto (texto)
        if (mondayIdContactoCol) {
          const val = item.column_values.find(
            (col) => col.column?.id === mondayIdContactoCol.id
          );
          if (val && val.text === katalystId) match = true;
        }
        // Buscar por relación de contacto
        if (!match && contactoCol) {
          const val = item.column_values.find(
            (col) => col.column?.id === contactoCol.id
          );
          if (val && val.value) {
            try {
              const rel = JSON.parse(val.value);
              if (rel.item_ids && rel.item_ids.includes(parseInt(katalystId)))
                match = true;
            } catch {}
          }
        }
        if (match) {
          misProgramas.push({
            programaId: programasInfo[boardId]?.programaId,
            programaNombre: programasInfo[boardId]?.nombre || "",
            boardId: boardId,
            boardName: progBoard.name,
            itemId: item.id,
            itemName: item.name,
            status: "-", // Puedes agregar lógica para status si lo necesitas
            tieneOnboarding: item.subitems?.some((sub) =>
              sub.name.toLowerCase().includes("onboarding")
            ),
            subitems: item.subitems,
          });
        }
      }
    }

    return NextResponse.json({
      success: true,
      programas: misProgramas,
      total: misProgramas.length,
    });
  } catch (error) {
    console.error(`[MIS-PROGRAMAS] Error:`, error);
    return NextResponse.json(
      { error: "Error interno del servidor", details: error.message },
      { status: 500 }
    );
  }
}
