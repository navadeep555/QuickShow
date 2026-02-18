import React, { useEffect, useState } from "react";
import { MapPinIcon, LocateIcon, XIcon, Loader2 } from "lucide-react";
import { useAppContext } from "../context/AppContext";
import { useNavigate } from "react-router-dom";

const CitySelector = () => {
    const { axios, selectedCity, setSelectedCity, showCitySelector, setShowCitySelector } = useAppContext();
    const navigate = useNavigate();

    const handleSelectCity = (city) => {
        setSelectedCity(city);
        setShowCitySelector(false);
        navigate('/');
        window.scrollTo(0, 0);
    };

    const [cities, setCities] = useState([]);
    const [detecting, setDetecting] = useState(false);
    const [detectedCity, setDetectedCity] = useState(null);
    const [error, setError] = useState("");
    const [search, setSearch] = useState("");

    // Fetch available cities from active theatres
    useEffect(() => {
        const fetchCities = async () => {
            try {
                const { data } = await axios.get("/api/theatres/all");
                if (data.success) {
                    const uniqueCities = [...new Set(data.theatres.map((t) => t.city))].sort();
                    setCities(uniqueCities);
                }
            } catch (err) {
                console.error(err);
            }
        };
        if (showCitySelector) fetchCities();
    }, [showCitySelector]);

    // Auto-detect location using browser geolocation + BigDataCloud
    const handleDetectLocation = () => {
        setError("");
        setDetecting(true);

        if (!navigator.geolocation) {
            setError("Geolocation is not supported by your browser.");
            setDetecting(false);
            return;
        }

        navigator.geolocation.getCurrentPosition(
            async (position) => {
                try {
                    const { latitude, longitude } = position.coords;
                    const res = await fetch(
                        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
                    );
                    const geo = await res.json();

                    // Try city → locality → principalSubdivision
                    const detectedName = geo.city || geo.locality || geo.principalSubdivision || "";

                    if (!detectedName) {
                        setError("Could not determine your city. Please select manually.");
                        setDetecting(false);
                        return;
                    }

                    setDetectedCity(detectedName);

                    // Try to find a matching theatre city (case-insensitive partial match)
                    const match = cities.find(
                        (c) => c.toLowerCase() === detectedName.toLowerCase() ||
                            c.toLowerCase().includes(detectedName.toLowerCase()) ||
                            detectedName.toLowerCase().includes(c.toLowerCase())
                    );

                    // If match found use it, otherwise use detected name directly
                    handleSelectCity(match || detectedName);
                } catch (err) {
                    setError("Failed to detect location. Please select manually.");
                } finally {
                    setDetecting(false);
                }
            },
            (err) => {
                setError("Location access denied. Please select your city manually.");
                setDetecting(false);
            }
        );
    };

    const filteredCities = cities.filter((c) =>
        c.toLowerCase().includes(search.toLowerCase())
    );

    if (!showCitySelector) return null;

    return (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/70 backdrop-blur-sm px-4">
            <div className="relative bg-[#0f0f0f] border border-gray-700 rounded-2xl w-full max-w-md p-6 shadow-2xl">

                {/* Close — only if city already selected */}
                {selectedCity && (
                    <button
                        onClick={() => setShowCitySelector(false)}
                        className="absolute top-4 right-4 text-gray-400 hover:text-white transition"
                    >
                        <XIcon className="w-5 h-5" />
                    </button>
                )}

                {/* Header */}
                <div className="flex items-center gap-3 mb-2">
                    <MapPinIcon className="w-6 h-6 text-primary" />
                    <h2 className="text-xl font-semibold">Choose Your City</h2>
                </div>
                <p className="text-gray-400 text-sm mb-5">
                    We'll show you theatres and shows available in your city.
                </p>

                {/* Auto-detect button */}
                <button
                    onClick={handleDetectLocation}
                    disabled={detecting}
                    className="w-full flex items-center justify-center gap-2 border border-primary/60 text-primary hover:bg-primary/10 rounded-xl py-3 text-sm font-medium transition mb-4 disabled:opacity-60"
                >
                    {detecting
                        ? <Loader2 className="w-4 h-4 animate-spin" />
                        : <LocateIcon className="w-4 h-4" />
                    }
                    {detecting ? "Detecting your location..." : "Auto-detect My Location"}
                </button>

                {/* Error / detected city message */}
                {error && (
                    <p className="text-red-400 text-xs mb-3 text-center">{error}</p>
                )}
                {detectedCity && !error && (
                    <p className="text-green-400 text-xs mb-3 text-center">
                        ✓ Detected: {detectedCity}
                    </p>
                )}

                {/* Divider */}
                <div className="flex items-center gap-3 mb-4">
                    <div className="flex-1 h-px bg-gray-700" />
                    <span className="text-gray-500 text-xs">or select manually</span>
                    <div className="flex-1 h-px bg-gray-700" />
                </div>

                {/* Search */}
                <input
                    type="text"
                    placeholder="Search city..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-white/5 border border-gray-700 rounded-lg px-4 py-2 text-sm outline-none focus:border-primary transition mb-3"
                />

                {/* City list or free-text fallback */}
                <div className="max-h-48 overflow-y-auto space-y-1 pr-1">
                    {filteredCities.length === 0 ? (
                        <div className="py-2">
                            {search.trim().length > 0 ? (
                                <button
                                    onClick={() => handleSelectCity(search.trim())}
                                    className="w-full flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm bg-primary/10 border border-primary/40 hover:bg-primary/20 text-white transition"
                                >
                                    <MapPinIcon className="w-3.5 h-3.5 text-primary flex-shrink-0" />
                                    Use &ldquo;{search.trim()}&rdquo; as my city
                                </button>
                            ) : (
                                <p className="text-gray-500 text-sm text-center py-4">
                                    {cities.length === 0
                                        ? "Type your city name above to continue"
                                        : "No matching cities"}
                                </p>
                            )}
                        </div>
                    ) : (
                        filteredCities.map((city) => (
                            <button
                                key={city}
                                onClick={() => handleSelectCity(city)}
                                className={`w-full text-left px-4 py-2.5 rounded-lg text-sm transition flex items-center gap-2
                  ${selectedCity === city
                                        ? "bg-primary text-white"
                                        : "hover:bg-white/5 text-gray-300"
                                    }`}
                            >
                                <MapPinIcon className="w-3.5 h-3.5 flex-shrink-0" />
                                {city}
                            </button>
                        ))
                    )}
                </div>
            </div>
        </div>
    );
};

export default CitySelector;
