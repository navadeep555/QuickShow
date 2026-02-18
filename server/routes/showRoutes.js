import express from "express";
import { getNowPlayingMovies, addShow, getShow, getShows, getMovieTrailers, getFeaturedTrailers } from "../controllers/showController.js";
import { protectAdmin } from "../middleware/auth.js";

const showRouter = express.Router();

// 🎬 Now Playing Movies
showRouter.get("/now-playing", protectAdmin, getNowPlayingMovies);
showRouter.post("/add", protectAdmin, addShow);
showRouter.get('/all', getShows)
showRouter.get('/featured-trailers', getFeaturedTrailers)
showRouter.get('/trailers/:movieId', getMovieTrailers)
showRouter.get('/:movieId', getShow)

export default showRouter;
