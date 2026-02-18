import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import BlurCircle from "../components/BlurCircle";
import { StarIcon, PlayCircleIcon, Heart, X, Loader2 } from "lucide-react";
import timeFormat from "../lib/timeFormat";
import DateSelect from "../components/DateSelect";
import MovieCard from "../components/MovieCard";
import Loading from "../components/Loading";
import { AppContext } from "../context/AppContext";
import { toast } from "react-hot-toast";

const MovieDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const { axios, shows, getToken, user, fetchFavoriteMovies, favoriteMovies, image_base_url } = useContext(AppContext);
  const [show, setShow] = useState(null);

  // Trailer modal state
  const [showTrailer, setShowTrailer] = useState(false);
  const [trailers, setTrailers] = useState([]);
  const [trailerIndex, setTrailerIndex] = useState(0);
  const [loadingTrailers, setLoadingTrailers] = useState(false);

  const getShow = async () => {
    try {
      const { data } = await axios.get(`/api/shows/${id}`);

      if (data.success) {
        setShow({
          movie: data.movie,
          dateTime: data.dateTime,
        });
      } else {
        toast.error(data.message);
        navigate("/movies");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch show details");
    }
  };

  const handleWatchTrailer = async () => {
    setLoadingTrailers(true);
    try {
      const { data } = await axios.get(`/api/shows/trailers/${show.movie._id}`);
      if (data.success && data.trailers.length > 0) {
        setTrailers(data.trailers);
        setTrailerIndex(0);
        setShowTrailer(true);
      } else {
        toast.error("No trailers available for this movie");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load trailers");
    } finally {
      setLoadingTrailers(false);
    }
  };

  const closeTrailer = () => {
    setShowTrailer(false);
    setTrailers([]);
  };

  const handleFavorite = async () => {
    try {
      if (!user) {
        return toast.error("Please sign in to add to favorites");
      }

      const { data } = await axios.post("/api/user/update-favorite",
        { movieId: show.movie._id },
        { headers: { Authorization: `Bearer ${await getToken()}` } }
      );

      if (data.success) {
        await fetchFavoriteMovies();
        toast.success(data.message);
      }
    } catch (error) {
      toast.error("Failed to update favorite status");
    }
  };

  useEffect(() => {
    getShow();
    window.scrollTo(0, 0);
  }, [id]);

  return show ? (
    <div className="px-6 md:px-16 lg:px-40 pt-30 md:pt-50">

      {/* ================= MAIN SECTION ================= */}
      <div className="flex flex-col md:flex-row gap-8 max-w-6xl mx-auto">

        {/* POSTER */}
        <img
          src={image_base_url + show.movie.poster_path}
          alt={show.movie.title}
          className="rounded-xl h-[420px] object-cover"
        />

        {/* DETAILS */}
        <div className="relative flex flex-col gap-4">
          <BlurCircle top="-100px" left="-100px" />

          <p className="text-primary font-medium uppercase">
            {new Intl.DisplayNames(["en"], { type: "language" }).of(show.movie.original_language) || "ENGLISH"}
          </p>

          <h1 className="text-4xl font-semibold max-w-2xl">
            {show.movie.title}
          </h1>

          {/* RATING */}
          <div className="flex items-center gap-2 text-gray-300">
            <StarIcon className="w-5 h-5 fill-primary text-primary" />
            {show.movie.vote_average.toFixed(1)} User Rating
          </div>

          {/* OVERVIEW */}
          <p className="text-gray-400 max-w-xl leading-tight">
            {show.movie.overview}
          </p>

          {/* META INFO */}
          <p className="text-gray-300 text-sm">
            {timeFormat(show.movie.runtime)} •{" "}
            {show.movie.genres.map((g) => g.name).join(", ")} •{" "}
            {show.movie.release_date.split("-")[0]}
          </p>

          {/* ACTION BUTTONS */}
          <div className="flex flex-wrap gap-4 mt-4">
            <button
              onClick={handleWatchTrailer}
              disabled={loadingTrailers}
              className="flex items-center gap-2 px-7 py-3 text-sm bg-gray-800 hover:bg-gray-900 rounded-md transition active:scale-95 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loadingTrailers
                ? <Loader2 className="w-5 h-5 animate-spin" />
                : <PlayCircleIcon className="w-5 h-5" />
              }
              {loadingTrailers ? "Loading..." : "Watch Trailer"}
            </button>

            <a
              href="#dateSelect"
              className="px-10 py-3 text-sm bg-primary hover:bg-primary-dull rounded-md transition active:scale-95"
            >
              Buy Tickets
            </a>

            <button
              onClick={handleFavorite}
              className="bg-gray-700 p-2.5 rounded-full hover:bg-gray-600 transition active:scale-95"
            >
              <Heart className={`w-5 h-5 ${favoriteMovies.some(movie => movie._id === show.movie._id) ? "fill-red-500 text-red-500" : "text-white"}`} />
            </button>
          </div>
        </div>
      </div>

      {/* ================= CAST SECTION ================= */}
      <p className="text-lg font-medium mt-20">Your Favorite Cast</p>

      <div className="overflow-x-auto no-scrollbar mt-8 pb-4">
        <div className="flex items-center gap-4 w-max px-4">
          {show.movie.casts.slice(0, 12).map((cast, index) => (
            <div
              key={index}
              className="flex flex-col items-center text-center"
            >
              <img
                src={image_base_url + cast.profile_path}
                alt={cast.name}
                className="rounded-full h-20 w-20 object-cover"
              />
              <p className="font-medium text-xs mt-3">
                {cast.name}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* ================= DATE SELECT ================= */}
      <DateSelect dateTime={show.dateTime} id={id} />

      {/* ================= RECOMMENDED ================= */}
      <p className="text-lg font-medium mt-20 mb-8">
        You May Also Like
      </p>

      <div className="flex flex-wrap max-sm:justify-center gap-8">
        {shows.slice(0, 4).map((movie, index) => (
          <MovieCard key={index} movie={movie} />
        ))}
      </div>

      {/* SHOW MORE */}
      <div className="flex justify-center mt-20">
        <button
          onClick={() => {
            navigate("/movies");
            window.scrollTo(0, 0);
          }}
          className="px-10 py-3 text-sm bg-primary hover:bg-primary-dull rounded-md transition active:scale-95"
        >
          Show More
        </button>
      </div>

      {/* ================= TRAILER MODAL ================= */}
      {showTrailer && trailers.length > 0 && (
        <div
          className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-16 bg-black/80 backdrop-blur-sm"
          onClick={closeTrailer}
        >
          <div
            className="relative w-full max-w-4xl mx-auto px-4 flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close button */}
            <button
              onClick={closeTrailer}
              className="absolute -top-10 right-0 text-white hover:text-primary transition"
            >
              <X className="w-7 h-7" />
            </button>

            {/* Video player */}
            <div className="w-full aspect-video rounded-xl overflow-hidden bg-black">
              <iframe
                key={trailerIndex}
                src={`https://www.youtube.com/embed/${trailers[trailerIndex].key}?autoplay=1`}
                title={trailers[trailerIndex].name}
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
                className="w-full h-full"
              />
            </div>

            {/* Trailer name */}
            <p className="text-center text-sm text-gray-300 mt-3">
              {trailers[trailerIndex].name}
            </p>

            {/* Trailer thumbnails — only show if more than 1 */}
            {trailers.length > 1 && (
              <div className="flex gap-3 mt-4 justify-center flex-wrap">
                {trailers.map((trailer, index) => (
                  <button
                    key={index}
                    onClick={() => setTrailerIndex(index)}
                    className={`relative rounded-lg overflow-hidden transition ${trailerIndex === index
                      ? "ring-2 ring-primary"
                      : "opacity-60 hover:opacity-100"
                      }`}
                  >
                    <img
                      src={`https://img.youtube.com/vi/${trailer.key}/mqdefault.jpg`}
                      alt={trailer.name}
                      className="w-32 h-20 object-cover"
                    />
                    <span className="absolute bottom-0 left-0 right-0 bg-black/60 text-white text-[10px] px-1 py-0.5 truncate">
                      {trailer.name}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  ) : (
    <Loading />
  );
};

export default MovieDetails;
