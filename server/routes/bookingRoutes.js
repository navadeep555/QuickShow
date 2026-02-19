import express from "express";
import { requireAuth } from "@clerk/express";
import { createBooking, getOccupiedSeats, getUserBookings, verifyPayment, cancelBooking }
    from "../controllers/BookingController.js";

const bookingRouter = express.Router();

bookingRouter.post("/create", requireAuth(), createBooking);
bookingRouter.post("/verify", verifyPayment);
bookingRouter.get("/seats/:showId", getOccupiedSeats);
bookingRouter.get("/my-bookings", requireAuth(), getUserBookings);
bookingRouter.delete("/cancel/:bookingId", requireAuth(), cancelBooking);

export default bookingRouter;

