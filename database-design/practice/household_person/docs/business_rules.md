# Business Rules: Household Management

## Overview
This document define the business rules that management Household Database, ensuring data integrity, consistency and proper operation of Household Management.
Business rule are constraints based will be used for the planning of schools, health care and child care.

## 🔗 Business Rules
Are the general rules that govern data and operations in the system.
- A Person just have a unique `id`.
- A Household must have at least one member.
- A Person just have a current address (end_date is NULL).
- A Household is dissolved when end_date is record.

## 🔗 Relationship-Specific Business Rules
- Person <-> Household_Member (1:N)
 - A Person can member of multiple household but one time just member in a household (end_date is NUL)
 - A Household will have multiple person
 - Business rule: UNIQUE(household_id, person_id)

- Household <-> Household_Member
 - A Household must have at least one member (obligatory relationship 1-N)
 - ON DELETE CASCADE 

- Person <-> Income (1-N)
  - a Person can have multiple income (time, multiple type income)
  - Rule: amount >= 0

- Person <-> Job_Status_History
  - a Person can work multiple job, but one time on one job (end_date -s NULL)

- Person <-> Parent_Child (n:m)
  - a Person can father/mother of multiple child, one child can have multiple father/mother
  - parent_id difference child_id

- Person <-> Person_Status (!:N)
  - One Person have have multiple person status, but one status on a time
  - Enum (single, married, divorced, widowed)

- Household ↔ Income (1:n)
  - a Household have multiple income