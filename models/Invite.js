import mongoose from "mongoose";

const inviteSchema = new mongoose.Schema({
  email: { type: String, required: true },
  empresaId: { type: String, required: true },
  token: { type: String, required: true, unique: true },
  status: { type: String, enum: ["pending", "accepted"], default: "pending" },
  createdAt: { type: Date, default: Date.now },
});

export default mongoose.models.Invite || mongoose.model("Invite", inviteSchema);
