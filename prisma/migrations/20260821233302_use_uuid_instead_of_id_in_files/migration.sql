/*
  Warnings:

  - The primary key for the `File` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `File` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[uuid]` on the table `File` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `uuid` to the `File` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE "File" DROP CONSTRAINT "File_pkey",
DROP COLUMN "id",
ADD COLUMN     "uuid" UUID NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "File_uuid_key" ON "File"("uuid");
