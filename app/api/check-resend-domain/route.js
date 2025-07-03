import { NextResponse } from "next/server";
import { Resend } from "resend";

export async function GET() {
  try {
    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        { error: "RESEND_API_KEY no está configurada" },
        { status: 400 }
      );
    }

    const resend = new Resend(process.env.RESEND_API_KEY);

    console.log("[CHECK-DOMAIN] Verificando dominios en Resend...");

    // Obtener dominios verificados
    const domains = await resend.domains.list();

    console.log("[CHECK-DOMAIN] Dominios encontrados:", domains);

    // Verificar si email.pildorasnocode.com está verificado
    const targetDomain = "email.pildorasnocode.com";
    const isVerified = domains.data?.some(
      (domain) => domain.name === targetDomain && domain.status === "valid"
    );

    return NextResponse.json({
      success: true,
      domains: domains.data,
      targetDomain,
      isVerified,
      totalDomains: domains.data?.length || 0,
    });
  } catch (error) {
    console.error("[CHECK-DOMAIN] Error:", error);
    return NextResponse.json(
      {
        error: "Error al verificar dominios",
        details: error.message,
        code: error.code,
        statusCode: error.statusCode,
      },
      { status: 500 }
    );
  }
}
