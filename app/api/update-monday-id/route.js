import { NextResponse } from "next/server";
import { connectDB } from "@/libs/mongodb";
import User from "@/app/models/User";

export async function POST(request) {
  try {
    const { email, mondayId, type = "personal" } = await request.json();

    console.log("=== UPDATE MONDAY ID ===");
    console.log("Datos recibidos:", { email, mondayId, type });

    if (!email || !mondayId) {
      return NextResponse.json(
        { error: "Email y Monday ID son requeridos" },
        { status: 400 }
      );
    }

    // Conectar a MongoDB
    await connectDB();
    console.log("✅ Conectado a MongoDB");

    // Buscar usuario
    const user = await User.findOne({ email });

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          message: "Usuario no encontrado",
          error: "Usuario no existe en la base de datos",
        },
        { status: 404 }
      );
    }

    // Actualizar Monday ID según el tipo
    let updateData = {};

    if (type === "personal") {
      updateData.personalMondayId = mondayId;
    } else if (type === "business") {
      // Para business, agregar al array si no existe
      if (!user.businessMondayId.includes(mondayId)) {
        updateData.businessMondayId = [...user.businessMondayId, mondayId];
      }
    }

    updateData.updatedAt = new Date();

    const updatedUser = await User.findByIdAndUpdate(user._id, updateData, {
      new: true,
    });

    console.log("✅ Usuario actualizado:", updatedUser._id);

    return NextResponse.json({
      success: true,
      message: "Monday ID actualizado exitosamente",
      data: {
        user: {
          id: updatedUser._id,
          email: updatedUser.email,
          personalMondayId: updatedUser.personalMondayId,
          businessMondayId: updatedUser.businessMondayId,
          updatedAt: updatedUser.updatedAt,
        },
      },
    });
  } catch (error) {
    console.error("❌ Error actualizando Monday ID:", error);
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error.message,
      },
      { status: 500 }
    );
  }
}

// GET endpoint para obtener información del usuario
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
      success: true,
      data: {
        user: {
          id: user._id,
          email: user.email,
          name: user.name,
          firstName: user.firstName,
          lastName: user.lastName,
          validado: user.validado,
          emailVerified: user.emailVerified,
          personalMondayId: user.personalMondayId,
          businessMondayId: user.businessMondayId,
          createdAt: user.createdAt,
          updatedAt: user.updatedAt,
        },
      },
    });
  } catch (error) {
    console.error("❌ Error obteniendo usuario:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
