/*
  Warnings:

  - You are about to drop the column `CreatedAt` on the `Note` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "public"."Note" DROP COLUMN "CreatedAt",
ADD COLUMN     "ModifiedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
