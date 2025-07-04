import { NextResponse } from "next/server";
import { connectDB } from "@/libs/mongodb";
import PodcastVideo from "@/app/models/PodcastVideo";

export async function POST() {
  try {
    console.log("[PODCAST-SYNC] Iniciando sincronización...");
    console.log("[PODCAST-SYNC] Variables de entorno:");
    console.log("  - NEXTAUTH_URL:", process.env.NEXTAUTH_URL);
    console.log(
      "  - YOUTUBE_API_KEY:",
      process.env.YOUTUBE_API_KEY ? "Configurada" : "NO CONFIGURADA"
    );
    console.log(
      "  - URL_PODCAST:",
      process.env.URL_PODCAST || "NO CONFIGURADA"
    );

    console.log("[PODCAST-SYNC] Conectando a la base de datos...");
    try {
      await connectDB();
      console.log("[PODCAST-SYNC] Conexión a base de datos exitosa");
    } catch (dbError) {
      console.error(
        "[PODCAST-SYNC] Error conectando a la base de datos:",
        dbError
      );
      throw new Error(`Error de conexión a base de datos: ${dbError.message}`);
    }

    // Paso 1: Obtener videos del playlist de YouTube
    console.log("[PODCAST-SYNC] Paso 1: Obteniendo videos del playlist...");
    console.log(
      "[PODCAST-SYNC] URL de la aplicación:",
      process.env.NEXTAUTH_URL
    );

    let videosResponse;
    try {
      videosResponse = await fetch(
        `${process.env.NEXTAUTH_URL}/api/podcast/youtube`
      );
      console.log(
        "[PODCAST-SYNC] Respuesta de videos:",
        videosResponse.status,
        videosResponse.statusText
      );
    } catch (fetchError) {
      console.error("[PODCAST-SYNC] Error en fetch a YouTube:", fetchError);
      throw new Error(`Error conectando a YouTube API: ${fetchError.message}`);
    }

    let videosData;
    try {
      videosData = await videosResponse.json();
    } catch (jsonError) {
      console.error(
        "[PODCAST-SYNC] Error parseando respuesta de YouTube:",
        jsonError
      );
      throw new Error(
        `Error parseando respuesta de YouTube: ${jsonError.message}`
      );
    }
    console.log("[PODCAST-SYNC] Datos de respuesta:", {
      success: videosData.success,
      total: videosData.total,
      new: videosData.new,
      error: videosData.error,
    });

    if (!videosData.success) {
      console.error(
        "[PODCAST-SYNC] Error en respuesta de videos:",
        videosData.error
      );
      console.error(
        "[PODCAST-SYNC] Respuesta completa:",
        JSON.stringify(videosData, null, 2)
      );
      throw new Error(
        videosData.error || "Error obteniendo videos del playlist"
      );
    }

    console.log(
      `[PODCAST-SYNC] Videos obtenidos: ${videosData.total} (${videosData.new} nuevos)`
    );

    // Paso 2: Sincronizar todos los videos con Monday.com
    console.log("[PODCAST-SYNC] Paso 2: Sincronizando con Monday.com...");
    console.log(
      "[PODCAST-SYNC] URL de Monday:",
      `${process.env.NEXTAUTH_URL}/api/podcast/monday`
    );
    console.log("[PODCAST-SYNC] Datos a enviar:", {
      allVideosCount: videosData.videos?.length || 0,
      totalVideos: videosData.total,
    });

    const mondayResponse = await fetch(
      `${process.env.NEXTAUTH_URL}/api/podcast/monday`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          allVideos: videosData.videos, // Enviamos todos los videos
          totalVideos: videosData.total,
        }),
      }
    );

    console.log(
      "[PODCAST-SYNC] Respuesta de Monday:",
      mondayResponse.status,
      mondayResponse.statusText
    );
    const mondayData = await mondayResponse.json();
    console.log("[PODCAST-SYNC] Datos de Monday:", {
      success: mondayData.success,
      createdItems: mondayData.createdItems?.length || 0,
      errors: mondayData.errors?.length || 0,
      error: mondayData.error,
    });

    // Paso 3: Generar estadísticas
    const stats = await PodcastVideo.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          published: { $sum: { $cond: ["$isPublished", 1, 0] } },
        },
      },
    ]);

    const summary = {
      total: stats[0]?.total || 0,
      published: stats[0]?.published || 0,
      newVideos: videosData.new || 0,
      mondayCreated: mondayData.createdItems?.length || 0,
      mondayErrors: mondayData.errors?.length || 0,
    };

    console.log(`[PODCAST-SYNC] ✅ Sincronización completada:`);
    console.log(`   - Total videos: ${summary.total}`);
    console.log(`   - Nuevos videos: ${summary.newVideos}`);
    console.log(`   - Publicados en Monday: ${summary.published}`);
    console.log(`   - Items creados en Monday: ${summary.mondayCreated}`);
    console.log(`   - Errores en Monday: ${summary.mondayErrors}`);

    return NextResponse.json({
      success: true,
      message: "Sincronización completada exitosamente",
      summary,
      mondayUpdate: mondayData.success,
      mondayData,
    });
  } catch (error) {
    console.error("[PODCAST-SYNC] Error en sincronización:", error);
    console.error("[PODCAST-SYNC] Stack trace:", error.stack);
    return NextResponse.json(
      {
        error: "Error en la sincronización",
        details: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      },
      { status: 500 }
    );
  }
}
