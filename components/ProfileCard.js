import useUserProfile from "./useUserProfile";

export default function ProfileCard() {
  const { profile, loading, error } = useUserProfile();

  if (loading) {
    // Skeleton minimalista
    return (
      <div className="w-full max-w-[240px] h-[220px] rounded-lg shadow-lg p-4 bg-gradient-to-br from-[#1C384A] via-[#54B8B4aa] to-[#1C384A] flex flex-col items-center justify-center mx-auto animate-pulse">
        <div className="w-[56px] h-[56px] rounded-full bg-slate-300 mb-2" />
        <div className="h-5 w-2/3 bg-slate-300 rounded mb-1" />
        <div className="h-4 w-1/3 bg-orange-300 rounded mb-2" />
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="w-full max-w-[240px] h-[220px] rounded-lg shadow-lg p-4 bg-gradient-to-br from-[#1C384A] via-[#54B8B4aa] to-[#1C384A] flex flex-col items-center justify-center text-white text-center mx-auto">
        Cargando...
      </div>
    );
  }

  return (
    <div className="w-full max-w-[240px] h-[220px] rounded-lg shadow-lg p-4 bg-gradient-to-br from-[#1C384A] via-[#54B8B4aa] to-[#1C384A] flex flex-col items-center justify-center mx-auto">
      <img
        src={profile.fotoPerfil}
        alt={profile.name}
        className="w-[56px] h-[56px] rounded-full object-cover border-4 border-white mb-2"
      />
      <div className="text-white font-bold text-lg text-center break-words w-full mb-1">
        {profile.name}
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
