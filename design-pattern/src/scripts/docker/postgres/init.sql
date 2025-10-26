-- Create application user
CREATE USER mydb_user WITH PASSWORD 'mydb_pass';

-- Create application database
CREATE DATABASE mydb_db OWNER mydb_user;

-- Grant privileges
GRANT ALL PRIVILEGES ON DATABASE mydb_db TO mydb_user;