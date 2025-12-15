/*
  Warnings:

  - You are about to drop the column `tag` on the `Note` table. All the data in the column will be lost.
  - You are about to drop the `commentaire` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "public"."commentaire" DROP CONSTRAINT "commentaire_authorId_fkey";

-- DropForeignKey
ALTER TABLE "public"."commentaire" DROP CONSTRAINT "commentaire_id_note_fkey";

-- AlterTable
ALTER TABLE "Note" DROP COLUMN "tag",
ADD COLUMN     "isPublic" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable
ALTER TABLE "notification_type" ALTER COLUMN "code" SET DATA TYPE TEXT,
ALTER COLUMN "name" SET DATA TYPE TEXT;

-- DropTable
DROP TABLE "public"."commentaire";
