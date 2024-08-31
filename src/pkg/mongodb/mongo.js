/**
 * NODE LIBS
 * -----------------------------------
 */
require("dotenv").config();
const mongoose = require("mongoose");

/**
 * LOAD CONFIGS
 * -----------------------------------
 */
const uri = process.env.MONGODB_URI || "your_mongodb_uri_here";

/**
 * CONNECT
 * -----------------------------------
 */
mongoose
  .connect(uri)
  .then(() => {
    console.log("Connected to MongoDB via Mongoose");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

module.exports = mongoose;
