import { postMonday } from "@/libs/monday";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const { searchParams } = new URL(req.url);
    const boardId = searchParams.get("boardId");

    if (!boardId) {
      return NextResponse.json(
        { error: "boardId es requerido" },
        { status: 400 }
      );
    }

    console.log(`[VALIDATE-BOARD] Validando board:`, boardId);

    // PASO 1: Verificar si el board está en la lista de programas
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

    const boardIdCol = programasData.columns.find(
      (c) => c.title === "Board destino"
    );
    const esProgramaValido =
      boardIdCol &&
      programasData.programas.some((prog) => prog[boardIdCol.id] === boardId);

    if (!esProgramaValido) {
      return NextResponse.json({
        success: false,
        esValido: false,
        error: "Este board no está configurado como programa válido",
      });
    }

    // PASO 2: Verificar estructura del board
    const boardQuery = `query { 
      boards(ids: [${boardId}]) { 
        id 
        name 
        columns { 
          id 
          title 
          type 
          settings_str 
        } 
      } 
    }`;

    const boardRes = await postMonday(boardQuery);
    const board = boardRes?.data?.boards?.[0];

    if (!board) {
      return NextResponse.json(
        { error: "Board no encontrado" },
        { status: 404 }
      );
    }

    // PASO 3: Verificar que tenga las columnas necesarias
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

    const estructuraValida = tieneContacto && tieneStatus;

    return NextResponse.json({
      success: true,
      esValido: estructuraValida,
      boardName: board.name,
      tieneContacto,
      tieneStatus,
      columnas: board.columns.map((col) => ({
        id: col.id,
        title: col.title,
        type: col.type,
      })),
    });
  } catch (error) {
    console.error(`[VALIDATE-BOARD] Error:`, error);
    return NextResponse.json(
      { error: "Error interno del servidor", details: error.message },
      { status: 500 }
    );
  }
}
