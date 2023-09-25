CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;
-- CreateTable
CREATE TABLE "Node" (
    "id" SERIAL NOT NULL,
    "nodeName" TEXT NOT NULL,

    CONSTRAINT "Node_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Log" (
    "id" SERIAL NOT NULL,
    "logged_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "weight" DOUBLE PRECISION NOT NULL,
    "nodeId" INTEGER NOT NULL
);

-- CreateIndex
CREATE UNIQUE INDEX "Log_id_logged_at_key" ON "Log"("id", "logged_at");

-- AddForeignKey
ALTER TABLE "Log" ADD CONSTRAINT "Log_nodeId_fkey" FOREIGN KEY ("nodeId") REFERENCES "Node"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

SELECT create_hypertable('"Log"', 'logged_at');