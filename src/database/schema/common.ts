import { timestamp } from 'drizzle-orm/pg-core';

export const baseSchema = {
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at')
    .defaultNow()
    .$onUpdateFn(() => new Date()),
};
