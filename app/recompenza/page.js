import Link from "next/link";
import { FaPlay, FaClock, FaCalendar, FaMicrophone } from "react-icons/fa";

async function getEpisodes() {
  try {
    const res = await fetch(
      `${
        process.env.NEXTAUTH_URL || ""
      }/api/podcast/videos?status=published&limit=100`
    );

    if (!res.ok) {
      console.error(`Error fetching episodes: ${res.status}`);
      return [];
    }

    const data = await res.json();
    return data.videos || [];
  } catch (error) {
    console.error("Error fetching episodes:", error);
    return [];
  }
}

export default async function RecompenzaPage() {
  const episodes = await getEpisodes();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#233746] via-[#1a2a35] to-[#0f1a23]">
      {/* Header inspirado en Spotify */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-8">
          <div className="flex items-center space-x-4">
            <div className="w-16 h-16 bg-gradient-to-br from-[#f99d25] to-[#f79533] rounded-lg flex items-center justify-center shadow-lg">
              <FaMicrophone className="text-white text-2xl" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-white mb-2">
                Recompenza de los Necios
              </h1>
              <p className="text-gray-300 text-lg">
                Podcast • {episodes.length} episodios
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Barra de herramientas */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <div className="bg-[#f99d25] text-white px-8 py-3 rounded-full font-semibold flex items-center space-x-2 shadow-lg">
              <FaMicrophone className="text-sm" />
              <span>Podcast Activo</span>
            </div>
            <div className="bg-white/10 text-white px-6 py-3 rounded-full font-medium">
              {episodes.length} episodios
            </div>
          </div>
          <div className="text-gray-400 text-sm">Disponible en YouTube</div>
        </div>

        {/* Lista de episodios */}
        <div className="space-y-2">
          {episodes.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-white/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <FaMicrophone className="text-white/50 text-3xl" />
              </div>
              <h3 className="text-white text-xl font-semibold mb-2">
                No hay episodios publicados aún
              </h3>
              <p className="text-gray-400">
                Los episodios aparecerán aquí cuando estén disponibles
              </p>
            </div>
          ) : (
            episodes.map((ep, index) => (
              <Link
                key={ep.videoId}
                href={`/recompenza/${ep.videoId}`}
                className="group flex items-center space-x-4 p-4 rounded-lg hover:bg-white/5 transition-all duration-200"
              >
                {/* Número del episodio */}
                <div className="w-8 h-8 flex items-center justify-center text-gray-400 group-hover:text-white transition-colors duration-200">
                  {index + 1}
                </div>

                {/* Thumbnail */}
                <div className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0">
                  <img
                    src={ep.thumbnail}
                    alt={ep.title}
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center">
                    <FaPlay className="text-white text-lg" />
                  </div>
                </div>

                {/* Información del episodio */}
                <div className="flex-1 min-w-0">
                  <h3 className="text-white font-semibold text-lg truncate group-hover:text-[#f99d25] transition-colors duration-200">
                    {ep.aiTitle || ep.title}
                  </h3>
                  <p className="text-gray-400 text-sm line-clamp-2 mt-1">
                    {ep.aiSummary || ep.description}
                  </p>
                </div>

                {/* Metadatos */}
                <div className="flex items-center space-x-6 text-gray-400 text-sm">
                  <div className="flex items-center space-x-2">
                    <FaCalendar className="text-xs" />
                    <span>
                      {new Date(ep.publishedAt).toLocaleDateString("es-MX", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <FaClock className="text-xs" />
                    <span>45 min</span>
                  </div>
                </div>

                {/* Botón de YouTube */}
                <div className="w-8 h-8 bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200 hover:bg-red-700">
                  <svg
                    className="w-4 h-4 text-white"
                    viewBox="0 0 24 24"
                    fill="currentColor"
                  >
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                  </svg>
                </div>
              </Link>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
