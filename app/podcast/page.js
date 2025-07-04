"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  FaPlay,
  FaCalendarAlt,
  FaEye,
  FaThumbsUp,
  FaClock,
  FaSync,
  FaSpinner,
} from "react-icons/fa";

export default function PodcastPage() {
  const [videos, setVideos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({});

  useEffect(() => {
    fetchVideos();
  }, []);

  const fetchVideos = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/podcast/videos");
      const data = await response.json();

      if (data.success) {
        setVideos(data.videos);

        // Calcular estadísticas
        const total = data.videos.length;
        const processed = data.videos.filter((v) => v.isProcessed).length;
        const published = data.videos.filter((v) => v.isPublished).length;

        setStats({ total, processed, published });
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError("Error al cargar los videos");
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("es-ES", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDuration = (duration) => {
    if (!duration) return "";

    // Convertir formato ISO 8601 (PT15M33S) a formato legible
    const match = duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return duration;

    const hours = match[1] || 0;
    const minutes = match[2] || 0;
    const seconds = match[3] || 0;

    if (hours > 0) {
      return `${hours}:${minutes.padStart(2, "0")}:${seconds.padStart(2, "0")}`;
    } else {
      return `${minutes}:${seconds.padStart(2, "0")}`;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <FaSpinner className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-4" />
          <p className="text-gray-600">Cargando episodios del podcast...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <h2 className="text-xl font-bold">Error</h2>
            <p>{error}</p>
          </div>
          <button
            onClick={fetchVideos}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Reintentar
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-16">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-4">
              🎙️ La Recompensa de los Necios
            </h1>
            <p className="text-xl md:text-2xl opacity-90 mb-8">
              Podcast sobre innovación, emprendimiento y tecnología
            </p>

            {/* Estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-2xl mx-auto">
              <div className="bg-white bg-opacity-20 rounded-lg p-4">
                <div className="text-3xl font-bold">{stats.total}</div>
                <div className="text-sm opacity-90">Episodios</div>
              </div>
              <div className="bg-white bg-opacity-20 rounded-lg p-4">
                <div className="text-3xl font-bold">{stats.processed}</div>
                <div className="text-sm opacity-90">Procesados</div>
              </div>
              <div className="bg-white bg-opacity-20 rounded-lg p-4">
                <div className="text-3xl font-bold">{stats.published}</div>
                <div className="text-sm opacity-90">Publicados</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Lista de episodios */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="flex justify-between items-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900">
            Episodios Disponibles
          </h2>
          <button
            onClick={fetchVideos}
            className="flex items-center space-x-2 bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
          >
            <FaSync className="w-4 h-4" />
            <span>Actualizar</span>
          </button>
        </div>

        {videos.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <FaPlay className="w-16 h-16 mx-auto" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No hay episodios disponibles
            </h3>
            <p className="text-gray-600">
              Los episodios aparecerán aquí una vez que se procesen.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {videos
              .sort((a, b) => new Date(b.publishedAt) - new Date(a.publishedAt))
              .map((video) => (
                <div
                  key={video.videoId}
                  className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
                >
                  {/* Thumbnail */}
                  <div className="relative">
                    <Image
                      src={video.thumbnail}
                      alt={video.title}
                      width={400}
                      height={225}
                      className="w-full h-48 object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                      <FaPlay className="w-12 h-12 text-white" />
                    </div>
                  </div>

                  {/* Contenido */}
                  <div className="p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2 line-clamp-2">
                      {video.title}
                    </h3>

                    <div className="flex items-center text-sm text-gray-500 mb-4 space-x-4">
                      <div className="flex items-center space-x-1">
                        <FaCalendarAlt className="w-4 h-4" />
                        <span>{formatDate(video.publishedAt)}</span>
                      </div>
                    </div>

                    {/* Estado del procesamiento */}
                    <div className="flex items-center justify-between">
                      <div className="flex space-x-2">
                        {video.isProcessed ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                            ✅ Procesado
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                            ⏳ Pendiente
                          </span>
                        )}

                        {video.isPublished ? (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            📝 Publicado
                          </span>
                        ) : (
                          <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                            📄 Borrador
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Botones de acción */}
                    <div className="mt-4 flex space-x-2">
                      <Link
                        href={`/podcast/${video.videoId}`}
                        className="flex-1 bg-blue-600 text-white text-center py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                      >
                        Ver Episodio
                      </Link>
                      <a
                        href={`https://www.youtube.com/watch?v=${video.videoId}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
                      >
                        YouTube
                      </a>
                    </div>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
    </div>
  );
}
