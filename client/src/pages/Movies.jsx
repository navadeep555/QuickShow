import React, { useContext } from "react";
import MovieCard from "../components/MovieCard";
import BlurCircle from "../components/BlurCircle";
import { AppContext } from "../context/AppContext";

const Movies = () => {

  const { shows, selectedCity } = useContext(AppContext)

  const filteredShows = selectedCity
    ? shows.filter(show => show.theatres && show.theatres.some(t => t.city?.toLowerCase() === selectedCity.toLowerCase()))
    : shows;

  return (
    <div className="relative my-32 px-6 md:px-16 lg:px-40 xl:px-44 overflow-hidden min-h-[80vh]">

      {/* Blur Effects */}
      <BlurCircle top="120px" left="-60px" />
      <BlurCircle bottom="80px" right="-40px" />

      {filteredShows.length > 0 ? (
        <>
          {/* Heading */}
          <h1 className="text-xl md:text-2xl font-semibold text-center text-white mb-10">
            Now Showing
          </h1>

          {/* Movies Grid */}
          <div className="flex flex-wrap justify-center gap-8">
            {filteredShows.map((movie) => (
              <MovieCard key={movie._id} movie={movie} />
            ))}
          </div>
        </>
      ) : (
        /* Empty State */
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-center">
          <h1 className="text-3xl font-bold text-gray-400 mb-2">
            No Movies Available
          </h1>
          <p className="text-gray-500 text-sm">
            Please check back later
          </p>
        </div>
      )}
    </div>
  );
};

export default Movies;
