const dns = require("dns");

dns.setServers(["8.8.8.8", "1.1.1.1"]);

require("dotenv").config();

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const articleRoutes = require("./routes/articleRoutes");
const quizRoutes = require("./routes/quizRoutes");
const userRoutes = require("./routes/userRoutes");

require("./models/User");
require("./models/Article");

const app = express();

app.use(cors());
app.use(express.json());

// IMPORTANT:
// Quiz routes must come BEFORE article routes
// so /generate-quiz is not treated as /:id.
app.use("/api", quizRoutes);

app.use("/api/articles", articleRoutes);
app.use("/api/users", userRoutes);

app.get("/", (req, res) => {
  res.json({
    message: "Content Management System Backend is running",
  });
});

const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB connected successfully");

    const server = app.listen(PORT, "127.0.0.1", () => {
      console.log(
        `Server running on http://127.0.0.1:${PORT}`
      );
      console.log(
        "Backend is ready. Keep this terminal running."
      );
    });

    server.on("error", (error) => {
      console.error(
        "Server failed to start:",
        error.message
      );
    });
  })
  .catch((error) => {
    console.error(
      "MongoDB connection failed:",
      error.message
    );
  });