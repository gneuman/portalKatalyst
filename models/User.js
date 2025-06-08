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
    fotoPerfil: {
      type: String,
    },
    personalMondayId: {
      type: String,
      default: null,
      description: "ID del ítem de perfil personal en Monday.com",
    },
    businessMondayId: {
      type: [String],
      default: [],
      description: "Arreglo de IDs de empresas en Monday.com",
    },
    // Campo opcional para contactos, si se requiere
    contactsMondayId: {
      type: [String],
      default: [],
      description: "IDs de contactos en Monday.com (opcional)",
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
