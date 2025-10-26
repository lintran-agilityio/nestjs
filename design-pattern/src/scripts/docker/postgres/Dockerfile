# Use official PostgreSQL image as base
FROM postgres:15-alpine

# Set environment variables for PostgreSQL
ENV POSTGRES_DB=postgres
ENV POSTGRES_USER=postgres
ENV POSTGRES_PASSWORD=postgres

# Set custom environment variables for the application user
ENV DB_USER=postgres
ENV DB_PASSWORD=postgres
ENV DB_NAME=postgres

# Copy the user creation script
COPY create-user.sh /docker-entrypoint-initdb.d/

# Make the script executable
RUN chmod +x /docker-entrypoint-initdb.d/create-user.sh

# Expose PostgreSQL port
EXPOSE 5434