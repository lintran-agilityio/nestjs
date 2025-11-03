## Description

It's include integration test and Loadtest for Fake social network database

---

## Integration Tests (E2E)

**Location**: `test/e2e/`

**Purpose**: Test complete request/response flows with real database

**Characteristics**:
- Uses real or test database
- Tests full HTTP request/response cycle
- Tests authentication/authorization
- Slower execution than unit tests

**Naming Convention**: `*.e2e-spec.ts`

**Example**: `test/integration/users/users.e2e-spec.ts`

### Running Integration Tests

```bash
# Run all E2E tests
pnpm run test:e2e

# Run specific E2E test
pnpm run test:e2e -- users.e2e-spec
```

---

## Coverage Goals

- **Services**: >85% coverage
- **Controllers**: >80% coverage
- **Overall**: >80% coverage

Run `pnpm run test:cov` to generate coverage report in `coverage/` directory.

## Load Testing Guide - Analytics Dashboard

Comprehensive load testing suite for the Sales Analytics Dashboard using k6.

### Overview

This load testing suite validates the performance and scalability of the Fake Social Network under various load conditions. Tests are written in JavaScript using [k6](https://k6.io/), a modern load testing tool.

### Load Testing Goals

1. Validate system handles expected production load (50 concurrent users)
2. Identify bottlenecks and breaking points (stress test to 200 users)
3. Ensure stable performance over time (soak test - 30 min)
4. Verify graceful degradation under extreme load

---

### Prerequisites

#### System Requirements

- **k6** v0.45.0 or higher
- **Node.js** v18+ (for test data generation)
- **Access** to the Analytics Dashboard API
- **Database** with seeded data (see below)

#### Required Setup

Before running load tests, ensure:

1. **Application is running**:
```bash
$ cd user-social-network
$ pnpm run start:dev
```

2. **Database is seeded** with test data:
```bash
$ pnpm run seed
```

3. **Environment variables** are configured:
```bash
# .env
  DB_HOST=localhost
  DB_PORT=5432
  DB_USERNAME=postgres
  DB_PASSWORD=postgres
  DB_DATABASE=fake_social
```

#### Start App in Load Test Mode
```bash
pnpm start:load
```

#### Build all typescript file become javascript file
```bash
pnpm load:build
```

---

#### Test Scenarios

##### 01-auth.test.js - Authentication Flow
**Purpose**: Test login and token validation

**Load**: 20 VUs, 1 minutes
**Key Metrics**: Login latency, token validation speed

```bash
$ pnpm load:auth
```

**What it tests**:
- Valid/invalid login attempts
- Token generation and validation
- Unauthorized access handling

##### 02-user-post-flow.test.js - Authentication - Post Flow
**Purpose**: Test login, token validation to create a Post and view

**Load**: 20 VUs, 1 minutes
**Key Metrics**: Login latency, token validation speed after that create a Post and get to view the Post

```bash
$ pnpm load:post
```

**What it tests**:
- Valid/invalid login attempts
- Token generation and validation
- Unauthorized access handling
- Create a Post
- View all Post in the Post

##### 03-user-post-comment-flow.test.js - Authentication - Post Flow - Comment Flow
**Purpose**: Test login, token validation to create a Post, create Comment and view Post

**Load**: 20 VUs, 1 minutes
**Key Metrics**: Login latency, token validation speed after that create a Post, create a Comment and get the Post to view

```bash
$ pnpm load:comment
```

**What it tests**:
- Valid/invalid login attempts
- Token generation and validation
- Unauthorized access handling
- Create a Post
- Create a Comment
- View all Post in the Post

##### 04-user-update-post.test.js - Authentication - Post Flow - Update Post Flow
**Purpose**: Test login, token validation to create a Post and view Post, Update Post and view Post

**Load**: 20 VUs, 1 minutes
**Key Metrics**: Login latency, token validation speed after that create a Post, view Post before update and Update the Post and view

```bash
$ pnpm load:update
```

**What it tests**:
- Valid/invalid login attempts
- Token generation and validation
- Unauthorized access handling
- Create a Post
- View the Post created (before Post update)
- Update the Post 
- View the Post after update

##### 05-user-post-comment-delete-comment-flow.test.js - Authentication - Post Flow - Comment Flow
**Purpose**: Test login, token validation to create a Post, create comments, view comments and delete comment

**Load**: 20 VUs, 1 minutes
**Key Metrics**: Login latency, token validation speed after that create a Post, create comments, view comments and Delete this comments created

```bash
$ pnpm load:delete
```

**What it tests**:
- Valid/invalid login attempts
- Token generation and validation
- Unauthorized access handling
- Create a Post
- Create a comments
- View comments (before delete)
- Delete this comments created
