/*
  Warnings:

  - You are about to alter the column `username` on the `User` table. The data in that column could be lost. The data in that column will be cast from `Text` to `VarChar(64)`.

*/
-- DropIndex
DROP INDEX "User_id_key";

-- AlterTable
CREATE SEQUENCE user_id_seq;
ALTER TABLE "User" ALTER COLUMN "id" SET DEFAULT nextval('user_id_seq'),
ALTER COLUMN "username" SET DATA TYPE VARCHAR(64);
ALTER SEQUENCE user_id_seq OWNED BY "User"."id";
