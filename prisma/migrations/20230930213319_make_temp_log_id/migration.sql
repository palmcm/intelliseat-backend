-- DropIndex
DROP INDEX "TempLog_id_logged_at_key";

-- AlterTable
ALTER TABLE "TempLog" ADD CONSTRAINT "TempLog_pkey" PRIMARY KEY ("id");
