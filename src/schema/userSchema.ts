import { pgTable, serial, varchar, pgEnum } from 'drizzle-orm/pg-core';
import { baseSchema } from './common';

export const userRoleEnum = pgEnum('user_role', ['USER', 'ADMIN']);
export const userStatusEnum = pgEnum('user_status', ['ACTIVE', 'INACTIVE']);

export const usersSchema = pgTable('users', {
  id: serial('id').primaryKey(),
  firstName: varchar('first_name', { length: 50 }).notNull(),
  lastName: varchar('last_name', { length: 50 }).notNull(),
  email: varchar('email', { length: 255 }).notNull().unique(),
  password: varchar('password', { length: 255 }).notNull(),
  role: userRoleEnum('role').default('USER').notNull(),
  status: userStatusEnum('status').default('ACTIVE').notNull(),
  ...baseSchema,
});
