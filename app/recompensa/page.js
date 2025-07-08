import Link from "next/link";
import { FaMicrophone } from "react-icons/fa";
import Image from "next/image";

// Función para convertir duración ISO 8601 a formato legible
function parseISODuration(duration) {
  if (!duration) return "";
  const regex = /PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/;
  const match = duration.match(regex);
  if (!match) return duration;
  const [, h, m, s] = match;
  const parts = [];
  if (h) parts.push(`${h}h`);
  if (m) parts.push(`${m}m`);
  if (s) parts.push(`${s}s`);
  return parts.join(" ") || "0s";
}

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
          <a
            href="https://www.youtube.com/@katalyst353?sub_confirmation=1"
            target="_blank"
            rel="noopener noreferrer"
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-full font-semibold flex items-center space-x-2 transition-colors duration-200 shadow-lg"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
            <span>Suscribirse al Canal</span>
          </a>
        </div>

        {/* Lista de episodios */}
        <div className="space-y-2 overflow-x-hidden">
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
            episodes.map((ep) => (
              <div
                key={ep.videoId}
                className="group w-full block"
                style={{ maxWidth: "100vw" }}
              >
                <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 p-4 rounded-lg hover:bg-white/5 transition-all duration-200 text-center sm:text-left shadow-md">
                  {/* Imagen de portada (thumbnail) */}
                  <div className="w-full max-w-xs sm:max-w-[160px] aspect-video rounded-lg overflow-hidden shadow-lg mx-auto">
                    <Image
                      src={ep.thumbnail}
                      alt={ep.title}
                      width={320}
                      height={180}
                      className="w-full h-full object-cover"
                    />
                  </div>
                  {/* Contenido textual */}
                  <div className="flex-1 flex flex-col items-center sm:items-start w-full">
                    {/* Título */}
                    <h2 className="text-lg sm:text-xl font-bold text-white w-full mb-1 text-center sm:text-left">
                      {ep.title}
                    </h2>
                    {/* Descripción debajo del título */}
                    <p className="text-gray-300 text-sm mb-2 line-clamp-3 w-full">
                      {ep.description}
                    </p>
                    {/* Metadatos */}
                    <div className="flex flex-wrap gap-2 justify-center sm:justify-start w-full mb-2">
                      <span className="bg-white/10 text-white px-3 py-1 rounded-full text-xs">
                        {ep.publishedAt
                          ? new Date(ep.publishedAt).toLocaleDateString()
                          : ""}
                      </span>
                      <span className="bg-white/10 text-white px-3 py-1 rounded-full text-xs">
                        {ep.duration ? parseISODuration(ep.duration) : ""}
                      </span>
                    </div>
                    <div className="flex gap-2 justify-center sm:justify-start w-full">
                      <Link
                        href={`/recompensa/${ep.videoId}`}
                        className="inline-block mt-2 bg-[#f99d25] hover:bg-[#ffb84d] text-black font-semibold px-4 py-2 rounded-full transition-colors duration-200 shadow"
                      >
                        Ver Episodio
                      </Link>
                      <a
                        href={`https://youtube.com/watch?v=${ep.videoId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-block mt-2 bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-full transition-colors duration-200 shadow"
                      >
                        YouTube
                      </a>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
