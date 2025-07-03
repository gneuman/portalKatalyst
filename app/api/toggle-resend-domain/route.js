import { NextResponse } from "next/server";
import { Resend } from "resend";

export async function POST(request) {
  try {
    const { useTestDomain } = await request.json();

    if (typeof useTestDomain !== "boolean") {
      return NextResponse.json(
        { error: "useTestDomain debe ser true o false" },
        { status: 400 }
      );
    }

    // Verificar si el dominio de prueba funciona
    if (useTestDomain) {
      const resend = new Resend(process.env.RESEND_API_KEY);

      try {
        // Intentar enviar un correo de prueba con el dominio de prueba
        const result = await resend.emails.send({
          from: "Katalyst <onboarding@resend.dev>",
          to: "test@example.com", // Email de prueba
          subject: "Prueba de dominio",
          text: "Este es un correo de prueba para verificar el dominio.",
        });

        console.log("[TOGGLE-DOMAIN] Prueba exitosa con onboarding@resend.dev");

        return NextResponse.json({
          success: true,
          message: "Dominio de prueba configurado correctamente",
          currentDomain: "onboarding@resend.dev",
          note: "Los correos no aparecerán en el dashboard de Resend, pero funcionarán para envío",
        });
      } catch (error) {
        console.error("[TOGGLE-DOMAIN] Error con dominio de prueba:", error);
        return NextResponse.json(
          {
            error: "Error al probar dominio de prueba",
            details: error.message,
          },
          { status: 500 }
        );
      }
    } else {
      // Verificar si el dominio principal está disponible
      const resend = new Resend(process.env.RESEND_API_KEY);

      try {
        const domains = await resend.domains.list();
        const targetDomain = "email.pildorasnocode.com";
        const isVerified = domains.data?.some(
          (domain) => domain.name === targetDomain && domain.status === "valid"
        );

        if (!isVerified) {
          return NextResponse.json(
            {
              error: "El dominio email.pildorasnocode.com no está verificado",
              suggestion:
                "Verifica el dominio en tu dashboard de Resend o usa el dominio de prueba",
            },
            { status: 400 }
          );
        }

        return NextResponse.json({
          success: true,
          message: "Dominio verificado configurado correctamente",
          currentDomain: "noreply@email.pildorasnocode.com",
          note: "Los correos aparecerán en el dashboard de Resend",
        });
      } catch (error) {
        console.error("[TOGGLE-DOMAIN] Error verificando dominio:", error);
        return NextResponse.json(
          {
            error: "Error al verificar dominio",
            details: error.message,
          },
          { status: 500 }
        );
      }
    }
  } catch (error) {
    console.error("[TOGGLE-DOMAIN] Error:", error);
    return NextResponse.json(
      {
        error: "Error interno del servidor",
        details: error.message,
      },
      { status: 500 }
    );
  }
}
