import { NextResponse } from "next/server";
import { connectDB } from "@/libs/mongodb";
import PodcastVideo from "@/app/models/PodcastVideo";
import { postMonday } from "@/libs/monday";

function extractPlaylistId(url) {
  console.log("[PODCAST-YOUTUBE] Extrayendo playlist ID de:", url);

  const patterns = [
    /[?&]list=([^&]+)/,
    /playlist\?list=([^&]+)/,
    /\/playlist\/([^?&]+)/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) {
      console.log("[PODCAST-YOUTUBE] Playlist ID encontrado:", match[1]);
      return match[1];
    }
  }

  console.log("[PODCAST-YOUTUBE] No se pudo extraer playlist ID");
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

export async function GET() {
  const logs = [];
  const results = [];
  try {
    console.log(
      "[PODCAST-YOUTUBE] Iniciando obtención de videos de YouTube..."
    );

    const apiKey = process.env.YOUTUBE_API_KEY;
    const playlistUrlEnv = process.env.URL_PODCAST;

    console.log("[PODCAST-YOUTUBE] Variables de entorno:");
    console.log(
      "  - YOUTUBE_API_KEY:",
      apiKey ? "Configurada" : "NO CONFIGURADA"
    );
    console.log("  - URL_PODCAST:", playlistUrlEnv || "NO CONFIGURADA");

    if (!apiKey) {
      console.error(
        "[PODCAST-YOUTUBE] Error: YOUTUBE_API_KEY no está configurada"
      );
      return NextResponse.json(
        { error: "YOUTUBE_API_KEY no está configurada" },
        { status: 500 }
      );
    }

    if (!playlistUrlEnv) {
      console.error("[PODCAST-YOUTUBE] Error: URL_PODCAST no está configurada");
      return NextResponse.json(
        { error: "URL_PODCAST no está configurada" },
        { status: 500 }
      );
    }

    const PLAYLIST_ID = extractPlaylistId(playlistUrlEnv);
    if (!PLAYLIST_ID) {
      console.error(
        "[PODCAST-YOUTUBE] Error: No se pudo extraer el playlistId de URL_PODCAST"
      );
      return NextResponse.json(
        { error: "No se pudo extraer el playlistId de URL_PODCAST" },
        { status: 500 }
      );
    }

    console.log("[PODCAST-YOUTUBE] Playlist ID extraído:", PLAYLIST_ID);

    await connectDB();

    // Obtener todos los videos del playlist
    const playlistUrl = `https://www.googleapis.com/youtube/v3/playlistItems?part=snippet&playlistId=${PLAYLIST_ID}&maxResults=50&key=${apiKey}`;

    console.log("[PODCAST-YOUTUBE] Obteniendo videos del playlist...");
    console.log("[PODCAST-YOUTUBE] URL de playlist:", playlistUrl);

    const playlistResponse = await fetch(playlistUrl);
    console.log(
      "[PODCAST-YOUTUBE] Respuesta de playlist:",
      playlistResponse.status,
      playlistResponse.statusText
    );

    const playlistData = await playlistResponse.json();
    console.log("[PODCAST-YOUTUBE] Datos de playlist:", {
      items: playlistData.items?.length || 0,
      error: playlistData.error,
      message: playlistData.message,
    });

    if (!playlistData.items) {
      console.error(
        "[PODCAST-YOUTUBE] Error: No se pudieron obtener los videos del playlist"
      );
      console.error("[PODCAST-YOUTUBE] Respuesta completa:", playlistData);
      return NextResponse.json(
        { error: "No se pudieron obtener los videos del playlist" },
        { status: 500 }
      );
    }

    // Obtener detalles completos de cada video
    const videoIds = playlistData.items.map(
      (item) => item.snippet.resourceId.videoId
    );

    console.log("[PODCAST-YOUTUBE] Video IDs encontrados:", videoIds.length);
    console.log(
      "[PODCAST-YOUTUBE] Primeros 5 video IDs:",
      videoIds.slice(0, 5)
    );

    const videosUrl = `https://www.googleapis.com/youtube/v3/videos?part=snippet,statistics,contentDetails&id=${videoIds.join(
      ","
    )}&key=${apiKey}`;

    console.log("[PODCAST-YOUTUBE] Obteniendo detalles de videos...");
    console.log("[PODCAST-YOUTUBE] URL de videos:", videosUrl);

    const videosResponse = await fetch(videosUrl);
    console.log(
      "[PODCAST-YOUTUBE] Respuesta de videos:",
      videosResponse.status,
      videosResponse.statusText
    );

    const videosData = await videosResponse.json();
    console.log("[PODCAST-YOUTUBE] Datos de videos:", {
      items: videosData.items?.length || 0,
      error: videosData.error,
      message: videosData.message,
    });

    if (!videosData.items) {
      console.error(
        "[PODCAST-YOUTUBE] Error: No se pudieron obtener los detalles de los videos"
      );
      console.error("[PODCAST-YOUTUBE] Respuesta completa:", videosData);
      return NextResponse.json(
        { error: "No se pudieron obtener los detalles de los videos" },
        { status: 500 }
      );
    }

    // Procesar y guardar videos en la base de datos
    const processedVideos = [];
    const newVideos = [];

    console.log("[PODCAST-YOUTUBE] Procesando videos en la base de datos...");

    // Obtener los primeros 500 items de Monday.com una sola vez
    let mondayItems = [];
    const PODCAST_BOARD_ID = process.env.MONDAY_PODCAST_BOARD_ID;
    if (PODCAST_BOARD_ID) {
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
      mondayItems = mondayResp?.data?.boards?.[0]?.items_page?.items || [];
    }

    for (const video of videosData.items) {
      try {
        console.log(
          `[PODCAST-YOUTUBE] Procesando video: ${video.id} - ${video.snippet.title}`
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

        console.log(`[PODCAST-YOUTUBE] Datos del video:`, {
          videoId: videoData.videoId,
          title: videoData.title.substring(0, 50) + "...",
          viewCount: videoData.viewCount,
          likeCount: videoData.likeCount,
          publishedAt: videoData.publishedAt,
        });

        // Guardar/actualizar en MongoDB
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

        // Sincronizar con Monday.com
        let mondayStatus = "";
        let mondayError = null;
        if (PODCAST_BOARD_ID) {
          // Buscar si ya existe el item en Monday.com (en JS, no en la query)
          const existingItem = mondayItems.find((item) =>
            item.column_values?.find(
              (col) =>
                col.id === "text_mkshh5" && col.text === videoData.videoId
            )
          );

          // Limpiar y preparar datos para Monday.com
          const cleanTitle = cleanTextForMonday(videoData.title);
          const cleanDescription = cleanTextForMonday(videoData.description);

          const columnValues = {
            text_mkshnrz2: cleanTitle,
            text_mkshh5: videoData.videoId,
            long_text_mkshzsqf: "", // No tocar el Resumen AI
            text_mkshn1k8: `https://www.youtube.com/watch?v=${videoData.videoId}`,
            text_mksh5pen: videoData.thumbnail,
            date_mkshy6ck: videoData.publishedAt.toISOString().split("T")[0],
            numeric_mkshtg2f: String(videoData.viewCount), // como string numérico
            numeric_mkshy1xp: String(videoData.likeCount), // como string numérico
            status: "1",
          };

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
            } else {
              mondayStatus = "error";
              mondayError = createResp?.errors || createResp;
            }
          }
        } else {
          mondayStatus = "NO BOARD ID";
        }
        logs.push(
          `[MONDAY] ${videoData.videoId}: ${mondayStatus}${
            mondayError ? " (error: " + JSON.stringify(mondayError) + ")" : ""
          }`
        );
        results.push({
          videoId: videoData.videoId,
          mongo: mongoStatus,
          monday: mondayStatus,
          error: mondayError,
          views: videoData.viewCount,
          likes: videoData.likeCount,
        });
        processedVideos.push(videoData);
      } catch (error) {
        logs.push(`[ERROR] ${video.id}: ${error.message}`);
        results.push({ videoId: video.id, error: error.message });
      }
    }

    console.log(
      `[PODCAST-YOUTUBE] ✅ Procesados ${processedVideos.length} videos (${newVideos.length} nuevos)`
    );

    return NextResponse.json({
      success: true,
      total: processedVideos.length,
      videos: processedVideos.map((video) => ({
        id: video._id,
        videoId: video.videoId,
        title: video.title,
        description: video.description,
        publishedAt: video.publishedAt,
        thumbnail: video.thumbnail,
        viewCount: video.viewCount,
        likeCount: video.likeCount,
        isProcessed: video.isProcessed,
        isPublished: video.isPublished,
      })),
      logs,
      results,
    });
  } catch (error) {
    logs.push(`[FATAL ERROR] ${error.message}`);
    return NextResponse.json(
      {
        error: "Error al obtener videos del playlist",
        details: error.message,
        logs,
      },
      { status: 500 }
    );
  }
}
