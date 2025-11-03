-- CreateTable
CREATE TABLE "Dossier" (
    "id" TEXT NOT NULL,
    "Nom" TEXT NOT NULL,
    "Description" TEXT,
    "CouleurTag" TEXT NOT NULL DEFAULT '#D4AF37',
    "authorId" INTEGER NOT NULL,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ModifiedAt" TIMESTAMP(3) NOT NULL,
    "deletedAt" TIMESTAMP(3),

    CONSTRAINT "Dossier_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "Dossier" ADD CONSTRAINT "Dossier_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
