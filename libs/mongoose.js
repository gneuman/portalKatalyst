import mongoose from "mongoose";
import User from "@/models/User";

let isConnected = false;

const connectMongo = async () => {
  if (!process.env.MONGODB_URI) {
    throw new Error(
      "Add the MONGODB_URI environment variable inside .env.local to use mongoose"
    );
  }
  if (isConnected) {
    console.log("[MONGODB] Ya existe una conexión activa");
    return mongoose;
  }
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    isConnected = true;
    console.log("[MONGODB] Conexión exitosa");
    return mongoose;
  } catch (e) {
    console.error("[MONGODB] Error de conexión:", e.message);
    throw e;
  }
};

export default connectMongo;
