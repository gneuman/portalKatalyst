import { NextResponse } from "next/server";
import { postMonday } from "@/libs/monday";
import { Resend } from "resend";
import config from "@/config";
import { connectDB } from "@/libs/mongodb";
import User from "@/app/models/User";
import crypto from "crypto";

const resend = new Resend(process.env.RESEND_API_KEY);
const RESEND_AUDIENCE_ID = process.env.RESEND_AUDIENCE_ID;

const VerificationToken = require("@/models/VerificationToken").default;

// Bloqueo para evitar requests simultáneos
const processingEmails = new Set();

export async function POST(request) {
  try {
    const { email } = await request.json();
    console.log("=== INICIO DE REGISTRO ===");
    console.log("Email:", email);

    if (!email) {
      return NextResponse.json(
        { error: "Email es requerido" },
        { status: 400 }
      );
    }

    // VERIFICAR SI YA SE ESTÁ PROCESANDO ESTE EMAIL
    if (processingEmails.has(email)) {
      console.log("⚠️ Email ya se está procesando:", email);
      return NextResponse.json(
        { error: "Email ya se está procesando" },
        { status: 409 }
      );
    }

    // AGREGAR EMAIL AL SET DE PROCESAMIENTO
    processingEmails.add(email);
    console.log("🔒 Bloqueando email:", email);

    try {
      await connectDB();
      let user = await User.findOne({ email });
      if (!user) {
        user = await User.create({
          email,
          validado: false,
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
      // Generar token de verificación compatible con NextAuth
      const token = crypto.randomBytes(32).toString("hex");
      const expires = new Date(Date.now() + 1000 * 60 * 60); // 1 hora
      await VerificationToken.create({
        identifier: email,
        token,
        expires,
      });
      // Aquí podrías enviar el correo manualmente si quieres, pero NextAuth lo hará al redirigir
      // Buscar/crear en Monday.com como antes (opcional, pero solo después de crear en Mongo)
      // ... (lógica de Monday.com si la quieres aquí)
      return NextResponse.json({
        success: true,
        message:
          "Usuario creado y token generado. Redirigiendo a NextAuth para verificación.",
        redirect: `/api/auth/signin?email=${encodeURIComponent(email)}`,
      });
    } finally {
      // LIBERAR EL BLOQUEO
      processingEmails.delete(email);
      console.log("🔓 Liberando email:", email);
    }
  } catch (error) {
    console.error("❌ Error en el registro:", error);

    // Asegurar que se libere el bloqueo en caso de error
    const { email } = await request.json().catch(() => ({}));
    if (email) {
      processingEmails.delete(email);
      console.log("🔓 Liberando email por error:", email);
    }

    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

// Función auxiliar removida - NextAuth maneja el envío de correos
