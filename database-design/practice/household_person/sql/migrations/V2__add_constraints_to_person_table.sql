CREATE UNIQUE INDEX "person_email_key_flyway" ON person(email);

ALTER TABLE "person"
ADD CONSTRAINT check_birth_death_date_flyway CHECK (death_date IS NULL OR death_date >= birthday);

ALTER TABLE "person"
ADD CONSTRAINT check_gender_flyway CHECK (gender IN ('M', 'F', 'O'));

ALTER TABLE "person"
ALTER COLUMN "gender" SET DEFAULT 'M';
