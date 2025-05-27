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
