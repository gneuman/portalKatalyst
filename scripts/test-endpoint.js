const fetch = require("node-fetch");

async function testRegistration() {
  console.log("🧪 Probando endpoint de registro...");

  try {
    const response = await fetch("http://localhost:3000/api/auth/register", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        email: "test@resend.dev", // Email de prueba válido para Resend
        name: "Usuario de Prueba",
        firstName: "Usuario",
        lastName: "Prueba",
        phone: "123456789",
      }),
    });

    const data = await response.json();

    console.log("📊 Respuesta del servidor:");
    console.log("Status:", response.status);
    console.log("Data:", JSON.stringify(data, null, 2));

    if (data.success) {
      console.log("✅ Registro exitoso!");
      if (data.data?.emailSent) {
        console.log("📧 Email enviado correctamente");
      } else {
        console.log("❌ Error enviando email:", data.data?.emailError);
      }
    } else {
      console.log("❌ Error en el registro:", data.error);
    }
  } catch (error) {
    console.error("❌ Error de conexión:", error.message);
  }
}

testRegistration();
