import { NextResponse } from "next/server";
import { connectDB } from "@/libs/mongodb";
import PodcastVideo from "@/app/models/PodcastVideo";

export async function POST(request) {
  try {
    console.log("[PODCAST-PROCESS] Iniciando procesamiento de video...");

    const { videoId } = await request.json();
    console.log("[PODCAST-PROCESS] Video ID recibido:", videoId);

    if (!videoId) {
      console.error("[PODCAST-PROCESS] Error: videoId es requerido");
      return NextResponse.json(
        { error: "videoId es requerido" },
        { status: 400 }
      );
    }

    const geminiApiKey = process.env.GEMINI_API_KEY;
    console.log(
      "[PODCAST-PROCESS] GEMINI_API_KEY configurada:",
      geminiApiKey ? "Sí" : "No"
    );

    if (!geminiApiKey) {
      console.error(
        "[PODCAST-PROCESS] Error: GEMINI_API_KEY no está configurada"
      );
      return NextResponse.json(
        { error: "GEMINI_API_KEY no está configurada" },
        { status: 500 }
      );
    }

    console.log("[PODCAST-PROCESS] Conectando a la base de datos...");
    await connectDB();

    // Buscar el video en la base de datos
    console.log("[PODCAST-PROCESS] Buscando video en la base de datos...");
    const video = await PodcastVideo.findOne({ videoId });

    if (!video) {
      console.error(
        "[PODCAST-PROCESS] Error: Video no encontrado en la base de datos"
      );
      return NextResponse.json(
        { error: "Video no encontrado en la base de datos" },
        { status: 404 }
      );
    }

    console.log("[PODCAST-PROCESS] Video encontrado:", {
      videoId: video.videoId,
      title: video.title.substring(0, 50) + "...",
      isProcessed: video.isProcessed,
      isPublished: video.isPublished,
    });

    if (video.isProcessed) {
      console.log(
        "[PODCAST-PROCESS] Video ya procesado, retornando datos existentes"
      );
      return NextResponse.json({
        success: true,
        message: "Video ya procesado",
        video: {
          id: video._id,
          videoId: video.videoId,
          title: video.title,
          aiSummary: video.aiSummary,
          aiTitle: video.aiTitle,
        },
      });
    }

    console.log(`[PODCAST-PROCESS] Procesando video: ${videoId}`);

    // Generar resumen con Gemini
    console.log("[PODCAST-PROCESS] Generando prompt para Gemini...");
    const prompt = `
Este es el contenido de un episodio de podcast titulado "${video.title}".

Descripción del video:
${video.description}

Por favor, genera:

1. Un resumen del episodio en máximo 3 párrafos. Sé claro, directo y amigable.
2. Un título alternativo más atractivo para el episodio (máximo 60 caracteres).

Formato de respuesta:
RESUMEN:
[tu resumen aquí]

TITULO:
[tu título aquí]
`;

    console.log(
      "[PODCAST-PROCESS] Prompt generado:",
      prompt.substring(0, 200) + "..."
    );
    console.log("[PODCAST-PROCESS] Llamando a Gemini API...");

    const geminiResponse = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-pro:generateContent?key=${geminiApiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
        }),
      }
    );

    console.log(
      "[PODCAST-PROCESS] Respuesta de Gemini:",
      geminiResponse.status,
      geminiResponse.statusText
    );

    const geminiData = await geminiResponse.json();
    console.log("[PODCAST-PROCESS] Datos de Gemini:", {
      hasCandidates: !!geminiData.candidates,
      candidatesCount: geminiData.candidates?.length || 0,
      error: geminiData.error,
      message: geminiData.message,
    });

    if (!geminiData.candidates?.[0]?.content?.parts?.[0]?.text) {
      console.error(
        "[PODCAST-PROCESS] Error: No se pudo generar el resumen con Gemini"
      );
      console.error(
        "[PODCAST-PROCESS] Respuesta completa de Gemini:",
        geminiData
      );
      throw new Error("No se pudo generar el resumen con Gemini");
    }

    const responseText = geminiData.candidates[0].content.parts[0].text;
    console.log(
      "[PODCAST-PROCESS] Respuesta de Gemini:",
      responseText.substring(0, 200) + "..."
    );

    // Extraer resumen y título del response
    console.log("[PODCAST-PROCESS] Extrayendo resumen y título...");
    const summaryMatch = responseText.match(
      /RESUMEN:\s*([\s\S]*?)(?=TITULO:|$)/i
    );
    const titleMatch = responseText.match(/TITULO:\s*([^\n]+)/i);

    const aiSummary = summaryMatch ? summaryMatch[1].trim() : "";
    const aiTitle = titleMatch ? titleMatch[1].trim() : video.title;

    console.log("[PODCAST-PROCESS] Datos extraídos:", {
      aiSummaryLength: aiSummary.length,
      aiTitle: aiTitle,
      hasSummary: !!aiSummary,
      hasTitle: !!aiTitle,
    });

    // Actualizar el video con el resumen generado
    console.log("[PODCAST-PROCESS] Actualizando video en la base de datos...");
    await PodcastVideo.findOneAndUpdate(
      { videoId },
      {
        aiSummary,
        aiTitle,
        isProcessed: true,
        lastSynced: new Date(),
      }
    );

    console.log(`[PODCAST-PROCESS] Video procesado exitosamente: ${videoId}`);

    return NextResponse.json({
      success: true,
      message: "Video procesado exitosamente",
      video: {
        id: video._id,
        videoId: video.videoId,
        title: video.title,
        aiSummary,
        aiTitle,
        isProcessed: true,
      },
    });
  } catch (error) {
    console.error("[PODCAST-PROCESS] Error procesando video:", error);
    console.error("[PODCAST-PROCESS] Stack trace:", error.stack);
    return NextResponse.json(
      { error: "Error al procesar video" },
      { status: 500 }
    );
  }
}
