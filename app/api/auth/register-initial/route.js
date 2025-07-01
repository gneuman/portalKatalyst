import { NextResponse } from "next/server";
import connectMongo from "@/libs/mongoose";
import User from "@/app/models/User";

export async function POST(request) {
  try {
    await connectMongo();
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email es requerido" },
        { status: 400 }
      );
    }

    // Verificar si el usuario ya existe en MongoDB
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { error: "El usuario ya existe" },
        { status: 400 }
      );
    }

    // Buscar primero en Monday.com antes de crear
    const mondayFindRes = await fetch(
      `${
        process.env.NEXTAUTH_URL || "http://localhost:3000"
      }/api/monday/contact/find`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      }
    );
    const mondayFindData = await mondayFindRes.json();
    let mondayId = null;
    if (mondayFindRes.ok && mondayFindData.found && mondayFindData.mondayId) {
      // Ya existe en Monday, usar ese ID
      mondayId = mondayFindData.mondayId;
      console.log(
        "[register-initial] Contacto YA EXISTE en Monday.com, usando ID:",
        mondayId
      );
    } else {
      // No existe, crear en Monday.com
      console.log(
        "[register-initial] Contacto NO existe en Monday.com, creando..."
      );
      // Obtener estructura del board para columna de email
      const boardId = process.env.MONDAY_BOARD_ID;
      const apiKey = process.env.MONDAY_API_KEY;
      const boardQuery = `query { boards(ids: [${boardId}]) { id name columns { id title type } } }`;
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
      const emailColumn = boardData?.data?.boards?.[0]?.columns?.find(
        (col) => col.type === "email"
      );
      if (!emailColumn) {
        return NextResponse.json(
          { error: "No se encontró la columna de email en Monday.com" },
          { status: 500 }
        );
      }
      const columnValues = {
        [emailColumn.id]: {
          text: email,
          email: email,
        },
      };
      const columnValuesStr = JSON.stringify(columnValues).replace(/"/g, '\\"');
      const mutationQuery = `mutation { create_item (board_id: ${boardId}, item_name: "${email}", column_values: "${columnValuesStr}", create_labels_if_missing: false) { id } }`;
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
      if (!res.ok || mondayData.errors || !mondayData.data?.create_item?.id) {
        return NextResponse.json(
          {
            error: "No se pudo crear el contacto en Monday.com",
            details: mondayData,
          },
          { status: 500 }
        );
      }
      mondayId = mondayData.data.create_item.id;
      console.log(
        "[register-initial] Contacto creado en Monday.com con ID:",
        mondayId
      );
    }

    // Crear usuario en MongoDB con el Monday ID
    const user = new User({
      email,
      personalMondayId: mondayId,
      emailVerified: null, // No verificado aún
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await user.save();
    console.log("[register-initial] Usuario creado en MongoDB:", email);
    return NextResponse.json({
      success: true,
      message: "Usuario creado exitosamente",
      email: user.email,
      mondayId: mondayId,
      debug: { mondayFindData },
    });
  } catch (error) {
    console.error("[register-initial] Error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
