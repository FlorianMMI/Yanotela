-- Migration: add_deleted_at_back
-- This migration restores the `deleted_at` column on the "User" table which was dropped
-- by a later migration. Prisma schema still references this column so the DB must have it.

ALTER TABLE "User"
ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP(3);
