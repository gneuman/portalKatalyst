import { NextResponse } from "next/server";
import Stripe from "stripe";
import connectMongo from "@/libs/mongoose";
import User from "@/models/User";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "sk_test_...");
const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET || "whsec_...";

export async function POST(req) {
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  let event;

  try {
    event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
  } catch (err) {
    console.error("Error de verificación del webhook:", err.message);
    return NextResponse.json(
      { error: "Webhook signature verification failed" },
      { status: 400 }
    );
  }

  try {
    await connectMongo();

    switch (event.type) {
      case "checkout.session.completed":
        await handleCheckoutSessionCompleted(event.data.object);
        break;

      case "invoice.payment_succeeded":
        await handleInvoicePaymentSucceeded(event.data.object);
        break;

      case "invoice.payment_failed":
        await handleInvoicePaymentFailed(event.data.object);
        break;

      case "customer.subscription.deleted":
        await handleSubscriptionDeleted(event.data.object);
        break;

      case "customer.subscription.updated":
        await handleSubscriptionUpdated(event.data.object);
        break;

      default:
        console.log(`Evento no manejado: ${event.type}`);
    }

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error("Error procesando webhook:", error);
    return NextResponse.json(
      { error: "Error interno del servidor" },
      { status: 500 }
    );
  }
}

async function handleCheckoutSessionCompleted(session) {
  console.log("Checkout session completed:", session.id);

  const { donorName, donorEmail, donorMessage, donationType, amount, userId } =
    session.metadata || {};

  // Guardar información de la donación en la base de datos
  const donationData = {
    sessionId: session.id,
    donorName,
    donorEmail,
    donorMessage,
    donationType,
    amount: parseFloat(amount),
    status: session.payment_status,
    customerId: session.customer,
    subscriptionId: session.subscription,
    createdAt: new Date(),
  };

  // Si hay un usuario asociado, actualizar su información
  if (userId) {
    try {
      const user = await User.findById(userId);
      if (user) {
        if (!user.donations) user.donations = [];
        user.donations.push(donationData);
        user.customerId = session.customer;
        await user.save();
      }
    } catch (error) {
      console.error("Error actualizando usuario:", error);
    }
  }

  // Aquí podrías enviar un email de confirmación
  // await sendDonationConfirmationEmail(donationData);
}

async function handleInvoicePaymentSucceeded(invoice) {
  console.log("Invoice payment succeeded:", invoice.id);

  // Para donaciones recurrentes
  if (invoice.subscription) {
    try {
      const subscription = await stripe.subscriptions.retrieve(
        invoice.subscription
      );
      const session = await stripe.checkout.sessions.list({
        subscription: invoice.subscription,
        limit: 1,
      });

      if (session.data.length > 0) {
        const originalSession = session.data[0];
        const { userId } = originalSession.metadata || {};

        if (userId) {
          const user = await User.findById(userId);
          if (user && user.donations) {
            // Actualizar el estado de la donación recurrente
            const recurringDonation = user.donations.find(
              (d) => d.subscriptionId === invoice.subscription
            );
            if (recurringDonation) {
              recurringDonation.lastPaymentDate = new Date();
              recurringDonation.status = "active";
              await user.save();
            }
          }
        }
      }
    } catch (error) {
      console.error("Error procesando pago recurrente:", error);
    }
  }
}

async function handleInvoicePaymentFailed(invoice) {
  console.log("Invoice payment failed:", invoice.id);

  if (invoice.subscription) {
    try {
      const subscription = await stripe.subscriptions.retrieve(
        invoice.subscription
      );
      const session = await stripe.checkout.sessions.list({
        subscription: invoice.subscription,
        limit: 1,
      });

      if (session.data.length > 0) {
        const originalSession = session.data[0];
        const { userId } = originalSession.metadata || {};

        if (userId) {
          const user = await User.findById(userId);
          if (user && user.donations) {
            const recurringDonation = user.donations.find(
              (d) => d.subscriptionId === invoice.subscription
            );
            if (recurringDonation) {
              recurringDonation.status = "payment_failed";
              await user.save();
            }
          }
        }
      }
    } catch (error) {
      console.error("Error procesando fallo de pago:", error);
    }
  }
}

async function handleSubscriptionDeleted(subscription) {
  console.log("Subscription deleted:", subscription.id);

  try {
    const session = await stripe.checkout.sessions.list({
      subscription: subscription.id,
      limit: 1,
    });

    if (session.data.length > 0) {
      const originalSession = session.data[0];
      const { userId } = originalSession.metadata || {};

      if (userId) {
        const user = await User.findById(userId);
        if (user && user.donations) {
          const recurringDonation = user.donations.find(
            (d) => d.subscriptionId === subscription.id
          );
          if (recurringDonation) {
            recurringDonation.status = "cancelled";
            recurringDonation.cancelledAt = new Date();
            await user.save();
          }
        }
      }
    }
  } catch (error) {
    console.error("Error procesando cancelación de suscripción:", error);
  }
}

async function handleSubscriptionUpdated(subscription) {
  console.log("Subscription updated:", subscription.id);

  try {
    const session = await stripe.checkout.sessions.list({
      subscription: subscription.id,
      limit: 1,
    });

    if (session.data.length > 0) {
      const originalSession = session.data[0];
      const { userId } = originalSession.metadata || {};

      if (userId) {
        const user = await User.findById(userId);
        if (user && user.donations) {
          const recurringDonation = user.donations.find(
            (d) => d.subscriptionId === subscription.id
          );
          if (recurringDonation) {
            recurringDonation.status = subscription.status;
            await user.save();
          }
        }
      }
    }
  } catch (error) {
    console.error("Error procesando actualización de suscripción:", error);
  }
}
