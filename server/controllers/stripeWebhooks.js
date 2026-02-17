import Stripe from "stripe";
import Booking from "../models/Booking.js";
import { inngest } from "../inngest/index.js";

export const stripeWebhooks = async (request, response) => {
  const stripeInstance = new Stripe(process.env.STRIPE_SECRET_KEY);
  const sig = request.headers["stripe-signature"];

  let event;

  try {
    event = stripeInstance.webhooks.constructEvent(
      request.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (error) {
    return response.status(400).send(`Webhook Error: ${error.message}`);
  }

  try {
    console.log("Stripe Webhook Event:", event.type);
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object;
        const { bookingId } = session.metadata;
        console.log("Booking ID from metadata:", bookingId);

        if (bookingId) {
          const booking = await Booking.findById(bookingId).populate({
            path: 'show',
            model: 'Show',
            populate: { path: 'movie', model: 'Movie' }
          }).populate({ path: 'user', model: 'User' });

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

            console.log(`Payment via Webhook Verified. Sending event: app/show.booked for Booking: ${bookingId}`, {
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
            console.log("Updated Booking Status for:", bookingId, "via Webhook");
          } else {
            console.log("Booking already marked as paid:", bookingId);
          }
        }

        break;
      }

      default:
        console.log("Unhandled event type:", event.type);
    }

    response.json({ received: true });
  } catch (err) {
    console.error("Webhook processing error:", err);
    response.status(500).send("Internal Server Error");
  }
};
