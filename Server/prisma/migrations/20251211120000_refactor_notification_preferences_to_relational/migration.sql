-- DropTable
DROP TABLE IF EXISTS "notification_preference";

-- CreateTable
CREATE TABLE "notification_type" (
    "id" SERIAL NOT NULL,
    "code" VARCHAR(50) NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" TEXT,
    "is_active" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_type_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "user_notification_preference" (
    "id" SERIAL NOT NULL,
    "user_id" INTEGER NOT NULL,
    "notification_type_id" INTEGER NOT NULL,
    "app_enabled" BOOLEAN NOT NULL DEFAULT true,
    "mail_enabled" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "user_notification_preference_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "notification_type_code_key" ON "notification_type"("code");

-- CreateIndex
CREATE UNIQUE INDEX "user_notification_preference_user_id_notification_type_id_key" ON "user_notification_preference"("user_id", "notification_type_id");

-- CreateIndex
CREATE INDEX "user_notification_preference_user_id_idx" ON "user_notification_preference"("user_id");

-- CreateIndex
CREATE INDEX "user_notification_preference_notification_type_id_idx" ON "user_notification_preference"("notification_type_id");

-- AddForeignKey
ALTER TABLE "user_notification_preference" ADD CONSTRAINT "user_notification_preference_notification_type_id_fkey" FOREIGN KEY ("notification_type_id") REFERENCES "notification_type"("id") ON DELETE CASCADE ON UPDATE CASCADE;
