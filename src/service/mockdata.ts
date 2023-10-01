import { Side } from "@prisma/client";
import prisma from "../prisma";

const addLogToDB = async (
  nodeGroup: string,
  sensor: { nodeSide: Side; weight: number },
  Datenoms: Date
) => {
  await prisma.log.create({
    data: {
      weight: sensor.weight,
      node: {
        connectOrCreate: {
          where: {
            nodeGroup_nodeSide: {
              nodeGroup: nodeGroup,
              nodeSide: sensor.nodeSide,
            },
          },
          create: {
            nodeGroup: nodeGroup,
            nodeSide: sensor.nodeSide,
          },
        },
      },
      logged_at: Datenoms,
    },
  });
};

export const mockData = async (
  nodeGroup: string,
  date: Date,
  data: { nodeSide: Side; weight: number }[]
) => {
  const now = date.getTime();
  const Datenoms = new Date(now - (now % 1000));
  for (let i = 0; i < data.length; i++) {
    await addLogToDB(nodeGroup, data[i], Datenoms);
  }
};
