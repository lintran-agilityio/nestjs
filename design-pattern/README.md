## Load Schema, Business Rules, and Data

```
docker exec -i mydb_db psql -U mydb_user -d mydb_db < src/sql/01_create_schema.sql
docker exec -i mydb_db psql -U mydb_user -d mydb_db < src/sql/02_insert_data_test.sql
docker exec -i mydb_db psql -U mydb_user -d mydb_db < src/sql/04_create_view.sql
```