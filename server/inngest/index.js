import { Inngest } from "inngest";
import User from "../models/User.js";
import Booking from "../models/Booking.js";
import Show from "../models/Show.js";

export const inngest = new Inngest({
  id: "movie-ticket-booking",
});

/* ================= USER CREATED ================= */
export const syncUserCreation = inngest.createFunction(
  { id: "sync-user-from-clerk" },
  { event: "clerk/user.created" },
  async ({ event }) => {
    const {
      id,
      first_name,
      last_name,
      email_addresses,
      image_url,
    } = event.data;

    const userData = {
      _id: id,
      name: `${first_name ?? ""} ${last_name ?? ""}`.trim(),
      email: email_addresses[0].email_address,
      image: image_url,
    };

    // Upsert = safe for retries
    await User.findByIdAndUpdate(id, userData, {
      upsert: true,
      new: true,
      setDefaultsOnInsert: true,
    });
  }
);

/* ================= USER UPDATED ================= */
export const syncUserUpdation = inngest.createFunction(
  { id: "update-user-from-clerk" },
  { event: "clerk/user.updated" },
  async ({ event }) => {
    const {
      id,
      first_name,
      last_name,
      email_addresses,
      image_url,
    } = event.data;

    const userData = {
      name: `${first_name ?? ""} ${last_name ?? ""}`.trim(),
      email: email_addresses[0].email_address,
      image: image_url,
    };

    await User.findByIdAndUpdate(id, userData, {
      new: true,
    });
  }
);

/* ================= USER DELETED ================= */
export const syncUserDeletion = inngest.createFunction(
  { id: "delete-user-with-clerk" },
  { event: "clerk/user.deleted" },
  async ({ event }) => {
    const { id } = event.data;
    await User.findByIdAndDelete(id);
  }
);
/* Inngest functions */
const releaseSeatsAndDeleteBooking = inngest.createFunction(
  { id: 'release-seats-delete-booking' },
  { event: "app/checkpayment" },
  async ({ event, step }) => {

    const tenMinutesLater = new Date(Date.now() + 10 * 60 * 1000);
    await step.sleepUntil('wait-for-10-minutes', tenMinutesLater);

    await step.run('check-payment-status', async () => {

      const bookingId = event.data.bookingId;
      const booking = await Booking.findById(bookingId);

      // If payment is not made, delete booking to release seats dynamically
      if (booking && !booking.isPaid) {
        await Booking.findByIdAndDelete(bookingId);
      }
    })
  }
)

/* ================= EXPORT ================= */
export const functions = [
  syncUserCreation,
  syncUserUpdation,
  syncUserDeletion,
  releaseSeatsAndDeleteBooking
];
