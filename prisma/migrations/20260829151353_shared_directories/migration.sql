-- CreateTable
CREATE TABLE "SharedDirectory" (
    "uuid" UUID NOT NULL,
    "dirId" INTEGER NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "SharedDirectory_uuid_key" ON "SharedDirectory"("uuid");

-- CreateIndex
CREATE UNIQUE INDEX "SharedDirectory_dirId_key" ON "SharedDirectory"("dirId");

-- AddForeignKey
ALTER TABLE "SharedDirectory" ADD CONSTRAINT "SharedDirectory_dirId_fkey" FOREIGN KEY ("dirId") REFERENCES "Directory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
