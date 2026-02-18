import React, { useEffect, useState } from "react";
import { useAppContext } from "../context/AppContext";
import Loading from "../components/Loading";
import BlurCircle from "../components/BlurCircle";
import { CalendarIcon, MapPinIcon } from "lucide-react";
import { useNavigate } from "react-router-dom";

const INDUSTRY_MAP = {
    en: "Hollywood",
    hi: "Bollywood",
    te: "Tollywood",
    ta: "Kollywood",
    ml: "Mollywood",
    kn: "Sandalwood",
    bn: "Bengali",
};

const Releases = () => {
    const { axios, image_base_url, selectedCity, setShowCitySelector } = useAppContext();
    const navigate = useNavigate();
    const [industries, setIndustries] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchReleases = async () => {
        try {
            const { data } = await axios.get("/api/shows/all");
            if (data.success) {
                // Filter movies: only include those with a theatre in the selected city
                const filtered = selectedCity
                    ? data.shows.filter(movie =>
                        movie.theatres && movie.theatres.some(t =>
                            t.city?.toLowerCase() === selectedCity.toLowerCase()
                        )
                    )
                    : data.shows;

                const langMap = {};
                filtered.forEach((movie) => {
                    const lang = movie.original_language;
                    const industryName = INDUSTRY_MAP[lang] || "Other";
                    if (!langMap[industryName]) langMap[industryName] = [];
                    langMap[industryName].push(movie);
                });

                const order = Object.values(INDUSTRY_MAP);
                const sorted = Object.entries(langMap).sort(([a], [b]) => {
                    const ai = order.indexOf(a), bi = order.indexOf(b);
                    if (ai === -1 && bi === -1) return 0;
                    if (ai === -1) return 1;
                    if (bi === -1) return -1;
                    return ai - bi;
                });

                setIndustries(sorted.map(([name, movies]) => ({ name, movies })));
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchReleases();
        window.scrollTo(0, 0);
    }, [selectedCity]);

    if (loading) return <Loading />;

    return (
        <div className="px-6 md:px-16 lg:px-40 pt-30 md:pt-40 min-h-screen">
            <BlurCircle top="100px" right="0px" />

            {/* Header */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-10">
                <div>
                    <h1 className="text-3xl font-semibold mb-1">Now Showing</h1>
                    <p className="text-gray-400 text-sm">
                        {selectedCity
                            ? `Movies playing in ${selectedCity}`
                            : "Movies currently playing in theatres"}
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

            {industries.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                    <CalendarIcon className="w-16 h-16 text-gray-600 mb-4" />
                    <p className="text-xl font-medium text-gray-300">
                        {selectedCity ? `No releases in ${selectedCity}` : "No releases available yet"}
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
                <div className="space-y-14">
                    {industries.map((industry) => (
                        <div key={industry.name}>
                            <div className="flex items-center gap-3 mb-6">
                                <span className="text-primary font-semibold text-lg">{industry.name}</span>
                                <div className="flex-1 h-px bg-gray-700" />
                            </div>

                            <div className="flex flex-wrap gap-6 max-sm:justify-center">
                                {industry.movies.map((movie, i) => (
                                    <div
                                        key={i}
                                        onClick={() => { navigate(`/movies/${movie._id}`); window.scrollTo(0, 0); }}
                                        className="w-36 cursor-pointer group"
                                    >
                                        <div className="relative overflow-hidden rounded-xl">
                                            <img
                                                src={image_base_url + movie.poster_path}
                                                alt={movie.title}
                                                className="w-full aspect-[2/3] object-cover group-hover:scale-105 transition duration-300"
                                            />
                                        </div>
                                        <p className="text-sm font-medium mt-2 truncate">{movie.title}</p>
                                        {movie.theatres && movie.theatres
                                            .filter(t => !selectedCity || t.city?.toLowerCase() === selectedCity.toLowerCase())
                                            .map((t, ti) => (
                                                <p key={ti} className="flex items-center gap-1 text-[11px] text-gray-400 truncate mt-0.5">
                                                    <MapPinIcon className="w-3 h-3 flex-shrink-0 text-primary" />
                                                    {t.name}, {t.city}
                                                </p>
                                            ))}
                                    </div>
                                ))}
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default Releases;
