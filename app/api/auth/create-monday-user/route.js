import { NextResponse } from "next/server";
import connectMongo from "@/libs/mongoose";
import User from "@/app/models/User";

export async function POST(request) {
  try {
    const data = await request.json();
    console.log("[create-monday-user] Payload recibido:", data);

    // Normalizar los datos
    const normalizedData = {
      email: data.email,
      name: data.name || data.nombre,
      nombre: data.nombre,
      apellidoP: data.apellidoP,
      apellidoM: data.apellidoM,
      genero: data.genero,
      comunidad: data.comunidad,
      telefono: data.telefono,
      pais: data.pais || "MX",
      fechaNacimiento: data.fechaNacimiento,
    };

    console.log("[create-monday-user] Datos normalizados:", normalizedData);

    // Validar email específicamente
    if (!normalizedData.email || !normalizedData.email.includes("@")) {
      console.error("[create-monday-user] Email inválido o faltante");
      return NextResponse.json(
        {
          error: "El email es requerido y debe ser válido",
          received: normalizedData,
        },
        { status: 400 }
      );
    }

    // Usar la lógica mejorada que configura tanto nombre como columna de email
    const boardId = process.env.MONDAY_BOARD_ID;
    const apiKey = process.env.MONDAY_API_KEY;

    // Obtener la estructura del board para encontrar la columna de email
    const boardQuery = `query { 
      boards(ids: [${boardId}]) { 
        id 
        name 
        columns { 
          id 
          title 
          type 
        } 
      } 
    }`;

    const boardRes = await fetch("https://api.monday.com/v2", {
      method: "POST",
      headers: {
        "user-agent": "Make/production",
        "api-version": "2024-10",
        "content-type": "application/json",
        authorization: apiKey,
      },
      body: JSON.stringify({ query: boardQuery }),
    });

    const boardData = await boardRes.json();

    if (!boardRes.ok || boardData.errors) {
      console.error(
        "[create-monday-user] Error obteniendo estructura del board:",
        boardData
      );
      return NextResponse.json(
        {
          error: "Error obteniendo estructura del board",
          details: boardData,
        },
        { status: 500 }
      );
    }

    const emailColumn = boardData?.data?.boards?.[0]?.columns?.find(
      (col) => col.type === "email"
    );

    if (!emailColumn) {
      console.error("[create-monday-user] No se encontró columna de email");
      return NextResponse.json(
        {
          error: "No se encontró la columna de email en Monday.com",
        },
        { status: 500 }
      );
    }

    // Crear el item con nombre y columna de email configurados correctamente
    const columnValues = {
      [emailColumn.id]: {
        text: normalizedData.email,
        email: normalizedData.email,
      },
    };

    const columnValuesStr = JSON.stringify(columnValues).replace(/"/g, '\\"');
    const mutationQuery = `mutation { create_item (board_id: ${boardId}, item_name: "${normalizedData.email}", column_values: "${columnValuesStr}", create_labels_if_missing: false) { id } }`;

    // Llamada a Monday.com con los headers de Make
    const res = await fetch("https://api.monday.com/v2", {
      method: "POST",
      headers: {
        "user-agent": "Make/production",
        "api-version": "2024-10",
        "content-type": "application/json",
        authorization: apiKey,
      },
      body: JSON.stringify({ query: mutationQuery }),
    });

    const mondayData = await res.json();

    if (!res.ok) {
      console.error("[create-monday-user] Error de Monday.com:", mondayData);
      return NextResponse.json(
        {
          error: `HTTP error! status: ${res.status}`,
          details: mondayData,
        },
        { status: res.status }
      );
    }

    if (mondayData.errors) {
      console.error(
        "[create-monday-user] Errores de Monday.com:",
        mondayData.errors
      );
      return NextResponse.json(
        {
          error: "Monday.com errors",
          details: mondayData.errors,
        },
        { status: 400 }
      );
    }

    const mondayId = mondayData.data?.create_item?.id;
    if (!mondayId) {
      return NextResponse.json(
        {
          error: "No se pudo crear el contacto en Monday.com",
          details: mondayData,
        },
        { status: 500 }
      );
    }

    console.log(
      "[create-monday-user] Contacto creado en Monday.com con ID:",
      mondayId
    );

    // Sincronizar MongoDB con el nuevo MondayID
    await connectMongo();
    await User.findOneAndUpdate(
      { email: normalizedData.email },
      {
        $set: {
          personalMondayId: mondayId,
          name: normalizedData.name || normalizedData.email,
          firstName: normalizedData.nombre,
          lastName: normalizedData.apellidoP,
          secondLastName: normalizedData.apellidoM,
          phone: normalizedData.telefono,
          dateOfBirth: normalizedData.fechaNacimiento,
          gender: normalizedData.genero,
          community: normalizedData.comunidad,
          updatedAt: new Date(),
        },
      },
      { new: true }
    );

    return NextResponse.json({
      mondayId,
      success: true,
      received: normalizedData,
      mondayResponse: mondayData,
      email: normalizedData.email,
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
