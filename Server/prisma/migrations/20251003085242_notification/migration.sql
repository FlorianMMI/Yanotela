-- CreateTable
CREATE TABLE "Notification" (
    "id_notification" SERIAL NOT NULL,
    "id_note" TEXT NOT NULL,
    "id_user" INTEGER NOT NULL,
    "isAccept" INTEGER NOT NULL DEFAULT 2,

    CONSTRAINT "Notification_pkey" PRIMARY KEY ("id_notification")
);

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_id_note_fkey" FOREIGN KEY ("id_note") REFERENCES "Note"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Notification" ADD CONSTRAINT "Notification_id_user_fkey" FOREIGN KEY ("id_user") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
