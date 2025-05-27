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
    await connectMongo();
    console.log("[STRIPE WEBHOOK] Conexión a MongoDB exitosa");

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
        const customerEmail = customer.email || session.customer_email;

        // Procesar el nombre de la tarjeta
        const { firstName, lastName, secondLastName } =
          processCardName(cardName);

        // Lógica para el pago (onboarding o nueva instancia)
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

        // Buscar o crear el usuario usando el email correcto
        if (!customerEmail) {
          throw new Error("No se pudo obtener el correo del cliente de Stripe");
        }
        let user = await User.findOne({ email: customerEmail });
        if (!user) {
          user = await User.create({
            email: customerEmail,
            name: `${firstName} ${lastName}`.trim(),
            firstName,
            lastName,
            secondLastName,
            stripeCustomerId: customerId,
            customerId: customerId,
            subscriptionId: subscriptionId,
          });
        } else {
          // Actualizar usuario con toda la info relevante
          user.name = `${firstName} ${lastName}`.trim();
          user.firstName = firstName;
          user.lastName = lastName;
          user.secondLastName = secondLastName;
          user.stripeCustomerId = customerId;
          user.customerId = customerId;
          user.subscriptionId = subscriptionId;
          await user.save();
        }

        // Validar que no exista ya una instancia con el mismo subdominio, paymentIntentId o subscriptionId
        const existingInstance = await Instance.findOne({
          $or: [
            { subdomain },
            { paymentIntentId: session.payment_intent },
            { subscriptionId: subscriptionId },
          ],
        });
        let instance = existingInstance;
        let isNewInstance = false;
        if (!existingInstance) {
          instance = await Instance.create({
            userId: user._id,
            subdomain,
            status: "pending",
            wordpressInstanceId: null, // Se puede actualizar después
            priceId:
              session?.metadata?.priceId || session?.metadata?.price_id || null,
            subscriptionId: subscriptionId || null,
            customerId: customerId || null,
            paymentIntentId: session.payment_intent || null,
            invoiceId: session.invoice || null,
          });
          isNewInstance = true;
        }

        // Llamar al webhook de onboarding solo si es nueva instancia
        if (isNewInstance && process.env.WEBHOOK_ONBOARDING) {
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

        // Actualizar el arreglo 'instances' del usuario
        await User.findByIdAndUpdate(user._id, {
          $addToSet: { instances: instance._id },
        });
      }

      // Notificar operaciones de suscripción (incluye correo e id de instancia de WP)
      if (process.env.WEBHOOK_OPERATIONS) {
        try {
          // Buscar la instancia más reciente del usuario
          let instance = null;
          if (user) {
            instance = await Instance.findOne({
              userId: user._id,
              subdomain,
            }).sort({ createdAt: -1 });
          }
          const response = await fetch(process.env.WEBHOOK_OPERATIONS, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              type: isFirstPayment
                ? "subscription.created"
                : "subscription.renewed",
              customerId,
              subscriptionId,
              email: user?.email || customerEmail,
              instanceId: instance?._id || null,
              wordpressInstanceId: instance?.wordpressInstanceId || null,
              subdomain: instance?.subdomain || subdomain,
              firstName: user?.firstName || firstName,
              lastName: user?.lastName || lastName,
              secondLastName: user?.secondLastName || secondLastName,
              status: isFirstPayment ? "pending" : "active",
              motivo: isFirstPayment ? "Primer pago" : "Pago recurrente",
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
        const instances = await Instance.find({ userId: user._id });
        await Instance.updateMany(
          { userId: user._id },
          { status: "suspended" }
        );

        // Notificar operaciones de suscripción
        if (process.env.WEBHOOK_OPERATIONS) {
          try {
            for (const instance of instances) {
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
                  instanceId: instance._id,
                  wordpressInstanceId: instance.wordpressInstanceId || null,
                  subdomain: instance.subdomain,
                  firstName: user.firstName,
                  lastName: user.lastName,
                  secondLastName: user.secondLastName,
                  status: "suspended",
                  motivo: "Cancelación de suscripción",
                }),
              });

              if (!response.ok) {
                console.error(
                  "Error al llamar al webhook de operaciones:",
                  await response.text()
                );
              }
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
          const data = event.data.object;
          const customerId = data.customer;
          const subscriptionId = data.subscription || data.id;
          // Buscar usuario e instancia
          const user = await User.findOne({ stripeCustomerId: customerId });
          let instances = user ? await Instance.find({ subscriptionId }) : [];

          // Si no existe la instancia y es un pago exitoso, crearla y mandar onboarding
          if (event.type === "invoice.paid" && instances.length === 0) {
            try {
              const subdomain =
                data?.custom_fields?.find((f) => f.key === "subdominio")?.text
                  ?.value || "sin-subdominio";
              const newInstance = await Instance.create({
                userId: user?._id,
                subdomain,
                status: "active",
                wordpressInstanceId: null,
                priceId: data?.lines?.data?.[0]?.price?.id || null,
                subscriptionId: subscriptionId || null,
                customerId: customerId || null,
                paymentIntentId: data.payment_intent || null,
                invoiceId: data.id || null,
              });
              console.log("[STRIPE WEBHOOK] Instancia creada:", newInstance);
              // Webhook de onboarding
              if (process.env.WEBHOOK_ONBOARDING) {
                await fetch(process.env.WEBHOOK_ONBOARDING, {
                  method: "POST",
                  headers: { "Content-Type": "application/json" },
                  body: JSON.stringify({
                    instanceId: newInstance._id,
                    subdomain: newInstance.subdomain,
                    userId: user?._id,
                    email: user?.email,
                    customerId,
                    subscriptionId,
                    firstName: user?.firstName,
                    lastName: user?.lastName,
                    secondLastName: user?.secondLastName,
                    wordpressInstanceId: newInstance.wordpressInstanceId,
                    priceId: newInstance.priceId,
                    paymentIntentId: newInstance.paymentIntentId,
                    invoiceId: newInstance.invoiceId,
                  }),
                });
                console.log("[STRIPE WEBHOOK] Webhook de onboarding enviado");
              }
              instances = [newInstance];
            } catch (err) {
              console.error(
                "Error creando instancia desde Stripe webhook:",
                err
              );
            }
          }

          // Si existe la instancia y es un pago exitoso, solo actualizar la fecha
          if (event.type === "invoice.paid" && instances.length > 0) {
            for (const instance of instances) {
              await Instance.findByIdAndUpdate(instance._id, {
                updatedAt: new Date(),
              });
              console.log(
                "[STRIPE WEBHOOK] Instancia actualizada (fecha):",
                instance._id
              );
            }
          }

          // Si es un fallo de pago, actualizar status a 'pending' y mandar webhook de operaciones
          if (event.type === "invoice.payment_failed" && instances.length > 0) {
            for (const instance of instances) {
              await Instance.findByIdAndUpdate(instance._id, {
                status: "pending",
                updatedAt: new Date(),
              });
              console.log(
                "[STRIPE WEBHOOK] Instancia actualizada (pending):",
                instance._id
              );
              // Webhook de operaciones
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
                  subdomain: instance.subdomain,
                  firstName: user?.firstName || null,
                  lastName: user?.lastName || null,
                  secondLastName: user?.secondLastName || null,
                  status: "pending",
                  motivo: "Fallo de pago",
                }),
              });
              if (!response.ok) {
                console.error(
                  "Error al llamar al webhook de operaciones:",
                  await response.text()
                );
              } else {
                console.log(
                  "[STRIPE WEBHOOK] Webhook de operaciones enviado (pending)"
                );
              }
            }
          }

          // Si es una actualización de suscripción, puedes agregar lógica adicional aquí si lo deseas
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
