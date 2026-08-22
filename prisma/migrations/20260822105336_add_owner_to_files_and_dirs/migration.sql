/*
  Warnings:

  - Added the required column `ownerId` to the `File` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_root_dir_id_fkey";

-- AlterTable
ALTER TABLE "Directory" ADD COLUMN     "ownerId" INTEGER NOT NULL DEFAULT 2;

-- AlterTable
ALTER TABLE "File" ADD COLUMN     "ownerId" INTEGER NOT NULL;

-- AddForeignKey
ALTER TABLE "Directory" ADD CONSTRAINT "Directory_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
