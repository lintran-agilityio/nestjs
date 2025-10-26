import { faker } from '@faker-js/faker';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const NUM_PERSONS = 120;
const NUM_household = 40;

const OUTPUT_DIR = path.join(__dirname, '../../sql');
const OUTPUT_FILE = path.join(OUTPUT_DIR, 'mock_data.sql');

function sqlString(value) {
  if (value === null || value === undefined) return 'NULL';
  return `'${String(value).replace(/'/g, "''")}'`;
}

function formatDate(date) {
  if (!date) return 'NULL';
  const d = new Date(date);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  const dd = String(d.getDate()).padStart(2, '0');
  return `'${yyyy}-${mm}-${dd}'`;
}

function randomDateBetween(start, end) {
  const startTime = start.getTime();
  const endTime = end.getTime();
  const ts = startTime + Math.random() * (endTime - startTime);
  return new Date(ts);
}

function addYears(date, years) {
  const d = new Date(date);
  d.setFullYear(d.getFullYear() + years);
  return d;
}

// Data holders to keep referential integrity
const Person = []; // { id, firstName, lastName, dob, deathDate, gender }
const household = []; // { id, address, startDate, endDate }

function generatePersons() {
  const statements = [];
  for (let i = 0; i < NUM_PERSONS; i++) {
    const id = faker.string.uuid();
    const firstName = faker.person.firstName();
    const lastName = faker.person.lastName();
    const dob = faker.date.between({ from: '1950-01-01', to: '2020-12-31' });
    const hasDeath = Math.random() < 0.08; // ~8%
    const deathDate = hasDeath ? randomDateBetween(new Date('2000-01-01'), new Date('2025-12-31')) : null;
    const gender = faker.helpers.arrayElement(['M', 'F', 'O']);

    Person.push({ id, firstName, lastName, dob, deathDate, gender });

    statements.push(
      `INSERT INTO household_manager.person (id, first_name, last_name, date_of_birth, death_date, gender) VALUES (` +
        `${sqlString(id)}, ` +
        `${sqlString(firstName)}, ` +
        `${sqlString(lastName)}, ` +
        `${formatDate(dob)}, ` +
        `${formatDate(deathDate)}, ` +
        `${sqlString(gender)});
`
    );
  }
  return statements;
}

function generateresidency() {
  const statements = [];
  for (const person of Person) {
    const periods = faker.number.int({ min: 1, max: 3 });
    let currentStart = randomDateBetween(new Date('1990-01-01'), new Date('2018-12-31'));
    for (let r = 0; r < periods; r++) {
      const id = faker.string.uuid();
      const address = `${faker.location.streetAddress()}, ${faker.location.city()}`;
      const years = faker.number.int({ min: 1, max: 10 });
      const tentativeEnd = addYears(currentStart, years);
      const isLast = r === periods - 1;
      const endDate = isLast && Math.random() < 0.7 ? null : tentativeEnd;

      statements.push(
        `INSERT INTO household_manager.residency (id, person_id, address, start_date, end_date) VALUES (` +
          `${sqlString(id)}, ` +
          `${sqlString(person.id)}, ` +
          `${sqlString(address)}, ` +
          `${formatDate(currentStart)}, ` +
          `${formatDate(endDate)});
`
      );

      if (endDate) {
        const next = new Date(endDate);
        next.setDate(next.getDate() + 1);
        currentStart = next;
      } else {
        break;
      }
    }
  }
  return statements;
}

function generatehousehold() {
  const statements = [];
  for (let i = 0; i < NUM_household; i++) {
    const id = faker.string.uuid();
    const address = `${faker.location.streetAddress()}, ${faker.location.city()}`;
    const startDate = randomDateBetween(new Date('1990-01-01'), new Date('2018-12-31'));
    const endDate = Math.random() < 0.6 ? null : randomDateBetween(addYears(startDate, 1), new Date('2025-12-31'));

    household.push({ id, address, startDate, endDate });

    statements.push(
      `INSERT INTO household_manager.household (id, start_date, end_date, address) VALUES (` +
        `${sqlString(id)}, ` +
        `${formatDate(startDate)}, ` +
        `${formatDate(endDate)}, ` +
        `${sqlString(address)});
`
    );
  }
  return statements;
}

function generateHouseholdMembers() {
  const statements = [];
  // Assign each person to 0-2 household historically
  for (const person of Person) {
    const memberships = faker.number.int({ min: 0, max: 2 });
    let start = randomDateBetween(new Date('1995-01-01'), new Date('2020-12-31'));

    for (let m = 0; m < memberships; m++) {
      const id = faker.string.uuid();
      const household = faker.helpers.arrayElement(household);
      const years = faker.number.int({ min: 1, max: 8 });
      const until = Math.random() < 0.6 ? null : addYears(start, years);
      const relationship = faker.helpers.arrayElement(['head', 'spouse', 'child', 'parent', 'other']);

      statements.push(
        `INSERT INTO household_manager.household_member (id, household_id, person_id, member_since, member_until, relationship_to_head) VALUES (` +
          `${sqlString(id)}, ` +
          `${sqlString(household.id)}, ` +
          `${sqlString(person.id)}, ` +
          `${formatDate(start)}, ` +
          `${formatDate(until)}, ` +
          `${sqlString(relationship)});
`
      );

      if (until) {
        const next = new Date(until);
        next.setDate(next.getDate() + 1);
        start = next;
      } else {
        break;
      }
    }
  }
  return statements;
}

