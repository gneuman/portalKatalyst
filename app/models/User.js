import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  emailVerified: { type: Date, default: null },
  businessMondayId: [{ type: String }],
  personalMondayId: { type: String },
  validado: { type: Boolean, default: false },
  updatedAt: { type: Date, default: Date.now },
  fotoPerfil: { type: String, default: "" },
});

export default mongoose.models.User || mongoose.model("User", UserSchema);
