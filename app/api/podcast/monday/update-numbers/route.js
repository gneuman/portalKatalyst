import { NextResponse } from "next/server";
import { postMonday } from "@/libs/monday";
import { connectDB } from "@/libs/mongodb";
import PodcastVideo from "@/app/models/PodcastVideo";

const PODCAST_BOARD_ID = process.env.MONDAY_PODCAST_BOARD_ID;

export async function POST(request) {
  try {
    console.log(
      "[PODCAST-MONDAY-UPDATE] Iniciando sincronización completa con Monday.com..."
    );

    console.log("[PODCAST-MONDAY-UPDATE] Variables de entorno:");
    console.log(
      "  - MONDAY_PODCAST_BOARD_ID:",
      PODCAST_BOARD_ID || "NO CONFIGURADO"
    );

    if (!PODCAST_BOARD_ID) {
      console.error(
        "[PODCAST-MONDAY-UPDATE] Error: MONDAY_PODCAST_BOARD_ID no está configurado"
      );
      return NextResponse.json(
        { error: "MONDAY_PODCAST_BOARD_ID no está configurado" },
        { status: 500 }
      );
    }

    console.log("[PODCAST-MONDAY-UPDATE] Conectando a la base de datos...");
    await connectDB();

    // Paso 1: Obtener videos de YouTube con estadísticas actualizadas
    console.log(
      "[PODCAST-MONDAY-UPDATE] Paso 1: Obteniendo videos de YouTube..."
    );
    const youtubeResponse = await fetch(
      `${process.env.NEXTAUTH_URL}/api/podcast/youtube`
    );
    const youtubeData = await youtubeResponse.json();

    if (!youtubeData.success) {
      throw new Error(
        `Error obteniendo videos de YouTube: ${youtubeData.error}`
      );
    }

    console.log(
      `[PODCAST-MONDAY-UPDATE] Videos obtenidos: ${youtubeData.total}`
    );

    // Paso 2: Obtener items existentes de Monday.com
    console.log(
      "[PODCAST-MONDAY-UPDATE] Paso 2: Obteniendo items de Monday.com..."
    );
    const mondayItems = await getAllMondayItems();
    console.log(
      `[PODCAST-MONDAY-UPDATE] Items en Monday.com: ${mondayItems.length}`
    );

    // Paso 3: Sincronizar cada video con Monday.com
    console.log(
      "[PODCAST-MONDAY-UPDATE] Paso 3: Sincronizando con Monday.com..."
    );
    const syncResults = await syncVideosWithMonday(
      youtubeData.videos,
      mondayItems
    );

    // Paso 4: Actualizar MongoDB con datos de Monday.com
    console.log("[PODCAST-MONDAY-UPDATE] Paso 4: Actualizando MongoDB...");
    await updateMongoDBFromMonday();

    console.log(`[PODCAST-MONDAY-UPDATE] ✅ Sincronización completada:`);
    console.log(`   - Videos de YouTube: ${youtubeData.total}`);
    console.log(`   - Items creados: ${syncResults.created}`);
    console.log(`   - Items actualizados: ${syncResults.updated}`);
    console.log(`   - Errores: ${syncResults.errors}`);

    return NextResponse.json({
      success: true,
      message: "Sincronización completa exitosa con Monday.com",
      summary: {
        youtubeVideos: youtubeData.total,
        mondayItems: mondayItems.length,
        created: syncResults.created,
        updated: syncResults.updated,
        errors: syncResults.errors,
      },
    });
  } catch (error) {
    console.error("[PODCAST-MONDAY-UPDATE] Error:", error);
    return NextResponse.json(
      { error: "Error en sincronización con Monday.com" },
      { status: 500 }
    );
  }
}

// Función para obtener todos los items de Monday.com (con paginación)
async function getAllMondayItems() {
  const items = [];
  let cursor = null;

  do {
    const query = `
      query {
        boards(ids: [${PODCAST_BOARD_ID}]) {
          items_page(limit: 500${cursor ? `, cursor: "${cursor}"` : ""}) {
            items {
              id
              name
              column_values {
                id
                text
                value
              }
            }
            cursor
          }
        }
      }
    `;

    const response = await postMonday(query);
    const pageItems = response?.data?.boards?.[0]?.items_page?.items || [];
    items.push(...pageItems);
    cursor = response?.data?.boards?.[0]?.items_page?.cursor;
  } while (cursor);

  return items;
}

