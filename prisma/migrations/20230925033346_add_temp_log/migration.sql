-- CreateTable
CREATE TABLE "TempLog" (
    "id" SERIAL NOT NULL,
    "logged_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "temp" DOUBLE PRECISION NOT NULL,
    "timeAdded" INTEGER NOT NULL,
    "nodeId" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "TempLog_id_logged_at_key" ON "TempLog"("id", "logged_at");

-- AddForeignKey
ALTER TABLE "TempLog" ADD CONSTRAINT "TempLog_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "Node"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
