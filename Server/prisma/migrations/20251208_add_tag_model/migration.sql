-- Migration: Add Tag model and update Note table
-- Date: 2025-12-08

-- CreateTable Tag
CREATE TABLE "Tag" (
    "id" TEXT NOT NULL,
    "nom" TEXT NOT NULL,
    "couleur" TEXT NOT NULL,
    "userId" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Tag_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Tag_userId_idx" ON "Tag"("userId");

-- CreateIndex (unique constraint on userId + nom)
CREATE UNIQUE INDEX "Tag_userId_nom_key" ON "Tag"("userId", "nom");

-- AddForeignKey
ALTER TABLE "Tag" ADD CONSTRAINT "Tag_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable Note - Add tagId column
ALTER TABLE "Note" ADD COLUMN "tagId" TEXT;

-- AddForeignKey to Note
ALTER TABLE "Note" ADD CONSTRAINT "Note_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Migration des anciennes données tag (couleur) vers le nouveau système
-- Cette partie est optionnelle et peut être exécutée séparément si nécessaire
-- Pour l'instant, on garde l'ancienne colonne 'tag' pour compatibilité descendante
