/*
  Warnings:

  - You are about to drop the column `system_path` on the `File` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[full_path]` on the table `Directory` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `size` to the `File` table without a default value. This is not possible if the table is not empty.

*/
-- DropIndex
DROP INDEX "File_system_path_key";

-- AlterTable
ALTER TABLE "Directory" ADD COLUMN     "full_path" TEXT NOT NULL DEFAULT '/';

-- AlterTable
ALTER TABLE "File" DROP COLUMN "system_path",
ADD COLUMN     "size" INTEGER NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "Directory_full_path_key" ON "Directory"("full_path");
