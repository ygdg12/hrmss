const mongoose = require("mongoose");

async function dropIndex() {
  try {
    await mongoose.connect("mongodb://127.0.0.1:27017/test"); // change DB if needed
    console.log("Connected to MongoDB");

    const result = await mongoose.connection.db.collection("users").dropIndex("username_1");
    console.log("Dropped index:", result);

    await mongoose.disconnect();
  } catch (err) {
    console.error("Error:", err.message);
  }
}

dropIndex();
