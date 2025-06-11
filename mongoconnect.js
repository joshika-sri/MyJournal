import { MongoClient } from 'mongodb';
const uri = "mongodb+srv://joshikasri:myjournalpassword2929@cluster0.an7rtrg.mongodb.net/myjournal?retryWrites=true&w=majority&appName=Cluster0";
let db = null;
async function connectDB() {
  if (db) return db; // Return existing connection if already connected
  try {
    const client = await MongoClient.connect(uri);
    db = client.db("myjournal");
    console.log("MongoDB connected!");
    return db;
  } catch (err) {
    console.error("MongoDB connection error:", err);
    process.exit(1);
  }
}
export default connectDB;