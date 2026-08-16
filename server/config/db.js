import mongoose from "mongoose";

/**
 * Connects to MongoDB Atlas using the connection string in MONGODB_URI.
 * The process exits if the connection cannot be established, since the
 * API cannot safely serve requests without a database.
 */
export const connectDB = async () => {
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error(
      "[db] MONGODB_URI is not set. Copy .env.example to .env and add your MongoDB Atlas connection string."
    );
    process.exit(1);
  }

  try {
    mongoose.set("strictQuery", true);
    const conn = await mongoose.connect(uri);
    console.log(`[db] MongoDB connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`[db] MongoDB connection failed: ${error.message}`);
    process.exit(1);
  }
};

mongoose.connection.on("disconnected", () => {
  console.warn("[db] MongoDB disconnected");
});
