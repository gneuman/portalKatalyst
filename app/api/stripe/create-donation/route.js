import { NextResponse } from "next/server";
import Stripe from "stripe";

// Configuración de Stripe con claves de prueba
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_...");

// IDs de precios de prueba para donaciones (deberás crear estos en tu dashboard de Stripe)
const DONATION_PRICES = {
  // Donaciones únicas - usar payment_intent
  "one-time": null, // Se maneja con payment_intent

  // Donaciones recurrentes - usar subscription
  recurring: {
    100: "price_1OqX2X2X2X2X2X2X2X2X2X2X", // $100 MXN/mes
    250: "price_1OqX2X2X2X2X2X2X2X2X2X2X2", // $250 MXN/mes
    500: "price_1OqX2X2X2X2X2X2X2X2X2X2X3", // $500 MXN/mes
    1000: "price_1OqX2X2X2X2X2X2X2X2X2X2X4", // $1000 MXN/mes
  },
};

export async function POST(req) {
  try {
    const body = await req.json();
    const {
      amount,
      type,
      donorName,
      donorEmail,
      donorMessage,
      successUrl,
      cancelUrl,
    } = body;

    if (!amount || amount <= 0) {
      return NextResponse.json({ error: "Monto inválido" }, { status: 400 });
    }

    if (!donorName || !donorEmail) {
      return NextResponse.json(
        { error: "Nombre y email son requeridos" },
        { status: 400 }
      );
    }

    if (!successUrl || !cancelUrl) {
      return NextResponse.json(
        { error: "URLs de éxito y cancelación son requeridas" },
        { status: 400 }
      );
    }

    let session;

    if (type === "one-time") {
      // Donación única
      session = await stripe.checkout.sessions.create({
        mode: "payment",
        payment_method_types: ["card"],
        line_items: [
          {
            price_data: {
              currency: "mxn",
              product_data: {
                name: "Donación a Katalyst",
                description: "Donación única para apoyar nuestro proyecto",
                images: ["https://katalyst.org.mx/images/Katalyst.png"],
              },
              unit_amount: Math.round(amount * 100), // Stripe usa centavos
            },
            quantity: 1,
          },
        ],
        customer_email: donorEmail,
        metadata: {
          donorName,
          donorEmail,
          donorMessage: donorMessage || "",
          donationType: "one-time",
          amount: amount.toString(),
        },
        success_url: successUrl,
        cancel_url: cancelUrl,
        allow_promotion_codes: true,
        billing_address_collection: "required",
        custom_fields: [
          {
            key: "donor_name",
            label: {
              type: "custom",
              custom: "Nombre del donador",
            },
            type: "text",
            optional: false,
          },
          {
            key: "donor_message",
            label: {
              type: "custom",
              custom: "Mensaje (opcional)",
            },
            type: "text",
            optional: true,
          },
        ],
      });
    } else if (type === "recurring") {
      // Donación recurrente
      const priceId = DONATION_PRICES.recurring[amount];

      if (!priceId) {
        // Si no existe el precio, crear uno dinámicamente
        const product = await stripe.products.create({
          name: `Donación Mensual - $${amount} MXN`,
          description:
            "Donación mensual recurrente para apoyar nuestro proyecto",
          images: ["https://katalyst.org.mx/images/Katalyst.png"],
        });

        const price = await stripe.prices.create({
          product: product.id,
          unit_amount: Math.round(amount * 100),
          currency: "mxn",
          recurring: {
            interval: "month",
          },
        });

        session = await stripe.checkout.sessions.create({
          mode: "subscription",
          payment_method_types: ["card"],
          line_items: [
            {
              price: price.id,
              quantity: 1,
            },
          ],
          customer_email: donorEmail,
          metadata: {
            donorName,
            donorEmail,
            donorMessage: donorMessage || "",
            donationType: "recurring",
            amount: amount.toString(),
          },
          success_url: successUrl,
          cancel_url: cancelUrl,
          allow_promotion_codes: true,
          billing_address_collection: "required",
          custom_fields: [
            {
              key: "donor_name",
              label: {
                type: "custom",
                custom: "Nombre del donador",
              },
              type: "text",
              optional: false,
            },
            {
              key: "donor_message",
              label: {
                type: "custom",
                custom: "Mensaje (opcional)",
              },
              type: "text",
              optional: true,
            },
          ],
        });
      } else {
        // Usar precio existente
        session = await stripe.checkout.sessions.create({
          mode: "subscription",
          payment_method_types: ["card"],
          line_items: [
            {
              price: priceId,
              quantity: 1,
            },
          ],
          customer_email: donorEmail,
          metadata: {
            donorName,
            donorEmail,
            donorMessage: donorMessage || "",
            donationType: "recurring",
            amount: amount.toString(),
          },
          success_url: successUrl,
          cancel_url: cancelUrl,
          allow_promotion_codes: true,
          billing_address_collection: "required",
          custom_fields: [
            {
              key: "donor_name",
              label: {
                type: "custom",
                custom: "Nombre del donador",
              },
              type: "text",
              optional: false,
            },
            {
              key: "donor_message",
              label: {
                type: "custom",
                custom: "Mensaje (opcional)",
              },
              type: "text",
              optional: true,
            },
          ],
        });
      }
    } else {
      return NextResponse.json(
        { error: "Tipo de donación inválido" },
        { status: 400 }
      );
    }

    return NextResponse.json({ url: session.url });
  } catch (error) {
    console.error("Error al crear sesión de donación:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}
