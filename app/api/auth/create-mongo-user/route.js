import { NextResponse } from "next/server";
import connectMongo from "@/libs/mongoose";
import User from "@/app/models/User";

export async function POST(request) {
  try {
    const { email, personalMondayId } = await request.json();

    if (!email) {
      return NextResponse.json({ error: "Email requerido" }, { status: 400 });
    }

    if (!personalMondayId) {
      return NextResponse.json(
        { error: "personalMondayId requerido" },
        { status: 400 }
      );
    }

    console.log("[create-mongo-user] Creando usuario en MongoDB:", {
      email,
      personalMondayId,
    });

    await connectMongo();

    // Verificar si el usuario ya existe
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        {
          error: "El usuario ya existe en MongoDB",
        },
        { status: 400 }
      );
    }

    // Crear usuario en MongoDB con el Monday ID existente
    const user = new User({
      email,
      personalMondayId,
      emailVerified: null, // No verificado aún
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    await user.save();

    console.log("[create-mongo-user] Usuario creado en MongoDB:", email);

    return NextResponse.json({
      success: true,
      message: "Usuario creado exitosamente en MongoDB",
      email: user.email,
      mondayId: personalMondayId,
    });
  } catch (error) {
    console.error("[create-mongo-user] Error:", error);
    return NextResponse.json(
      {
        error: "Error interno del servidor",
      },
      { status: 500 }
    );
  }
}
