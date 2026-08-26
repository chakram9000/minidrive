-- AddForeignKey
ALTER TABLE "User" ADD CONSTRAINT "User_root_dir_id_fkey" FOREIGN KEY ("root_dir_id") REFERENCES "Directory"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
