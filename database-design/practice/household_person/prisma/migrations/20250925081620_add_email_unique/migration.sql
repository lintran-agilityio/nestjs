/*
  Warnings:

  - You are about to drop the `User` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropTable
DROP TABLE "public"."User";

-- CreateTable
CREATE TABLE "public"."Person" (
    "id" UUID NOT NULL,
    "first_name" VARCHAR(50) NOT NULL,
    "last_name" VARCHAR(50),
    "email" TEXT NOT NULL,
    "birthday" TIMESTAMP(3) NOT NULL,
    "death_date" TIMESTAMP(3),
    "gender" VARCHAR(1) NOT NULL DEFAULT 'M',
    "path_relationship" VARCHAR(255),

    CONSTRAINT "Person_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Person_email_key" ON "public"."Person"("email");
