import { Side } from "@prisma/client";
import prisma from "../prisma";
import { SIT_THRESHOLD, SIT_TIME_NOTIFICATION } from "../constant";

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

export const logToDB = async (
  nodeGroup: string,
  data: { nodeSide: Side; weight: number }[]
) => {
  const now = Date.now();
  const Datenoms = new Date(now - (now % 1000));
  for (let i = 0; i < data.length; i++) {
    await addLogToDB(nodeGroup, data[i], Datenoms);
  }
  let weight = data.map((sensor) => sensor.weight).reduce((a, b) => a + b, 0);
  if (weight < SIT_THRESHOLD) return;
  const startSit = await prisma.tempLog.findFirst({
    where: {
      nodeGroup,
    },
  });
  if (!startSit) {
    await prisma.tempLog.create({
      data: {
        temp: weight,
        logged_at: Datenoms,
        timeAdded: 0,
        nodeGroup,
      },
    });
  } else {
    if (startSit.timeAdded > 1000 * 60 * 60 * SIT_TIME_NOTIFICATION) {
      //send webhook to discord
      return;
    }

    if (Datenoms.getTime() - startSit.logged_at.getTime() > 1000 * 10) {
      await prisma.tempLog.delete({
        where: {
          id: startSit.id,
        },
      });
      return;
    }

    await prisma.tempLog.update({
      where: {
        id: startSit.id,
      },
      data: {
        temp: weight,
        logged_at: Datenoms,
        timeAdded: startSit.timeAdded + 1,
      },
    });
  }
};
