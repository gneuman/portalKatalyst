import mongoose from "mongoose";

const VerificationTokenSchema = new mongoose.Schema(
  {
    identifier: { type: String, required: true },
    token: { type: String, required: true, unique: true },
    expires: { type: Date, required: true },
  },
  {
    collection: "verification_tokens", // Forzar el nombre de la colección
  }
);

export default mongoose.models.VerificationToken ||
  mongoose.model("VerificationToken", VerificationTokenSchema);
