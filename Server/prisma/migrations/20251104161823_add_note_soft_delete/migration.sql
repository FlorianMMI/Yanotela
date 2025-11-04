/*
  Warnings:

  - You are about to drop the `note_dossier` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."note_dossier" DROP CONSTRAINT "note_dossier_dossier_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."note_dossier" DROP CONSTRAINT "note_dossier_note_id_fkey";

-- DropForeignKey
ALTER TABLE "public"."note_dossier" DROP CONSTRAINT "note_dossier_user_id_fkey";

-- AlterTable
ALTER TABLE "Note" ADD COLUMN     "deletedAt" TIMESTAMP(3);

-- DropTable
DROP TABLE "public"."note_dossier";
