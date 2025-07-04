import { notFound } from "next/navigation";

async function getEpisode(videoId) {
  const res = await fetch(
    `${process.env.NEXTAUTH_URL || ""}/api/podcast/videos?videoId=${videoId}`
  );
  const data = await res.json();
  return (data.videos && data.videos[0]) || null;
}

export default async function EpisodioPage({ params }) {
  const episode = await getEpisode(params.videoId);
  if (!episode) return notFound();

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-bold mb-2">
        {episode.aiTitle || episode.title}
      </h1>
      <div className="text-gray-500 text-sm mb-4">
        {new Date(episode.publishedAt).toLocaleDateString("es-MX", {
          year: "numeric",
          month: "short",
          day: "numeric",
        })}
      </div>
      <div className="mb-6">
        <img
          src={episode.thumbnail}
          alt={episode.title}
          className="w-full h-64 object-cover rounded-lg"
        />
      </div>
      <div className="mb-6">
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
      <div className="mb-4 text-lg text-gray-800">
        {episode.aiSummary || episode.description}
      </div>
      <div className="text-gray-600 whitespace-pre-line">
        {episode.description}
      </div>
    </div>
  );
}
