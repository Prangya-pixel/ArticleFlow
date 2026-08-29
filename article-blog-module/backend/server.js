const dns = require("dns");
dns.setServers(["8.8.8.8", "1.1.1.1"]);

const articleRoutes = require("./routes/articleRoutes");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const userRoutes = require("./routes/userRoutes");
require("dotenv").config();

require("./models/User");
const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use("/api/articles", articleRoutes);
app.use("/api/users", userRoutes);

// MongoDB connection
mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully");
  })
  .catch((error) => {
    console.error("MongoDB connection failed:", error.message);
  });

// Test route
app.get("/", (req, res) => {
  res.send("Content Management System Backend is running");
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});