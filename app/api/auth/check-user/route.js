import { NextResponse } from "next/server";
import { connectDB } from "@/libs/mongodb";
import User from "@/models/User";

export async function GET(request, { searchParams }) {
  try {
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { error: "Email es requerido" },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findOne({ email });

    return NextResponse.json({
      exists: !!user,
      user: user
        ? {
            id: user._id,
            name: user.name,
            email: user.email,
            emailVerified: user.emailVerified,
          }
        : null,
    });
  } catch (error) {
    console.error("Error al verificar usuario:", error);
    return NextResponse.json(
      { error: "Error al verificar usuario" },
      { status: 500 }
    );
  }
}
