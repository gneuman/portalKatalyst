import { NextResponse } from "next/server";
import User from "@/models/User";
import { connectDB } from "@/libs/mongodb";

export async function POST(request) {
  try {
    const { token, password } = await request.json();
    if (!token || !password) {
      return NextResponse.json(
        { error: "Token y contraseña son requeridos" },
        { status: 400 }
      );
    }
    if (password.length < 6) {
      return NextResponse.json(
        { error: "La contraseña debe tener al menos 6 caracteres" },
        { status: 400 }
      );
    }
    await connectDB();
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });
    if (!user) {
      return NextResponse.json(
        { error: "Token inválido o expirado" },
        { status: 400 }
      );
    }
    user.password = password;
    user.hasPassword = true;
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;
    await user.save();
    return NextResponse.json({
      success: true,
      message: "Contraseña restablecida exitosamente",
    });
  } catch (error) {
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
