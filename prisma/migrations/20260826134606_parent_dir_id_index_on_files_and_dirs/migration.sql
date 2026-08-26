-- CreateIndex
CREATE INDEX "Directory_parentDirId_idx" ON "Directory"("parentDirId");

-- CreateIndex
CREATE INDEX "File_parentDirId_idx" ON "File"("parentDirId");
