-- AlterTable
ALTER TABLE "TempLog" ADD COLUMN     "last_logged_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;
