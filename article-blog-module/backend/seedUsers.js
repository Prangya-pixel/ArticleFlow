const mongoose = require("mongoose");
require("dotenv").config();

const User = require("./models/User");

const users = [
  {
    name: "Aarav Sharma",
    email: "aarav.author@gmail.com",
    role: "author",
  },
  {
    name: "Priya Mehta",
    email: "priya.author@gmail.com",
    role: "author",
  },
  {
    name: "Rohan Verma",
    email: "rohan.reader@gmail.com",
    role: "reader",
  },
  {
    name: "Admin User",
    email: "admin@articleflow.com",
    role: "admin",
  },
];

const seedUsers = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("MongoDB connected successfully");

    await User.deleteMany({});

    const createdUsers = await User.insertMany(users);

    console.log(
      `${createdUsers.length} dummy users created successfully.`
    );

    createdUsers.forEach((user) => {
      console.log(
        `${user.name} | ${user.email} | ${user.role}`
      );
    });

    await mongoose.connection.close();

    console.log("Database connection closed.");
    process.exit(0);
  } catch (error) {
    console.error("Failed to seed users:", error.message);

    await mongoose.connection.close();

    process.exit(1);
  }
};

seedUsers();