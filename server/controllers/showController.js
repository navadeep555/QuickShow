import axios from "axios";
import Movie from "../models/Movie.js";
import Show from "../models/Show.js";
import { inngest } from "../inngest/index.js";

// 🎬 Get Now Playing Movies (All Industries - properly filtered by language)
export const getNowPlayingMovies = async (req, res) => {
  try {
    const headers = {
      Authorization: `Bearer ${process.env.TMDB_TOKEN}`,
      Accept: "application/json",
    };

    // Date range for "now playing" — last 90 days to today
    const today = new Date().toISOString().split("T")[0];
    const past90 = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

    // Hollywood: use now_playing (most reliable for English)
    const hollywoodPromise = axios.get("https://api.themoviedb.org/3/movie/now_playing", {
      headers,
      params: { language: "en-US", region: "US" },
    }).then(r => ({ name: "Hollywood", movies: r.data.results }))
      .catch(() => ({ name: "Hollywood", movies: [] }));

    // Indian industries: use discover with strict language filter
    const indianLanguages = [
      { code: "hi", name: "Bollywood" },
      { code: "te", name: "Tollywood" },
      { code: "ta", name: "Kollywood" },
      { code: "ml", name: "Mollywood" },
      { code: "kn", name: "Sandalwood" },
      { code: "bn", name: "Bengali" },
    ];

    const indianPromises = indianLanguages.map(({ code, name }) =>
      axios.get("https://api.themoviedb.org/3/discover/movie", {
        headers,
        params: {
          with_original_language: code,
          "primary_release_date.gte": past90,
          "primary_release_date.lte": today,
          sort_by: "popularity.desc",
          "vote_count.gte": 3,
        },
      })
        .then(r => ({ name, movies: r.data.results }))
        .catch(() => ({ name, movies: [] }))
    );

    const allResults = await Promise.all([hollywoodPromise, ...indianPromises]);

    // Only include industries that have movies
    const industries = allResults.filter(g => g.movies.length > 0);

    res.json({ success: true, industries });
  } catch (error) {
    console.error("NOW PLAYING ERROR:", error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: "Failed to fetch now playing movies",
    });
  }
};

// � Get Featured Trailers for Home Page (1 per industry)
export const getFeaturedTrailers = async (req, res) => {
  try {
    const headers = {
      Authorization: `Bearer ${process.env.TMDB_TOKEN}`,
      Accept: "application/json",
    };

    const past90 = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
    const today = new Date().toISOString().split("T")[0];

    const industries = [
      { code: "en", name: "Hollywood", region: "US" },
      { code: "te", name: "Tollywood" },
      { code: "hi", name: "Bollywood" },
      { code: "ta", name: "Kollywood" },
      { code: "ml", name: "Mollywood" },
    ];

    const trailers = await Promise.all(
      industries.map(async ({ code, name, region }) => {
        try {
          // Get the most popular recent movie for this language
          const discoverParams = {
            with_original_language: code,
            sort_by: "popularity.desc",
            "vote_count.gte": 5,
          };
          if (code === "en") {
            // For Hollywood use now_playing
            const npRes = await axios.get("https://api.themoviedb.org/3/movie/now_playing", {
              headers, params: { language: "en-US", region: "US" },
            });
            const movie = npRes.data.results[0];
            if (!movie) return null;

            // Fetch its trailer
            const vidRes = await axios.get(`https://api.themoviedb.org/3/movie/${movie.id}/videos`, {
              headers, params: { include_video_language: "en" },
            });
            const trailer = vidRes.data.results.find(v => v.site === "YouTube" && v.type === "Trailer")
              || vidRes.data.results.find(v => v.site === "YouTube");
            if (!trailer) return null;

            return {
              industry: name,
              movieTitle: movie.title,
              poster: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
              thumbnail: `https://img.youtube.com/vi/${trailer.key}/maxresdefault.jpg`,
              key: trailer.key,
            };
          } else {
            const discRes = await axios.get("https://api.themoviedb.org/3/discover/movie", {
              headers,
              params: {
                ...discoverParams,
                "primary_release_date.gte": past90,
                "primary_release_date.lte": today,
              },
            });
            const movie = discRes.data.results[0];
            if (!movie) return null;

            // Fetch its trailer
            const vidRes = await axios.get(`https://api.themoviedb.org/3/movie/${movie.id}/videos`, {
              headers, params: { include_video_language: `${code},en` },
            });
            const trailer = vidRes.data.results.find(v => v.site === "YouTube" && v.type === "Trailer")
              || vidRes.data.results.find(v => v.site === "YouTube");
            if (!trailer) return null;

            return {
              industry: name,
              movieTitle: movie.title,
              poster: `https://image.tmdb.org/t/p/w500${movie.poster_path}`,
              thumbnail: `https://img.youtube.com/vi/${trailer.key}/maxresdefault.jpg`,
              key: trailer.key,
            };
          }
        } catch {
          return null;
        }
      })
    );

    // Filter out nulls (industries where no trailer was found)
    res.json({ success: true, trailers: trailers.filter(Boolean) });
  } catch (error) {
    console.error("FEATURED TRAILERS ERROR:", error.response?.data || error.message);
    res.status(500).json({ success: false, message: "Failed to fetch featured trailers" });
  }
};

