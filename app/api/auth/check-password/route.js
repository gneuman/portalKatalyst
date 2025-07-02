import { NextResponse } from "next/server";
import { connectDB } from "@/libs/mongodb";
import User from "@/models/User";

// Forzar renderizado dinámico para evitar errores de build
export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { error: "Email es requerido" },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findOne({ email });

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      hasPassword: user.hasPassword || false,
      email: user.email,
    });
  } catch (error) {
    console.error("Error al verificar contraseña:", error);
    return NextResponse.json(
      { error: "Error al verificar contraseña" },
      { status: 500 }
    );
  }
}
