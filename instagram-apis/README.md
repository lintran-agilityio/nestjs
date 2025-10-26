# Node.js Practice

A robust RESTful API server template built with Node.js and Express.

## Overview

This template provides a solid foundation for building scalable and maintainable RESTful APIs using Node.js. It includes authentication, database integration, testing setup, and best practices for API development, based on the guidelines from [factory.dev's blog](https://factory.dev/blog/how-to-build-api).

## OBJECTIVES

- Establish a Robust Project Architecture
- Ensure Type Safety and Developer Productivity
- Implement Secure and Flexible Authentication Mechanisms
- Facilitate Database Interaction through ORM
- Ensure High Code Reliability
- Provide Interactive and Up-to-Date API Documentation

## Features

- Authentication:
  - Register
  - Login

- User
- Get
  - Get all users
  - Get a user
- Update a user
- Create a user
- Delete a user

- Post:
  - Get
   - Get all posts
   - Get a post
  - Create a new post
  - Update a post
  - Delete a post

- Comments:
  - Get
    - Get all comments of a post
    - Get a comment of a post
  - Create a new comment
  - Update a comment
  - Delete a comment

## Technical stacks

- [express](https://expressjs.com/)(v5.1.0): Express is a minimal and flexible Node.js web application framework that provides a robust set of features for web and mobile applications.
- [typescript](https://www.npmjs.com/package/typescript)(v5.8.3): TypeScript extends JavaScript by adding types to the language.
- [passport](https://www.npmjs.com/package/passport): Simple, unobtrusive authentication for Node.js
- [sequelize](https://www.npmjs.com/package/sequelize)(v6.37.7): Sequelize is a modern TypeScript and Node.js ORM for Oracle, Postgres, MySQL, MariaDB, SQLite and SQL Server, and more.
- [sqlite3](https://www.npmjs.com/package/sqlite3)(v5.1.7): SQLite is a C-language library that implements a small, fast, self-contained, high-reliability, full-featured, SQL database engine.
- [jest](https://www.npmjs.com/package/jest)(v29.7.0): Jest is a JavaScript testing framework designed to ensure correctness of any JavaScript codebase.
- [winston](https://www.npmjs.com/package/winston)(v3.17.0): winston allows you to define a level property on each transport which specifies the maximum level of messages that a transport should log.
- [swagger-ui-express](https://www.npmjs.com/package/swagger-ui-express)(v5.0.1): Simplify your API development with our open-source and professional tools, built to help you and your team efficiently design and document APIs at scale.

## Project Structure

```
├── public/
└── src/
    ├── configs/
    ├── constants/
    ├── libs/
    ├── models/
    ├── middlewares/
    ├── services/
    ├── tests/
    └── utils/
```

## Getting Started

### Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Database (SQLite)

### Installation

1. Clone this repository:

```bash
git git@gitlab.asoft-python.com:lin.tran/nodejs-training.git
cd nodejs-training
checkout practice/instagram-apis
```

2. Install dependencies:

```bash
npm install
```

3. Set up environment variables:

```bash
cp .env.example .env
# Edit .env file with your settings
```

4. Run database migrations (if applicable):

```bash
npm run db:migrate
```

5. Start the server:

```bash
npm start
```

## Available Scripts

- `npm start` - Generates API documentation and starts the server
- `npm test` - Runs the test suite

## Testing

The project uses Mocha as the test runner, Chai for assertions, and Supertest for HTTP testing:

```bash
npm test
```

Tests are organized by modules and run in a dedicated test environment to ensure the main database is not affected.

## API Documentation

API documentation is automatically generated from inline comments using Swagger. After starting the server, access the documentation at:

## Deployment

Instructions for deploying to various environments:

## Author

Lin Tran
