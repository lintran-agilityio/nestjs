<p align="center">
  <a href="http://nestjs.com/" target="blank"><img src="https://nestjs.com/img/logo-small.svg" width="120" alt="Nest Logo" /></a>
</p>

[circleci-image]: https://img.shields.io/circleci/build/github/nestjs/nest/master?token=abc123def456
[circleci-url]: https://circleci.com/gh/nestjs/nest

  <p align="center">A progressive <a href="http://nodejs.org" target="_blank">Node.js</a> framework for building efficient and scalable server-side applications.</p>
    <p align="center">
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/v/@nestjs/core.svg" alt="NPM Version" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/l/@nestjs/core.svg" alt="Package License" /></a>
<a href="https://www.npmjs.com/~nestjscore" target="_blank"><img src="https://img.shields.io/npm/dm/@nestjs/common.svg" alt="NPM Downloads" /></a>
<a href="https://circleci.com/gh/nestjs/nest" target="_blank"><img src="https://img.shields.io/circleci/build/github/nestjs/nest/master" alt="CircleCI" /></a>
<a href="https://discord.gg/G7Qnnhy" target="_blank"><img src="https://img.shields.io/badge/discord-online-brightgreen.svg" alt="Discord"/></a>
<a href="https://opencollective.com/nest#backer" target="_blank"><img src="https://opencollective.com/nest/backers/badge.svg" alt="Backers on Open Collective" /></a>
<a href="https://opencollective.com/nest#sponsor" target="_blank"><img src="https://opencollective.com/nest/sponsors/badge.svg" alt="Sponsors on Open Collective" /></a>
  <a href="https://paypal.me/kamilmysliwiec" target="_blank"><img src="https://img.shields.io/badge/Donate-PayPal-ff3f59.svg" alt="Donate us"/></a>
    <a href="https://opencollective.com/nest#sponsor"  target="_blank"><img src="https://img.shields.io/badge/Support%20us-Open%20Collective-41B883.svg" alt="Support us"></a>
  <a href="https://twitter.com/nestframework" target="_blank"><img src="https://img.shields.io/twitter/follow/nestframework.svg?style=social&label=Follow" alt="Follow us on Twitter"></a>
</p>
  <!--[![Backers on Open Collective](https://opencollective.com/nest/backers/badge.svg)](https://opencollective.com/nest#backer)
  [![Sponsors on Open Collective](https://opencollective.com/nest/sponsors/badge.svg)](https://opencollective.com/nest#sponsor)-->

## Description

The User social network is a RESTful API build by NestJs.
It's building APIs for our fakeTwitter project we will have three main resource: Auth, User, Post, Comment. The project uses PostgreSQL as the database and using TypeORM to manager database.

- Trainee: Lin Tran(lin.tran@asnet.com.vn)
- Supporter: Duy Tran (duytran@asnet.com.vn)

## Technical stacks

- [Nest](https://github.com/nestjs/nest) framework TypeScript starter repository.

- [TypeORM](https://typeorm.io/) TypeORM provides a beautiful, simple API for interacting with your database that takes full advantage of TypeScript's type system.

- [Swagger Docs](https://swagger.io/docs/)

- [Testing with Jest](https://jestjs.io/docs/getting-started)

## Features

- ** User Management **
  - Login
  - Logout
  - Refresh and logout endpoints
- **Posts**
  - Create, Read, Update, Delete (CRUD)
  - Author-based access control
- **Comments**
  - Create, Read, Update, Delete (CRUD)
  - Author-based access control
- **Swagger Documentation**
  - Auto-generated API docs
- **Testing**
  - Unit tests for services and controllers
  - E2E tests for authentication, posts, and comments
- **Database**
  - PostgreSQL via TypeORM
  - Docker support for local development
- **ORM**
  - TypeORM

## Prerequisites

- Node.js >= 20
- pnpm (or npm/yarn)
- Docker & Docker Compose (for local DB)

## Clone Repository

```bash
# clone the repo
git@gitlab.asoft-python.com:lin.tran/nodejs-training.git

# Go to practice folder:
cd user-social-network

```

## Environment Variables

Create a `.env` file in the root of your project with the following the env.template

## Project setup

```bash
$ pnpm install
```

## Run database

```bash
$ docker compose up
```

## Run migrations

```bash
$ migration:run
```

## Seeding data (Optional)

```bash
$ seed:dev
```


## Compile and run the project

```bash
# development
$ pnpm run start

# watch mode
$ pnpm run start:dev

# production mode
$ pnpm run start:prod
```

## Run tests

```bash
# unit tests
$ pnpm run test

# e2e tests
$ pnpm run test:e2e

# test coverage
$ pnpm run test:cov
```

## Project Structure

```bash
src/
  ├─config
    ├─ seeding/       # Seeding database
  ├─migrations
  ├─modules
    ├─ auth/          # JWT auth, guards, DTOs
    ├─ users/         # Users CRUD
    ├─ posts/         # Posts CRUD
    ├─ comments/      # Comments CRUD
    ├─ database/      # Initial connect database with typeORM
    ├─ hashing/       # Password hashing service
    ├─ redis/         # Cache data
    ├─ comments/      # Comments CRUD
  ├─ shared/        # Common DTOs, constants, decorators
  ├─ app.module.ts
  ├─ main.ts
test
  ├─e2e
  ├─loadtest
```

## API Documentation

Swagger is enabled and can be accessed in development:

```bash
http://localhost:8080/api/docs
```
