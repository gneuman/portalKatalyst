import { NextResponse } from "next/server";

export async function GET() {
  try {
    console.log("[DEBUG-ENV] Verificando variables de entorno...");

    const envVars = {
      MONDAY_API_KEY: process.env.MONDAY_API_KEY
        ? "Configurado"
        : "NO CONFIGURADO",
      MONDAY_PODCAST_BOARD_ID: process.env.MONDAY_PODCAST_BOARD_ID
        ? "Configurado"
        : "NO CONFIGURADO",
      NODE_ENV: process.env.NODE_ENV || "No configurado",
    };

    console.log("[DEBUG-ENV] Variables encontradas:", envVars);

    return NextResponse.json({
      success: true,
      environment: envVars,
      message: "Variables de entorno verificadas",
    });
  } catch (error) {
    console.error("[DEBUG-ENV] Error:", error);
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      { status: 500 }
    );
  }
}
