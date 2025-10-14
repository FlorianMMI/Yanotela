-- AlterTable
ALTER TABLE "Note" ADD COLUMN     "modifierId" INTEGER;

-- AddForeignKey
ALTER TABLE "Note" ADD CONSTRAINT "Note_modifierId_fkey" FOREIGN KEY ("modifierId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
