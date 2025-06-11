import express from "express";
import connectDB from "../mongoconnect.js";
import cors from "cors";
import bcrypt from "bcryptjs";
import { ObjectId } from "mongodb";

const app = express();
app.use(cors());
app.use(express.json({ limit: "5mb" }));
app.use(express.urlencoded({ limit: "5mb", extended: true }));

// Save a journal (POST /api/journals)
app.post("/api/journals", async (req, res) => {
  try {
    const db = await connectDB();
    const { userId, date, day, year, title, story, mood, background } = req.body;
    const journal = { userId, date, day, year, title, story, mood, background, createdAt: new Date(), updatedAt: new Date() };
    const result = await db.collection("journals").insertOne(journal);
    res.status(201).json({ ...journal, _id: result.insertedId });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all journals (GET /api/journals)
app.get("/api/journals", async (req, res) => {
  try {
    const db = await connectDB();
    const journals = await db.collection("journals").find({}).toArray();
    res.json(journals);
  } catch (err) {
    res.status(500).json({ error: "Failed to fetch journals", details: err.message });
  }
});

// Test DB connection
app.get("/api/test-db", async (req, res) => {
  try {
    const db = await connectDB();
    res.json({ status: "connected" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Register User
app.post("/api/users/register", async (req, res) => {
  try {
    const db = await connectDB();
    const { name, username, email, password, profilePic } = req.body;
    // Check for duplicate username/email
    const existing = await db.collection("users").findOne({
      $or: [{ username }, { email }]
    });
    if (existing) {
      return res.status(409).json({ error: "Username or email already exists" });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = { name, username, email, password: hashedPassword, profilePic };
    const result = await db.collection("users").insertOne(user);
    res.status(201).json({ ...user, _id: result.insertedId, password: undefined });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Login User
app.post("/api/users/login", async (req, res) => {
  try {
    const db = await connectDB();
    const { username, password } = req.body;
    const user = await db.collection("users").findOne({ username });
    if (!user) return res.status(401).json({ error: "Invalid credentials" });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(401).json({ error: "Invalid credentials" });
    // Don't send password back
    const { password: pw, ...userData } = user;
    res.json(userData);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Get all journals for a user
app.get("/api/journals/:userId", async (req, res) => {
  try {
    const db = await connectDB();
    const userId = req.params.userId;
    const journals = await db.collection("journals").find({ userId }).toArray();
    res.json(journals);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update a journal
app.put("/api/journals/:journalId", async (req, res) => {
  try {
    const db = await connectDB();
    const { journalId } = req.params;
    const { userId, title, story, mood } = req.body;

    const filter = { _id: new ObjectId(journalId), userId: String(userId) };
    const updateResult = await db.collection("journals").updateOne(
      filter,
      { $set: { title, story, mood, updatedAt: new Date() } }
    );

    if (updateResult.modifiedCount === 0) {
      return res.status(404).json({ error: "Journal not found or unauthorized" });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete a journal
app.delete("/api/journals/:journalId", async (req, res) => {
  try {
    const db = await connectDB();
    const { journalId } = req.params;
    const { userId } = req.body;

    const result = await db.collection("journals").deleteOne({
      _id: new ObjectId(journalId),
      userId,
    });
    if (result.deletedCount === 0) {
      return res.status(404).json({ error: "Journal not found or unauthorized" });
    }
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Export the app for Vercel serverless
export default app;