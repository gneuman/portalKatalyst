import { NextResponse } from "next/server";
import { connectDB } from "@/libs/mongodb";
import PodcastVideo from "@/app/models/PodcastVideo";

export async function GET() {
  try {
    await connectDB();

    // Obtener estadísticas agregadas
    const stats = await PodcastVideo.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          processed: { $sum: { $cond: ["$isProcessed", 1, 0] } },
          published: { $sum: { $cond: ["$isPublished", 1, 0] } },
          totalViews: { $sum: "$viewCount" },
          totalLikes: { $sum: "$likeCount" },
        },
      },
    ]);

    // Obtener videos más populares
    const topVideos = await PodcastVideo.find({})
      .sort({ viewCount: -1 })
      .limit(5)
      .select("videoId title viewCount likeCount thumbnail");

    // Obtener videos recientes
    const recentVideos = await PodcastVideo.find({})
      .sort({ publishedAt: -1 })
      .limit(5)
      .select("videoId title publishedAt thumbnail");

    const result = {
      total: stats[0]?.total || 0,
      processed: stats[0]?.processed || 0,
      published: stats[0]?.published || 0,
      totalViews: stats[0]?.totalViews || 0,
      totalLikes: stats[0]?.totalLikes || 0,
      topVideos,
      recentVideos,
    };

    return NextResponse.json(result);
  } catch (error) {
    console.error("[PODCAST-STATS] Error:", error);
    return NextResponse.json(
      { error: "Error obteniendo estadísticas" },
      { status: 500 }
    );
  }
}
