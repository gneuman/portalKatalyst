import useUserProfile from "./useUserProfile";

export default function ProfileCard() {
  const { profile, loading, error } = useUserProfile();

  if (loading) {
    // Spinner SVG
    return (
      <div className="w-full max-w-[240px] h-[220px] rounded-lg shadow-lg p-4 bg-gradient-to-br from-[#1C384A] via-[#54B8B4aa] to-[#1C384A] flex flex-col items-center justify-center mx-auto">
        <svg
          className="animate-spin h-10 w-10 text-white"
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
        <div className="text-white text-sm mt-2">Cargando perfil...</div>
      </div>
    );
  }

  if (error || !profile) {
    // Mostrar un mensaje más amigable o un placeholder
    return (
      <div className="w-full max-w-[240px] h-[220px] rounded-lg shadow-lg p-4 bg-gradient-to-br from-[#1C384A] via-[#54B8B4aa] to-[#1C384A] flex flex-col items-center justify-center text-white text-center mx-auto">
        <div className="w-[56px] h-[56px] rounded-full bg-gray-300 flex items-center justify-center mb-2">
          <svg
            className="w-8 h-8 text-gray-600"
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
    <div className="w-full max-w-[240px] h-[220px] rounded-lg shadow-lg p-4 bg-gradient-to-br from-[#1C384A] via-[#54B8B4aa] to-[#1C384A] flex flex-col items-center justify-center mx-auto">
      <img
        src={profile.fotoPerfil}
        alt={profile.nombreCompleto}
        className="w-[56px] h-[56px] rounded-full object-cover border-4 border-white mb-2"
      />
      <div className="text-xs text-orange-200 font-mono mb-1">
        Katalyst ID: {profile.personalMondayId || ""}
      </div>
      <div className="text-xs text-blue-200 font-mono mb-1">
        {profile.email}
      </div>
      <div className="text-white font-bold text-lg text-center break-words w-full mb-1">
        {profile.nombreCompleto}
      </div>
      <div className="flex justify-center w-full mt-1">
        <span className="flex items-center px-3 py-1 text-xs font-semibold rounded bg-orange-400 text-white">
          {profile.comunidad || "Sin comunidad"}
        </span>
      </div>
      {/* Espacio para agregar más cosas en el futuro */}
    </div>
  );
}
