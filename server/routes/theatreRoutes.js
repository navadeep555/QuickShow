import express from "express";
import {
    addTheatre,
    getAllTheatres,
    getAllTheatresAdmin,
    deleteTheatre,
    toggleTheatreStatus,
    getTheatreShows,
} from "../controllers/theatreController.js";
import { protectAdmin } from "../middleware/auth.js";

const theatreRouter = express.Router();

theatreRouter.post("/add", protectAdmin, addTheatre);
theatreRouter.get("/all", getAllTheatres);
theatreRouter.get("/admin/all", protectAdmin, getAllTheatresAdmin);
theatreRouter.get("/:id/shows", getTheatreShows);
theatreRouter.delete("/:id", protectAdmin, deleteTheatre);
theatreRouter.patch("/:id/toggle", protectAdmin, toggleTheatreStatus);

export default theatreRouter;
