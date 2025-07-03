import { NextResponse } from "next/server";
import { Resend } from "resend";
import config from "@/config";

export async function POST(request) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email es requerido" },
        { status: 400 }
      );
    }

    console.log("[TEST-RESEND] Iniciando prueba de envío");
    console.log("[TEST-RESEND] Email:", email);
    console.log(
      "[TEST-RESEND] RESEND_API_KEY presente:",
      !!process.env.RESEND_API_KEY
    );
    console.log("[TEST-RESEND] From address:", config.resend.fromNoReply);

    const resend = new Resend(process.env.RESEND_API_KEY);

    console.log("[TEST-RESEND] Cliente Resend creado");

    const result = await resend.emails.send({
      from: config.resend.fromNoReply,
      to: email,
      subject: "Prueba de Resend - Katalyst",
      text: "Esta es una prueba del sistema de correos de Katalyst.",
      html: `
        <div style="background:#f9fafb;padding:40px 0;min-height:100vh;font-family:sans-serif;">
          <div style="max-width:480px;margin:40px auto;background:#fff;border-radius:12px;padding:32px 24px;box-shadow:0 2px 8px #0001;">
            <h2 style="text-align:center;color:#222;font-size:24px;margin-bottom:24px;">Prueba de <span style='color:#FFA726'>Resend</span></h2>
            <p style="text-align:center;font-size:16px;color:#444;margin-bottom:32px;">Si recibes este correo, Resend está funcionando correctamente.</p>
            <p style="text-align:center;font-size:14px;color:#888;">Timestamp: ${new Date().toISOString()}</p>
            <hr style="margin:32px 0;border:none;border-top:1px solid #eee;" />
            <p style="text-align:center;font-size:12px;color:#bbb;">© ${new Date().getFullYear()} Katalyst</p>
          </div>
        </div>
      `,
    });

    console.log("[TEST-RESEND] Resultado:", result);

    return NextResponse.json({
      success: true,
      message: "Correo de prueba enviado exitosamente",
      result,
    });
  } catch (error) {
    console.error("[TEST-RESEND] Error:", error);
    console.error("[TEST-RESEND] Detalles del error:", {
      message: error.message,
      code: error.code,
      statusCode: error.statusCode,
      response: error.response,
    });

    return NextResponse.json(
      {
        error: "Error al enviar correo de prueba",
        details: error.message,
        code: error.code,
        statusCode: error.statusCode,
      },
      { status: 500 }
    );
  }
}
