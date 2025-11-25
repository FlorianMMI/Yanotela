-- AlterTable
ALTER TABLE "Note" ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "commentaire" (
    "id" TEXT NOT NULL,
    "text" TEXT NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "authorId" INTEGER NOT NULL,
    "id_note" TEXT NOT NULL,

    CONSTRAINT "commentaire_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "commentaire" ADD CONSTRAINT "commentaire_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "commentaire" ADD CONSTRAINT "commentaire_id_note_fkey" FOREIGN KEY ("id_note") REFERENCES "Note"("id") ON DELETE CASCADE ON UPDATE CASCADE;
