const mongoose = require('mongoose');


const uri = process.env.CONNECTION_STRING

const connectDB = async () => {
  try {
    await mongoose.connect(uri, {

    });
    console.log("Database connection is ready...");
  } catch (err) {
    console.error("Error connecting to the database:", err);
  }
};

module.exports = connectDB;
