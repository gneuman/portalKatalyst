import { NextResponse } from "next/server";
import { connectDB } from "@/libs/mongodb";
import User from "@/app/models/User";

export async function GET(request) {
  try {
    const { searchParams } = new URL(
      request.url,
      process.env.NEXTAUTH_URL || "http://localhost:3000"
    );
    const token = searchParams.get("token");
    const isAjax = request.headers.get("accept")?.includes("application/json");

    if (!token) {
      console.log("[VERIFY] Token no proporcionado");
      if (isAjax) {
        return NextResponse.json(
          { error: "Token no proporcionado" },
          { status: 400 }
        );
      }
      return NextResponse.redirect(
        `${
          process.env.NEXTAUTH_URL || "http://localhost:3000"
        }/auth/verify-request?error=missing_token`
      );
    }

    await connectDB();
    const user = await User.findById(token);
    console.log("[VERIFY] Buscando usuario con _id:", token);

    if (!user) {
      console.log("[VERIFY] Usuario no encontrado para _id:", token);
      if (isAjax) {
        return NextResponse.json(
          { error: "Token inválido o expirado" },
          { status: 400 }
        );
      }
      return NextResponse.redirect(
        `${
          process.env.NEXTAUTH_URL || "http://localhost:3000"
        }/auth/verify-request?error=invalid_token`
      );
    }

    if (user.emailVerified) {
      console.log("[VERIFY] Usuario ya verificado:", user.email);
      console.log("[VERIFY] emailVerified value:", user.emailVerified);
      console.log("[VERIFY] emailVerified type:", typeof user.emailVerified);
      if (isAjax) {
        return NextResponse.json({
          success: true,
          message: "Usuario ya verificado",
          redirect: "/dashboard?verified=1",
        });
      }
      return NextResponse.redirect(
        `${
          process.env.NEXTAUTH_URL || "http://localhost:3000"
        }/dashboard?verified=1`
      );
    }

    console.log(
      "[VERIFY] Usuario NO verificado, marcando como verificado:",
      user.email
    );
    console.log("[VERIFY] emailVerified antes:", user.emailVerified);
    user.emailVerified = new Date();
    await user.save();
    console.log("[VERIFY] Usuario verificado:", user.email);

    if (isAjax) {
      return NextResponse.json({
        success: true,
        message: "Usuario verificado exitosamente",
        redirect: "/dashboard?verified=1",
      });
    }

    return NextResponse.redirect(
      `${
        process.env.NEXTAUTH_URL || "http://localhost:3000"
      }/dashboard?verified=1`
    );
  } catch (error) {
    console.error("[VERIFY] Error en verificación:", error);
    const isAjax = request.headers.get("accept")?.includes("application/json");

    if (isAjax) {
      return NextResponse.json(
        { error: "Error del servidor" },
        { status: 500 }
      );
    }

    return NextResponse.redirect(
      `${
        process.env.NEXTAUTH_URL || "http://localhost:3000"
      }/auth/verify-request?error=server_error`
    );
  }
}
