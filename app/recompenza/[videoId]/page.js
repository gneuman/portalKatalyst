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
} from "react-icons/fa";

async function getEpisode(videoId) {
  try {
    const res = await fetch(
      `${process.env.NEXTAUTH_URL || ""}/api/podcast/videos?videoId=${videoId}`
    );

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

export default async function EpisodioPage({ params }) {
  const episode = await getEpisode(params.videoId);
  if (!episode) return notFound();

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#233746] via-[#1a2a35] to-[#0f1a23]">
      {/* Header con navegación */}
      <div className="bg-black/20 backdrop-blur-sm border-b border-white/10">
        <div className="max-w-7xl mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link
              href="/recompenza"
              className="flex items-center space-x-3 text-white hover:text-[#f99d25] transition-colors duration-200"
            >
              <FaArrowLeft className="text-lg" />
              <span className="font-medium">Volver al podcast</span>
            </Link>
            <div className="flex items-center space-x-4">
              <a
                href={`https://www.youtube.com/watch?v=${episode.videoId}`}
                target="_blank"
                rel="noopener noreferrer"
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-full font-medium flex items-center space-x-2 transition-all duration-200"
              >
                <svg
                  className="w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                </svg>
                <span>Ver en YouTube</span>
              </a>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Columna izquierda - Información del episodio */}
          <div className="lg:col-span-2">
            {/* Thumbnail y controles */}
            <div className="relative mb-8">
              <div className="relative rounded-xl overflow-hidden shadow-2xl">
                <img
                  src={episode.thumbnail}
                  alt={episode.title}
                  className="w-full h-80 object-cover"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />
                <div className="absolute bottom-4 left-4 right-4">
                  <a
                    href={`https://www.youtube.com/watch?v=${episode.videoId}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 rounded-full font-semibold flex items-center space-x-3 transition-all duration-200 transform hover:scale-105 shadow-lg"
                  >
                    <svg
                      className="w-6 h-6"
                      viewBox="0 0 24 24"
                      fill="currentColor"
                    >
                      <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
                    </svg>
                    <span>Ver en YouTube</span>
                  </a>
                </div>
              </div>
            </div>

            {/* Información del episodio */}
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-bold text-white mb-4 leading-tight">
                  {episode.aiTitle || episode.title}
                </h1>
                <div className="flex items-center space-x-6 text-gray-400 text-sm mb-6">
                  <div className="flex items-center space-x-2">
                    <FaCalendar className="text-xs" />
                    <span>
                      {new Date(episode.publishedAt).toLocaleDateString(
                        "es-MX",
                        {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        }
                      )}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <FaClock className="text-xs" />
                    <span>45 min</span>
                  </div>
                </div>
              </div>

              {/* Descripción */}
              <div className="bg-white/5 rounded-xl p-6">
                <h3 className="text-white font-semibold text-lg mb-4">
                  Descripción
                </h3>
                <div className="text-gray-300 leading-relaxed space-y-4">
                  {episode.aiSummary && (
                    <div>
                      <h4 className="text-[#f99d25] font-medium mb-2">
                        Resumen AI
                      </h4>
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

          {/* Columna derecha - Video y metadatos */}
          <div className="space-y-6">
            {/* Video de YouTube */}
            <div className="bg-white/5 rounded-xl p-4">
              <h3 className="text-white font-semibold text-lg mb-4">
                Ver en YouTube
              </h3>
              <div className="relative rounded-lg overflow-hidden">
                <iframe
                  width="100%"
                  height="315"
                  src={`https://www.youtube.com/embed/${episode.videoId}`}
                  title={episode.title}
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="rounded-lg"
                ></iframe>
              </div>
            </div>

            {/* Metadatos adicionales */}
            <div className="bg-white/5 rounded-xl p-4">
              <h3 className="text-white font-semibold text-lg mb-4">
                Información
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Duración</span>
                  <span className="text-white">45 minutos</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Categoría</span>
                  <span className="text-white">Podcast</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Idioma</span>
                  <span className="text-white">Español</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Calidad</span>
                  <span className="text-white">HD</span>
                </div>
              </div>
            </div>

            {/* Acciones rápidas */}
            <div className="bg-white/5 rounded-xl p-4">
              <h3 className="text-white font-semibold text-lg mb-4">
                Acciones
              </h3>
              <div className="space-y-3">
                <a 
                  href={`https://www.youtube.com/watch?v=${episode.videoId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-red-600 hover:bg-red-700 text-white py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2"
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z"/>
                  </svg>
                  <span>Ver en YouTube</span>
                </a>
                <a 
                  href={`https://www.youtube.com/channel/UCYOUR_CHANNEL_ID`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full bg-white/10 hover:bg-white/20 text-white py-3 px-4 rounded-lg font-medium transition-all duration-200 flex items-center justify-center space-x-2"
                >
                  <FaMicrophone className="text-sm" />
                  <span>Suscribirse al canal</span>
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
