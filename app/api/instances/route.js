import { NextResponse } from "next/server";
import connectMongo from "@/libs/mongoose";
import Instance from "@/models/Instance";
import mongoose from "mongoose";

export async function GET(req) {
  try {
    await connectMongo();

    // Obtener los ids del query param
    const { searchParams } = new URL(req.url);
    const idsParam = searchParams.get("ids");
    const userIdParam = searchParams.get("userId");

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
    } else if (userIdParam) {
      // Buscar por userId recibido por query
      instances = await Instance.find({ userId: userIdParam })
        .sort({ createdAt: -1 })
        .populate("userId")
        .lean();
    } else {
      // Si no se pasa nada, devolver vacío
      instances = [];
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
