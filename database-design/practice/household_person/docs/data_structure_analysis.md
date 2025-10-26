# Data Structure Analysis: Household Management

## 📊 Overview

This document provides a analysis of the Household management Database structure, focusing on member in household, income of member and total income of household, status of Person in household. The analysis examines table relationships, data flow, and structural integrity.

## 🔗 Relationship Analysis
### Adjacency Matrix

|                        | Person      | Personal_Status | Parent_Child | residency | Job_Status_History | Household | Household_Member | Income  |
|------------------------|:-----------:|:---------------:|:------------:|:---------:|:------------------:|:---------:|:----------------:|:-------:|
| **Person**             |      -      |   1:N           |     1:N      |  1:N      |       1:N          |           |      1:N         |  1:N    |
| **Personal_Status**    |    N:1      |    -            |              |           |                    |           |                  |         |
| **Parent_Child**       |    N:1      |                 |    -         |           |                    |           |                  |         |
| **residency**          |    N:1      |                 |              |    -      |                    |           |                  |         |
| **Job_Status_history** |    N:1      |                 |              |           |        -           |           |                  |         |
| **household**          |             |                 |              |           |                    |     -     |       1:N        |         |
| **household_member**   |    1:N      |                 |              |           |                    |    N:1    |        -         |         |
| **income**             |    N:1      |                 |              |           |                    |           |        1:N       |    -    |

- **1:N**: Row table has one, column table has many
- **N:1**: Row table has many, column table has one
- **M:N**: Many-to-many relationship via linking table
- **\***: Special relationship (director assignment)

### Relationship Patterns
- **1:N**:
  - Person-income
  - Person-Personal_Status
  - Person-residency
- **M:N**: (intermediate table): household - Person (household_member intermediate table)
- **Self-Referencing 1:N**: Person – Parent_Child
- **1:N (indirect)**: household – income

📄 household Management Database – Data Structure Analysis

### Main Relationship Patterns in Household Management Database


#### 1. household – Household_Member – Person
- Relationship type: Household (1) <-> (N) Household_Member (N) <-> (1) Person
- Relationship Many-to-Many (M:N) between Household and Person, using Household_Member is intermediate table
- Mean: one household have have many household member, one Person can lived in multiple household (overtime)

#### 2. Person – Parent_Child – Person
- Relationship type: Self-Referencing 1:N
- One Person can have mother/father of multiple different Person | one Person just one Father/Mother
- Mean: Parent-child relationship management.

#### 3. Person – income
- Relationship type: 1:N
- One Person can have multiple income (salary, investment, ...) | one income belongs to only one Person. 

#### 4. household – income (indirect by Person table)
- Relationship type: 1:N
- One Household have multiple income from many Person in household | one income of Person belongs to one Household

#### 5. Person – residency
- Relationship type: 1:N (temporal)
- One Person can live in multiple difference address (change over time)

#### 6. Person – Personal_Status
- Relationship type: 1:N (temporal)
- A Person can change their marital status (single, married, divorced, widowed) | a status belongs to only one Person at a time
