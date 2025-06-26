import useUserProfile from "./useUserProfile";

export default function ProfileCard() {
  const { profile, loading, error } = useUserProfile();

  if (loading) {
    return (
      <div className="w-full max-w-[340px] h-[320px] rounded-xl shadow-lg p-6 bg-gradient-to-br from-[#1C384A] via-[#54B8B4aa] to-[#1C384A] flex flex-col justify-center mx-auto">
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
      <div className="w-full max-w-[340px] h-[320px] rounded-xl shadow-lg p-6 bg-gradient-to-br from-[#1C384A] via-[#54B8B4aa] to-[#1C384A] flex flex-col items-center justify-center text-white text-center mx-auto">
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
    <div className="w-full max-w-[340px] rounded-xl shadow-lg p-6 bg-gradient-to-br from-[#1C384A] via-[#54B8B4aa] to-[#1C384A] flex flex-col gap-3 mx-auto">
      <div className="flex gap-4 items-center">
        <img
          src={profile.fotoPerfil}
          alt={profile.nombreCompleto}
          className="w-[72px] h-[72px] rounded-full object-cover border-4 border-white"
        />
        <div className="flex flex-col justify-center">
          <div className="text-white font-bold text-xl leading-tight">
            {profile.nombreCompleto}
          </div>
          <div className="text-white text-sm opacity-80">{profile.email}</div>
        </div>
      </div>
      <div className="flex gap-2 mt-2">
        <span className="flex items-center px-3 py-1 text-xs font-semibold rounded bg-orange-400 text-white">
          {profile.comunidad || "Sin comunidad"}
        </span>
        {profile.generacion && (
          <span className="flex items-center px-3 py-1 text-xs font-semibold rounded bg-purple-500 text-white">
            {profile.generacion}
          </span>
        )}
      </div>
      <div className="flex gap-4 mt-4">
        <a href="#" className="text-gray-300 hover:text-blue-500">
          <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
            <path d="M22.23 0H1.77C.792 0 0 .771 0 1.723v20.549C0 23.229.792 24 1.77 24h20.459C23.208 24 24 23.229 24 22.271V1.723C24 .771 23.208 0 22.23 0zM7.12 20.452H3.56V9h3.56v11.452zM5.34 7.633a2.062 2.062 0 1 1 0-4.124 2.062 2.062 0 0 1 0 4.124zM20.452 20.452h-3.555v-5.605c0-1.336-.025-3.057-1.865-3.057-1.867 0-2.153 1.457-2.153 2.963v5.699h-3.555V9h3.414v1.561h.049c.476-.899 1.637-1.847 3.37-1.847 3.602 0 4.267 2.37 4.267 5.455v6.283z" />
          </svg>
        </a>
        <a href="#" className="text-gray-300 hover:text-blue-500">
          <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19.615 3.184c-1.72-.153-5.6-.153-7.32 0-1.72.153-2.89.672-3.6 1.38-.71.71-1.23 1.88-1.38 3.6-.153 1.72-.153 5.6 0 7.32.153 1.72.672 2.89 1.38 3.6.71.71 1.88 1.23 3.6 1.38 1.72.153 5.6.153 7.32 0 1.72-.153 2.89-.672 3.6-1.38.71-.71 1.23-1.88 1.38-3.6.153-1.72.153-5.6 0-7.32-.153-1.72-.672-2.89-1.38-3.6-.71-.71-1.88-1.23-3.6-1.38zM12 15.6A3.6 3.6 0 1 1 12 8.4a3.6 3.6 0 0 1 0 7.2zm6.4-8.4a.8.8 0 1 1-1.6 0 .8.8 0 0 1 1.6 0z" />
          </svg>
        </a>
        <a href="#" className="text-gray-300 hover:text-blue-500">
          <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2.163c-5.468 0-9.837 4.369-9.837 9.837 0 4.354 2.82 8.065 6.839 9.387.5.092.682-.217.682-.482 0-.237-.009-.868-.013-1.703-2.782.604-3.369-1.342-3.369-1.342-.454-1.154-1.11-1.461-1.11-1.461-.908-.62.069-.608.069-.608 1.004.07 1.532 1.032 1.532 1.032.892 1.529 2.341 1.088 2.91.832.092-.646.35-1.088.636-1.339-2.221-.253-4.555-1.111-4.555-4.943 0-1.091.39-1.984 1.029-2.683-.103-.253-.446-1.272.098-2.65 0 0 .84-.269 2.75 1.025A9.564 9.564 0 0 1 12 6.844c.85.004 1.705.115 2.504.338 1.909-1.294 2.748-1.025 2.748-1.025.546 1.378.202 2.397.1 2.65.64.699 1.028 1.592 1.028 2.683 0 3.841-2.337 4.687-4.566 4.936.359.309.678.919.678 1.852 0 1.336-.012 2.417-.012 2.747 0 .267.18.577.688.48C19.18 20.062 22 16.451 22 12c0-5.468-4.369-9.837-9.837-9.837z" />
          </svg>
        </a>
      </div>
    </div>
  );
}
