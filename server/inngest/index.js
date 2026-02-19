import { Inngest } from "inngest";
import User from "../models/User.js";
import Booking from "../models/Booking.js";
import Show from "../models/Show.js";
import Movie from "../models/Movie.js";
import sendEmail from "../configs/nodeMailer.js";
import { clerkClient } from "@clerk/express";

export const inngest = new Inngest({
  id: "movie-ticket-booking",
});

/* ================= USER CREATED ================= */
export const syncUserCreation = inngest.createFunction(
  { id: "sync-user-from-clerk" },
  { event: "clerk/user.created" },
  async ({ event }) => {
    const { id, first_name, last_name, email_addresses, image_url } = event.data;

    const userData = {
      _id: id,
      name: `${first_name ?? ""} ${last_name ?? ""}`.trim(),
      email: email_addresses[0].email_address,
      image: image_url,
    };

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
    const { id, first_name, last_name, email_addresses, image_url } = event.data;

    const userData = {
      name: `${first_name ?? ""} ${last_name ?? ""}`.trim(),
      email: email_addresses[0].email_address,
      image: image_url,
    };

    await User.findByIdAndUpdate(id, userData, { new: true });
  }
);

/* ================= USER DELETED ================= */
export const syncUserDeletion = inngest.createFunction(
  { id: "delete-user-with-clerk" },
  { event: "clerk/user.deleted" },
  async ({ event }) => {
    await User.findByIdAndDelete(event.data.id);
  }
);

/* ================= RELEASE SEATS ================= */
const releaseSeatsAndDeleteBooking = inngest.createFunction(
  { id: "release-seats-delete-booking" },
  { event: "app/checkpayment" },
  async ({ event, step }) => {

    const tenMinutesLater = new Date(Date.now() + 10 * 60 * 1000);
    await step.sleepUntil("wait-for-10-minutes", tenMinutesLater);

    await step.run("check-payment-status", async () => {
      const booking = await Booking.findById(event.data.bookingId);

      if (booking && !booking.isPaid) {
        console.log(`Auto-releasing seats for unpaid booking: ${booking._id}`);
        await Booking.findByIdAndDelete(booking._id);
      }
    });
  }
);

/* ================= BOOKING CONFIRMATION EMAIL ================= */
const sendBookingConfirmationEmail = inngest.createFunction(
  { id: "send-booking-confirmation-email" },
  { event: "app/show.booked" },
  async ({ event }) => {

    const { bookingId } = event.data;

    const booking = await Booking.findById(bookingId)
      .populate({
        path: "show",
        populate: [
          { path: "movie" },
          { path: "theatre" },
        ],
      })
      .populate("user");

    if (!booking || !booking.show) return;

    // If user not in MongoDB, fallback to Clerk
    let recipientEmail = booking.user?.email;
    let recipientName = booking.user?.name || "Customer";
    if (!recipientEmail && booking.userId) {
      try {
        const clerkUser = await clerkClient.users.getUser(booking.userId);
        recipientEmail = clerkUser.emailAddresses[0]?.emailAddress;
        recipientName = `${clerkUser.firstName} ${clerkUser.lastName}`.trim() || "Customer";
      } catch (e) {
        console.error("Could not fetch user from Clerk:", e.message);
      }
    }

    // Also try using the user field as a string ID (Clerk ID stored as string)
    if (!recipientEmail && typeof booking.user === "string") {
      try {
        const clerkUser = await clerkClient.users.getUser(booking.user);
        recipientEmail = clerkUser.emailAddresses[0]?.emailAddress;
        recipientName = `${clerkUser.firstName} ${clerkUser.lastName}`.trim() || "Customer";
      } catch (e) {
        console.error("Could not fetch user from Clerk (string id):", e.message);
      }
    }

    if (!recipientEmail) {
      console.error("No recipient email found for booking", bookingId);
      return;
    }
    const movieTitle = booking.show.movie?.title || "Unknown Movie";
    const theatreName = booking.show.theatre?.name || "";
    const theatreAddress = booking.show.theatre?.address || "";
    const theatreCity = booking.show.theatre?.city || "";
    const theatreInfo = [theatreName, theatreAddress, theatreCity].filter(Boolean).join(", ");

    const showDateObj = new Date(booking.show.showDateTime);

    const formattedDate = showDateObj.toLocaleDateString("en-IN", {
      timeZone: "Asia/Kolkata",
      day: "numeric",
      month: "long",
      year: "numeric",
    });

    const formattedTime = showDateObj.toLocaleTimeString("en-IN", {
      timeZone: "Asia/Kolkata",
      hour: "2-digit",
      minute: "2-digit",
    });

    await sendEmail({
      to: recipientEmail,
      subject: `🎬 Booking Confirmation - ${movieTitle}`,
      body: `
        <div style="font-family: Arial; line-height:1.6;">
          <h2 style="color:#e11d48;">Booking Confirmed!</h2>

          <p>Hi <strong>${recipientName}</strong>,</p>

          <p>Your booking for <strong>${movieTitle}</strong> is confirmed.</p>

          <div style="background:#f4f4f4; padding:15px; border-radius:8px;">
            <p><strong>📅 Show Date:</strong> ${formattedDate}</p>
            <p><strong>⏰ Show Time:</strong> ${formattedTime}</p>
            ${theatreInfo ? `<p><strong>🎭 Theatre:</strong> ${theatreInfo}</p>` : ""}
          </div>

          <p>Please arrive 15 minutes early.</p>

          <p>Enjoy your movie! 🍿</p>
        </div>
      `,
    });

    console.log("✅ Booking confirmation email sent");
  }
);

