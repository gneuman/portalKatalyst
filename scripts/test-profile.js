const fetch = require("node-fetch");

async function testProfile() {
  console.log("🧪 Probando endpoint de perfil...");

  try {
    const response = await fetch(
      "http://localhost:3000/api/user/profile?email=neumang+nocode@gmail.com"
    );

    console.log("📊 Respuesta del servidor:");
    console.log("Status:", response.status);

    if (response.ok) {
      const data = await response.json();
      console.log("✅ Usuario encontrado:");
      console.log("Email:", data.email);
      console.log("Validado:", data.validado);
      console.log("EmailVerified:", data.emailVerified);
      console.log("ID:", data._id);
    } else {
      const error = await response.json();
      console.log("❌ Error:", error);
    }
  } catch (error) {
    console.error("❌ Error de conexión:", error.message);
  }
}

testProfile();
