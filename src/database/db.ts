// Libs
import { drizzle } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';

import { usersSchema } from '../schema/userSchema';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export const db = drizzle(pool, { schema: { users: usersSchema } });
