import Show from "../models/Show.js";
import Booking from "../models/Booking.js";
import Stripe from "stripe";
import { inngest } from "../inngest/index.js";
import { getAuth } from "@clerk/express";
// Function to check availability of selected seats
const checkSeatsAvailability = async (showId, selectedSeats) => {
  const bookings = await Booking.find({ show: showId });
  const occupiedSeats = bookings.flatMap((b) => b.bookedSeats);
  const isAnySeatTaken = selectedSeats.some((seat) => occupiedSeats.includes(seat));
  return !isAnySeatTaken;
};

export const createBooking = async (req, res) => {
  try {
    const { userId } = getAuth(req);
    const { showId, seats: selectedSeats } = req.body;
    const origin = req.headers.origin || "http://localhost:5173";

    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized - Please login to book tickets",
      });
    }

    // Check availability
    const isAvailable = await checkSeatsAvailability(showId, selectedSeats);

    if (!isAvailable) {
      return res.json({
        success: false,
        message: "Selected Seats are not available.",
      });
    }

    // Get show details
    const showData = await Show.findById(showId).populate("movie");

    if (!showData) {
      return res.status(404).json({
        success: false,
        message: "Show not found",
      });
    }

    // Create booking
    const booking = await Booking.create({
      user: userId,
      show: showId,
      amount: showData.showPrice * selectedSeats.length,
      bookedSeats: selectedSeats,
    });

    const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);
    const line_items = [
      {
        price_data: {
          currency: "inr",
          product_data: {
            name: `Booking for ${showData.movie.title}`,
          },
          unit_amount: showData.showPrice * 100, // Convert to paise
        },
        quantity: selectedSeats.length,
      },
    ];
    const session = await stripeInstance.checkout.sessions.create({
      success_url: `${origin}/my-bookings?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/my-bookings`,
      line_items: line_items,
      mode: "payment",
      metadata: {
        bookingId: booking._id.toString(),
      },
      expires_at: Math.floor(Date.now() / 1000) + 30 * 60, // Session expires in 30 minutes
    })
    booking.paymentLink = session.url;
    await booking.save();
    await inngest.send({
      name: "app/checkpayment",
      data: {
        bookingId: booking._id.toString(),
      },
    })
    res.json({
      success: true,
      url: session.url,
    });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};
export const getOccupiedSeats = async (req, res) => {
  try {
    const { showId } = req.params;

    const showData = await Show.findById(showId);

    if (!showData) {
      return res.json({
        success: false,
        message: "Show not found",
      });
    }

    const bookings = await Booking.find({ show: showId });
    const occupiedSeats = bookings.flatMap((b) => b.bookedSeats);

    res.json({
      success: true,
      occupiedSeats,
    });

  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

export const getUserBookings = async (req, res) => {
  try {
    const { userId } = getAuth(req);

    const bookings = await Booking.find({ user: userId })
      .populate({
        path: "show",
        populate: [
          { path: "movie" },
          { path: "theatre" },
        ],
      })
      .sort({ createdAt: -1 });

    res.json({ success: true, bookings });
  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};
export const verifyPayment = async (req, res) => {
  try {
    const { sessionId } = req.body;
    const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);
    const session = await stripeInstance.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === "paid") {
      const { bookingId } = session.metadata;

      if (bookingId) {
        const booking = await Booking.findById(bookingId).populate({
          path: 'show',
          populate: { path: 'movie' }
        }).populate({ path: 'user' });

        if (booking && !booking.isPaid) {
          await Booking.findByIdAndUpdate(bookingId, {
            isPaid: true,
            paymentLink: "",
          });

          const movieTitle = booking.show?.movie?.title;
          const showDate = booking.show?.showDateTime ? new Date(booking.show.showDateTime).toLocaleDateString() : "";
          const showTime = booking.show?.showDateTime ? new Date(booking.show.showDateTime).toLocaleTimeString() : "";
          const userName = booking.user?.name;
          const userEmail = booking.user?.email;

          console.log(`Payment Verified. Sending event: app/show.booked for Booking: ${bookingId}`, {
            movieTitle, showDate, showTime, userName, userEmail
          });

          await inngest.send({
            name: "app/show.booked",
            data: {
              bookingId,
              movieTitle,
              showDate,
              showTime,
              userName,
              userEmail
            },
          });
        }
        return res.json({ success: true, message: "Payment verified" });
      }
    }

    res.json({ success: false, message: "Payment not verified" });

  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};
