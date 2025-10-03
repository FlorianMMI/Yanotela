-- AlterTable
ALTER TABLE "User" ADD COLUMN     "deleted_at" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "Permission" (
    "id_note" TEXT NOT NULL,
    "id_user" INTEGER NOT NULL,
    "role" INTEGER NOT NULL,

    CONSTRAINT "Permission_pkey" PRIMARY KEY ("id_note","id_user")
);

-- AddForeignKey
ALTER TABLE "Permission" ADD CONSTRAINT "Permission_id_note_fkey" FOREIGN KEY ("id_note") REFERENCES "Note"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Permission" ADD CONSTRAINT "Permission_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
