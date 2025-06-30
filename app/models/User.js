import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  name: { type: String },
  firstName: { type: String },
  lastName: { type: String },
  secondLastName: { type: String },
  phone: { type: String },
  dateOfBirth: { type: String },
  gender: { type: String },
  community: { type: String },
  emailVerified: { type: Date, default: null },
  businessMondayId: [{ type: String }],
  personalMondayId: { type: String },
  validado: { type: Boolean, default: false },
  updatedAt: { type: Date, default: Date.now },
  fotoPerfil: { type: String, default: "" },
});

export default mongoose.models.User || mongoose.model("User", UserSchema);
