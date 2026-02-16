import express from "express";
import { createBooking, getOccupiedSeats, getUserBookings, verifyPayment }
    from "../controllers/BookingController.js";

const bookingRouter = express.Router();

bookingRouter.post("/create", createBooking);
bookingRouter.post("/verify", verifyPayment);
bookingRouter.get("/seats/:showId", getOccupiedSeats);
bookingRouter.get("/my-bookings", getUserBookings);

export default bookingRouter;
