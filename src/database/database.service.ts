// Libs
import { Pool } from 'pg';
import { drizzle, NodePgDatabase } from 'drizzle-orm/node-postgres';
import { OnModuleInit, OnModuleDestroy } from '@nestjs/common';

import * as schema from './schema';

export class DatabaseServices implements OnModuleInit, OnModuleDestroy {
  private pool: Pool;
  public db: NodePgDatabase<typeof schema>;

  async onModuleInit() {
    this.pool = new Pool({
      connectionString: process.env.DATABASE_URL,
    });
    this.db = drizzle(this.pool, { schema });

    // Test connection
    const client = await this.pool.connect();
    await client.query('SELECT 1');
    client.release();
    console.log('Database connected successfully');
  }

  async onModuleDestroy() {
    await this.pool.end();
    console.log('🛑 Pool closed');
  }
}
