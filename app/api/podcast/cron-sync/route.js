import { NextResponse } from "next/server";

export async function POST(request) {
  try {
    // Verificar que sea una llamada autorizada (puedes agregar un token secreto)
    const authHeader = request.headers.get("authorization");
    const expectedToken = process.env.CRON_SECRET_TOKEN;

    if (expectedToken && authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json({ error: "No autorizado" }, { status: 401 });
    }

    console.log("[CRON-SYNC] Iniciando sincronización automática diaria...");
    console.log("[CRON-SYNC] Fecha:", new Date().toISOString());

    // Llamar al endpoint de sincronización completa
    const syncResponse = await fetch(
      `${process.env.NEXTAUTH_URL}/api/podcast/sync-complete`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    const syncData = await syncResponse.json();

    if (syncData.success) {
      console.log(
        "[CRON-SYNC] ✅ Sincronización automática completada exitosamente"
      );
      console.log("[CRON-SYNC] Resumen:", syncData.summary);

      return NextResponse.json({
        success: true,
        message: "Sincronización automática completada",
        timestamp: new Date().toISOString(),
        summary: syncData.summary,
      });
    } else {
      throw new Error(syncData.error || "Error en sincronización");
    }
  } catch (error) {
    console.error("[CRON-SYNC] Error en sincronización automática:", error);
    return NextResponse.json(
      {
        error: "Error en sincronización automática",
        details: error.message,
        timestamp: new Date().toISOString(),
      },
      { status: 500 }
    );
  }
}
