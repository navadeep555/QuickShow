import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { dummyDateTimeData, dummyShowsData } from "../assets/assets";
import BlurCircle from "../components/BlurCircle";
import { StarIcon, PlayCircleIcon, Heart } from "lucide-react";
import timeFormat from "../lib/timeFormat";
import DateSelect from "../components/DateSelect";
import MovieCard from "../components/MovieCard";
import Loading from "../components/Loading"; // ✅ FIXED

const MovieDetails = () => {
  const navigate = useNavigate();
  const { id } = useParams();
  const [show, setShow] = useState(null);

  const getShow = async () => {
    const foundShow = dummyShowsData.find(
      (show) => show._id === id
    );

    // ✅ Correct placement
    if (foundShow) {
      setShow({
        movie: foundShow,
        dateTime: dummyDateTimeData,
      });
    }
  };

  useEffect(() => {
    getShow();
  }, [id]);

  return show ? (
    <div className="px-6 md:px-16 lg:px-40 pt-30 md:pt-50">

      {/* ================= MAIN SECTION ================= */}
      <div className="flex flex-col md:flex-row gap-8 max-w-6xl mx-auto">

        {/* POSTER */}
        <img
          src={show.movie.poster_path}
          alt={show.movie.title}
          className="rounded-xl h-[420px] object-cover"
        />

        {/* DETAILS */}
        <div className="relative flex flex-col gap-4">
          <BlurCircle top="-100px" left="-100px" />

          <p className="text-primary font-medium">ENGLISH</p>

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
            <button className="flex items-center gap-2 px-7 py-3 text-sm bg-gray-800 hover:bg-gray-900 rounded-md transition active:scale-95">
              <PlayCircleIcon className="w-5 h-5" />
              Watch Trailer
            </button>

            <a
              href="#dateSelect"
              className="px-10 py-3 text-sm bg-primary hover:bg-primary-dull rounded-md transition active:scale-95"
            >
              Buy Tickets
            </a>

            <button className="bg-gray-700 p-2.5 rounded-full hover:bg-gray-600 transition active:scale-95">
              <Heart className="w-5 h-5" />
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
                src={cast.profile_path}
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
        {dummyShowsData.slice(0, 4).map((movie, index) => (
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
    </div>
  ) : (
    <Loading />
  );
};

export default MovieDetails;
