/*
  Warnings:

  - You are about to drop the column `nodeName` on the `Node` table. All the data in the column will be lost.
  - Added the required column `nodeSide` to the `Node` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "Side" AS ENUM ('LEFT', 'RIGHT');

-- AlterTable
ALTER TABLE "Node" DROP COLUMN "nodeName",
ADD COLUMN     "nodeSide" "Side" NOT NULL;
