import { NextResponse } from "next/server";
import Stripe from "stripe";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_...");

export async function POST(req) {
  try {
    const body = await req.json();
    const { sessionId } = body;

    if (!sessionId) {
      return NextResponse.json(
        { error: "Session ID es requerido" },
        { status: 400 }
      );
    }

    // Obtener la sesión de checkout
    const session = await stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["line_items", "customer"],
    });

    if (!session) {
      return NextResponse.json(
        { error: "Sesión no encontrada" },
        { status: 404 }
      );
    }

    // Extraer información de la donación
    const donationInfo = {
      donorName: session.metadata?.donorName || "Donador anónimo",
      donorEmail: session.customer_email || session.customer?.email || "",
      type: session.metadata?.donationType || "one-time",
      amount: session.metadata?.amount || "0",
      message: session.metadata?.donorMessage || "",
      sessionId: session.id,
      status: session.payment_status,
      createdAt: new Date(session.created * 1000).toISOString(),
    };

    // Si es una suscripción, obtener información adicional
    if (session.mode === "subscription" && session.subscription) {
      const subscription = await stripe.subscriptions.retrieve(
        session.subscription
      );
      donationInfo.subscriptionId = subscription.id;
      donationInfo.subscriptionStatus = subscription.status;
      donationInfo.currentPeriodEnd = new Date(
        subscription.current_period_end * 1000
      ).toISOString();
    }

    return NextResponse.json(donationInfo);
  } catch (error) {
    console.error("Error al obtener información de la donación:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
