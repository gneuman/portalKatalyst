import { NextResponse } from "next/server";
import { connectDB } from "@/libs/mongodb";
import User from "@/app/models/User";

export async function POST(request) {
  try {
    const data = await request.json();
    console.log("[register] Payload recibido:", data);
    await connectDB();
    const {
      email,
      personalMondayId,
      businessMondayId = [],
      fotoPerfil = "",
    } = data;
    if (!email || !personalMondayId) {
      return NextResponse.json(
        { error: "Faltan campos requeridos (email, personalMondayId)" },
        { status: 400 }
      );
    }
    // Buscar usuario existente
    let user = await User.findOne({ email });
    if (user) {
      user.personalMondayId = personalMondayId;
      user.businessMondayId = businessMondayId;
      user.fotoPerfil = fotoPerfil;
      user.updatedAt = new Date();
      await user.save();
    } else {
      user = await User.create({
        email,
        personalMondayId,
        businessMondayId,
        fotoPerfil,
        updatedAt: new Date(),
        validado: false,
      });
    }
    // Redirigir a verificación de correo
    return NextResponse.json({
      success: true,
      user,
      redirect: "/api/auth/verify-request?email=" + encodeURIComponent(email),
    });
  } catch (error) {
    console.error("[register] Error:", error);
    return NextResponse.json(
      { error: error.message || "Error inesperado en registro" },
      { status: 500 }
    );
  }
}
