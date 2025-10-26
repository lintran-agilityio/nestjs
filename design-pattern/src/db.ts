import { Pool } from 'pg';

class Database {
  private static instance: Pool;
  
  private constructor() {}

  public static getInstance(): Pool {
    if (!Database.instance) {
      Database.instance = new Pool({
        user: "postgres",
        host: "localhost",
        database: "postgres",
        password: "postgres",
        port: 5434,
      });

      console.log("Database connection pool created.");
    }

    return Database.instance;
  };
};

export default Database;
