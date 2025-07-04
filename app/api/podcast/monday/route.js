import { NextResponse } from "next/server";
import { postMonday } from "@/libs/monday";
import { connectDB } from "@/libs/mongodb";
import PodcastVideo from "@/app/models/PodcastVideo";

const PODCAST_BOARD_ID = process.env.MONDAY_PODCAST_BOARD_ID;

export async function POST(request) {
  try {
    console.log("[PODCAST-MONDAY] Iniciando actualización de Monday.com...");

    const { allVideos = [], totalVideos = 0 } = await request.json();
    console.log("[PODCAST-MONDAY] Datos recibidos:", {
      allVideosCount: allVideos.length,
      totalVideos: totalVideos,
    });

    console.log("[PODCAST-MONDAY] Variables de entorno:");
    console.log(
      "  - MONDAY_PODCAST_BOARD_ID:",
      PODCAST_BOARD_ID || "NO CONFIGURADO"
    );
    console.log(
      "  - MONDAY_API_KEY:",
      process.env.MONDAY_API_KEY ? "Configurada" : "NO CONFIGURADA"
    );

    if (!PODCAST_BOARD_ID) {
      console.error(
        "[PODCAST-MONDAY] Error: MONDAY_PODCAST_BOARD_ID no está configurado"
      );
      return NextResponse.json(
        { error: "MONDAY_PODCAST_BOARD_ID no está configurado" },
        { status: 500 }
      );
    }

    console.log("[PODCAST-MONDAY] Conectando a la base de datos...");
    await connectDB();

    console.log(
      `[PODCAST-MONDAY] Procesando ${allVideos.length} videos para Monday.com`
    );

    const createdItems = [];
    const errors = [];

    for (const video of allVideos) {
      try {
        console.log(`[PODCAST-MONDAY] Procesando video: ${video.videoId}`);

        // Obtener datos actualizados de MongoDB
        const mongoVideo = await PodcastVideo.findOne({
          videoId: video.videoId,
        });
        if (!mongoVideo) {
          console.log(
            `[PODCAST-MONDAY] Video no encontrado en MongoDB: ${video.videoId}`
          );
          continue;
        }

        // Usar los datos actualizados de MongoDB
        const videoData = {
          videoId: mongoVideo.videoId,
          title: mongoVideo.title,
          description: mongoVideo.description || "",
          publishedAt: mongoVideo.publishedAt,
          thumbnail: mongoVideo.thumbnail || "",
          viewCount: mongoVideo.viewCount || 0,
          likeCount: mongoVideo.likeCount || 0,
          mondayItemId: mongoVideo.mondayItemId || "",
          isPublished: mongoVideo.isPublished || false,
          isDraft: mongoVideo.isDraft || false,
        };

        console.log(`[PODCAST-MONDAY] Datos del video (desde MongoDB):`, {
          videoId: videoData.videoId,
          title: videoData.title.substring(0, 50) + "...",
          viewCount: videoData.viewCount,
          likeCount: videoData.likeCount,
          mondayItemId: videoData.mondayItemId,
          isPublished: videoData.isPublished,
        });

        // Buscar si ya existe un item en Monday.com con ese Video ID
        const findItemQuery = `query { boards(ids: [${PODCAST_BOARD_ID}]) { items_page(limit: 500) { items { id name column_values { id text } } } } }`;
        const findRes = await postMonday(findItemQuery);
        const items = findRes?.data?.boards?.[0]?.items_page?.items || [];
        const existingItem = items.find((item) =>
          item.column_values?.find(
            (col) => col.id === "text_mkshh5" && col.text === videoData.videoId
          )
        );

        const columnValues = {
          text_mkshnrz2: videoData.title, // Título
          text_mkshh5: videoData.videoId, // Video ID
          long_text_mkshzsqf: videoData.description.substring(0, 500), // Resumen AI
          text_mkshn1k8: `https://www.youtube.com/watch?v=${videoData.videoId}`,
          text_mksh5pen: videoData.thumbnail,
          date_mkshy6ck: videoData.publishedAt
            ? videoData.publishedAt.toISOString().split("T")[0]
            : null,
          numeric_mkshtg2f: String(videoData.viewCount),
          numeric_mkshy1xp: String(videoData.likeCount),
          status: videoData.isDraft ? "0" : "1",
        };

        if (existingItem) {
          // Actualizar el item existente
          const updateQuery = `mutation { change_multiple_column_values (board_id: ${PODCAST_BOARD_ID}, item_id: ${
            existingItem.id
          }, column_values: "${JSON.stringify(columnValues).replace(
            /\"/g,
            '\\"'
          )}") { id name } }`;
          const updateRes = await postMonday(updateQuery);
          if (updateRes?.data?.change_multiple_column_values?.id) {
            await PodcastVideo.findOneAndUpdate(
              { videoId: video.videoId },
              {
                mondayItemId: existingItem.id,
                isPublished: true,
                lastSynced: new Date(),
              },
              { upsert: true }
            );
            createdItems.push({
              videoId: video.videoId,
              title: videoData.title,
              mondayItemId: existingItem.id,
              updated: true,
              viewCount: videoData.viewCount,
              likeCount: videoData.likeCount,
            });
            console.log(
              `[PODCAST-MONDAY] Item actualizado: ${videoData.title} (${existingItem.id}) - views: ${videoData.viewCount}, likes: ${videoData.likeCount}`
            );
          } else {
            errors.push({
              videoId: video.videoId,
              title: videoData.title,
              error: "No se pudo actualizar el item en Monday.com",
            });
            console.log(
              `[PODCAST-MONDAY] ❌ Error actualizando item: ${videoData.title}`
            );
          }
        } else {
          // Crear el item nuevo
          const createItemQuery = `mutation { create_item (board_id: ${PODCAST_BOARD_ID}, item_name: "${
            videoData.title
          }", column_values: "${JSON.stringify(columnValues).replace(
            /\"/g,
            '\\"'
          )}") { id name } }`;
          const mondayResponse = await postMonday(createItemQuery);
          if (mondayResponse?.data?.create_item?.id) {
            const itemId = mondayResponse.data.create_item.id;
            await PodcastVideo.findOneAndUpdate(
              { videoId: video.videoId },
              {
                mondayItemId: itemId,
                isPublished: true,
                lastSynced: new Date(),
              },
              { upsert: true }
            );
            createdItems.push({
              videoId: video.videoId,
              title: videoData.title,
              mondayItemId: itemId,
              created: true,
              viewCount: videoData.viewCount,
              likeCount: videoData.likeCount,
            });
            console.log(
              `[PODCAST-MONDAY] ✅ Item creado: ${videoData.title} (${itemId}) - views: ${videoData.viewCount}, likes: ${videoData.likeCount}`
            );
          } else {
            errors.push({
              videoId: video.videoId,
              title: videoData.title,
              error: "No se pudo crear el item en Monday.com",
            });
            console.log(
              `[PODCAST-MONDAY] ❌ Error creando item: ${videoData.title}`
            );
          }
        }

        // Pausa entre creaciones para evitar rate limits
        await new Promise((resolve) => setTimeout(resolve, 500));
      } catch (error) {
        errors.push({
          videoId: video.videoId,
          error: error.message,
        });
        console.log(
          `[PODCAST-MONDAY] ❌ Error procesando: ${video.videoId} - ${error.message}`
        );
      }
    }

    // Actualizar estadísticas del board
    const statsQuery = `
      query {
        boards(ids: [${PODCAST_BOARD_ID}]) {
          items_page(limit: 500) {
            items {
              id
              name
              column_values {
                id
                text
                value
              }
            }
          }
        }
      }
    `;

    const statsResponse = await postMonday(statsQuery);
    const totalItems =
      statsResponse?.data?.boards?.[0]?.items_page?.items?.length || 0;

    console.log(`[PODCAST-MONDAY] ✅ Actualización completada:`);
    console.log(`   - Items creados: ${createdItems.length}`);
    console.log(`   - Errores: ${errors.length}`);
    console.log(`   - Total items en board: ${totalItems}`);

    return NextResponse.json({
      success: true,
      message: "Monday.com actualizado exitosamente",
      createdItems,
      errors,
      totalItems,
    });
  } catch (error) {
    console.error("[PODCAST-MONDAY] Error:", error);
    return NextResponse.json(
      { error: "Error actualizando Monday.com" },
      { status: 500 }
    );
  }
}
