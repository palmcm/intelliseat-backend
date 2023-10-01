/*
  Warnings:

  - You are about to drop the column `nodeId` on the `TempLog` table. All the data in the column will be lost.
  - A unique constraint covering the columns `[nodeGroup]` on the table `TempLog` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `nodeGroup` to the `TempLog` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE "TempLog" DROP CONSTRAINT "TempLog_nodeId_fkey";

-- AlterTable
ALTER TABLE "TempLog" DROP COLUMN "nodeId",
ADD COLUMN     "nodeGroup" TEXT NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "TempLog_nodeGroup_key" ON "TempLog"("nodeGroup");
