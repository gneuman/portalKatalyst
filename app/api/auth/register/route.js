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
    const contactsBoardId = process.env.MONDAY_CONTACTS_BOARD_ID;
    const query = `query {
      items_by_column_values (board_id: ${contactsBoardId}, column_id: "email", column_value: "${email}") {
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
      // 2.1 Si existe en Monday, crear usuario en MongoDB con esa información
      const mondayData = mondayUser.column_values.reduce((acc, col) => {
        acc[col.id] = col.text;
        return acc;
      }, {});

      user = await User.create({
        email,
        name: mondayUser.name,
        personalMondayId: mondayUser.id,
        updatedAt: new Date(),
        validado: false,
      });

      return NextResponse.json({
        success: true,
        user,
        mondayData,
        redirect: "/api/auth/verify-request?email=" + encodeURIComponent(email),
      });
    }

    // 2.2 Si no existe en Monday, devolver error
    return NextResponse.json(
      { error: "El usuario no existe en Monday.com" },
      { status: 404 }
    );
  } catch (error) {
    console.error("[register] Error:", error);
    return NextResponse.json(
      { error: error.message || "Error inesperado en registro" },
      { status: 500 }
    );
  }
}
