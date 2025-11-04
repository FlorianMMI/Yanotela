-- CreateTable
CREATE TABLE "note_folder" (
    "note_id" TEXT NOT NULL,
    "folder_id" TEXT NOT NULL,
    "user_id" INTEGER NOT NULL,
    "addedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "note_folder_pkey" PRIMARY KEY ("note_id")
);

-- CreateIndex
CREATE INDEX "note_folder_folder_id_idx" ON "note_folder"("folder_id");

-- CreateIndex
CREATE INDEX "note_folder_user_id_idx" ON "note_folder"("user_id");

-- AddForeignKey
ALTER TABLE "note_folder" ADD CONSTRAINT "note_folder_note_id_fkey" FOREIGN KEY ("note_id") REFERENCES "Note"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "note_folder" ADD CONSTRAINT "note_folder_folder_id_fkey" FOREIGN KEY ("folder_id") REFERENCES "Dossier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "note_folder" ADD CONSTRAINT "note_folder_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
