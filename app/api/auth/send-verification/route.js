import { NextResponse } from "next/server";
import { connectDB } from "@/libs/mongodb";
import User from "@/app/models/User";
import { Resend } from "resend";
import config from "@/config";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
  try {
    const { email } = await request.json();
    console.log("[send-verification] Enviando verificación a:", email);

    if (!email) {
      return NextResponse.json(
        { error: "Email es requerido" },
        { status: 400 }
      );
    }

    // Buscar usuario en MongoDB
    await connectDB();
    const user = await User.findOne({ email });

    if (!user) {
      return NextResponse.json(
        { error: "Usuario no encontrado" },
        { status: 404 }
      );
    }

    // Enviar correo de verificación
    try {
      const verificationUrl = `${
        process.env.NEXTAUTH_URL || "http://localhost:3000"
      }/dashboard`;
      const result = await resend.emails.send({
        from: config.resend.fromNoReply,
        to: [email],
        subject: "Tu acceso a Katalyst",
        html: `
          <div style="background:#f9fafb;padding:40px 0;min-height:100vh;font-family:sans-serif;">
            <div style="max-width:480px;margin:40px auto;background:#fff;border-radius:12px;padding:32px 24px;box-shadow:0 2px 8px #0001;">
              <h2 style="text-align:center;color:#222;font-size:24px;margin-bottom:24px;">¡Bienvenido a <span style='color:#FFA726'>Katalyst</span>!</h2>
              <p style="text-align:center;font-size:16px;color:#444;margin-bottom:32px;">Haz clic en el botón para acceder a tu cuenta:</p>
              <div style="text-align:center;margin-bottom:32px;">
                <a href="${verificationUrl}" style="display:inline-block;padding:16px 32px;background:#FFA726;color:#fff;font-size:18px;font-weight:bold;border-radius:8px;text-decoration:none;">Acceder a Katalyst</a>
              </div>
              <p style="text-align:center;font-size:14px;color:#888;">Si no solicitaste este acceso, puedes ignorar este correo.</p>
              <hr style="margin:32px 0;border:none;border-top:1px solid #eee;" />
              <p style="text-align:center;font-size:12px;color:#bbb;">&copy; ${new Date().getFullYear()} Katalyst</p>
            </div>
          </div>
        `,
      });

      console.log("[Resend] Resultado del envío:", result);
      console.log("[Resend] Correo de verificación enviado a:", email);

      return NextResponse.json({
        success: true,
        message: "Correo de verificación enviado exitosamente",
      });
    } catch (emailError) {
      console.error("[Resend] Error al enviar correo:", emailError);
      return NextResponse.json(
        { error: "Error al enviar correo de verificación" },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error en send-verification:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
