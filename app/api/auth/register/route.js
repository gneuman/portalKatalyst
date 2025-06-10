import { NextResponse } from "next/server";
import { connectDB } from "@/libs/mongodb";
import User from "@/app/models/User";
import { postMonday } from "@/libs/monday";

export async function POST(request) {
  try {
    const data = await request.json();
    console.log("[register] Payload recibido:", data);
    await connectDB();
    const { email } = data;

    if (!email) {
      return NextResponse.json(
        { error: "El email es requerido" },
        { status: 400 }
      );
    }

    // 1. Buscar usuario en MongoDB
    let user = await User.findOne({ email });

    if (user) {
      // Si existe en MongoDB, enviar directamente el link de verificación
      return NextResponse.json({
        success: true,
        user,
        redirect: "/api/auth/verify-request?email=" + encodeURIComponent(email),
      });
    }

    // 2. Si no existe en MongoDB, buscar en Monday
    const boardId = process.env.MONDAY_BOARD_ID;
    const query = `query {
      items_by_column_values (board_id: ${boardId}, column_id: "email", column_value: "${email}") {
        id
        name
        column_values {
          id
          text
          value
          type
        }
      }
    }`;

    const mondayResponse = await postMonday(query);
    const mondayUser = mondayResponse?.data?.items_by_column_values?.[0];

    if (mondayUser) {
      // Si existe en Monday, actualizar los datos y crear usuario en MongoDB
      const userData = {
        email,
        name: mondayUser.name,
        personalMondayId: mondayUser.id,
      };

      // Extraer datos adicionales de las columnas
      mondayUser.column_values.forEach((col) => {
        if (col.type === "text") {
          if (col.id === "text_mkqc3cea") userData.firstName = col.text;
          if (col.id === "text_mkqcmqh0") userData.lastName = col.text;
          if (col.id === "text_mkqcjqph") userData.secondLastName = col.text;
        }
      });

      // Actualizar el usuario en Monday.com
      const updateMutation = `mutation {
        change_multiple_column_values (
          board_id: ${boardId},
          item_id: ${mondayUser.id},
          column_values: ${JSON.stringify(
            JSON.stringify({
              text_mkqc3cea: { text: userData.firstName },
              text_mkqcmqh0: { text: userData.lastName },
              text_mkqcjqph: { text: userData.secondLastName },
              email: { email: email, text: email },
            })
          )}
        ) {
          id
        }
      }`;

      await postMonday(updateMutation);

      // Crear usuario en MongoDB
      user = await User.create(userData);

      return NextResponse.json({
        success: true,
        user,
        redirect: "/api/auth/verify-request?email=" + encodeURIComponent(email),
      });
    }

    // Si no existe en ninguno de los dos, devolver 404
    return NextResponse.json(
      { error: "Usuario no encontrado" },
      { status: 404 }
    );
  } catch (error) {
    console.error("Error en el registro:", error);
    return NextResponse.json(
      { error: "Error en el proceso de registro" },
      { status: 500 }
    );
  }
}
