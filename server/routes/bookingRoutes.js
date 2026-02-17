import express from "express";
import { requireAuth } from "@clerk/express";
import { createBooking, getOccupiedSeats, getUserBookings, verifyPayment }
    from "../controllers/BookingController.js";

const bookingRouter = express.Router();

bookingRouter.post("/create", requireAuth(), createBooking);
bookingRouter.post("/verify", verifyPayment);
bookingRouter.get("/seats/:showId", getOccupiedSeats);
bookingRouter.get("/my-bookings", requireAuth(), getUserBookings);

export default bookingRouter;
