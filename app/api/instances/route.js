import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/auth";
import { NextResponse } from "next/server";
import connectMongo from "@/libs/mongoose";
import Instance from "@/models/Instance";

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    await connectMongo();

    const instances = await Instance.find({ userId: session.user.id })
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json(instances);
  } catch (error) {
    console.error("Error al obtener las instancias:", error);
    return NextResponse.json(
      { message: "Error al obtener las instancias" },
      { status: 500 }
    );
  }
}
