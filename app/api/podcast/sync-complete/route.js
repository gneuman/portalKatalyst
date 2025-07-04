import { NextResponse } from "next/server";
import { connectDB } from "@/libs/mongodb";
import PodcastVideo from "@/app/models/PodcastVideo";
import { postMonday } from "@/libs/monday";

function extractPlaylistId(url) {
  console.log("[PODCAST-SYNC-COMPLETE] Extrayendo playlist ID de:", url);

  const patterns = [
    /[?&]list=([^&]+)/,
    /playlist\?list=([^&]+)/,
    /\/playlist\/([^?&]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      console.log("[PODCAST-SYNC-COMPLETE] Playlist ID encontrado:", match[1]);
      return match[1];
    }
  }

  console.log("[PODCAST-SYNC-COMPLETE] No se pudo extraer playlist ID");
  return null;
}

// Función para limpiar texto para Monday.com
function cleanTextForMonday(text) {
  if (!text) return "";
  return text
    .replace(/"/g, "'") // Reemplazar comillas dobles con simples
    .replace(/\n/g, " ") // Reemplazar saltos de línea con espacios
    .replace(/\r/g, " ") // Reemplazar retornos de carro con espacios
    .replace(/\t/g, " ") // Reemplazar tabs con espacios
    .replace(/\s+/g, " ") // Múltiples espacios a uno solo
    .trim()
    .substring(0, 500); // Limitar a 500 caracteres
}

export async function POST() {
  const logs = [];
  const results = [];

  try {
    console.log("[PODCAST-SYNC-COMPLETE] Iniciando sincronización completa...");

    const apiKey = process.env.YOUTUBE_API_KEY;
    const playlistUrlEnv = process.env.URL_PODCAST;
    const PODCAST_BOARD_ID = process.env.MONDAY_PODCAST_BOARD_ID;

    console.log("[PODCAST-SYNC-COMPLETE] Variables de entorno:");
    console.log(
      "  - YOUTUBE_API_KEY:",
      apiKey ? "Configurada" : "NO CONFIGURADA"
    );
    console.log("  - URL_PODCAST:", playlistUrlEnv || "NO CONFIGURADA");
    console.log(
      "  - MONDAY_PODCAST_BOARD_ID:",
      PODCAST_BOARD_ID || "NO CONFIGURADO"
    );

    if (!apiKey) {
      return NextResponse.json(
        { error: "YOUTUBE_API_KEY no está configurada" },
        { status: 500 }
      );
    }

    if (!playlistUrlEnv) {
      return NextResponse.json(
        { error: "URL_PODCAST no está configurada" },
        { status: 500 }
      );
    }

    if (!PODCAST_BOARD_ID) {
      return NextResponse.json(
        { error: "MONDAY_PODCAST_BOARD_ID no está configurado" },
        { status: 500 }
      );
    }

    const PLAYLIST_ID = extractPlaylistId(playlistUrlEnv);
    if (!PLAYLIST_ID) {
      return NextResponse.json(
        { error: "No se pudo extraer el playlistId de URL_PODCAST" },
        { status: 500 }
      );
    }

    console.log("[PODCAST-SYNC-COMPLETE] Conectando a la base de datos...");
    await connectDB();

    // Paso 1: Obtener videos del playlist de YouTube
    console.log(
      "[PODCAST-SYNC-COMPLETE] Paso 1: Obteniendo videos del playlist..."
    );

    const playlistUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${PLAYLIST_ID}&maxResults=50&key=${apiKey}`;
    const playlistResponse = await fetch(playlistUrl);
    const playlistData = await playlistResponse.json();

    if (!playlistData.items) {
      return NextResponse.json(
        { error: "No se pudieron obtener los videos del playlist" },
        { status: 500 }
      );
    }

    // Obtener detalles completos de cada video
    const videoIds = playlistData.items.map(
      (item) => item.snippet.resourceId.videoId
    );
    const videosUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoIds.join(
      ","
    )}&key=${apiKey}`;
    const videosResponse = await fetch(videosUrl);
    const videosData = await videosResponse.json();

    if (!videosData.items) {
      return NextResponse.json(
        { error: "No se pudieron obtener los detalles de los videos" },
        { status: 500 }
      );
    }

    // Paso 2: Obtener items existentes de Monday.com
    console.log(
      "[PODCAST-SYNC-COMPLETE] Paso 2: Obteniendo items de Monday.com..."
    );

    const mondayQuery = `
      query {
        boards(ids: [${PODCAST_BOARD_ID}]) {
          items_page(limit: 500) {
            items {
              id
              name
              column_values { id text value }
            }
          }
        }
      }
    `;
    const mondayResp = await postMonday(mondayQuery);
    const mondayItems = mondayResp?.data?.boards?.[0]?.items_page?.items || [];

    console.log(
      `[PODCAST-SYNC-COMPLETE] Items encontrados en Monday.com: ${mondayItems.length}`
    );

    // Paso 3: Procesar cada video
    console.log("[PODCAST-SYNC-COMPLETE] Paso 3: Procesando videos...");

    const processedVideos = [];
    const mongoUpdates = [];
    const mondayUpdates = [];
    const errors = [];

    for (const video of videosData.items) {
      try {
        console.log(
          `[PODCAST-SYNC-COMPLETE] Procesando: ${video.id} - ${video.snippet.title}`
        );

        const videoData = {
          videoId: video.id,
          title: video.snippet.title,
          description: video.snippet.description,
          publishedAt: new Date(video.snippet.publishedAt),
          thumbnail:
            video.snippet.thumbnails?.high?.url ||
            video.snippet.thumbnails?.medium?.url ||
            "",
          duration: video.contentDetails?.duration || "",
          viewCount: parseInt(video.statistics?.viewCount || 0),
          likeCount: parseInt(video.statistics?.likeCount || 0),
        };

        // Actualizar MongoDB
        let mongoStatus = "";
        const existingVideo = await PodcastVideo.findOne({
          videoId: videoData.videoId,
        });

        if (existingVideo) {
          await PodcastVideo.findOneAndUpdate(
            { videoId: videoData.videoId },
            {
              ...videoData,
              lastSynced: new Date(),
            },
            { new: true }
          );
          mongoStatus = "actualizado";
        } else {
          const newVideo = new PodcastVideo(videoData);
          await newVideo.save();
          mongoStatus = "creado";
        }

        const mongoCheck = await PodcastVideo.findOne({
          videoId: videoData.videoId,
        });
        logs.push(
          `[MONGO] ${videoData.videoId}: ${mongoStatus} (views: ${mongoCheck?.viewCount}, likes: ${mongoCheck?.likeCount})`
        );
        mongoUpdates.push({
          videoId: videoData.videoId,
          status: mongoStatus,
          views: mongoCheck?.viewCount,
          likes: mongoCheck?.likeCount,
        });

        // Actualizar Monday.com
        const existingItem = mondayItems.find((item) =>
          item.column_values?.find(
            (col) => col.id === "text_mkshh5" && col.text === videoData.videoId
          )
        );

        const cleanTitle = cleanTextForMonday(videoData.title);
        const cleanDescription = cleanTextForMonday(videoData.description);

        const columnValues = {
          text_mkshnrz2: cleanTitle,
          text_mkshh5: videoData.videoId,
          long_text_mkshzsqf: "", // No tocar el Resumen AI
          text_mkshn1k8: `https://www.youtube.com/watch?v=${videoData.videoId}`,
          text_mksh5pen: videoData.thumbnail,
          date_mkshy6ck: videoData.publishedAt.toISOString().split("T")[0],
          date4: videoData.publishedAt.toISOString().split("T")[0], // Publish at
          numeric_mkshtg2f: String(videoData.viewCount), // Vistas como string numérico
          numeric_mkshy1xp: String(videoData.likeCount), // Likes como string numérico
          status: "1",
        };

        let mondayStatus = "";
        let mondayError = null;

        if (existingItem) {
          // Actualizar item existente
          const updateQuery = `
            mutation {
              change_multiple_column_values (
                board_id: ${PODCAST_BOARD_ID},
                item_id: ${existingItem.id},
                column_values: "${JSON.stringify(columnValues).replace(
                  /"/g,
                  '\\"'
                )}"
              ) {
                id
                name
              }
            }
          `;
          const updateResp = await postMonday(updateQuery);

          if (updateResp?.data?.change_multiple_column_values?.id) {
            mondayStatus = "actualizado";
            await PodcastVideo.findOneAndUpdate(
              { videoId: videoData.videoId },
              { mondayItemId: existingItem.id, isPublished: true },
              { upsert: true }
            );
          } else {
            mondayStatus = "error";
            mondayError = updateResp?.errors || updateResp;
          }
        } else {
          // Crear nuevo item
          const createQuery = `
            mutation {
              create_item (
                board_id: ${PODCAST_BOARD_ID},
                item_name: "${cleanTitle.replace(/"/g, '\\"')}",
                column_values: "${JSON.stringify(columnValues).replace(
                  /"/g,
                  '\\"'
                )}"
              ) {
                id
                name
              }
            }
          `;
          const createResp = await postMonday(createQuery);

          if (createResp?.data?.create_item?.id) {
            mondayStatus = "creado";
            await PodcastVideo.findOneAndUpdate(
              { videoId: videoData.videoId },
              {
                mondayItemId: createResp.data.create_item.id,
                isPublished: true,
              },
              { upsert: true }
            );
          } else {
            mondayStatus = "error";
            mondayError = createResp?.errors || createResp;
          }
        }

        logs.push(
          `[MONDAY] ${videoData.videoId}: ${mondayStatus}${
            mondayError ? " (error: " + JSON.stringify(mondayError) + ")" : ""
          }`
        );
        mondayUpdates.push({
          videoId: videoData.videoId,
          status: mondayStatus,
          error: mondayError,
          views: videoData.viewCount,
          likes: videoData.likeCount,
        });

        results.push({
          videoId: videoData.videoId,
          title: videoData.title,
          mongo: mongoStatus,
          monday: mondayStatus,
          error: mondayError,
          views: videoData.viewCount,
          likes: videoData.likeCount,
        });

        processedVideos.push(videoData);

        // Pausa entre operaciones
        await new Promise((resolve) => setTimeout(resolve, 200));
      } catch (error) {
        const errorMsg = `Error procesando ${video.id}: ${error.message}`;
        logs.push(`[ERROR] ${errorMsg}`);
        errors.push({ videoId: video.id, error: error.message });
      }
    }

    // Generar estadísticas finales
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
      processed: processedVideos.length,
      mongoUpdates: mongoUpdates.length,
      mondayUpdates: mondayUpdates.length,
      errors: errors.length,
    };

    console.log(`[PODCAST-SYNC-COMPLETE] ✅ Sincronización completada:`);
    console.log(`   - Videos procesados: ${summary.processed}`);
    console.log(`   - Actualizaciones MongoDB: ${summary.mongoUpdates}`);
    console.log(`   - Actualizaciones Monday.com: ${summary.mondayUpdates}`);
    console.log(`   - Errores: ${summary.errors}`);

    return NextResponse.json({
      success: true,
      message: "Sincronización completa exitosa",
      summary,
      results,
      logs,
      errors,
    });
  } catch (error) {
    console.error("[PODCAST-SYNC-COMPLETE] Error:", error);
    return NextResponse.json(
      {
        error: "Error en la sincronización completa",
        details: error.message,
        logs,
      },
      { status: 500 }
    );
  }
}
