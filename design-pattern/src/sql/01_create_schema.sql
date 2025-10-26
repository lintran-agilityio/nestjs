CREATE SCHEMA IF NOT EXISTS mydb_test;


-- Drop tables in dependency order (linking tables first)
DROP TABLE IF EXISTS users CASCADE;


CREATE TABLE users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL
);

