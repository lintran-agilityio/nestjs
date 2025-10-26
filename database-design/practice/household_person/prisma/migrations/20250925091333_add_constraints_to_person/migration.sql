-- This is an empty migration.

ALTER TABLE "public"."Person"
ADD CONSTRAINT check_birth_death_date CHECK (death_date IS NULL OR death_date >= birthday);

ALTER TABLE "public"."Person"
ADD CONSTRAINT check_gender CHECK (gender IN ('M', 'F', 'O'));

ALTER TABLE "public"."Person"
ALTER COLUMN "gender" SET DEFAULT 'M';