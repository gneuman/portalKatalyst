import { NextResponse } from "next/server";
import { Resend } from "resend";
import config from "@/config";
import crypto from "crypto";
import User from "@/models/User";
import { connectDB } from "@/libs/mongodb";

const resend = new Resend(process.env.RESEND_API_KEY);

export async function POST(request) {
  try {
    const { email, type } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email es requerido" },
        { status: 400 }
      );
    }

    await connectDB();
    const user = await User.findOne({ email });
    if (!user) {
      // Por seguridad, responde igual aunque no exista
      return NextResponse.json({
        success: true,
        message: "Correo enviado si existe el usuario",
      });
    }

    if (type === "reset-password") {
      // 1. Generar token seguro
      const token = crypto.randomBytes(32).toString("hex");
      // 2. Guardar token y expiración en el usuario
      user.resetPasswordToken = token;
      user.resetPasswordExpires = Date.now() + 1000 * 60 * 60; // 1 hora
      await user.save();

      // 3. Generar URL de recuperación
      const resetUrl = `${
        process.env.NEXTAUTH_URL || "http://localhost:3000"
      }/reset-password/${token}`;

      // 4. Enviar correo de recuperación
      await resend.emails.send({
        from: config.resend.fromNoReply,
        to: [email],
        subject: "Recupera tu contraseña en Katalyst",
        html: `
          <div style="background:#f9fafb;padding:40px 0;min-height:100vh;font-family:sans-serif;">
            <div style="max-width:480px;margin:40px auto;background:#fff;border-radius:12px;padding:32px 24px;box-shadow:0 2px 8px #0001;">
              <h2 style="text-align:center;color:#222;font-size:24px;margin-bottom:24px;">Recupera tu contraseña en <span style='color:#FFA726'>Katalyst</span></h2>
              <p style="text-align:center;font-size:16px;color:#444;margin-bottom:32px;">Haz clic en el botón para restablecer tu contraseña:</p>
              <div style="text-align:center;margin-bottom:32px;">
                <a href="${resetUrl}" style="display:inline-block;padding:16px 32px;background:#FFA726;color:#fff;font-size:18px;font-weight:bold;border-radius:8px;text-decoration:none;">Restablecer contraseña</a>
              </div>
              <p style="text-align:center;font-size:14px;color:#888;">Si no solicitaste este acceso, puedes ignorar este correo.</p>
              <hr style="margin:32px 0;border:none;border-top:1px solid #eee;" />
              <p style="text-align:center;font-size:12px;color:#bbb;">© ${new Date().getFullYear()} Katalyst</p>
            </div>
          </div>
        `,
      });

      return NextResponse.json({
        success: true,
        message: "Correo de recuperación enviado",
      });
    }

    // Por defecto, enviar enlace mágico de acceso
    const verificationUrl = `${
      process.env.NEXTAUTH_URL || "http://localhost:3000"
    }/api/auth/signin/email?email=${encodeURIComponent(
      email
    )}&callbackUrl=${encodeURIComponent("/dashboard")}`;

    await resend.emails.send({
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
            <p style="text-align:center;font-size:12px;color:#bbb;">© ${new Date().getFullYear()} Katalyst</p>
          </div>
        </div>
      `,
    });

    return NextResponse.json({
      success: true,
      message: "Correo de verificación enviado exitosamente",
    });
  } catch (error) {
    console.error("[send-verification] Error:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
