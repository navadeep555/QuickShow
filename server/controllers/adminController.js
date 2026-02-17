import Booking from "../models/Booking.js";
import Show from "../models/Show.js";
import User from "../models/User.js";


// API to check if user is admin
export const isAdmin = async (req, res) => {
  res.json({ success: true, isAdmin: true });
};


// API to get dashboard data
export const getDashboardData = async (req, res) => {
  try {
    const bookings = await Booking.find({ isPaid: true });

    const activeShows = await Show.find({
      showDateTime: { $gte: new Date() },
    }).populate("movie");

    const totalUser = await User.countDocuments();

    const dashboardData = {
      totalBookings: bookings.length,
      totalRevenue: bookings.reduce(
        (acc, booking) => acc + booking.amount,
        0
      ),
      activeShows,
      totalUser,
    };

    res.json({ success: true, dashboardData });

  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};


// API to get all shows
export const getAllShows = async (req, res) => {
  try {
    console.log("Admin getAllShows HIT");
    const shows = await Show.find({
      showDateTime: { $gte: new Date() },
    })
      .populate("movie")
      .sort({ showDateTime: 1 });

    const showsWithSeats = await Promise.all(
      shows.map(async (show) => {
        const bookings = await Booking.find({ show: show._id });
        const occupiedSeats = bookings.flatMap((booking) => booking.bookedSeats);
        return { ...show.toObject(), occupiedSeats };
      })
    );

    res.json({ success: true, shows: showsWithSeats });

  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};


// API to get all bookings
export const getAllBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({})
      .populate({
        path: "user",
      })
      .populate({
        path: "show",
        populate: { path: "movie" },
      })
      .sort({ createdAt: -1 });

    res.json({ success: true, bookings });

  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};
