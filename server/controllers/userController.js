import { clerkClient } from "@clerk/express";
import Booking from "../models/Booking.js";
import Movie from "../models/Movie.js";


// ==============================================
// 1️⃣ Get User Bookings
// ==============================================
export const getUserBookings = async (req, res) => {
  try {
    const userId = req.auth().userId;

    const bookings = await Booking.find({ user: userId })
      .populate({
        path: "show",
        populate: { path: "movie" },
      })
      .sort({ createdAt: -1 });

    res.json({ success: true, bookings });

  } catch (error) {
    console.error(error.message);
    res.json({ success: false, message: error.message });
  }
};


// ==============================================
// 2️⃣ Update Favorite Movie (Add/Remove Toggle)
// ==============================================
export const updateFavorite = async (req, res) => {
  try {
    const { movieId } = req.body;
    const userId = req.auth().userId;

    const user = await clerkClient.users.getUser(userId);

    if (!user.privateMetadata.favorites) {
      user.privateMetadata.favorites = [];
    }

    if (!user.privateMetadata.favorites.includes(movieId)) {
      // ADD movie
      user.privateMetadata.favorites.push(movieId);
    } else {
      // REMOVE movie
      user.privateMetadata.favorites =
        user.privateMetadata.favorites.filter(
          (item) => item !== movieId
        );
    }

    await clerkClient.users.updateUserMetadata(userId, {
      privateMetadata: user.privateMetadata,
    });

    res.json({
      success: true,
      message: "Favorite movies updated",
    });

  } catch (error) {
    console.error(error.message);
    res.json({ success: false, message: error.message });
  }
};


// ==============================================
// 3️⃣ Get Favorite Movies
// ==============================================
export const getFavorites = async (req, res) => {
  try {
    const userId = req.auth().userId;

    const user = await clerkClient.users.getUser(userId);

    const favorites = user.privateMetadata.favorites || [];

    const movies = await Movie.find({
      _id: { $in: favorites },
    });

    res.json({ success: true, movies });

  } catch (error) {
    console.error(error.message);
    res.json({ success: false, message: error.message });
  }
};
