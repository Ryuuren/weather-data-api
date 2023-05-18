import { MongoClient } from "mongodb";
import dotenv from "dotenv"

// Load environment variables from .env file
dotenv.config(); 

const connectionString = process.env.MONGO_CONNECTION_STRING;

const client = new MongoClient(connectionString);
export const db = client.db("weather-data-api");
