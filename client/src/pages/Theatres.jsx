import React, { useEffect, useState } from "react";
import { useAppContext } from "../context/AppContext";
import { MapPinIcon, MonitorIcon } from "lucide-react";
import Loading from "../components/Loading";
import BlurCircle from "../components/BlurCircle";
import { useNavigate } from "react-router-dom";

const Theatres = () => {
    const { axios, image_base_url, selectedCity, setShowCitySelector } = useAppContext();
    const navigate = useNavigate();
    const [theatres, setTheatres] = useState([]);
    const [theatreShows, setTheatreShows] = useState({});
    const [loading, setLoading] = useState(true);

    const fetchTheatresAndShows = async () => {
        try {
            const { data: tData } = await axios.get("/api/theatres/all");
            if (!tData.success) return;

            // Filter by selected city
            const theatreList = selectedCity
                ? tData.theatres.filter(t => t.city?.toLowerCase() === selectedCity.toLowerCase())
                : tData.theatres;

            setTheatres(theatreList);

            // Fetch movies per theatre
            const theatreMovieMap = {};
            await Promise.allSettled(
                theatreList.map(async (theatre) => {
                    try {
                        const { data } = await axios.get(`/api/theatres/${theatre._id}/shows`);
                        theatreMovieMap[theatre._id] = data.success ? data.movies : [];
                    } catch {
                        theatreMovieMap[theatre._id] = [];
                    }
                })
            );
            setTheatreShows(theatreMovieMap);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTheatresAndShows();
        window.scrollTo(0, 0);
    }, [selectedCity]);

    if (loading) return <Loading />;

    return (
        <div className="px-6 md:px-16 lg:px-40 pt-30 md:pt-40 min-h-screen">
            <BlurCircle top="100px" left="0px" />

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-10">
                <div>
                    <h1 className="text-3xl font-semibold mb-1">Theatres</h1>
                    <p className="text-gray-400 text-sm">
                        {selectedCity
                            ? `Showing theatres in ${selectedCity}`
                            : "Showing all theatres"}
                    </p>
                </div>
                <button
                    onClick={() => setShowCitySelector(true)}
                    className="flex items-center gap-2 px-4 py-2 border border-primary/40 hover:border-primary rounded-full text-sm text-gray-300 hover:text-white transition w-fit"
                >
                    <MapPinIcon className="w-4 h-4 text-primary" />
                    {selectedCity ? `Change city (${selectedCity})` : "Select your city"}
                </button>
            </div>

            {theatres.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <MonitorIcon className="w-16 h-16 text-gray-600 mb-4" />
                    <p className="text-xl font-medium text-gray-300">
                        {selectedCity ? `No theatres in ${selectedCity}` : "No theatres available yet"}
                    </p>
                    {selectedCity && (
                        <button
                            onClick={() => setShowCitySelector(true)}
                            className="mt-4 text-primary text-sm underline"
                        >
                            Try a different city
                        </button>
                    )}
                </div>
            ) : (
                <div className="space-y-10">
                    {theatres.map((theatre) => {
                        const movies = theatreShows[theatre._id] || [];
                        return (
                            <div key={theatre._id} className="bg-primary/5 border border-primary/15 rounded-2xl p-6">
                                <div className="flex flex-col md:flex-row md:items-center justify-between gap-2 mb-6">
                                    <div>
                                        <h2 className="text-xl font-semibold">{theatre.name}</h2>
                                        <p className="flex items-center gap-1 text-gray-400 text-sm mt-1">
                                            <MapPinIcon className="w-4 h-4" />
                                            {theatre.address}, {theatre.city}
                                        </p>
                                    </div>
                                    <span className="text-xs bg-primary/20 text-primary px-3 py-1 rounded-full font-medium w-fit">
                                        {theatre.totalSeats} Seats
                                    </span>
                                </div>

                                {movies.length === 0 ? (
                                    <p className="text-gray-500 text-sm">No shows currently scheduled.</p>
                                ) : (
                                    <div className="flex gap-4 overflow-x-auto pb-2 no-scrollbar">
                                        {movies.map((movie, i) => (
                                            <div
                                                key={i}
                                                onClick={() => navigate(`/movies/${movie._id}?theatreId=${theatre._id}`)}
                                                className="flex-shrink-0 w-32 cursor-pointer hover:-translate-y-1 transition"
                                            >
                                                <img
                                                    src={image_base_url + movie.poster_path}
                                                    alt={movie.title}
                                                    className="rounded-lg w-full aspect-[2/3] object-cover"
                                                />
                                                <p className="text-xs font-medium mt-2 truncate">{movie.title}</p>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default Theatres;
