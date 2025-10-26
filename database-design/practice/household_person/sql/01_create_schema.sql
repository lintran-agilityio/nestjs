-- Household Manager Database Schema
-- Based on the D2 diagram: household_manager.d2
-- This file contains only table creation statements.

-- Create custom Schema
CREATE SCHEMA IF NOT EXISTS household_manager;
SET search_path TO household_manager;

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop tables in dependency order (linking tables first)
DROP TABLE IF EXISTS household_member CASCADE;
DROP TABLE IF EXISTS household CASCADE;
DROP TABLE IF EXISTS income CASCADE;
DROP TABLE IF EXISTS job_status_history CASCADE;
DROP TABLE IF EXISTS parent_children CASCADE;
DROP TABLE IF EXISTS parent_child_closure CASCADE;
DROP TABLE IF EXISTS residency CASCADE;
DROP TABLE IF EXISTS personal_status CASCADE;
DROP TABLE IF EXISTS person CASCADE;
DROP TABLE IF EXISTS people CASCADE;

-- Create tables in dependency order (base tables first)

-- 1. person
CREATE TABLE person (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  date_of_birth TIMESTAMP CHECK (date_of_birth <= CURRENT_TIMESTAMP),
  gender VARCHAR(1) DEFAULT 'M' CHECK (gender IN ('M', 'F', 'O')),
  death_date TIMESTAMP CHECK (death_date >= date_of_birth),
  path_relationship VARCHAR(255)
);

-- 2. residency
CREATE TABLE residency (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  person_id UUID NOT NULL REFERENCES person(id) ON DELETE CASCADE,
  address VARCHAR(255),
  start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  end_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Job Status History
CREATE TABLE job_status_history (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  person_id UUID NOT NULL REFERENCES person(id) ON DELETE CASCADE,
  status VARCHAR(20) CHECK (status IN ('employed', 'unemployed', 'student', 'retired')),
  start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  end_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 4. Parent Child
CREATE TABLE parent_child (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  parent_id UUID NOT NULL REFERENCES person(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES person(id) ON DELETE CASCADE,
  UNIQUE (parent_id, child_id),
  start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  end_date TIMESTAMP
);

-- Parent Child closure table
CREATE TABLE parent_child_closure (
  ancestor_id UUID NOT NULL REFERENCES person(id) ON DELETE CASCADE,
  descendant_id UUID NOT NULL REFERENCES person(id) ON DELETE CASCADE,
  depth INT NOT NULL,
  PRIMARY KEY (ancestor_id, descendant_id)
);

-- 5. Personal Status tables
CREATE TABLE personal_status (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  person_id UUID NOT NULL REFERENCES person(id) ON DELETE CASCADE,
  status VARCHAR(20) CHECK (status IN ('single', 'married', 'divorced', 'widowed')),
  start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  end_date TIMESTAMP
);

-- 6. household
CREATE TABLE household (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  address VARCHAR(255),
  formation_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  dissolution_date TIMESTAMP
);

-- 7. Household Member
CREATE TABLE household_member (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  household_id UUID NOT NULL REFERENCES household(id) ON DELETE CASCADE,
  person_id UUID NOT NULL REFERENCES person(id) ON DELETE CASCADE,
  role VARCHAR(20) CHECK (role IN ('head', 'spouse', 'child_id', 'other')),
  start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  end_date TIMESTAMP,
  UNIQUE (household_id, person_id)
);

-- 8. Income
CREATE TABLE income (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  person_id UUID NOT NULL REFERENCES person(id) ON DELETE CASCADE,
  household_id UUID NOT NULL REFERENCES household(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) CHECK (amount >= 0),
  income_type VARCHAR(20) CHECK (income_type IN ('salary', 'investment', 'pension', 'business', 'other')),
  start_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  end_date TIMESTAMP
);

-- 9. people (view)
-- CREATE TABLE people (
--   id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
--   name VARCHAR(50) NOT NULL,
--   birthday TIMESTAMP CHECK (date_of_birth <= CURRENT_TIMESTAMP),
--   gender VARCHAR(1) DEFAULT 'M' CHECK (gender IN ('M', 'F', 'O')),
--   path VARCHAR(255),
--   email VARCHAR(100) NOT NULL,
-- );
