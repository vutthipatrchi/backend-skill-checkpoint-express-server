import "dotenv/config";
import * as pg from "pg";

const { Pool } = pg.default;

if (!process.env.DATABASE_URL) {
  throw new Error("DATABASE_URL is not defined in the .env file.");
}

const connectionPool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default connectionPool;
