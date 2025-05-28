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

// Función robusta para obtener custom_fields por key
function getCustomField(session, key) {
  if (!session.custom_fields) return null;
  const field = session.custom_fields.find((f) => f.key === key);
  return field?.text?.value || null;
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
      console.log(
        "[STRIPE WEBHOOK] Evento recibido:",
        JSON.stringify(event, null, 2)
      );
    } catch (err) {
      console.error(`⚠️  Error de firma del webhook: ${err.message}`);
      return NextResponse.json(
        { message: `Error de firma del webhook: ${err.message}` },
        { status: 400 }
      );
    }

    // Conectar a MongoDB
    console.log("[STRIPE WEBHOOK] Conectando a MongoDB...");
    await connectMongo({ serverSelectionTimeoutMS: 30000 });
    console.log("[STRIPE WEBHOOK] Conexión a MongoDB exitosa");

    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      console.log(
        "[DEBUG] session recibida en webhook:",
        JSON.stringify(session, null, 2)
      );
      const customerId = session.customer;
      const subscriptionId = session.subscription;
      const userId = session.metadata?.userId;

      // Verificar si es el primer pago (tiene campos personalizados)
      const isFirstPayment =
        session.custom_fields && session.custom_fields.length > 0;

      if (isFirstPayment) {
        // Obtener el nombre de la tarjeta del cliente
        const customer = await stripe.customers.retrieve(customerId);
        const cardName = customer.name;
        const customerEmail = customer.email || session.customer_email;

        // Procesar el nombre de la tarjeta
        const { firstName, lastName, secondLastName } =
          processCardName(cardName);

        // Obtener los campos necesarios
        const nombre_instancia = getCustomField(session, "nombre_instancia");
        // Puedes agregar más campos si los necesitas:
        // const otro_campo = getCustomField(session, "otro_campo");

        // Validar existencia antes de crear la instancia
        if (!nombre_instancia) {
          console.warn("No se recibió nombre_instancia en custom_fields");
          // Puedes lanzar error, asignar null, o manejarlo como prefieras
          // throw new Error("El campo nombre_instancia es obligatorio");
        }

        // Buscar el usuario usando el email correcto
        if (!customerEmail) {
          throw new Error("No se pudo obtener el correo del cliente de Stripe");
        }
        let user = await User.findOne({ email: customerEmail });
        if (!user) {
          console.log("[STRIPE WEBHOOK] Creando nuevo usuario...");
          console.log("[STRIPE WEBHOOK] Datos del usuario a crear:", {
            email: customerEmail,
            name: `${firstName} ${lastName}`.trim(),
            firstName,
            lastName,
            secondLastName,
            stripeCustomerId: customerId,
            customerId: customerId,
          });
          user = await User.create({
            email: customerEmail,
            name: `${firstName} ${lastName}`.trim(),
            firstName,
            lastName,
            secondLastName,
            stripeCustomerId: customerId,
            customerId: customerId,
          });
        } else {
          // Actualizar usuario con toda la info relevante
          user.email = customerEmail;
          user.name = `${firstName} ${lastName}`.trim();
          user.firstName = firstName;
          user.lastName = lastName;
          user.secondLastName = secondLastName;
          user.stripeCustomerId = customerId;
          user.customerId = customerId;
          await user.save();
        }

        // Crear la instancia primero
        const instance = await Instance.create({
          userId: userId || user._id, // Usar userId de la metadata o el del usuario
          nombre_instancia: nombre_instancia || null,
          status: "pending",
          wordpressInstanceId: null,
          priceId:
            session?.metadata?.priceId || session?.metadata?.price_id || null,
          subscriptionId: subscriptionId || null,
          customerId: customerId || null,
          paymentIntentId: session.payment_intent || null,
          invoiceId: session.invoice || null,
        });

        // Actualizar el arreglo 'instances' del usuario
        await User.findByIdAndUpdate(user._id, {
          $addToSet: { instances: instance._id },
        });

        // Enviar webhook de onboarding SOLO si es nueva instancia
        if (process.env.WEBHOOK_ONBOARDING) {
          try {
            const response = await fetch(process.env.WEBHOOK_ONBOARDING, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                instanceId: instance._id,
                nombre_instancia: nombre_instancia,
                userId: user._id,
                email: user.email,
                customerId,
                subscriptionId,
                firstName,
                lastName,
                secondLastName,
                wordpressInstanceId: instance.wordpressInstanceId,
                priceId: instance.priceId,
                paymentIntentId: instance.paymentIntentId,
                invoiceId: instance.invoiceId,
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

        // Webhook de operaciones para creación
        if (process.env.WEBHOOK_OPERATIONS) {
          try {
            const response = await fetch(process.env.WEBHOOK_OPERATIONS, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                type: "subscription.created",
                customerId,
                subscriptionId,
                email: user?.email || customerEmail,
                instanceId: instance?._id || null,
                wordpressInstanceId: instance?.wordpressInstanceId || null,
                nombre_instancia:
                  instance?.nombre_instancia || nombre_instancia,
                firstName: user?.firstName || firstName,
                lastName: user?.lastName || lastName,
                secondLastName: user?.secondLastName || secondLastName,
                status: "pending",
                motivo: "Primer pago",
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

      return NextResponse.json({ message: "Webhook procesado correctamente" });
    }

    // Actualización de suscripción
    if (event.type === "customer.subscription.updated") {
      const subscription = event.data.object;
      const customerId = subscription.customer;
      const subscriptionId = subscription.id;
      const user = await User.findOne({ stripeCustomerId: customerId });
      const instance = user ? await Instance.findOne({ subscriptionId }) : null;
      if (instance && process.env.WEBHOOK_OPERATIONS) {
        try {
          const response = await fetch(process.env.WEBHOOK_OPERATIONS, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              type: event.type,
              customerId,
              subscriptionId,
              email: user?.email || null,
              instanceId: instance._id,
              wordpressInstanceId: instance.wordpressInstanceId || null,
              nombre_instancia: instance.nombre_instancia,
              firstName: user?.firstName || null,
              lastName: user?.lastName || null,
              secondLastName: user?.secondLastName || null,
              status: subscription.status === "active" ? "active" : "pending",
              motivo: "Actualización de suscripción",
            }),
          });
          if (!response.ok) {
            console.error(
              "[STRIPE WEBHOOK] Error enviando webhook de operaciones (updated):",
              await response.text()
            );
          }
        } catch (err) {
          console.error(
            "[STRIPE WEBHOOK] Error enviando webhook de operaciones (updated):",
            err
          );
        }
      }
      return NextResponse.json({ message: "Actualización procesada" });
    }

    // Cancelación de suscripción
    if (event.type === "customer.subscription.deleted") {
      const subscription = event.data.object;
      const customerId = subscription.customer;
      const subscriptionId = subscription.id;
      const user = await User.findOne({ stripeCustomerId: customerId });
      const instances = user ? await Instance.find({ subscriptionId }) : [];
      for (const instance of instances) {
        try {
          await Instance.findByIdAndUpdate(instance._id, {
            status: "suspended",
            updatedAt: new Date(),
          });
          if (process.env.WEBHOOK_OPERATIONS) {
            const response = await fetch(process.env.WEBHOOK_OPERATIONS, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                type: event.type,
                customerId,
                subscriptionId,
                email: user?.email || null,
                instanceId: instance._id,
                wordpressInstanceId: instance.wordpressInstanceId || null,
                nombre_instancia: instance.nombre_instancia,
                firstName: user?.firstName || null,
                lastName: user?.lastName || null,
                secondLastName: user?.secondLastName || null,
                status: "suspended",
                motivo: "Cancelación de suscripción",
              }),
            });
            if (!response.ok) {
              console.error(
                "[STRIPE WEBHOOK] Error enviando webhook de operaciones (suspended):",
                await response.text()
              );
            }
          }
        } catch (err) {
          console.error(
            "[STRIPE WEBHOOK] Error actualizando instancia (suspended):",
            err
          );
        }
      }
      return NextResponse.json({ message: "Cancelación procesada" });
    }

    // Fallo de pago
    if (event.type === "invoice.payment_failed") {
      const data = event.data.object;
      const customerId = data.customer;
      const subscriptionId = data.subscription || data.id;
      const user = await User.findOne({ stripeCustomerId: customerId });
      const instances = user ? await Instance.find({ subscriptionId }) : [];
      for (const instance of instances) {
        try {
          await Instance.findByIdAndUpdate(instance._id, {
            status: "pending",
            updatedAt: new Date(),
          });
          if (process.env.WEBHOOK_OPERATIONS) {
            const response = await fetch(process.env.WEBHOOK_OPERATIONS, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                type: event.type,
                customerId,
                subscriptionId,
                email: user?.email || null,
                instanceId: instance._id,
                wordpressInstanceId: instance.wordpressInstanceId || null,
                nombre_instancia: instance.nombre_instancia,
                firstName: user?.firstName || null,
                lastName: user?.lastName || null,
                secondLastName: user?.secondLastName || null,
                status: "pending",
                motivo: "Fallo de pago",
              }),
            });
            if (!response.ok) {
              console.error(
                "[STRIPE WEBHOOK] Error enviando webhook de operaciones (pending):",
                await response.text()
              );
            }
          }
        } catch (err) {
          console.error(
            "[STRIPE WEBHOOK] Error actualizando instancia (pending):",
            err
          );
        }
      }
      return NextResponse.json({ message: "Fallo de pago procesado" });
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
