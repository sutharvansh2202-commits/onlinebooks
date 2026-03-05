const express = require("express");
const cors = require("cors");
const mongoose = require("mongoose");
const path = require("path");

require("dotenv").config({ path: path.join(__dirname, ".env") });

const bookRoutes = require("./routes/bookRoutes");
const adminRoutes = require("./routes/admin");
const trendingRoutes = require("./routes/trendingRoutes");
const authRoutes = require("./routes/authRoutes");
const orderRoutes = require("./routes/orderRoutes");
const contactRoutes = require("./routes/contactRoutes");
const oauthRoutes = require("./routes/oauthRoutes");

const app = express();

const corsOrigin = process.env.CORS_ORIGIN || "*";
app.use(cors({ origin: corsOrigin === "*" ? true : corsOrigin }));
app.use(express.json());


// MongoDB connection
const mongoURI = process.env.MONGO_URI || "mongodb://localhost:27017/onlineBookStore";
const localMongoURI = process.env.MONGO_URI_LOCAL || "mongodb://127.0.0.1:27017/onlineBookStore";

async function connectMongo() {
  try {
    await mongoose.connect(mongoURI);
    console.log("MongoDB connected");
  } catch (err) {
    const isSrvDnsError = err && err.code === "ECONNREFUSED" && String(err.hostname || "").startsWith("_mongodb._tcp.");

    if (isSrvDnsError) {
      console.error("MongoDB SRV DNS lookup failed. Trying local MongoDB fallback...");
      try {
        await mongoose.connect(localMongoURI);
        console.log("MongoDB connected (local fallback)");
        return;
      } catch (fallbackErr) {
        console.error("MongoDB fallback connection error:", fallbackErr.message || fallbackErr);
      }
    } else {
      console.error("MongoDB connection error:", err.message || err);
    }
  }
}

connectMongo();

app.use("/api/books", bookRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/orders", orderRoutes);
app.use("/api/trending", trendingRoutes);
app.use("/api/contact", contactRoutes);
app.use("/api/oauth", oauthRoutes);

// Debug test POST route (should be after all middleware/routes)
app.post("/api/test", (req, res) => {
  res.json({ ok: true });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
