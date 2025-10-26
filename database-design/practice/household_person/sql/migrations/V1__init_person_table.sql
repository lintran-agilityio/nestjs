-- Enable uuid_generate_v4 
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create Enum for gender
CREATE TYPE gender_enum AS ENUM ('M', 'F', 'O');

-- Create person table
CREATE TABLE person (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50),
  email TEXT NOT NULL UNIQUE,
  birthday DATE NOT NULL,
  death_date DATE,
  gender gender_enum DEFAULT 'M'
)