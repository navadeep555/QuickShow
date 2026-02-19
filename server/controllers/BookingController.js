import Show from "../models/Show.js";
import Booking from "../models/Booking.js";
import Stripe from "stripe";
import { inngest } from "../inngest/index.js";
import { getAuth, clerkClient } from "@clerk/express";
import User from "../models/User.js";
// Function to check availability of selected seats
const checkSeatsAvailability = async (showId, selectedSeats) => {
  const bookings = await Booking.find({ show: showId, isCancelled: { $ne: true } });
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

    // Lazy Sync: Ensure user exists in MongoDB
    let user = await User.findById(userId);
    if (!user) {
      try {
        const clerkUser = await clerkClient.users.getUser(userId);
        user = await User.create({
          _id: clerkUser.id,
          name: `${clerkUser.firstName} ${clerkUser.lastName}`.trim(),
          email: clerkUser.emailAddresses[0].emailAddress,
          image: clerkUser.imageUrl,
        });
        console.log("Lazy synced user:", user._id);
      } catch (error) {
        console.error("Error lazy syncing user:", error.message);
        // Continue but might fail populated queries
      }
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

    const bookings = await Booking.find({ show: showId, isCancelled: { $ne: true } });
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
            stripeSessionId: sessionId,
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

export const cancelBooking = async (req, res) => {
  try {
    const { userId } = getAuth(req);
    const { bookingId } = req.params;

    const booking = await Booking.findById(bookingId).populate({
      path: "show",
      populate: [{ path: "movie" }, { path: "theatre" }],
    }).populate("user");

    if (!booking) {
      return res.status(404).json({ success: false, message: "Booking not found" });
    }

    if (booking.user?._id?.toString() !== userId && booking.user !== userId) {
      return res.status(403).json({ success: false, message: "Unauthorized" });
    }

    if (!booking.isPaid) {
      // Just mark unpaid booking as cancelled — no refund needed
      await Booking.findByIdAndUpdate(bookingId, { isCancelled: true, cancelledAt: new Date() });
      return res.json({ success: true, message: "Booking cancelled" });
    }

    // Issue Stripe refund using stored session ID
    const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);
    let refunded = false;

    if (booking.stripeSessionId) {
      const session = await stripeInstance.checkout.sessions.retrieve(booking.stripeSessionId);
      if (session.payment_intent) {
        await stripeInstance.refunds.create({ payment_intent: session.payment_intent });
        refunded = true;
      }
    }

    // Soft-delete: mark as cancelled in DB (keeps history, releases seats)
    await Booking.findByIdAndUpdate(bookingId, {
      isCancelled: true,
      cancelledAt: new Date(),
      refundAmount: refunded ? booking.amount : 0,
    });

    // Send cancellation email via Inngest
    await inngest.send({
      name: "app/booking.cancelled",
      data: {
        userId: booking.user?._id || booking.user,
        bookingId: bookingId,
        movieTitle: booking.show?.movie?.title || "Unknown Movie",
        theatreName: booking.show?.theatre?.name || "",
        theatreCity: booking.show?.theatre?.city || "",
        showDateTime: booking.show?.showDateTime,
        amount: booking.amount,
        seats: booking.bookedSeats,
        refunded,
      },
    });

    res.json({ success: true, message: refunded ? "Booking cancelled and refund initiated" : "Booking cancelled" });

  } catch (error) {
    console.log(error.message);
    res.json({ success: false, message: error.message });
  }
};

