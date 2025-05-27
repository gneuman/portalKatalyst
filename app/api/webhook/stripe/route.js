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
      const subscriptionId = subscription.id;
      const user = await User.findOne({ stripeCustomerId: customerId });
      const instances = user ? await Instance.find({ subscriptionId }) : [];
      for (const instance of instances) {
        try {
          await Instance.findByIdAndUpdate(instance._id, {
            status: "suspended",
            updatedAt: new Date(),
          });
          console.log(
            "[STRIPE WEBHOOK] Instancia actualizada (suspended):",
            instance._id
          );
        } catch (err) {
          console.error(
            "[STRIPE WEBHOOK] Error actualizando instancia (suspended):",
            err
          );
        }
        // Webhook de operaciones
        if (process.env.WEBHOOK_OPERATIONS) {
          try {
            console.log(
              "[STRIPE WEBHOOK] Enviando webhook de operaciones (suspended)..."
            );
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
                status: "suspended",
                motivo: "Cancelación de suscripción",
              }),
            });
            if (!response.ok) {
              console.error(
                "[STRIPE WEBHOOK] Error enviando webhook de operaciones (suspended):",
                await response.text()
              );
            } else {
              console.log(
                "[STRIPE WEBHOOK] Webhook de operaciones enviado (suspended)"
              );
            }
          } catch (err) {
            console.error(
              "[STRIPE WEBHOOK] Error enviando webhook de operaciones (suspended):",
              err
            );
          }
        }
      }
      return NextResponse.json({ message: "Cancelación procesada" });
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
          let user = null;
          try {
            user = await User.findOne({ stripeCustomerId: customerId });
            if (!user) {
              console.log(
                "[STRIPE WEBHOOK] Usuario no encontrado, creando usuario..."
              );
              // Aquí podrías crear el usuario si lo deseas
            } else {
              console.log("[STRIPE WEBHOOK] Usuario encontrado:", user.email);
            }
          } catch (err) {
            console.error(
              "[STRIPE WEBHOOK] Error buscando/creando usuario:",
              err
            );
          }
          let instances = user ? await Instance.find({ subscriptionId }) : [];
          // Si no existe la instancia, crearla y mandar onboarding
          if (instances.length === 0) {
            try {
              console.log("[STRIPE WEBHOOK] Creando nueva instancia...");
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
                try {
                  console.log(
                    "[STRIPE WEBHOOK] Enviando webhook de onboarding..."
                  );
                  const resp = await fetch(process.env.WEBHOOK_ONBOARDING, {
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
                  if (!resp.ok) {
                    console.error(
                      "[STRIPE WEBHOOK] Error enviando webhook de onboarding:",
                      await resp.text()
                    );
                  } else {
                    console.log(
                      "[STRIPE WEBHOOK] Webhook de onboarding enviado"
                    );
                  }
                } catch (err) {
                  console.error(
                    "[STRIPE WEBHOOK] Error enviando webhook de onboarding:",
                    err
                  );
                }
              }
              instances = [newInstance];
            } catch (err) {
              console.error(
                "[STRIPE WEBHOOK] Error creando instancia desde Stripe webhook:",
                err
              );
            }
          } else {
            // Si existe, solo actualizar la fecha
            for (const instance of instances) {
              try {
                await Instance.findByIdAndUpdate(instance._id, {
                  updatedAt: new Date(),
                });
                console.log(
                  "[STRIPE WEBHOOK] Instancia actualizada (fecha):",
                  instance._id
                );
              } catch (err) {
                console.error(
                  "[STRIPE WEBHOOK] Error actualizando instancia:",
                  err
                );
              }
            }
          }
          return NextResponse.json({ message: "Pago procesado" });
        } catch (error) {
          console.error("Error al llamar al webhook de operaciones:", error);
        }
      }
    }

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
          console.log(
            "[STRIPE WEBHOOK] Instancia actualizada (pending):",
            instance._id
          );
        } catch (err) {
          console.error(
            "[STRIPE WEBHOOK] Error actualizando instancia (pending):",
            err
          );
        }
        // Webhook de operaciones
        if (process.env.WEBHOOK_OPERATIONS) {
          try {
            console.log(
              "[STRIPE WEBHOOK] Enviando webhook de operaciones (pending)..."
            );
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
                "[STRIPE WEBHOOK] Error enviando webhook de operaciones (pending):",
                await response.text()
              );
            } else {
              console.log(
                "[STRIPE WEBHOOK] Webhook de operaciones enviado (pending)"
              );
            }
          } catch (err) {
            console.error(
              "[STRIPE WEBHOOK] Error enviando webhook de operaciones (pending):",
              err
            );
          }
        }
      }
      return NextResponse.json({ message: "Fallo de pago procesado" });
    }

    if (event.type === "payment_intent.succeeded") {
      const paymentIntent = event.data.object;
      const customerId = paymentIntent.customer;
      const invoiceId = paymentIntent.invoice;
      const paymentIntentId = paymentIntent.id;

      console.log("[STRIPE WEBHOOK] Procesando payment_intent.succeeded");

      // Obtener el invoice para obtener más información
      const invoice = await stripe.invoices.retrieve(invoiceId);
      const subscriptionId = invoice.subscription;

      // Obtener el customer para obtener el email y nombre
      const customer = await stripe.customers.retrieve(customerId);
      const customerEmail = customer.email;
      const cardName = customer.name;

      // Procesar el nombre de la tarjeta
      const { firstName, lastName, secondLastName } = processCardName(cardName);

      // Buscar o crear el usuario
      let user = await User.findOne({ email: customerEmail });
      if (!user) {
        console.log("[STRIPE WEBHOOK] Creando nuevo usuario...");
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
        console.log("[STRIPE WEBHOOK] Usuario encontrado:", user.email);
        // Actualizar información del usuario
        user.name = `${firstName} ${lastName}`.trim();
        user.firstName = firstName;
        user.lastName = lastName;
        user.secondLastName = secondLastName;
        user.stripeCustomerId = customerId;
        user.customerId = customerId;
        user.subscriptionId = subscriptionId;
        await user.save();
      }

      // Verificar si ya existe una instancia con este paymentIntentId o subscriptionId
      const existingInstance = await Instance.findOne({
        $or: [{ paymentIntentId }, { subscriptionId }],
      });

      if (!existingInstance) {
        console.log("[STRIPE WEBHOOK] Creando nueva instancia...");
        // Obtener el subdominio del invoice
        const subdomain =
          invoice.custom_fields?.find((f) => f.key === "subdominio")?.text
            ?.value || "sin-subdominio";

        // Crear la nueva instancia
        const newInstance = await Instance.create({
          userId: user._id,
          subdomain,
          status: "active",
          wordpressInstanceId: null,
          priceId: invoice.lines?.data?.[0]?.price?.id || null,
          subscriptionId: subscriptionId || null,
          customerId: customerId || null,
          paymentIntentId: paymentIntentId || null,
          invoiceId: invoiceId || null,
        });

        console.log("[STRIPE WEBHOOK] Instancia creada:", newInstance);

        // Webhook de onboarding
        if (process.env.WEBHOOK_ONBOARDING) {
          try {
            console.log("[STRIPE WEBHOOK] Enviando webhook de onboarding...");
            const resp = await fetch(process.env.WEBHOOK_ONBOARDING, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                instanceId: newInstance._id,
                subdomain: newInstance.subdomain,
                userId: user._id,
                email: user.email,
                customerId,
                subscriptionId,
                firstName,
                lastName,
                secondLastName,
                wordpressInstanceId: newInstance.wordpressInstanceId,
                priceId: newInstance.priceId,
                paymentIntentId: newInstance.paymentIntentId,
                invoiceId: newInstance.invoiceId,
              }),
            });
            if (!resp.ok) {
              console.error(
                "[STRIPE WEBHOOK] Error enviando webhook de onboarding:",
                await resp.text()
              );
            } else {
              console.log("[STRIPE WEBHOOK] Webhook de onboarding enviado");
            }
          } catch (err) {
            console.error(
              "[STRIPE WEBHOOK] Error enviando webhook de onboarding:",
              err
            );
          }
        }

        // Actualizar el arreglo 'instances' del usuario
        await User.findByIdAndUpdate(user._id, {
          $addToSet: { instances: newInstance._id },
        });
      } else {
        console.log(
          "[STRIPE WEBHOOK] Instancia ya existe:",
          existingInstance._id
        );
      }

      return NextResponse.json({
        message: "Payment intent procesado correctamente",
      });
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
