import { NextResponse } from "next/server";
import { Resend } from "resend";
import Invite from "@/models/Invite";
import User from "@/models/User";
import connectMongo from "@/libs/mongoose";
import config from "@/config";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/next-auth";
import crypto from "crypto";

export async function POST(req) {
  try {
    await connectMongo();
    const session = await getServerSession(authOptions);
    const { email, empresaId, empresaNombre } = await req.json();

    if (!email || !empresaId || !empresaNombre) {
      return NextResponse.json({ error: "Faltan parámetros" }, { status: 400 });
    }

    // Obtener el nombre real del usuario logueado desde Monday
    let invitadorNombre = session?.user?.name || "Un usuario";
    let invitadorMondayId = null;
    if (session?.user?.email) {
      const userInvitador = await User.findOne({ email: session.user.email });
      invitadorMondayId = userInvitador?.personalMondayId;
      if (invitadorMondayId) {
        const query = `query { items (ids: [${invitadorMondayId}]) { id name } }`;
        const mondayRes = await fetch("https://api.monday.com/v2", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: process.env.MONDAY_API_KEY,
          },
          body: JSON.stringify({ query }),
        });
        const data = await mondayRes.json();
        invitadorNombre = data?.data?.items?.[0]?.name || invitadorNombre;
      }
    }

    // 1. Buscar usuario en MongoDB
    const user = await User.findOne({ email });
    let contactoMonday = null;
    let nombreContacto = null;

    // 2. Si no existe en MongoDB, buscar en Monday
    if (!user) {
      const boardId = process.env.MONDAY_CONTACTS_BOARD_ID;
      const query = `query { items_by_column_values (board_id: ${boardId}, column_id: \"email\", column_value: \"${email}\") { id name column_values { id text value } } }`;
      const mondayRes = await fetch("https://api.monday.com/v2", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: process.env.MONDAY_API_KEY,
        },
        body: JSON.stringify({ query }),
      });
      const data = await mondayRes.json();
      contactoMonday = data?.data?.items_by_column_values?.[0] || null;
    } else {
      // Si existe en MongoDB, obtener su nombre de Monday
      const query = `query { items (ids: [${user.personalMondayId}]) { id name } }`;
      const mondayRes = await fetch("https://api.monday.com/v2", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: process.env.MONDAY_API_KEY,
        },
        body: JSON.stringify({ query }),
      });
      const data = await mondayRes.json();
      nombreContacto = data?.data?.items?.[0]?.name || null;
    }

    // Generar hash seguro con empresaId, invitadorMondayId y email
    const raw = `${email}:${empresaId}:${invitadorMondayId}:${Date.now()}`;
    const token = crypto.createHash("sha256").update(raw).digest("hex");
    await Invite.create({
      email,
      empresaId,
      token,
      status: "pending",
      invitadorMondayId,
    });

    // 4. Enviar correo con Resend
    let baseUrl = "";
    if (process.env.NODE_ENV === "development") {
      baseUrl = "http://localhost:3000";
    } else {
      baseUrl = `https://${config.domainName}`;
    }
    // El link ahora lleva el token, el id de la empresa y el mondayId del invitador
    const url = `${baseUrl}/invitar?token=${token}&empresaId=${empresaId}&invitadorMondayId=${invitadorMondayId}`;
    const resend = new Resend(process.env.RESEND_API_KEY);
    let subject, html;
    if (!user && !contactoMonday) {
      subject = `Te acaban de invitar a participar en Katalyst en la empresa ${empresaNombre}`;
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #333; text-align: center;">¡Bienvenido a Katalyst!</h2>
          <p style="color: #666; line-height: 1.6;">${invitadorNombre} te acaba de invitar a participar en <strong>Katalyst</strong> en la empresa <strong>${empresaNombre}</strong>.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${url}" style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Registrarme y aceptar invitación</a>
          </div>
        </div>
      `;
    } else {
      subject = `${invitadorNombre} te acaba de invitar a colaborar en ${empresaNombre}`;
      html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
          <h2 style="color: #333; text-align: center;">¡Invitación a Colaborar!</h2>
          <p style="color: #666; line-height: 1.6;">${invitadorNombre} te acaba de invitar a colaborar en <strong>${empresaNombre}</strong>.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${url}" style="background-color: #6366f1; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold;">Aceptar invitación</a>
          </div>
        </div>
      `;
    }
    console.log("Enviando correo a:", email);
    console.log("Subject:", subject);
    console.log("HTML:", html);
    const emailRes = await resend.emails.send({
      from: "katalyst@email.pildorasnocode.com",
      to: email,
      subject,
      html,
    });
    console.log("Respuesta de Resend:", emailRes);

    return NextResponse.json({
      ok: true,
      userExists: !!user,
      contactoMonday,
      nombreContacto,
      emailSent: true,
    });
  } catch (error) {
    console.error("Error en el proceso de invitación:", error);
    return NextResponse.json(
      { error: "Error al procesar la invitación" },
      { status: 500 }
    );
  }
}
