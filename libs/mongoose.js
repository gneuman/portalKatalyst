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
    console.log("[MONGODB] Usando conexión existente");
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
    isConnected = false;
    throw e;
  }
};

export default connectMongo;
