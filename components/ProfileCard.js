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
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="w-full max-w-[240px] h-[220px] rounded-lg shadow-lg p-4 bg-gradient-to-br from-[#1C384A] via-[#54B8B4aa] to-[#1C384A] flex flex-col items-center justify-center text-white text-center mx-auto">
        Error: No tienes acceso o el usuario no existe en la base de datos.
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
