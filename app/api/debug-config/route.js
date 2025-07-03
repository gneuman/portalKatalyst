import { NextResponse } from "next/server";
import config from "@/config";

export async function GET() {
  try {
    const debugInfo = {
      environment: process.env.NODE_ENV,
      resend: {
        apiKeyPresent: !!process.env.RESEND_API_KEY,
        apiKeyLength: process.env.RESEND_API_KEY
          ? process.env.RESEND_API_KEY.length
          : 0,
        fromNoReply: config.resend.fromNoReply,
        fromAdmin: config.resend.fromAdmin,
        supportEmail: config.resend.supportEmail,
      },
      nextauth: {
        url: process.env.NEXTAUTH_URL,
        secret: !!process.env.NEXTAUTH_SECRET,
        secretLength: process.env.NEXTAUTH_SECRET
          ? process.env.NEXTAUTH_SECRET.length
          : 0,
      },
      mongodb: {
        uri: !!process.env.MONGODB_URI,
        uriLength: process.env.MONGODB_URI ? process.env.MONGODB_URI.length : 0,
      },
      domain: {
        name: config.domainName,
        fullUrl: process.env.NEXTAUTH_URL,
      },
      timestamp: new Date().toISOString(),
    };

    return NextResponse.json(debugInfo);
  } catch (error) {
    return NextResponse.json(
      { error: "Error al obtener configuración", details: error.message },
      { status: 500 }
    );
  }
}
