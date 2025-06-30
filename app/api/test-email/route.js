import { NextResponse } from "next/server";
import { Resend } from "resend";
import config from "@/config";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
  try {
    const { email } = await request.json();

    console.log("[TEST-EMAIL] Configuración:", {
      apiKey: process.env.RESEND_API_KEY ? "Configurada" : "No configurada",
      from: config.resend.fromNoReply,
      to: email,
    });

    if (!process.env.RESEND_API_KEY) {
      return NextResponse.json(
        {
          error: "RESEND_API_KEY no está configurada",
          config: {
            from: config.resend.fromNoReply,
            to: email,
          },
        },
        { status: 500 }
      );
    }

    const result = await resend.emails.send({
      from: config.resend.fromNoReply,
      to: [email],
      subject: "Prueba de email - Katalyst",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #1C384A;">¡Prueba de email exitosa!</h2>
          <p>Este es un email de prueba para verificar que Resend está funcionando correctamente.</p>
          <p>Email enviado a: <strong>${email}</strong></p>
          <p>Fecha: <strong>${new Date().toLocaleString()}</strong></p>
        </div>
      `,
    });

    console.log("[TEST-EMAIL] Resultado:", result);

    return NextResponse.json({
      success: true,
      message: "Email de prueba enviado exitosamente",
      result: result,
    });
  } catch (error) {
    console.error("[TEST-EMAIL] Error:", error);
    return NextResponse.json(
      {
        error: error.message,
        details: error,
      },
      { status: 500 }
    );
  }
}