// �🎟️ Add Show (Admin)
export const addShow = async (req, res) => {
  try {
    const { movieID, showInput, showPrice } = req.body;

    console.log("ADD SHOW REQ BODY:", JSON.stringify(req.body, null, 2));

    if (!movieID || !showInput || !showPrice) {
      return res.status(400).json({
        success: false,
        message: "movieID, showInput and showPrice are required",
      });
    }

    let movie = await Movie.findOne({ tmdbId: movieID });

    // 🔹 Fetch movie from TMDB if not exists
    if (!movie) {
      console.log(`Fetching details for movie ID: ${movieID}`);
      const detailsRes = await axios.get(`https://api.themoviedb.org/3/movie/${movieID}`, {
        headers: {
          Authorization: `Bearer ${process.env.TMDB_TOKEN}`,
          Accept: "application/json",
        },
      });
      console.log("Details fetched");

      const creditsRes = await axios.get(`https://api.themoviedb.org/3/movie/${movieID}/credits`, {
        headers: {
          Authorization: `Bearer ${process.env.TMDB_TOKEN}`,
          Accept: "application/json",
        },
      });
      console.log("Credits fetched");

      const details = detailsRes.data;
      const credits = creditsRes.data;

      movie = await Movie.create({
        tmdbId: movieID,
        title: details.title,
        overview: details.overview,
        poster_path: details.poster_path,
        backdrop_path: details.backdrop_path,
        genres: details.genres,
        casts: credits.cast,
        release_date: details.release_date,
        original_language: details.original_language,
        tagline: details.tagline || "",
        vote_average: details.vote_average,
        runtime: details.runtime,
      });
    }

    // 🔹 Create shows
    const showsToCreate = [];

    showInput.forEach((show) => {
      show.time.forEach((time) => {
        showsToCreate.push({
          movie: movie._id,
          showDateTime: new Date(`${show.date}T${time}`),
          showPrice,
        });
      });
    });

    await Show.insertMany(showsToCreate);
    await inngest.send({
      name: "app/show.added",
      data: { movieTitle: movie.title }
    });

    res.status(201).json({
      success: true,
      message: "Show added successfully",
    });
  } catch (error) {
    console.error("ADD SHOW ERROR:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// API to get all shows from the database
export const getShows = async (req, res) => {
  try {
    const shows = await Show.find({
      showDateTime: { $gte: new Date() }
    })
      .populate("movie")
      .sort({ showDateTime: 1 });

    // filter unique shows by movie ID
    const uniqueMovies = {};
    shows.forEach(show => {
      if (show.movie && !uniqueMovies[show.movie._id]) {
        uniqueMovies[show.movie._id] = show.movie;
      }
    });

    res.json({ success: true, shows: Object.values(uniqueMovies) });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

// 🎬 Get Movie Trailers from TMDB
export const getMovieTrailers = async (req, res) => {
  try {
    const { movieId } = req.params;

    // Look up the movie to get its tmdbId
    const movie = await Movie.findById(movieId);
    if (!movie) {
      return res.status(404).json({ success: false, message: "Movie not found" });
    }

    const { data } = await axios.get(
      `https://api.themoviedb.org/3/movie/${movie.tmdbId}/videos`,
      {
        headers: {
          Authorization: `Bearer ${process.env.TMDB_TOKEN}`,
          Accept: "application/json",
        },
        params: {
          // Include English + all major Indian languages so regional trailers are returned
          include_video_language: "en,hi,te,ta,ml,kn,bn",
        },
      }
    );

    // Filter only YouTube trailers/teasers, official trailers first
    const trailers = data.results
      .filter((v) => v.site === "YouTube" && (v.type === "Trailer" || v.type === "Teaser"))
      .sort((a, b) => {
        if (a.type === "Trailer" && b.type !== "Trailer") return -1;
        if (a.type !== "Trailer" && b.type === "Trailer") return 1;
        return 0;
      });

    res.json({ success: true, trailers });
  } catch (error) {
    console.error("TRAILERS ERROR:", error.response?.data || error.message);
    res.status(500).json({ success: false, message: "Failed to fetch trailers" });
  }
};

// API to get a single show from the database
export const getShow = async (req, res) => {
  try {
    const { movieId } = req.params;

    // get all upcoming shows for the movie
    const shows = await Show.find({
      movie: movieId,
      showDateTime: { $gte: new Date() }
    });

    const movie = await Movie.findById(movieId);
    const dateTime = {};

    shows.forEach((show) => {
      const date = show.showDateTime.toISOString().split("T")[0];

      if (!dateTime[date]) {
        dateTime[date] = [];
      }

      dateTime[date].push({
        time: show.showDateTime,
        showId: show._id
      });
    });

    res.json({ success: true, movie, dateTime });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