// Función para sincronizar videos con Monday.com
async function syncVideosWithMonday(youtubeVideos, mondayItems) {
  const results = { created: 0, updated: 0, errors: 0 };

  for (const video of youtubeVideos) {
    try {
      // Buscar si el video ya existe en Monday.com
      const existingItem = mondayItems.find((item) =>
        item.column_values?.find(
          (col) => col.id === "text_mkshh5" && col.text === video.videoId
        )
      );

      // Preparar datos del video
      const videoData = {
        videoId: video.videoId,
        title: video.title,
        description: video.description || "",
        publishedAt: new Date(video.publishedAt),
        thumbnail: video.thumbnail || "",
        viewCount: video.viewCount || 0,
        likeCount: video.likeCount || 0,
        isPublished: true,
        isDraft: false,
      };

      // Preparar valores de columnas para Monday.com
      const columnValues = {
        text_mkshnrz2: videoData.title,
        text_mkshh5: videoData.videoId,
        long_text_mkshzsqf: videoData.description.substring(0, 500),
        text_mkshn1k8: `https://www.youtube.com/watch?v=${videoData.videoId}`,
        text_mksh5pen: videoData.thumbnail,
        date_mkshy6ck: videoData.publishedAt.toISOString().split("T")[0],
        numeric_mkshtg2f: String(videoData.viewCount),
        numeric_mkshy1xp: String(videoData.likeCount),
        status: videoData.isDraft ? "0" : "1",
      };

      console.log(`[PODCAST-MONDAY-UPDATE] 📊 Valores para ${videoData.title}:`);
      console.log(`   - Vistas (numeric_mkshtg2f): ${videoData.viewCount} -> "${String(videoData.viewCount)}"`);
      console.log(`   - Likes (numeric_mkshy1xp): ${videoData.likeCount} -> "${String(videoData.likeCount)}"`);
      console.log(`   - ColumnValues completo:`, JSON.stringify(columnValues, null, 2));

      if (existingItem) {
        // Actualizar item existente
        const updateQuery = `
          mutation {
            change_multiple_column_values (
              board_id: ${PODCAST_BOARD_ID},
              item_id: ${existingItem.id},
              column_values: "${JSON.stringify(columnValues).replace(
                /\"/g,
                '\\"'
              )}"
            ) {
              id
              name
            }
          }
        `;

        const updateResponse = await postMonday(updateQuery);
        if (updateResponse?.data?.change_multiple_column_values?.id) {
          results.updated++;
          console.log(
            `[PODCAST-MONDAY-UPDATE] ✅ Actualizado: ${videoData.title} (Views: ${videoData.viewCount}, Likes: ${videoData.likeCount})`
          );
        } else {
          results.errors++;
          console.log(
            `[PODCAST-MONDAY-UPDATE] ❌ Error actualizando: ${videoData.title}`
          );
        }
      } else {
        // Crear nuevo item
        const createQuery = `
          mutation {
            create_item (
              board_id: ${PODCAST_BOARD_ID},
              item_name: "${videoData.title.replace(/"/g, '\\"')}",
              column_values: "${JSON.stringify(columnValues).replace(
                /\"/g,
                '\\"'
              )}"
            ) {
              id
              name
            }
          }
        `;

        const createResponse = await postMonday(createQuery);
        if (createResponse?.data?.create_item?.id) {
          results.created++;
          console.log(
            `[PODCAST-MONDAY-UPDATE] ✅ Creado: ${videoData.title} (Views: ${videoData.viewCount}, Likes: ${videoData.likeCount})`
          );
        } else {
          results.errors++;
          console.log(
            `[PODCAST-MONDAY-UPDATE] ❌ Error creando: ${videoData.title}`
          );
        }
      }

      // Pausa entre operaciones
      await new Promise((resolve) => setTimeout(resolve, 500));
    } catch (error) {
      results.errors++;
      console.log(
        `[PODCAST-MONDAY-UPDATE] ❌ Error procesando ${video.videoId}: ${error.message}`
      );
    }
  }

  return results;
}

// Función para actualizar MongoDB con datos de Monday.com
async function updateMongoDBFromMonday() {
  try {
    // Obtener todos los items de Monday.com
    const mondayItems = await getAllMondayItems();

    // Limpiar MongoDB
    await PodcastVideo.deleteMany({});

    // Insertar datos de Monday.com en MongoDB
    for (const item of mondayItems) {
      const videoId = item.column_values?.find(
        (col) => col.id === "text_mkshh5"
      )?.text;
      const title = item.column_values?.find(
        (col) => col.id === "text_mkshnrz2"
      )?.text;
      const description = item.column_values?.find(
        (col) => col.id === "long_text_mkshzsqf"
      )?.text;
      const url = item.column_values?.find(
        (col) => col.id === "text_mkshn1k8"
      )?.text;
      const thumbnail = item.column_values?.find(
        (col) => col.id === "text_mksh5pen"
      )?.text;
      const publishedAt = item.column_values?.find(
        (col) => col.id === "date_mkshy6ck"
      )?.text;
      const viewCount = parseInt(
        item.column_values?.find((col) => col.id === "numeric_mkshtg2f")
          ?.text || "0"
      );
      const likeCount = parseInt(
        item.column_values?.find((col) => col.id === "numeric_mkshy1xp")
          ?.text || "0"
      );

      if (videoId && title) {
        await PodcastVideo.create({
          videoId,
          title,
          description: description || "",
          publishedAt: publishedAt ? new Date(publishedAt) : new Date(),
          thumbnail: thumbnail || "",
          viewCount,
          likeCount,
          mondayItemId: item.id,
          isPublished: true,
          lastSynced: new Date(),
        });
      }
    }

    console.log(
      `[PODCAST-MONDAY-UPDATE] MongoDB actualizado con ${mondayItems.length} items`
    );
  } catch (error) {
    console.error("[PODCAST-MONDAY-UPDATE] Error actualizando MongoDB:", error);
    throw error;
  }
}