/* ================= SHOW REMINDERS (CRON) ================= */
const sendShowReminders = inngest.createFunction(
  { id: "send-show-reminders" },
  { cron: "0 */8 * * *" }, // Every 8 hours
  async ({ step }) => {

    const now = new Date();
    const in8Hours = new Date(now.getTime() + 8 * 60 * 60 * 1000);
    const windowStart = new Date(in8Hours.getTime() - 10 * 60 * 1000);

    const reminderTasks = await step.run("prepare-reminder-tasks", async () => {

      const shows = await Show.find({
        showDateTime: { $gte: windowStart, $lte: in8Hours },
      }).populate("movie");

      const tasks = [];

      for (const show of shows) {

        const bookings = await Booking.find({
          show: show._id,
          isPaid: true,
        }).populate("user");

        for (const booking of bookings) {
          if (!booking.user?.email) continue;

          tasks.push({
            userEmail: booking.user.email,
            userName: booking.user.name,
            movieTitle: show.movie.title,
            showDateTime: show.showDateTime,
          });
        }
      }

      return tasks;
    });

    if (reminderTasks.length === 0) {
      return { sent: 0, message: "No reminders to send." };
    }

    const results = await step.run("send-all-reminders", async () => {
      return await Promise.allSettled(
        reminderTasks.map(task => {

          const showDateObj = new Date(task.showDateTime);

          const formattedDate = showDateObj.toLocaleDateString("en-IN", {
            timeZone: "Asia/Kolkata",
          });

          const formattedTime = showDateObj.toLocaleTimeString("en-IN", {
            timeZone: "Asia/Kolkata",
          });

          return sendEmail({
            to: task.userEmail,
            subject: `🎬 Reminder: ${task.movieTitle} starts soon!`,
            body: `
              <div style="font-family: Arial;">
                <h2>Movie Reminder 🍿</h2>
                <p>Hi ${task.userName},</p>
                <p>Your movie <strong>${task.movieTitle}</strong> starts soon!</p>
                <p><strong>Date:</strong> ${formattedDate}</p>
                <p><strong>Time:</strong> ${formattedTime}</p>
                <p>Please arrive 15 minutes early.</p>
              </div>
            `
          });

        })
      );
    });

    const sent = results.filter(r => r.status === "fulfilled").length;
    const failed = results.length - sent;

    return {
      sent,
      failed,
      message: `Sent ${sent} reminder(s), ${failed} failed.`,
    };
  }
);

/* ================= NEW SHOW NOTIFICATIONS ================= */

const sendNewShowNotifications = inngest.createFunction(
  { id: "send-new-show-notifications" },
  { event: "app/show.added" },
  async ({ event }) => {

    const { movieTitle } = event.data;

    // Get all users
    const users = await User.find({});

    for (const user of users) {

      const userEmail = user.email;
      const userName = user.name;

      const subject = `🎬 New Show Added: ${movieTitle}`;

      const body = `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2>Hi ${userName},</h2>

          <p>We've just added a new show to our library!</p>

          <h3 style="color: #F84565;">${movieTitle}</h3>

          <p>Visit our website to book your tickets now 🎟️</p>

          <br/>

          <p>Thanks,<br/>QuickShow Team</p>
        </div>
      `;

      await sendEmail({
        to: userEmail,
        subject,
        body,
      });
    }

    return { message: "Notifications sent." };
  }
);


/* ================= EXPORT ================= */
export const functions = [
  syncUserCreation,
  syncUserUpdation,
  syncUserDeletion,
  releaseSeatsAndDeleteBooking,
  sendBookingConfirmationEmail,
  sendShowReminders,
  sendNewShowNotifications
];
