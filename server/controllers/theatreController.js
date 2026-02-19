import Theatre from "../models/Theatre.js";
import Show from "../models/Show.js";
import Movie from "../models/Movie.js";

// Add a new theatre (Admin)
export const addTheatre = async (req, res) => {
    try {
        const { name, city, address, totalSeats } = req.body;

        if (!name || !city || !address) {
            return res.status(400).json({ success: false, message: "name, city and address are required" });
        }

        const theatre = await Theatre.create({
            name,
            city,
            address,
            totalSeats: totalSeats || 90,
        });

        res.status(201).json({ success: true, message: "Theatre added successfully", theatre });
    } catch (error) {
        console.error("ADD THEATRE ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get all active theatres (Public)
export const getAllTheatres = async (req, res) => {
    try {
        const theatres = await Theatre.find({ isActive: true }).sort({ city: 1, name: 1 });
        res.setHeader('Cache-Control', 'no-store');
        res.json({ success: true, theatres });
    } catch (error) {
        console.error("GET THEATRES ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get ALL theatres including inactive (Admin)
export const getAllTheatresAdmin = async (req, res) => {
    try {
        const theatres = await Theatre.find({}).sort({ city: 1, name: 1 });
        res.setHeader('Cache-Control', 'no-store');
        res.json({ success: true, theatres });
    } catch (error) {
        console.error("GET THEATRES ADMIN ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Delete a theatre (Admin)
export const deleteTheatre = async (req, res) => {
    try {
        const { id } = req.params;
        const theatre = await Theatre.findByIdAndDelete(id);
        if (!theatre) {
            return res.status(404).json({ success: false, message: "Theatre not found" });
        }
        res.json({ success: true, message: "Theatre deleted successfully" });
    } catch (error) {
        console.error("DELETE THEATRE ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Toggle theatre active/inactive (Admin)
export const toggleTheatreStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const theatre = await Theatre.findById(id);
        if (!theatre) {
            return res.status(404).json({ success: false, message: "Theatre not found" });
        }
        theatre.isActive = !theatre.isActive;
        await theatre.save();
        res.json({
            success: true,
            message: `Theatre ${theatre.isActive ? "activated" : "deactivated"} successfully`,
            theatre,
        });
    } catch (error) {
        console.error("TOGGLE THEATRE ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};

// Get unique movies currently showing at a specific theatre (Public)
export const getTheatreShows = async (req, res) => {
    try {
        const { id } = req.params;
        const now = new Date();

        // Find all future shows at this theatre
        const shows = await Show.find({
            theatre: id,
            showDateTime: { $gte: now },
        }).populate("movie");

        // Deduplicate movies
        const movieMap = {};
        shows.forEach((show) => {
            if (show.movie && !movieMap[show.movie._id]) {
                movieMap[show.movie._id] = show.movie;
            }
        });

        const movies = Object.values(movieMap);
        res.json({ success: true, movies });
    } catch (error) {
        console.error("GET THEATRE SHOWS ERROR:", error);
        res.status(500).json({ success: false, message: error.message });
    }
};
