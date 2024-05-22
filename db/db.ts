import mongoose from "mongoose";
import logger from "../utils/logger.ts";

let protocol = "mongodb";
const url = Deno.env.get("MONGOOSE_URL");
const db = Deno.env.get("MONGOOSE_DB");
const user = Deno.env.get("MONGOOSE_USER");
const password = Deno.env.get("MONGOOSE_PASSWORD");

if (Deno.env.get("MONGOOSE_USE_SSL") === "true") {
  protocol = "mongodb+srv";
}

const connectionString = `${protocol}://${user}:${password}@${url}/${db}?retryWrites=true&w=majority`;
const connection = await mongoose.connect(connectionString);

logger.info("Connected to MongoDB");

export default connection;
