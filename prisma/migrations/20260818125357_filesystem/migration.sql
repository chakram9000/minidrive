/*
  Warnings:

  - A unique constraint covering the columns `[root_dir_id]` on the table `User` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `root_dir_id` to the `User` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "User_password_key";

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "root_dir_id" INTEGER NOT NULL;

-- CreateTable
CREATE TABLE "Directory" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "parentDirId" INTEGER,

    CONSTRAINT "Directory_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "File" (
    "id" SERIAL NOT NULL,
    "name" TEXT NOT NULL,
    "system_path" TEXT NOT NULL,
    "parentDirId" INTEGER NOT NULL,

    CONSTRAINT "File_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "File_system_path_key" ON "File"("system_path");

-- CreateIndex
CREATE UNIQUE INDEX "User_root_dir_id_key" ON "User"("root_dir_id");

-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_root_dir_id_fkey" FOREIGN KEY ("root_dir_id") REFERENCES "Directory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Directory" ADD CONSTRAINT "Directory_parentDirId_fkey" FOREIGN KEY ("parentDirId") REFERENCES "Directory"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_parentDirId_fkey" FOREIGN KEY ("parentDirId") REFERENCES "Directory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
