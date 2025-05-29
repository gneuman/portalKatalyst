import mongoose from "mongoose";

const leadSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    lowercase: true,
  },
  nombre: {
    type: String,
    required: true,
    trim: true,
  },
  apellidoPaterno: {
    type: String,
    required: true,
    trim: true,
  },
  apellidoMaterno: {
    type: String,
    required: true,
    trim: true,
  },
  telefono: {
    type: String,
    required: true,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Lead = mongoose.models.Lead || mongoose.model("Lead", leadSchema);

export default Lead;
