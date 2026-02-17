import React, { useEffect, useState } from "react";
import { CheckIcon, Trash2 } from "lucide-react";
import Loading from "../../components/Loading";
import Title from "../../components/admin/Title";
import { useAppContext } from "../../context/AppContext";
import { toast } from "react-hot-toast";

const AddShows = () => {
  const { axios, getToken, user, image_base_url } = useAppContext();
  const currency = import.meta.env.VITE_CURRENCY;
  const [nowPlayingMovies, setNowPlayingMovies] = useState([]);
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

      const { data } = await axios.get("/api/shows/now-playing", {
        headers: {
          Authorization: `Bearer ${await getToken()}`
        }
      });

      if (data.success) {
        setNowPlayingMovies(data.movies);
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

      if (!selectedMovie || !showPrice || Object.keys(dateTimeSelection).length === 0) {
        toast("Please fill all fields");
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

      <p className="mt-10 text-lg font-medium">Now Playing Movies</p>

      <div className="overflow-x-auto pb-4">
        <div className="flex flex-wrap gap-4 mt-4 w-max">
          {nowPlayingMovies.map((movie) => (
            <div
              key={movie.id}
              className={`relative max-w-40 cursor-pointer
              hover:-translate-y-1 transition
              ${selectedMovie === movie.id ? "ring-2 ring-primary" : ""}`}
              onClick={() => setSelectedMovie(movie.id)}
            >
              <img
                src={image_base_url + movie.poster_path}
                alt={movie.title}
                className="rounded-lg brightness-90"
              />

              {selectedMovie === movie.id && (
                <div className="absolute top-2 right-2 bg-primary h-6 w-6 rounded-full flex items-center justify-center">
                  <CheckIcon className="w-4 h-4 text-white" />
                </div>
              )}

              <p className="font-medium p-2 truncate">
                {movie.title}
              </p>
              <p className="text-sm text-gray-400 px-2 pb-2">
                {movie.release_date}
              </p>
            </div>
          ))}
        </div>
      </div>

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
