import React, { useEffect, useState } from "react";
import { CheckIcon, Trash2 } from "lucide-react";
import Loading from "../../components/Loading";
import Title from "../../components/admin/Title";
import { useAppContext } from "../../context/AppContext";
import { toast } from "react-hot-toast";

const AddShows = () => {
  const { axios, getToken, user, image_base_url } = useAppContext();
  const currency = import.meta.env.VITE_CURRENCY;
  const [industries, setIndustries] = useState([]);
  const [theatres, setTheatres] = useState([]);
  const [selectedTheatre, setSelectedTheatre] = useState("");
  const [loading, setLoading] = useState(true);
  const [selectedMovie, setSelectedMovie] = useState(null);
  const [showPrice, setShowPrice] = useState("");
  const [dateTimeInput, setDateTimeInput] = useState("");
  const [dateTimeSelection, setDateTimeSelection] = useState({});
  const [addingShow, setAddingShow] = useState(false);

  // FETCH MOVIES
  const fetchNowPlayingMovies = async () => {
    try {
      setLoading(true);

      const [moviesResult, theatresResult] = await Promise.allSettled([
        axios.get("/api/shows/now-playing", {
          headers: { Authorization: `Bearer ${await getToken()}` }
        }),
        axios.get("/api/theatres/all"),
      ]);

      if (moviesResult.status === "fulfilled" && moviesResult.value.data.success) {
        setIndustries(moviesResult.value.data.industries);
      }
      if (theatresResult.status === "fulfilled" && theatresResult.value.data.success) {
        setTheatres(theatresResult.value.data.theatres);
      }

    } catch (error) {
      console.error("Error fetching movies:", error);
    } finally {
      setLoading(false);
    }
  };
  const handleSubmit = async () => {
    try {
      setAddingShow(true);

      if (!selectedTheatre || !selectedMovie || !showPrice || Object.keys(dateTimeSelection).length === 0) {
        toast("Please fill all fields including theatre");
        setAddingShow(false);
        return;
      }

      const showInput = Object.entries(dateTimeSelection).map(
        ([date, times]) => ({ date, time: times })
      );

      const payload = {
        movieID: selectedMovie,
        showInput,
        showPrice: Number(showPrice),
        theatreId: selectedTheatre,
      };

      const { data } = await axios.post(
        "/api/shows/add",
        payload,
        {
          headers: {
            Authorization: `Bearer ${await getToken()}`,
          },
        }
      );

      if (data.success) {
        toast.success(data.message);
        setSelectedMovie(null);
        setDateTimeSelection({});
        setShowPrice("");
        setSelectedTheatre("");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      console.error("Error adding show:", error);
      console.log("Error Data:", error.response?.data);
      toast.error(error.response?.data?.message || "Failed to add show");
    } finally {
      setAddingShow(false);
    }
  };



  // ✅ CALL ON COMPONENT LOAD
  useEffect(() => {
    if (user) {
      fetchNowPlayingMovies();
    }
  }, [user]);

  // ADD DATE & TIME
  const handleDateTimeAdd = () => {
    if (!dateTimeInput) return;

    const [date, time] = dateTimeInput.split("T");
    if (!date || !time) return;

    setDateTimeSelection((prev) => {
      const times = prev[date] || [];
      if (times.includes(time)) return prev;

      return {
        ...prev,
        [date]: [...times, time]
      };
    });

    setDateTimeInput("");
  };

  // REMOVE TIME
  const handleRemoveTime = (date, time) => {
    setDateTimeSelection((prev) => {
      const filteredTimes = prev[date].filter((t) => t !== time);

      if (filteredTimes.length === 0) {
        const { [date]: _, ...rest } = prev;
        return rest;
      }

      return {
        ...prev,
        [date]: filteredTimes
      };
    });
  };

  // ✅ Proper loading handling
  if (loading) return <Loading />;

  return (
    <>
      <Title text1="Add" text2="Shows" />

      {/* ===== THEATRE SELECTOR ===== */}
      <div className="mt-10">
        <p className="text-lg font-medium mb-3">Select Theatre</p>
        {theatres.length === 0 ? (
          <p className="text-gray-400 text-sm">No theatres available. Please add a theatre first.</p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {theatres.map((theatre) => (
              <button
                key={theatre._id}
                onClick={() => setSelectedTheatre(theatre._id)}
                className={`px-4 py-2 rounded-lg border text-sm transition ${selectedTheatre === theatre._id
                  ? "border-primary bg-primary/20 text-primary"
                  : "border-gray-600 hover:border-primary/60"
                  }`}
              >
                <span className="font-medium">{theatre.name}</span>
                <span className="text-gray-400 ml-1">— {theatre.city}</span>
              </button>
            ))}
          </div>
        )}
      </div>

      <p className="mt-10 text-lg font-medium">Now Playing Movies</p>

      {industries.map((industry) => (
        <div key={industry.name} className="mt-8">
          {/* Industry label */}
          <div className="flex items-center gap-3 mb-4">
            <span className="text-primary font-semibold text-base">{industry.name}</span>
            <div className="flex-1 h-px bg-gray-700" />
          </div>

          <div className="overflow-x-auto pb-4 no-scrollbar">
            <div className="flex gap-4 w-max">
              {industry.movies.map((movie) => (
                <div
                  key={movie.id}
                  className={`relative w-36 cursor-pointer hover:-translate-y-1 transition ${selectedMovie === movie.id ? "ring-2 ring-primary rounded-lg" : ""
                    }`}
                  onClick={() => setSelectedMovie(movie.id)}
                >
                  <img
                    src={image_base_url + movie.poster_path}
                    alt={movie.title}
                    className="rounded-lg brightness-90 w-full"
                  />

                  {selectedMovie === movie.id && (
                    <div className="absolute top-2 right-2 bg-primary h-6 w-6 rounded-full flex items-center justify-center">
                      <CheckIcon className="w-4 h-4 text-white" />
                    </div>
                  )}

                  <p className="font-medium p-2 truncate text-sm">{movie.title}</p>
                  <p className="text-xs text-gray-400 px-2 pb-2">{movie.release_date}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      ))}

      <div className="mt-8">
        <label className="block text-sm mb-2">Show Price</label>
        <div className="inline-flex items-center gap-2 border px-3 py-2 rounded-md">
          <span className="text-gray-400">{currency}</span>
          <input
            type="number"
            min={0}
            value={showPrice}
            onChange={(e) => setShowPrice(e.target.value)}
            className="outline-none bg-transparent"
          />
        </div>
      </div>

      <div className="mt-6">
        <label className="block text-sm mb-2">
          Select Date & Time
        </label>

        <div className="inline-flex gap-4 border p-2 rounded-lg">
          <input
            type="datetime-local"
            value={dateTimeInput}
            onChange={(e) => setDateTimeInput(e.target.value)}
            className="outline-none"
          />

          <button
            onClick={handleDateTimeAdd}
            className="bg-primary text-white px-3 py-2 rounded-lg"
          >
            Add Time
          </button>
        </div>
      </div>

      {Object.keys(dateTimeSelection).length > 0 && (
        <div className="mt-6">
          <h2 className="mb-2 font-medium">
            Selected Date-Time
          </h2>

          <ul className="space-y-3">
            {Object.entries(dateTimeSelection).map(([date, times]) => (
              <li key={date}>
                <div className="font-medium">{date}</div>

                <div className="flex flex-wrap gap-2 mt-2">
                  {times.map((time) => (
                    <div
                      key={time}
                      className="border border-primary px-2 py-1 rounded flex items-center"
                    >
                      <span>{time}</span>
                      <Trash2
                        size={15}
                        onClick={() => handleRemoveTime(date, time)}
                        className="ml-2 text-red-500 hover:text-red-700 cursor-pointer"
                      />
                    </div>
                  ))}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      <button onClick={handleSubmit} disabled={addingShow}
        className="bg-primary text-white px-8 py-2 rounded-lg mt-6
        hover:bg-primary/90 transition-all cursor-pointer"
      >
        Add Show
      </button>
    </>
  );
};

export default AddShows;
