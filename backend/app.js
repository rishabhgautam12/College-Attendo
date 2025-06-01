import dotenv from "dotenv";

import express from "express";
import cors from "cors";
import mongoose from "mongoose";
import bodyParser from "body-parser";
import cookieParser from "cookie-parser";
import userRoutes from "./routes/userRoutes.js";
import SessionRoutes from "./routes/SessionRoutes.js";
dotenv.config();

// Initialize the app
const app = express();
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB;
// Middleware
app.use(cors({
  origin: "https://college-attendo.vercel.app",
  methods: ["GET", "POST"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));



app.use(cookieParser());
// app.use(express.json());

app.use(express.json({ limit: "50mb" }));
app.use(express.static("public"));
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
);
app.use("/uploads", express.static("uploads"));

// app.use((req, res, next) => {
//   console.log(`[${req.method}] ${req.url}`);
//   console.log("Headers:", req.headers);
//   console.log("Body:", req.body);
//   next();
// });
// Connect to MongoDB
mongoose
  .connect(MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => {
    console.log("Database Connected");
  })
  .catch((err) => console.log(err));

// Routes
app.use("/users", userRoutes);
app.use("/sessions", SessionRoutes);

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
