import { NextResponse } from "next/server";
import { postMonday } from "@/libs/monday";

export async function POST(request) {
  try {
    const data = await request.json();
    console.log("[create-monday-user] Payload recibido:", data);

    // Lista de campos requeridos
    const requiredFields = [
      "name",
      "nombre",
      "apellidoP",
      "apellidoM",
      "fechaNac",
      "genero",
      "comunidad",
      "telefono",
      "email",
      "foto",
    ];
    // Buscar los campos que faltan
    const missing = requiredFields.filter(
      (key) =>
        !Object.values(data).some((v, i) =>
          i === 0 ? false : v && key === key
        )
    );
    if (!data.name || missing.length > 0) {
      console.error("[create-monday-user] Faltan campos:", missing);
      return NextResponse.json(
        {
          error:
            "Faltan campos requeridos para crear el contacto en Monday.com",
          missingFields: missing,
          received: data,
        },
        { status: 400 }
      );
    }

    // Obtener la estructura del board
    const boardId = process.env.MONDAY_BOARD_ID;
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

    const boardResponse = await postMonday(query);
    console.log("[create-monday-user] Estructura del board:", boardResponse);

    if (!boardResponse.data?.boards?.[0]?.columns) {
      throw new Error("No se pudo obtener la estructura del board");
    }

    const columns = boardResponse.data.boards[0].columns;
    // Mapeo dinámico de columnas
    const columnValuesObj = {};
    columns.forEach((col) => {
      // Nombre
      if (col.title === "Nombre" && data[col.id]) {
        columnValuesObj[col.id] = data[col.id];
      }
      // Apellido Paterno
      if (col.title === "Apellido Paterno" && data[col.id]) {
        columnValuesObj[col.id] = data[col.id];
      }
      // Apellido Materno
      if (col.title === "Apellido Materno" && data[col.id]) {
        columnValuesObj[col.id] = data[col.id];
      }
      // Fecha de Nacimiento
      if (col.type === "date" && data.fechaNac) {
        columnValuesObj[col.id] = { date: data.fechaNac };
      }
      // Teléfono
      if (col.type === "phone" && data[col.id]) {
        columnValuesObj[col.id] = data[col.id];
      }
      // Email
      if (col.type === "email" && data[col.id]) {
        columnValuesObj[col.id] = data[col.id];
      }
      // Comunidad (status)
      if (col.type === "status" && data.comunidad) {
        const labels = JSON.parse(col.settings_str).labels || {};
        const idx = Object.entries(labels).find(
          ([i, label]) => label === data.comunidad
        )?.[0];
        if (idx !== undefined) {
          columnValuesObj[col.id] = { index: parseInt(idx) };
        }
      }
      // Género (dropdown)
      if (col.type === "dropdown" && data.genero) {
        const labels = JSON.parse(col.settings_str).labels || {};
        const found = Object.entries(labels).find(
          ([i, label]) => label === data.genero
        );
        if (found) {
          columnValuesObj[col.id] = {
            labels: [found[1]],
            ids: [parseInt(found[0])],
          };
        }
      }
      // Foto de perfil
      if (
        (col.title === "Foto De Perfil" || col.title === "Foto de perfil") &&
        data.foto
      ) {
        columnValuesObj[col.id] = data.foto;
      }
    });
    // Eliminar campos undefined
    Object.keys(columnValuesObj).forEach(
      (key) => columnValuesObj[key] === undefined && delete columnValuesObj[key]
    );
    let columnValuesStr = JSON.stringify(columnValuesObj);
    columnValuesStr = columnValuesStr.replace(/"/g, '\\"');
    console.log("[create-monday-user] columnValuesStr:", columnValuesStr);

    // Construir la mutación
    const mutation = {
      query: `mutation { create_item (board_id: ${boardId}, group_id: \"group_mkqkvhv4\", item_name: \"${data.name}\", column_values: \"${columnValuesStr}\", create_labels_if_missing: false) { id } }`,
    };
    console.log("[create-monday-user] Mutación enviada:", mutation);

    // Llamada a la API de Monday.com
    const response = await fetch("https://api.monday.com/v2", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: process.env.MONDAY_API_KEY,
      },
      body: JSON.stringify(mutation),
    });

    const result = await response.json();
    console.log("[create-monday-user] Respuesta de Monday:", result);

    if (!response.ok || result.errors) {
      return NextResponse.json(
        {
          error:
            result.errors?.[0]?.message ||
            "Error al crear usuario en Monday.com",
          details: result,
          mutation,
          received: data,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      mondayId: result.data.create_item.id,
      success: true,
      mutation,
      received: data,
      mondayResponse: result,
    });
  } catch (error) {
    console.error("[create-monday-user] Error general:", error);
    return NextResponse.json(
      {
        error: error.message || "Error inesperado en create-monday-user",
        details: error.toString(),
      },
      { status: 500 }
    );
  }
}
