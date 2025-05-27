import mongoose from "mongoose";

const instanceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    subdomain: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^[a-z0-9]+$/,
        "El subdominio solo puede contener letras minúsculas y números",
      ],
    },
    status: {
      type: String,
      enum: ["pending", "active", "suspended"],
      default: "pending",
    },
    wordpressInstanceId: {
      type: String,
      default: null,
      description: "ID de la instancia de WordPress asociada (si existe)",
    },
    priceId: {
      type: String,
      default: null,
      description: "ID del precio de Stripe usado para esta instancia",
    },
    subscriptionId: {
      type: String,
      default: null,
      description: "ID de la suscripción de Stripe asociada",
    },
    customerId: {
      type: String,
      default: null,
      description: "ID del cliente de Stripe",
    },
    paymentIntentId: {
      type: String,
      default: null,
      description: "ID del PaymentIntent de Stripe",
    },
    invoiceId: {
      type: String,
      default: null,
      description: "ID de la factura de Stripe",
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    updatedAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
  }
);

// Índice compuesto para búsquedas eficientes
instanceSchema.index({ userId: 1, subdomain: 1 });

const Instance =
  mongoose.models.Instance || mongoose.model("Instance", instanceSchema);

export default Instance;
