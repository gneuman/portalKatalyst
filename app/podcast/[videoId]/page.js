"use client";
import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  FaArrowLeft,
  FaCalendarAlt,
  FaEye,
  FaThumbsUp,
  FaClock,
  FaYoutube,
  FaSpinner,
  FaPlay,
} from "react-icons/fa";

export default function PodcastEpisodePage() {
  const params = useParams();
  const videoId = params.videoId;

  const [video, setVideo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (videoId) {
      fetchVideo();
    }
  }, [videoId]);

  const fetchVideo = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/podcast/videos");
      const data = await response.json();

      if (data.success) {
        const foundVideo = data.videos.find((v) => v.videoId === videoId);
        if (foundVideo) {
          setVideo(foundVideo);
        } else {
          setError("Episodio no encontrado");
        }
      } else {
        setError(data.error);
      }
    } catch (err) {
      setError("Error al cargar el episodio");
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
          <p className="text-gray-600">Cargando episodio...</p>
        </div>
      </div>
    );
  }

  if (error || !video) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-600 mb-4">
            <h2 className="text-xl font-bold">Error</h2>
            <p>{error || "Episodio no encontrado"}</p>
          </div>
          <Link
            href="/podcast"
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700"
          >
            Volver al Podcast
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center space-x-4 mb-6">
            <Link
              href="/podcast"
              className="flex items-center space-x-2 hover:opacity-80 transition-opacity"
            >
              <FaArrowLeft className="w-4 h-4" />
              <span>Volver al Podcast</span>
            </Link>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Información del episodio */}
            <div>
              <h1 className="text-3xl md:text-4xl font-bold mb-4">
                {video.title}
              </h1>

              <div className="flex items-center space-x-6 text-sm opacity-90 mb-6">
                <div className="flex items-center space-x-2">
                  <FaCalendarAlt className="w-4 h-4" />
                  <span>{formatDate(video.publishedAt)}</span>
                </div>
                {video.duration && (
                  <div className="flex items-center space-x-2">
                    <FaClock className="w-4 h-4" />
                    <span>{formatDuration(video.duration)}</span>
                  </div>
                )}
              </div>

              {/* Estadísticas */}
              <div className="grid grid-cols-2 gap-4">
                {video.viewCount > 0 && (
                  <div className="bg-white bg-opacity-20 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <FaEye className="w-4 h-4" />
                      <span>{video.viewCount.toLocaleString()}</span>
                    </div>
                    <div className="text-xs opacity-75">Visualizaciones</div>
                  </div>
                )}
                {video.likeCount > 0 && (
                  <div className="bg-white bg-opacity-20 rounded-lg p-3">
                    <div className="flex items-center space-x-2">
                      <FaThumbsUp className="w-4 h-4" />
                      <span>{video.likeCount.toLocaleString()}</span>
                    </div>
                    <div className="text-xs opacity-75">Me gusta</div>
                  </div>
                )}
              </div>
            </div>

            {/* Thumbnail */}
            <div className="relative">
              <Image
                src={video.thumbnail}
                alt={video.title}
                width={480}
                height={270}
                className="w-full rounded-lg shadow-lg"
              />
              <div className="absolute inset-0 bg-black bg-opacity-20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity rounded-lg">
                <FaPlay className="w-16 h-16 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto px-4 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Video y descripción */}
          <div className="lg:col-span-2">
            {/* Video embebido */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">
                🎬 Ver Episodio
              </h2>

              <div
                className="relative w-full"
                style={{ paddingBottom: "56.25%" }}
              >
                <iframe
                  src={`https://www.youtube.com/embed/${videoId}`}
                  title={video.title}
                  className="absolute top-0 left-0 w-full h-full rounded-lg"
                  frameBorder="0"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              </div>

              <div className="mt-4 flex space-x-4">
                <a
                  href={`https://www.youtube.com/watch?v=${videoId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center space-x-2 bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 transition-colors"
                >
                  <FaYoutube className="w-4 h-4" />
                  <span>Ver en YouTube</span>
                </a>
              </div>
            </div>

            {/* Resumen AI */}
            {video.aiSummary && (
              <div className="bg-white rounded-xl shadow-lg p-6">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  📝 Resumen del Episodio
                </h2>
                <div className="prose prose-lg max-w-none">
                  <p className="text-gray-700 leading-relaxed">
                    {video.aiSummary}
                  </p>
                </div>
              </div>
            )}

            {/* Descripción original */}
            {video.description && (
              <div className="bg-white rounded-xl shadow-lg p-6 mt-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  📄 Descripción Original
                </h2>
                <div className="prose prose-lg max-w-none">
                  <p className="text-gray-700 whitespace-pre-wrap">
                    {video.description}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Estado del procesamiento */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Estado del Episodio
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Procesamiento IA:</span>
                  {video.isProcessed ? (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      ✅ Completado
                    </span>
                  ) : (
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                      ⏳ Pendiente
                    </span>
                  )}
                </div>

                <div className="flex items-center justify-between">
                  <span className="text-gray-600">Publicación:</span>
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
            </div>

            {/* Información técnica */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Información Técnica
              </h3>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Video ID:</span>
                  <span className="font-mono text-gray-900">
                    {video.videoId}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Fecha de publicación:</span>
                  <span className="text-gray-900">
                    {formatDate(video.publishedAt)}
                  </span>
                </div>
                {video.duration && (
                  <div className="flex justify-between">
                    <span className="text-gray-600">Duración:</span>
                    <span className="text-gray-900">
                      {formatDuration(video.duration)}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Navegación */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Navegación
              </h3>
              <div className="space-y-3">
                <Link
                  href="/podcast"
                  className="block w-full text-center bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Ver Todos los Episodios
                </Link>
                <a
                  href={`https://www.youtube.com/watch?v=${videoId}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block w-full text-center bg-red-600 text-white py-2 px-4 rounded-lg hover:bg-red-700 transition-colors"
                >
                  Ver en YouTube
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
