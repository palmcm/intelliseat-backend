/*
  Warnings:

  - A unique constraint covering the columns `[nodeGroup,nodeSide]` on the table `Node` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Node_nodeGroup_nodeSide_key" ON "Node"("nodeGroup", "nodeSide");