function generatePersonalStatus() {
  const statements = [];
  for (const person of Person) {
    const records = faker.number.int({ min: 1, max: 3 });
    let start = randomDateBetween(new Date('1990-01-01'), new Date('2018-12-31'));
    for (let i = 0; i < records; i++) {
      const id = faker.string.uuid();
      const status = faker.helpers.arrayElement(['single', 'married', 'divorced', 'widowed']);
      const until = i === records - 1 && Math.random() < 0.7 ? null : addYears(start, faker.number.int({ min: 1, max: 8 }));

      statements.push(
        `INSERT INTO household_manager.personal_status (id, person_id, status, start_date, end_date) VALUES (` +
          `${sqlString(id)}, ` +
          `${sqlString(person.id)}, ` +
          `${sqlString(status)}, ` +
          `${formatDate(start)}, ` +
          `${formatDate(until)});
`
      );

      if (until) {
        const next = new Date(until);
        next.setDate(next.getDate() + 1);
        start = next;
      } else {
        break;
      }
    }
  }
  return statements;
}

function generateJobStatusHistory() {
  const statements = [];
  for (const person of Person) {
    const records = faker.number.int({ min: 0, max: 3 });
    let start = randomDateBetween(new Date('1990-01-01'), new Date('2018-12-31'));
    for (let i = 0; i < records; i++) {
      const id = faker.string.uuid();
      const status = faker.helpers.arrayElement(['Employed', 'unemployed', 'student', 'retired']);
      const until = i === records - 1 && Math.random() < 0.6 ? null : addYears(start, faker.number.int({ min: 1, max: 6 }));

      statements.push(
        `INSERT INTO household_manager.job_status_history (id, person_id, status, start_date, end_date) VALUES (` +
          `${sqlString(id)}, ` +
          `${sqlString(person.id)}, ` +
          `${sqlString(status)}, ` +
          `${formatDate(start)}, ` +
          `${formatDate(until)});
`
      );

      if (until) {
        const next = new Date(until);
        next.setDate(next.getDate() + 1);
        start = next;
      } else {
        break;
      }
    }
  }
  return statements;
}

function generateParentChild() {
  const statements = [];
  // Split adults and minors based on DOB
  const adults = Person.filter(p => (new Date().getFullYear() - new Date(p.dob).getFullYear()) >= 18);
  const minors = Person.filter(p => (new Date().getFullYear() - new Date(p.dob).getFullYear()) < 18);

  const pairs = faker.number.int({ min: 50, max: 150 });
  for (let i = 0; i < pairs; i++) {
    if (adults.length === 0 || minors.length === 0) break;
    const parent = faker.helpers.arrayElement(adults);
    const child = faker.helpers.arrayElement(minors);
    // ensure parent older than child by at least 15 years
    const parentAge = new Date().getFullYear() - new Date(parent.dob).getFullYear();
    const childAge = new Date().getFullYear() - new Date(child.dob).getFullYear();
    if (parent.id === child.id || parentAge - childAge < 15) continue;

    const id = faker.string.uuid();
    const start = randomDateBetween(new Date('1990-01-01'), new Date('2020-12-31'));
    const end = Math.random() < 0.4 ? addYears(start, faker.number.int({ min: 1, max: 10 })) : null;

    statements.push(
      `INSERT INTO household_manager.parent_child (id, parent_id, child_id, start_date, end_date) VALUES (` +
        `${sqlString(id)}, ` +
        `${sqlString(parent.id)}, ` +
        `${sqlString(child.id)}, ` +
        `${formatDate(start)}, ` +
        `${formatDate(end)});
`
    );
  }
  return statements;
}

function generateIncome() {
  const statements = [];
  for (const household of household) {
    const entries = faker.number.int({ min: 1, max: 5 });
    // pick some members' Person to attribute income where possible (optional in schema but we'll fill it)
    for (let i = 0; i < entries; i++) {
      const id = faker.string.uuid();
      const amount = faker.number.int({ min: 1000, max: 100000 });
      const incomeType = faker.helpers.arrayElement(['salary', 'pension', 'business', 'investment', 'other']);
      const periodStart = randomDateBetween(new Date('2000-01-01'), new Date('2022-12-31'));
      const periodEnd = Math.random() < 0.5 ? null : addYears(periodStart, faker.number.int({ min: 1, max: 5 }));
      const person = faker.helpers.arrayElement(Person);

      statements.push(
        `INSERT INTO household_manager.income (id, household_id, person_id, amount, income_type, period_start, period_end) VALUES (` +
          `${sqlString(id)}, ` +
          `${sqlString(household.id)}, ` +
          `${sqlString(person.id)}, ` +
          `${amount}, ` +
          `${sqlString(incomeType)}, ` +
          `${formatDate(periodStart)}, ` +
          `${formatDate(periodEnd)});
`
      );
    }
  }
  return statements;
}

function generateMockData() {
  const sqlStatements = [];
  sqlStatements.push('-- Mock data for Household Management schema');
  sqlStatements.push('BEGIN;');

  sqlStatements.push('-- person');
  sqlStatements.push(...generatePersons());

  sqlStatements.push('-- residency');
  sqlStatements.push(...generateresidency());

  sqlStatements.push('-- household');
  sqlStatements.push(...generatehousehold());

  sqlStatements.push('-- household_member');
  sqlStatements.push(...generateHouseholdMembers());

  sqlStatements.push('-- personal_status');
  sqlStatements.push(...generatePersonalStatus());

  sqlStatements.push('-- parent_child');
  sqlStatements.push(...generateParentChild());

  sqlStatements.push('-- job_status_history');
  sqlStatements.push(...generateJobStatusHistory());

  sqlStatements.push('-- income');
  sqlStatements.push(...generateIncome());

  sqlStatements.push('COMMIT;');

  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }
  fs.writeFileSync(OUTPUT_FILE, sqlStatements.join('\n'), { flag: 'w' });
  console.log(`Mock data generated and written to ${OUTPUT_FILE}`);
}

generateMockData();
