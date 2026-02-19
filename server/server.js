import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import connectDB from './configs/db.js';
import { clerkMiddleware } from '@clerk/express'
import { serve } from "inngest/express";
import { inngest, functions } from "./inngest/index.js";
import showRouter from './routes/showRoutes.js';
import bookingRouter from './routes/bookingRoutes.js';
import adminRouter from './routes/adminRoutes.js';
import userRouter from './routes/userRoutes.js';
import theatreRouter from './routes/theatreRoutes.js';
import { stripeWebhooks } from './controllers/stripeWebhooks.js';
import { clerkWebhooks } from './controllers/clerkWebhooks.js';
const app = express();
const port = 3000;
await connectDB()

//stripe webhook route
//stripe webhook route
app.use("/api/stripe", express.raw({ type: "application/json" }), stripeWebhooks);

//clerk webhook route
app.use('/api/webhooks/clerk', express.json(), clerkWebhooks)

//Middlewares
app.use(express.json());
app.use(cors());
app.use(clerkMiddleware())


//Routes
app.get('/', (req, res) => {
    res.send('Server is running');
});
app.use("/api/inngest", serve({ client: inngest, functions }));
app.use("/api/shows", showRouter);
app.use("/api/bookings", bookingRouter);
app.use("/api/admin", adminRouter);
app.use("/api/user", userRouter);
app.use("/api/theatres", theatreRouter);
app.listen(port, () => {
    console.log(`Server listening at http://localhost:${port}`);
}); 