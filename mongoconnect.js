import { MongoClient } from 'mongodb';
const uri = process.env.MONGODB_URI; // Use environment variable!
let db = null;
async function connectDB() {
  if (db) return db;
  try {
    const client = await MongoClient.connect(uri);
    db = client.db("myjournal");
    return db;
  } catch (err) {
    process.exit(1);
  }
}
export default connectDB;
