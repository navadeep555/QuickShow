import { useState, useEffect, useContext } from "react";
import BlurCircle from "./BlurCircle";
import { AppContext } from "../context/AppContext";

const TrailerSection = () => {
  const { axios } = useContext(AppContext);
  const [trailers, setTrailers] = useState([]);
  const [current, setCurrent] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchTrailers = async () => {
      try {
        const { data } = await axios.get("/api/shows/featured-trailers");
        if (data.success && data.trailers.length > 0) {
          setTrailers(data.trailers);
          setCurrent(data.trailers[0]);
        }
      } catch (err) {
        console.error("Failed to fetch featured trailers", err);
      } finally {
        setLoading(false);
      }
    };
    fetchTrailers();
  }, []);

  if (loading || !current) return null;

  return (
    <div className="px-6 md:px-16 lg:px-24 xl:px-44 py-20 bg-black overflow-hidden">
      <p className="text-gray-300 font-medium text-lg text-center mb-2">
        Trailers
      </p>
      <p className="text-center text-gray-500 text-sm mb-8">
        Latest from every industry
      </p>

      <div className="relative flex justify-center">
        <BlurCircle top="-120px" right="-120px" />

        {/* Main video player */}
        <div className="w-full max-w-[960px] z-10">
          <div className="aspect-video rounded-xl overflow-hidden bg-black">
            <iframe
              key={current.key}
              src={`https://www.youtube.com/embed/${current.key}?autoplay=0`}
              title={current.movieTitle}
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          </div>

          {/* Movie title + industry badge */}
          <div className="flex items-center gap-3 mt-4 px-1">
            <span className="bg-primary text-white text-xs font-semibold px-3 py-1 rounded-full">
              {current.industry}
            </span>
            <p className="text-white font-medium truncate">{current.movieTitle}</p>
          </div>
        </div>
      </div>

      {/* Thumbnail switcher */}
      <div className="mt-8 flex gap-4 justify-center flex-wrap">
        {trailers.map((trailer, index) => (
          <div
            key={index}
            onClick={() => setCurrent(trailer)}
            className={`relative cursor-pointer rounded-lg overflow-hidden transition group ${current.key === trailer.key
                ? "ring-2 ring-primary"
                : "opacity-70 hover:opacity-100"
              }`}
          >
            <img
              src={trailer.thumbnail}
              alt={trailer.movieTitle}
              className="w-40 h-24 object-cover"
              onError={(e) => {
                // fallback to lower-res thumbnail if maxresdefault fails
                e.target.src = `https://img.youtube.com/vi/${trailer.key}/hqdefault.jpg`;
              }}
            />
            {/* Industry label overlay */}
            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent px-2 py-1">
              <p className="text-white text-[10px] font-semibold">{trailer.industry}</p>
              <p className="text-gray-300 text-[9px] truncate">{trailer.movieTitle}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default TrailerSection;
