-- CreateTable
CREATE TABLE "notification_preference" (
    "user_id" INTEGER NOT NULL,
    "invitation_app" BOOLEAN NOT NULL DEFAULT true,
    "invitation_mail" BOOLEAN NOT NULL DEFAULT true,
    "removed_app" BOOLEAN NOT NULL DEFAULT true,
    "removed_mail" BOOLEAN NOT NULL DEFAULT true,
    "note_deleted_app" BOOLEAN NOT NULL DEFAULT true,
    "note_deleted_mail" BOOLEAN NOT NULL DEFAULT true,
    "role_changed_app" BOOLEAN NOT NULL DEFAULT true,
    "role_changed_mail" BOOLEAN NOT NULL DEFAULT true,
    "someone_invited_app" BOOLEAN NOT NULL DEFAULT true,
    "someone_invited_mail" BOOLEAN NOT NULL DEFAULT true,
    "collaborator_removed_app" BOOLEAN NOT NULL DEFAULT true,
    "collaborator_removed_mail" BOOLEAN NOT NULL DEFAULT true,
    "user_left_app" BOOLEAN NOT NULL DEFAULT true,
    "user_left_mail" BOOLEAN NOT NULL DEFAULT true,
    "comment_added_app" BOOLEAN NOT NULL DEFAULT true,
    "comment_added_mail" BOOLEAN NOT NULL DEFAULT true,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "notification_preference_pkey" PRIMARY KEY ("user_id")
);
