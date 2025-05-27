import mongoose from "mongoose";
import toJSON from "./plugins/toJSON";

// USER SCHEMA
const userSchema = mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
    },
    firstName: {
      type: String,
      trim: true,
    },
    lastName: {
      type: String,
      trim: true,
    },
    secondLastName: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      trim: true,
      lowercase: true,
      private: true,
      required: true,
      unique: true,
    },
    image: {
      type: String,
    },
    subdominio: {
      type: String,
      trim: true,
      lowercase: true,
      unique: true,
      validate: {
        validator: function (v) {
          return /^[a-z0-9]+$/.test(v);
        },
        message:
          "El subdominio solo puede contener letras minúsculas y números",
      },
    },
    // Used in the Stripe webhook to identify the user in Stripe and later create Customer Portal or prefill user credit card details
    customerId: {
      type: String,
      validate: {
        validator: function (v) {
          return !v || v.startsWith("cus_");
        },
        message: 'El customerId debe comenzar con "cus_"',
      },
    },
    // Used in the Stripe webhook. should match a plan in config.js file.
    priceId: {
      type: String,
      validate: {
        validator: function (v) {
          return !v || v.startsWith("price_");
        },
        message: 'El priceId debe comenzar con "price_"',
      },
    },
    // Used to determine if the user has access to the product—it's turn on/off by the Stripe webhook
    hasAccess: {
      type: Boolean,
      default: false,
    },
    instances: [{ type: mongoose.Schema.Types.ObjectId, ref: "Instance" }],
    stripeCustomerId: {
      type: String,
      validate: {
        validator: function (v) {
          return !v || v.startsWith("cus_");
        },
        message: 'El stripeCustomerId debe comenzar con "cus_"',
      },
    },
    subscriptionId: {
      type: String,
      validate: {
        validator: function (v) {
          return !v || v.startsWith("sub_");
        },
        message: 'El subscriptionId debe comenzar con "sub_"',
      },
    },
    lastLogin: {
      type: Date,
      default: Date.now,
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
  }
);

// add plugin that converts mongoose to json
userSchema.plugin(toJSON);

// Middleware para actualizar lastLogin antes de cada save
userSchema.pre("save", function (next) {
  if (this.isModified("lastLogin")) {
    this.lastLogin = new Date();
  }
  next();
});

export default mongoose.models.User || mongoose.model("User", userSchema);
