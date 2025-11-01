-- CreateTable
CREATE TABLE "note_dossier" (
    "id" TEXT NOT NULL,
    "note_id" TEXT NOT NULL,
    "dossier_id" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "CreatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "note_dossier_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "note_dossier_note_id_user_id_key" ON "note_dossier"("note_id", "user_id");

-- AddForeignKey
ALTER TABLE "note_dossier" ADD CONSTRAINT "note_dossier_note_id_fkey" FOREIGN KEY ("note_id") REFERENCES "Note"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "note_dossier" ADD CONSTRAINT "note_dossier_dossier_id_fkey" FOREIGN KEY ("dossier_id") REFERENCES "Dossier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "note_dossier" ADD CONSTRAINT "note_dossier_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
