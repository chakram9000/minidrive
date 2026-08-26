-- DropForeignKey
ALTER TABLE "Directory" DROP CONSTRAINT "Directory_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "Directory" DROP CONSTRAINT "Directory_parentDirId_fkey";

-- DropForeignKey
ALTER TABLE "File" DROP CONSTRAINT "File_ownerId_fkey";

-- DropForeignKey
ALTER TABLE "File" DROP CONSTRAINT "File_parentDirId_fkey";

-- AddForeignKey
ALTER TABLE "Directory" ADD CONSTRAINT "Directory_parentDirId_fkey" FOREIGN KEY ("parentDirId") REFERENCES "Directory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Directory" ADD CONSTRAINT "Directory_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_parentDirId_fkey" FOREIGN KEY ("parentDirId") REFERENCES "Directory"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "File" ADD CONSTRAINT "File_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
