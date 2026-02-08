import express from "express";
import cors from "cors";
import "dotenv/config";
import connectDB from "./configs/db.js";
import { serve } from "inngest/express";
import { inngest, functions } from "./inngest/index.js";

const app = express();

app.use(express.json());
app.use(cors());

// connect DB per invocation (cached)
app.use(async (req, res, next) => {
  await connectDB();
  next();
});

// ✅ PUBLIC ROUTE (NO CLERK)
app.get("/", (req, res) => {
  res.send("Server is running");
});

// ✅ INNGEST MUST BE PUBLIC
app.use("/api/inngest", serve({ client: inngest, functions }));

export default app;
