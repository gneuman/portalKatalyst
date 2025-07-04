import { NextResponse } from "next/server";
import { connectDB } from "@/libs/mongodb";
import PodcastVideo from "@/app/models/PodcastVideo";

function extractPlaylistId(url) {
  const match = url.match(/[?&]list=([a-zA-Z0-9_-]+)/);
  return match ? match[1] : null;
}

export async function GET(request) {
  try {
    await connectDB();

    const url = new URL(request.url);
    const searchParams = url.searchParams;
    const page = parseInt(searchParams.get("page")) || 1;
    const limit = parseInt(searchParams.get("limit")) || 10;
    const sortBy = searchParams.get("sortBy") || "publishedAt";
    const sortOrder = searchParams.get("sortOrder") || "desc";
    const status = searchParams.get("status"); // processed, published, all

    const skip = (page - 1) * limit;

    // Construir filtro
    let filter = {};
    if (status === "processed") {
      filter.isProcessed = true;
    } else if (status === "published") {
      filter.isPublished = true;
    }

    // Construir ordenamiento
    const sort = {};
    sort[sortBy] = sortOrder === "desc" ? -1 : 1;

    // Obtener videos
    const videos = await PodcastVideo.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .select("-__v");

    // Obtener total de videos
    const total = await PodcastVideo.countDocuments(filter);

    // Calcular paginación
    const totalPages = Math.ceil(total / limit);
    const hasNextPage = page < totalPages;
    const hasPrevPage = page > 1;

    const result = {
      videos,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNextPage,
        hasPrevPage,
      },
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("[PODCAST-VIDEOS] Error:", error);
    return NextResponse.json(
      { error: "Error obteniendo videos" },
      { status: 500 }
    );
  }
}
