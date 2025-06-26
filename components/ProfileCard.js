import useUserProfile from "./useUserProfile";

export default function ProfileCard() {
  const { profile, loading, error } = useUserProfile();

  // Mostrar en consola solo la información relevante de nombre completo
  if (profile) {
    console.log(`Nombre Completo Monday: ${profile.nombreCompletoMonday}`);
    console.log(`Nombre (MongoDB): ${profile.name}`);
    console.log(`Origen del nombre completo: ${profile.origenNombreCompleto}`);
  }

  // Mostrar siempre el nombre de Monday si existe
  const nombreMostrar = profile?.nombreCompletoMonday || "";

  if (loading) {
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

  if (error || !profile) {
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
          {error ? "Error al cargar el perfil" : "Completa tu registro"}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full max-w-[340px] rounded-xl shadow-lg p-6 bg-[#1C384A] flex flex-col gap-3 mx-auto">
      <div className="flex gap-4 items-center">
        <img
          src={profile.fotoPerfil}
          alt={nombreMostrar}
          className="w-[72px] h-[72px] rounded-full object-cover border-4 border-white"
        />
        <div className="flex flex-col justify-center">
          <div className="text-xs text-orange-200 font-mono mb-1">
            Katalyst ID: {profile.personalMondayId || ""}
          </div>
          <div className="text-white font-bold text-xl leading-tight">
            {nombreMostrar}
          </div>
          <div className="text-white text-sm opacity-80">{profile.email}</div>
        </div>
      </div>
      <div className="flex gap-2 mt-2">
        <span className="flex items-center px-3 py-1 text-xs font-semibold rounded bg-orange-400 text-white">
          {profile.comunidad || "Sin comunidad"}
        </span>
      </div>
    </div>
  );
}
