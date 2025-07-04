import { NextResponse } from "next/server";
import { connectDB } from "@/libs/mongodb";
import PodcastVideo from "@/app/models/PodcastVideo";

export async function POST(request) {
  try {
    const { videoIds } = await request.json();
    if (!Array.isArray(videoIds) || videoIds.length === 0) {
      return NextResponse.json(
        { error: "Debes enviar un arreglo de videoIds" },
        { status: 400 }
      );
    }
    await connectDB();
    const videos = await PodcastVideo.find({ videoId: { $in: videoIds } });
    const stats = {};
    for (const video of videos) {
      stats[video.videoId] = {
        viewCount: video.viewCount,
        likeCount: video.likeCount,
      };
    }
    return NextResponse.json({ success: true, stats });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
