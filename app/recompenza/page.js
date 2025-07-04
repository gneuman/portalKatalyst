import Link from "next/link";

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
    <div className="max-w-3xl mx-auto py-10 px-4">
      <h1 className="text-3xl font-bold mb-6 text-center">
        Recompenza de los Necios
      </h1>
      <p className="mb-8 text-center text-gray-600">
        Todos los episodios del podcast, disponibles para escuchar y compartir.
      </p>
      <div className="grid gap-8">
        {episodes.length === 0 && (
          <div className="text-center text-gray-500">
            No hay episodios publicados aún.
          </div>
        )}
        {episodes.map((ep) => (
          <Link
            key={ep.videoId}
            href={`/recompenza/${ep.videoId}`}
            className="block border rounded-lg shadow hover:shadow-lg transition overflow-hidden"
          >
            <div className="flex flex-col md:flex-row">
              <img
                src={ep.thumbnail}
                alt={ep.title}
                className="w-full md:w-48 h-40 object-cover"
              />
              <div className="flex-1 p-4">
                <h2 className="text-xl font-semibold mb-2">
                  {ep.aiTitle || ep.title}
                </h2>
                <div className="text-gray-500 text-sm mb-2">
                  {new Date(ep.publishedAt).toLocaleDateString("es-MX", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  })}
                </div>
                <p className="text-gray-700 line-clamp-3">
                  {ep.aiSummary || ep.description}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
