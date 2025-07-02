import mongoose from "mongoose";
import bcrypt from "bcryptjs";
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
    password: {
      type: String,
      private: true,
      minlength: 6,
      select: false, // No incluir en consultas por defecto
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
    // Campos para autenticación
    emailVerified: {
      type: Date,
      default: null,
    },
    hasPassword: {
      type: Boolean,
      default: false,
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

// Middleware para hashear contraseña antes de guardar
userSchema.pre("save", async function (next) {
  // Solo hashear si la contraseña fue modificada
  if (!this.isModified("password")) return next();

  try {
    // Hashear la contraseña con salt de 12 rondas
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    this.hasPassword = true;
    next();
  } catch (error) {
    next(error);
  }
});

// Método para comparar contraseñas
userSchema.methods.comparePassword = async function (candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
    throw new Error("Error al comparar contraseñas");
  }
};

// Método para verificar si el usuario tiene contraseña
userSchema.methods.hasPasswordSet = function () {
  return this.hasPassword || !!this.password;
};

// Método estático para buscar usuario por email con contraseña
userSchema.statics.findByEmailWithPassword = function (email) {
  return this.findOne({ email }).select("+password");
};

export default mongoose.models.User || mongoose.model("User", userSchema);
