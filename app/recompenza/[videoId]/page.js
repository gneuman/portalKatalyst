import { notFound } from "next/navigation";
import Link from "next/link";
import {
  FaPlay,
  FaClock,
  FaCalendar,
  FaArrowLeft,
  FaShare,
  FaHeart,
  FaDownload,
  FaMicrophone,
} from "react-icons/fa";

async function getEpisode(videoId) {
  try {
    // Construir URL absoluta para fetch en server-side
    const base =
      typeof window === "undefined"
        ? process.env.NEXTAUTH_URL || "http://localhost:3000"
        : "";
    const res = await fetch(`${base}/api/podcast/videos?videoId=${videoId}`, {
      cache: "no-store",
    });
    if (!res.ok) {
      console.error(`Error fetching episode: ${res.status}`);
      return null;
    }
    const data = await res.json();
    return (data.videos && data.videos[0]) || null;
  } catch (error) {
    console.error("Error fetching episode:", error);
    return null;
  }
}

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

export default async function EpisodioPage({ params }) {
  // Buscar el episodio en MongoDB usando el videoId de la URL
  const episode = await getEpisode(params.videoId);
  if (!episode) return notFound();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#233746] via-[#1a2a35] to-[#0f1a23] flex flex-col items-center py-8 px-4">
      {/* Header navegación */}
      <div className="w-full max-w-2xl mb-6">
        <Link
          href="/recompenza"
          className="flex items-center space-x-2 text-white hover:text-[#f99d25] transition-colors duration-200 font-medium mb-4"
        >
          <FaArrowLeft className="text-lg" />
          <span>Volver al podcast</span>
        </Link>
      </div>

      {/* Video principal */}
      <div className="w-full max-w-2xl rounded-xl overflow-hidden shadow-2xl mb-6">
        <iframe
          width="100%"
          height="400"
          src={`https://www.youtube.com/embed/${episode.videoId}`}
          title={episode.title}
          frameBorder="0"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          className="rounded-xl w-full min-h-[220px] md:min-h-[400px]"
        ></iframe>
      </div>

      {/* Información del episodio */}
      <div className="w-full max-w-2xl space-y-6">
        {/* Título */}
        <h1 className="text-3xl font-bold text-white mb-2 leading-tight text-center">
          {episode.aiTitle && episode.aiTitle.trim() !== ""
            ? episode.aiTitle
            : episode.title}
        </h1>

        {/* Estadísticas */}
        <div className="flex flex-wrap justify-center gap-4 text-gray-400 text-base mb-2">
          <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full">
            <FaCalendar className="text-lg" />
            <span className="text-white font-medium">
              {(() => {
                // publishedAt puede venir como string, Date o timestamp
                let date = episode.publishedAt;
                if (typeof date === "object" && date.$date) date = date.$date;
                date = new Date(date);
                return date.toLocaleDateString("es-MX", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                });
              })()}
            </span>
          </div>
          <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full">
            <FaClock className="text-lg" />
            <span className="text-white font-medium">
              {parseISODuration(episode.duration) || "45 min"}
            </span>
          </div>
          <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full">
            <FaPlay className="text-lg" />
            <span className="text-white font-medium">
              {Number(episode.viewCount) || 0} vistas
            </span>
          </div>
          <div className="flex items-center gap-2 bg-white/10 px-4 py-2 rounded-full">
            <FaHeart className="text-lg" />
            <span className="text-white font-medium">
              {Number(episode.likeCount) || 0} likes
            </span>
          </div>
        </div>

        {/* Botón YouTube */}
        <div className="flex justify-center mb-2">
          <a
            href={`https://www.youtube.com/watch?v=${episode.videoId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-full font-semibold flex items-center space-x-2 transition-all duration-200 shadow-lg"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
              <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
            </svg>
            <span>Ver en YouTube</span>
          </a>
        </div>

        {/* Descripción */}
        <div className="bg-white/5 rounded-xl p-6">
          <h3 className="text-white font-semibold text-lg mb-4 text-center">
            Descripción
          </h3>
          <div className="text-gray-300 leading-relaxed space-y-4">
            {episode.aiSummary && episode.aiSummary.trim() !== "" && (
              <div>
                <h4 className="text-[#f99d25] font-medium mb-2">Resumen AI</h4>
                <p className="text-gray-300">{episode.aiSummary}</p>
              </div>
            )}
            <div>
              <h4 className="text-[#f99d25] font-medium mb-2">
                Descripción completa
              </h4>
              <p className="text-gray-300 whitespace-pre-line">
                {episode.description}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
