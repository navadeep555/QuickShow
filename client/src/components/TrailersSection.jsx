import { useState } from "react";
import BlurCircle from "./BlurCircle";
import { dummyTrailers } from "../assets/assets";

const getVideoId = (url) => {
  if (!url) return "";
  const match = url.match(/v=([^&]+)/);
  return match ? match[1] : "";
};

const TrailerSection = () => {
  const [currentTrailer, setCurrentTrailer] = useState(dummyTrailers[0]);
  const videoId = getVideoId(currentTrailer.videoUrl);

  return (
    <div className="px-6 md:px-16 lg:px-24 xl:px-44 py-20 bg-black overflow-hidden">
      <p className="text-gray-300 font-medium text-lg text-center mb-6">
        Trailers
      </p>

      <div className="relative flex justify-center">
        <BlurCircle top="-120px" right="-120px" />

        <div className="relative w-full max-w-[960px] aspect-video rounded-xl overflow-hidden bg-black z-10">
          {videoId && (
            <iframe
              key={videoId}
              src={`https://www.youtube.com/embed/${videoId}`}
              title="YouTube trailer"
              frameBorder="0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
              className="w-full h-full"
            />
          )}
        </div>
      </div>

      <div className="mt-8 flex gap-4 justify-center flex-wrap">
        {dummyTrailers.map((trailer, index) => (
          <img
            key={index}
            src={trailer.image}
            alt="trailer"
            onClick={() => setCurrentTrailer(trailer)}
            className={`w-40 h-24 object-cover rounded-lg cursor-pointer transition ${
              currentTrailer.videoUrl === trailer.videoUrl
                ? "ring-2 ring-primary"
                : "opacity-70 hover:opacity-100"
            }`}
          />
        ))}
      </div>
    </div>
  );
};

export default TrailerSection;
