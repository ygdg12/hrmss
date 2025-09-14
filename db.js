
const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect("mongodb+srv://yaredgirmab1234:BfROlmdbBzb13CfK@cluster0.mnb4efk.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0", {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    }); 
    console.log("✅ Connected to MongoDB");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message || err);
    process.exit(1); // Stop the server if DB connection fails
  }
};

module.exports = connectDB;
