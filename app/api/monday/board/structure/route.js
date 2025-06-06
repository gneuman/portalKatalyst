import { NextResponse } from "next/server";
import { postMonday } from "@/libs/monday";

export async function POST(request) {
  try {
    console.log("=== INICIO DE OBTENCIÓN DE ESTRUCTURA DEL BOARD ===");
    const boardId = process.env.MONDAY_BOARD_ID;

    console.log("Board ID del servidor:", boardId);

    if (!boardId) {
      console.error(
        "No se encontró el ID del board en las variables de entorno"
      );
      return NextResponse.json(
        { error: "Error de configuración: ID del board no encontrado" },
        { status: 500 }
      );
    }

    const query = `query { 
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

    console.log("Query a ejecutar:", query);

    const response = await postMonday(query);

    console.log("Respuesta de Monday:", response);
    console.log("=== FIN DE OBTENCIÓN DE ESTRUCTURA DEL BOARD ===");

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error al obtener estructura del board:", error);
    return NextResponse.json(
      { error: "Error al obtener estructura del board" },
      { status: 500 }
    );
  }
}
