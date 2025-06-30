import { NextResponse } from "next/server";
import { connectDB } from "@/libs/mongodb";
import User from "@/app/models/User";
import { Resend } from "resend";

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
      await resend.emails.send({
        from: "Katalyst <noreply@katalyst.com>",
        to: [email],
        subject: "Verifica tu cuenta - Katalyst",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #1C384A;">¡Bienvenido a Katalyst!</h2>
            <p>Hola ${user.firstName || user.name || email.split("@")[0]},</p>
            <p>Gracias por registrarte en Katalyst. Para completar tu registro, por favor verifica tu cuenta.</p>
            <p>Tu Monday ID: <strong>${
              user.personalMondayId || "No asignado"
            }</strong></p>
            <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
            <p>Saludos,<br>El equipo de Katalyst</p>
          </div>
        `,
      });

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
