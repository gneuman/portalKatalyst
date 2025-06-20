import { NextResponse } from "next/server";
import Invite from "@/models/Invite";
import User from "@/models/User";
import connectMongo from "@/libs/mongoose";

export async function POST(req) {
  try {
    await connectMongo();
    const { token, empresaId, invitadorMondayId } = await req.json();

    // Para debug: guardar info relevante
    let debug = { token, empresaId, invitadorMondayId };

    if (!empresaId || !invitadorMondayId) {
      return NextResponse.json(
        { error: "Faltan parámetros para aceptar la invitación", debug },
        { status: 400 }
      );
    }

    // Buscar la invitación solo por token (si existe)
    let invite = null;
    if (token) {
      invite = await Invite.findOne({ token });
      debug.invite = invite;
    }

    // Buscar el usuario por email (de la invitación si existe, si no por invitadorMondayId)
    let user = null;
    if (invite) {
      user = await User.findOne({ email: invite.email });
    } else {
      // Si no hay invitación, buscar usuario por personalMondayId
      user = await User.findOne({ personalMondayId: invitadorMondayId });
    }
    debug.user = user;
    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado", debug },
        { status: 404 }
      );
    }

    // Usar el nombre de columna fijo 'board_relation_mkrcrrm'
    const boardId = process.env.MONDAY_BUSINESS_BOARD_ID;
    const relationColId = "board_relation_mkrcrrm";
    const mutation = `mutation { change_multiple_column_values (board_id: ${boardId}, item_id: ${empresaId}, column_values: "{ \\\"${relationColId}\\\": {\\\"item_ids\\\":[${user.personalMondayId}]}}", create_labels_if_missing: false) { id } }`;
    debug.mutation = mutation;

    const mondayRes = await fetch("https://api.monday.com/v2", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: process.env.MONDAY_API_KEY,
      },
      body: JSON.stringify({ query: mutation }),
    });

    const data = await mondayRes.json();
    debug.mondayResponse = data;
    if (data.errors) {
      console.error("Error al asociar contacto en Monday:", data.errors);
      return NextResponse.json(
        { error: "Error al actualizar la relación en Monday", debug },
        { status: 500 }
      );
    }

    // Actualizar el estado de la invitación si existe
    if (invite) {
      invite.status = "accepted";
      await invite.save();
    }

    // Actualizar el usuario en MongoDB
    if (!user.businessMondayId.includes(empresaId)) {
      user.businessMondayId.push(empresaId);
      await user.save();
    }

    return NextResponse.json({
      ok: true,
      message: "Invitación aceptada correctamente",
      debug,
    });
  } catch (error) {
    console.error("Error al aceptar invitación:", error);
    return NextResponse.json(
      { error: "Error al procesar la aceptación", debug: error.message },
      { status: 500 }
    );
  }
}
