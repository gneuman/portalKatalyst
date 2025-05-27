import { NextResponse } from "next/server";
import { headers } from "next/headers";
import Stripe from "stripe";
import connectMongo from "@/libs/mongoose";
import configFile from "@/config";
import User from "@/models/User";
import { findCheckoutSession } from "@/libs/stripe";
import { getServerSession } from "next-auth";
import { authOptions } from "@/libs/auth";
import Instance from "@/models/Instance";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

// Función para procesar el nombre de la tarjeta
function processCardName(cardName) {
  if (!cardName) return { firstName: "", lastName: "", secondLastName: "" };

  // Eliminar títulos y prefijos comunes
  const cleanName = cardName
    .replace(
      /\b(MR\.|MRS\.|MS\.|DR\.|PROF\.|ING\.|LIC\.|MTRO\.|SR\.|SRA\.|SRTA\.)\b/gi,
      ""
    )
    .trim();

  // Dividir el nombre en partes
  const parts = cleanName.split(/\s+/);

  // Si solo hay una parte, asumimos que es el nombre
  if (parts.length === 1) {
    return {
      firstName: parts[0],
      lastName: "",
      secondLastName: "",
    };
  }

  // Si hay dos partes, asumimos nombre y apellido
  if (parts.length === 2) {
    return {
      firstName: parts[0],
      lastName: parts[1],
      secondLastName: "",
    };
  }

  // Para tres o más partes
  // El último elemento es el segundo apellido
  const secondLastName = parts.pop();
  // El penúltimo elemento es el primer apellido
  const lastName = parts.pop();
  // Todo lo demás es el nombre (puede ser compuesto)
  const firstName = parts.join(" ");

  return {
    firstName,
    lastName,
    secondLastName,
  };
}

// This is where we receive Stripe webhook events
// It used to update the user data, send emails, etc...
// By default, it'll store the user in the database
// See more: https://shipfa.st/docs/features/payments
export async function POST(req) {
  try {
    const body = await req.text();
    const signature = headers().get("stripe-signature");

    let event;
    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
    } catch (err) {
      console.error(`⚠️  Error de firma del webhook: ${err.message}`);
      return NextResponse.json(
        { message: `Error de firma del webhook: ${err.message}` },
        { status: 400 }
      );
    }

    // Conectar a MongoDB
    await connectMongo();

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      const customerId = session.customer;
      const subscriptionId = session.subscription;

      // Verificar si es el primer pago (tiene campos personalizados)
      const isFirstPayment =
        session.custom_fields && session.custom_fields.length > 0;

      if (isFirstPayment) {
        // Obtener el nombre de la tarjeta del cliente
        const customer = await stripe.customers.retrieve(customerId);
        const cardName = customer.name;

        // Procesar el nombre de la tarjeta
        const { firstName, lastName, secondLastName } =
          processCardName(cardName);

        // Lógica para el primer pago (onboarding)
        const subdomain = session.custom_fields.find(
          (field) => field.key === "subdominio"
        )?.text.value;

        if (!subdomain) {
          throw new Error(
            "No se encontró el subdominio en los campos personalizados"
          );
        }

        // Validar el formato del subdominio
        if (!/^[a-z0-9]+$/.test(subdomain)) {
          throw new Error(
            "El subdominio solo puede contener letras minúsculas y números"
          );
        }

        // Verificar si el subdominio ya existe
        const existingInstance = await Instance.findOne({ subdomain });
        if (existingInstance) {
          throw new Error("Este subdominio ya está en uso");
        }

        // Buscar o crear el usuario
        let user = await User.findOne({ email: session.customer_email });
        if (!user) {
          user = await User.create({
            email: session.customer_email,
            name: `${firstName} ${lastName}`.trim(),
            firstName,
            lastName,
            secondLastName,
            stripeCustomerId: customerId,
          });
        }

        // Crear la instancia
        const instance = await Instance.create({
          userId: user._id,
          subdomain,
          status: "pending",
        });

        // Llamar al webhook de onboarding
        if (process.env.WEBHOOK_ONBOARDING) {
          try {
            const response = await fetch(process.env.WEBHOOK_ONBOARDING, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                instanceId: instance._id,
                subdomain,
                userId: user._id,
                email: user.email,
                customerId,
                subscriptionId,
                firstName,
                lastName,
                secondLastName,
              }),
            });

            if (!response.ok) {
              console.error(
                "Error al llamar al webhook de onboarding:",
                await response.text()
              );
            }
          } catch (error) {
            console.error("Error al llamar al webhook de onboarding:", error);
          }
        }

        // Actualizar el arreglo 'instances' del usuario
        await User.findByIdAndUpdate(user._id, {
          $addToSet: { instances: instance._id },
        });
      }

      // Notificar operaciones de suscripción
      if (process.env.WEBHOOK_OPERATIONS) {
        try {
          const response = await fetch(process.env.WEBHOOK_OPERATIONS, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              type: "subscription.created",
              customerId,
              subscriptionId,
              email: session.customer_email,
              isFirstPayment,
            }),
          });

          if (!response.ok) {
            console.error(
              "Error al llamar al webhook de operaciones:",
              await response.text()
            );
          }
        } catch (error) {
          console.error("Error al llamar al webhook de operaciones:", error);
        }
      }

      return NextResponse.json({ message: "Webhook procesado correctamente" });
    }

    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object;
      const customerId = subscription.customer;

      const user = await User.findOne({ stripeCustomerId: customerId });

      if (user) {
        // Actualizar el estado de la instancia a suspendido
        await Instance.updateMany(
          { userId: user._id },
          { status: "suspended" }
        );

        // Notificar operaciones de suscripción
        if (process.env.WEBHOOK_OPERATIONS) {
          try {
            const response = await fetch(process.env.WEBHOOK_OPERATIONS, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                type: "subscription.deleted",
                customerId,
                subscriptionId: subscription.id,
                email: user.email,
              }),
            });

            if (!response.ok) {
              console.error(
                "Error al llamar al webhook de operaciones:",
                await response.text()
              );
            }
          } catch (error) {
            console.error("Error al llamar al webhook de operaciones:", error);
          }
        }
      }

      return NextResponse.json({ message: "Suscripción cancelada" });
    }

    // Otros eventos de suscripción que podrían ser relevantes
    if (
      [
        "invoice.paid",
        "invoice.payment_failed",
        "customer.subscription.updated",
      ].includes(event.type)
    ) {
      if (process.env.WEBHOOK_OPERATIONS) {
        try {
          const response = await fetch(process.env.WEBHOOK_OPERATIONS, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              type: event.type,
              data: event.data.object,
            }),
          });

          if (!response.ok) {
            console.error(
              "Error al llamar al webhook de operaciones:",
              await response.text()
            );
          }
        } catch (error) {
          console.error("Error al llamar al webhook de operaciones:", error);
        }
      }
    }

    return NextResponse.json({ message: "Webhook recibido" });
  } catch (error) {
    console.error("Error en el webhook:", error);
    return NextResponse.json(
      { message: `Error en el webhook: ${error.message}` },
      { status: 500 }
    );
  }
}
