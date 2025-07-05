import { useSession } from "next-auth/react";

export default function ProfileCard() {
  const { data: session, status } = useSession();

  // Mostrar en consola solo la información relevante
  if (session?.user) {
    console.log(`Nombre (NextAuth): ${session.user.name}`);
    console.log(`Email (NextAuth): ${session.user.email}`);
    console.log(`Foto de perfil: ${session.user.fotoPerfil}`);
  }

  if (status === "loading") {
    return (
      <div className="w-full max-w-[340px] h-[220px] rounded-xl shadow-lg p-6 bg-[#1C384A] flex flex-col justify-center mx-auto">
        <svg
          className="animate-spin h-10 w-10 text-white mx-auto"
          xmlns="http://www.w3.org/2000/svg"
          fill="none"
          viewBox="0 0 24 24"
        >
          <circle
            className="opacity-25"
            cx="12"
            cy="12"
            r="10"
            stroke="currentColor"
            strokeWidth="4"
          ></circle>
          <path
            className="opacity-75"
            fill="currentColor"
            d="M4 12a8 8 0 018-8v8z"
          ></path>
        </svg>
        <div className="text-white text-sm mt-2 text-center">
          Cargando perfil...
        </div>
      </div>
    );
  }

  if (status === "unauthenticated" || !session?.user) {
    return (
      <div className="w-full max-w-[340px] h-[220px] rounded-xl shadow-lg p-6 bg-[#1C384A] flex flex-col items-center justify-center text-white text-center mx-auto">
        <div className="w-[72px] h-[72px] rounded-full bg-gray-300 flex items-center justify-center mb-2">
          <svg
            className="w-10 h-10 text-gray-600"
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path
              fillRule="evenodd"
              d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"
              clipRule="evenodd"
            />
          </svg>
        </div>
        <div className="text-white font-bold text-lg text-center break-words w-full mb-1">
          Perfil no disponible
        </div>
        <div className="text-xs text-gray-300">
          Inicia sesión para ver tu perfil
        </div>
      </div>
    );
  }

  // Usar datos de NextAuth
  const nombreMostrar = session.user.name || "";
  const email = session.user.email || "";
  const fotoPerfil =
    session.user.fotoPerfil ||
    session.user.image ||
    "/images/default-avatar.png";
  const katalystId = session.user.personalMondayId || "";
  const comunidad = session.user.comunidad || "";

  return (
    <div
      style={{
        width: "100%", // Ocupa todo el ancho del sidebar
        maxWidth: "100%",
        background: "#18304B", // Color branding Katalyst
        borderRadius: "16px",
        padding: "2rem 1.5rem",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        boxShadow: "0 2px 8px rgba(24,48,75,0.08)",
        marginBottom: "2rem",
      }}
    >
      <img
        src={fotoPerfil}
        alt="Avatar"
        style={{
          width: 90,
          height: 90,
          borderRadius: "50%",
          objectFit: "cover",
          border: "3px solid #fff",
          marginBottom: "1rem",
        }}
      />
      <div
        style={{
          color: "#fff",
          fontWeight: 700,
          fontSize: "1.35rem",
          textAlign: "center",
          marginBottom: 4,
          lineHeight: 1.2,
        }}
      >
        {nombreMostrar}
      </div>
      <div
        style={{
          color: "#e0e6ed",
          fontSize: "1rem",
          textAlign: "center",
          marginBottom: 2,
        }}
      >
        {email}
      </div>
      <div
        style={{
          color: "#b6c2d6",
          fontSize: "0.95rem",
          textAlign: "center",
          marginBottom: 8,
        }}
      >
        Katalyst ID: <span style={{ fontWeight: 600 }}>{katalystId}</span>
      </div>
      {comunidad && (
        <div
          style={{
            background: "#F7931A",
            color: "#fff",
            borderRadius: 8,
            padding: "0.25rem 1rem",
            fontWeight: 600,
            fontSize: "0.95rem",
            marginTop: 8,
            marginBottom: 0,
            textAlign: "center",
            letterSpacing: 0.5,
          }}
        >
          {comunidad}
        </div>
      )}
    </div>
  );
}
