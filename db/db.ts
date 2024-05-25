import mongoose from "mongoose";
import logger from "@/utils/logger.ts";
import { env } from "@/utils/env.ts";

let protocol = "mongodb";
const url = env.MONGOOSE_URL;
const db = env.MONGOOSE_DB;
const user = env.MONGOOSE_USER;
const password = env.MONGOOSE_PASSWORD;

if (env.MONGOOSE_USE_SSL === "true") {
  protocol = "mongodb+srv";
}

const connectionString = `${protocol}://${user}:${password}@${url}/${db}?retryWrites=true&w=majority`;
const connection = await mongoose.connect(connectionString);

logger.info("Connected to MongoDB");

export default connection;
