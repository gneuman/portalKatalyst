import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/auth";
import { NextResponse } from "next/server";
import connectMongo from "@/libs/mongoose";
import Instance from "@/models/Instance";
import mongoose from "mongoose";

export async function GET(req) {
  try {
    const session = await getServerSession(authOptions);

    if (!session) {
      return NextResponse.json({ message: "No autorizado" }, { status: 401 });
    }

    await connectMongo();

    // Obtener los ids del query param
    const { searchParams } = new URL(req.url);
    const idsParam = searchParams.get("ids");

    let instances = [];
    if (idsParam) {
      // Buscar solo las instancias con los IDs proporcionados
      const ids = idsParam
        .split(",")
        .map((id) => new mongoose.Types.ObjectId(id));
      instances = await Instance.find({ _id: { $in: ids } })
        .sort({ createdAt: -1 })
        .populate("userId")
        .lean();
    } else {
      // Fallback: buscar por userId (legacy)
      instances = await Instance.find({ userId: session.user.id })
        .sort({ createdAt: -1 })
        .populate("userId")
        .lean();
    }

    return NextResponse.json(instances);
  } catch (error) {
    console.error("Error al obtener las instancias:", error);
    return NextResponse.json(
      { message: "Error al obtener las instancias" },
      { status: 500 }
    );
  }
}
