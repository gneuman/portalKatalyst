import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  throw new Error(
    "Por favor define la variable de entorno MONGODB_URI dentro de .env.local"
  );
}

let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts = {
      bufferCommands: true,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
      bufferMaxEntries: 0,
      // Configuraciones adicionales para mejorar la estabilidad
      retryWrites: true,
      w: "majority",
      // Configuración de reconexión
      autoReconnect: true,
      reconnectTries: Number.MAX_VALUE,
      reconnectInterval: 1000,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongoose) => {
      console.log("[MONGODB] Conexión exitosa con connectDB");

      // Configurar listeners para manejar desconexiones
      mongoose.connection.on("disconnected", () => {
        console.log("[MONGODB] Desconectado de la base de datos");
      });

      mongoose.connection.on("error", (err) => {
        console.error("[MONGODB] Error de conexión:", err);
      });

      return mongoose;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (e) {
    cached.promise = null;
    console.error("[MONGODB] Error de conexión:", e.message);
    throw e;
  }

  return cached.conn;
}
