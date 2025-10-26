-- Create application user
CREATE USER household_management_user WITH PASSWORD 'household_management_pass';

-- Create application database
CREATE DATABASE household_management_db OWNER household_management_user;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE household_management_db TO household_management_user;