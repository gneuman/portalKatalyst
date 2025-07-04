import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    const { videoIds } = await request.json();
    if (!Array.isArray(videoIds) || videoIds.length === 0) {
      return NextResponse.json(
        { error: "Debes enviar un arreglo de videoIds" },
        { status: 400 }
      );
    }
    const apiKey = process.env.YOUTUBE_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: "YOUTUBE_API_KEY no configurada" },
        { status: 500 }
      );
    }
    const url = `https://www.googleapis.com/youtube/v3/videos?part=statistics&id=${videoIds.join(
      ","
    )}&key=${apiKey}`;
    const response = await fetch(url);
    const data = await response.json();
    if (!data.items) {
      return NextResponse.json(
        { error: "No se pudieron obtener los datos de YouTube" },
        { status: 500 }
      );
    }
    const stats = {};
    for (const item of data.items) {
      stats[item.id] = {
        viewCount: parseInt(item.statistics?.viewCount || 0),
        likeCount: parseInt(item.statistics?.likeCount || 0),
      };
    }
    return NextResponse.json({ success: true, stats });
  } catch (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
