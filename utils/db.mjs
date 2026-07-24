// Create PostgreSQL Connection Pool here !
import * as pg from "pg";
const { Pool } = pg.default;

const connectionPool = new Pool({
  connectionString:
    "postgresql://postgres:.Whitememo95@localhost:5432/QuoraMock",
});

export default connectionPool;
