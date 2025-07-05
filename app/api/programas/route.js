import { NextResponse } from "next/server";
import { postMonday } from "@/libs/monday";

const MONDAY_API_KEY = process.env.MONDAY_API_KEY;
const PROGRAMAS_BOARD = process.env.PROGRAMAS_BOARD;

export async function GET() {
  if (!MONDAY_API_KEY || !PROGRAMAS_BOARD) {
    return NextResponse.json(
      { error: "Faltan variables de entorno" },
      { status: 500 }
    );
  }

  // Query robusta: obtener items y columnas
  const query = `query { 
    boards(ids: [${PROGRAMAS_BOARD}]) { 
      id 
      name 
      columns { id title type } 
      items_page(limit: 50) {
        items {
          id 
          name 
          updated_at 
          column_values { 
            id 
            text 
            value 
            column {
              id 
              title 
              type 
              settings_str 
            }
          }
        }
        cursor
      }
    } 
  }`;

  try {
    const mondayRes = await postMonday(query, MONDAY_API_KEY);
    if (!mondayRes?.data?.boards?.length) {
      return NextResponse.json(
        { error: "No se encontró la tabla" },
        { status: 404 }
      );
    }
    const board = mondayRes.data.boards[0];
    const itemsPage = board.items_page;
    const columns = board.columns || [];
    // Mapear usando el id de la columna como clave
    const programas = (itemsPage.items || []).map((item) => {
      const obj = { nombre: item.name };
      for (const col of item.column_values) {
        let valor = col.text;
        if (!valor || valor === "") {
          if (col.value) {
            valor =
              typeof col.value === "string"
                ? col.value
                : JSON.stringify(col.value);
          }
        }
        obj[col.id] = valor;
      }
      return obj;
    });
    return NextResponse.json({ programas, columns });
  } catch (err) {
    console.error("Error en la consulta a Monday:", err);
    return NextResponse.json(
      { error: "Error inesperado", details: err.message },
      { status: 500 }
    );
  }
}
