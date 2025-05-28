import mongoose from "mongoose";

const instanceSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    nombre_instancia: {
      type: String,
      unique: true,
      trim: true,
      lowercase: true,
      match: [
        /^[a-z0-9]+$/,
        "El nombre de la instancia solo puede contener letras minúsculas y números",
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
      validate: {
        validator: function (v) {
          return !v || v.startsWith("price_");
        },
        message: 'El priceId debe comenzar con "price_"',
      },
      description: "ID del precio de Stripe usado para esta instancia",
    },
    subscriptionId: {
      type: String,
      required: true,
      validate: {
        validator: function (v) {
          return v && v.startsWith("sub_");
        },
        message: 'El subscriptionId debe comenzar con "sub_"',
      },
      description: "ID de la suscripción de Stripe asociada",
    },
    customerId: {
      type: String,
      required: true,
      validate: {
        validator: function (v) {
          return v && v.startsWith("cus_");
        },
        message: 'El customerId debe comenzar con "cus_"',
      },
      description: "ID del cliente de Stripe",
    },
    paymentIntentId: {
      type: String,
      validate: {
        validator: function (v) {
          return !v || v.startsWith("pi_");
        },
        message: 'El paymentIntentId debe comenzar con "pi_"',
      },
      description: "ID del PaymentIntent de Stripe",
    },
    invoiceId: {
      type: String,
      required: true,
      validate: {
        validator: function (v) {
          return v && v.startsWith("in_");
        },
        message: 'El invoiceId debe comenzar con "in_"',
      },
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
instanceSchema.index({ userId: 1, nombre_instancia: 1 });
instanceSchema.index({ subscriptionId: 1 });
instanceSchema.index({ paymentIntentId: 1 });
instanceSchema.index({ customerId: 1 });

// Middleware para actualizar updatedAt antes de cada save
instanceSchema.pre("save", function (next) {
  this.updatedAt = new Date();
  next();
});

const Instance =
  mongoose.models.Instance || mongoose.model("Instance", instanceSchema);

export default Instance;
