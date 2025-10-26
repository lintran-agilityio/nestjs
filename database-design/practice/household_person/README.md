## Household Management – Mock Data Generator

This project generates realistic SQL seed data for a Household Management schema. It produces `INSERT` statements for the following tables with consistent foreign keys and chronological periods:

- `household_manager.Person`
- `household_manager.residency`
- `household_manager.household`
- `household_manager.household_member`
- `household_manager.personal_status`
- `household_manager.parent_child`
- `household_manager.job_status_history`
- `household_manager.income`

### Directory Structure
practice/
├── diagrams/         # ERD and relationship diagrams (PNG, D2)
├── scripts/          # Shell and data generation scripts
│   └── data/         # Mock data generator and output
├── sql/              # All SQL files (mocking data, insert data, view data)
├── docker-compose.yaml
└── README.md         # This file

### Prerequisites

- Node.js 18+
- npm
- A PostgreSQL database with the `household_manager` schema and tables created (schemas must match column names used in the inserts).

### Install

```bash
npm install
```

### 1. Start the Database
```bash
./scripts/start-db.sh start
```

### 2. Check Database Status
```bash
./scripts/start-db.sh status
```

### 3. Connect to the Database
```bash
./scripts/start-db.sh connect
```

- Host: localhost
- Port: 5433
- Database: household_management_db
- User: household_management_user
- Password: household_management_pass

### 4. Load Schema, Business Rules, and Data

The schema is loaded automatically on first run. To (re)load or update, use:
```bash
  docker exec -i household_management_db psql -U household_management_user -d household_management_db < sql/01_create_schema.sql
  docker exec -i household_management_db psql -U household_management_user -d household_management_db < sql/02_create_function.sql
  docker exec -i household_management_db psql -U household_management_user -d household_management_db < sql/03_test_data.sql
  docker exec -i household_management_db psql -U household_management_user -d household_management_db < sql/04_create_view.sql
```

### Or can Generate mock data

This will create `sql/mock_data.sql` containing all `INSERT` statements wrapped in a transaction.

```bash
npm run generate:mock
```

Output location:

```
sql/mock_data.sql
```

### Load data into PostgreSQL

Ensure your database already contains the `household_manager` schema and tables. Then run:

```bash
psql "postgres://USER:PASSWORD@HOST:PORT/DBNAME" -f sql/mock_data.sql
```

### 5. Stop Database
```
docker stop household_management_db
```

### Database Schema

** Main Tables:**
- Person - Information of person
- residency - the place person is living
- Job_Status_history - save the history job of person
- Parent_child - the table save relationship of child and parent
- Personal_status - the table save history status (single, married, divorced, widowed) of person
- household - save the information of household (address, formation_date, dissolution_date)
- household_member - save information of member in household
- income - save amount and income-type of person 

** See the ERD:**
- [ERD PNG](diagrams/household_manager.png)
- [ERD Source (D2)](diagrams/household_manager.d2)

## Key Features
- Business Rules: Enforced via constraints, triggers, and documentation
- Soft Delete: All tables support logical deletion (deleted flag)
- Audit Fields: Automatic timestamps for creation and updates
- Multi-Channel Broadcasting: Transmissions can be broadcast on multiple channels
- Performance: Indexes and optimized queries


### Notes

- The generator assumes the schema is named `household_manager`. If yours differs, find and replace the schema prefix in `sql/mock_data.sql` or update the generator accordingly.
- Date ranges are generated to be chronological and often end with `NULL` `end_date` to represent ongoing periods.
- All primary keys are UUIDs.



