import { NextResponse } from "next/server";
import Invite from "@/models/Invite";
import User from "@/models/User";
import connectMongo from "@/libs/mongoose";

export async function GET(req) {
  try {
    await connectMongo();
    const { searchParams } = new URL(req.url);
    const token = searchParams.get("token");
    if (!token) {
      return NextResponse.json(
        { error: "Token no proporcionado" },
        { status: 400 }
      );
    }
    const invite = await Invite.findOne({ token });
    if (!invite) {
      return NextResponse.json(
        { error: "Invitación no válida o parámetros incorrectos" },
        { status: 404 }
      );
    }
    // Buscar usuario en MongoDB
    const user = await User.findOne({ email: invite.email });
    if (!user) {
      // Buscar en Monday
      const boardId = process.env.MONDAY_CONTACTS_BOARD_ID;
      const query = `query { items_by_column_values (board_id: ${boardId}, column_id: \"email\", column_value: \"${invite.email}\") { id name } }`;
      const mondayRes = await fetch("https://api.monday.com/v2", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: process.env.MONDAY_API_KEY,
        },
        body: JSON.stringify({ query }),
      });
      const data = await mondayRes.json();
      const mondayUser = data?.data?.items_by_column_values?.[0];
      if (!mondayUser) {
        return NextResponse.json(
          {
            error: "Tu cuenta no existe en Katalyst. Contacta a soporte.",
            debug: { email: invite.email },
          },
          { status: 404 }
        );
      }
      return NextResponse.json({
        ok: true,
        message: "Usuario encontrado en Monday, pero no en MongoDB.",
        personalMondayId: mondayUser.id,
        empresaId: invite.empresaId,
        debug: { email: invite.email, mondayUser },
      });
    }
    // Usuario existe en MongoDB
    return NextResponse.json({
      ok: true,
      message: "Usuario encontrado en MongoDB.",
      personalMondayId: user.personalMondayId,
      empresaId: invite.empresaId,
      debug: { email: invite.email, user },
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Error al validar la invitación", debug: error.message },
      { status: 500 }
    );
  }
}
