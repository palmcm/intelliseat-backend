import { Side } from "@prisma/client";
import prisma from "../prisma";
import {
  SIT_THRESHOLD,
  SIT_TIME_NOTIFICATION,
  STAND_UP_TIME,
} from "../constant";
import { sendToDiscord } from "./sendToDiscord";

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
  const startSit = await prisma.tempLog.findFirst({
    where: {
      nodeGroup,
    },
  });
  if (weight < SIT_THRESHOLD) return !!startSit;
  const update = Datenoms.getSeconds() == 0;
  if (!startSit) {
    await prisma.tempLog.create({
      data: {
        temp: 0,
        logged_at: Datenoms,
        timeAdded: 0,
        nodeGroup,
      },
    });
  } else {
    if (
      Datenoms.getTime() - startSit.last_logged_at.getTime() >
      1000 * 60 * STAND_UP_TIME
    ) {
      await prisma.tempLog.update({
        where: {
          id: startSit.id,
        },
        data: {
          temp: 0,
          logged_at: Datenoms,
          last_logged_at: Datenoms,
        },
      });
      return update;
    }

    if (
      startSit.temp === 0 &&
      Datenoms.getTime() - startSit.logged_at.getTime() >
        1000 * 60 * SIT_TIME_NOTIFICATION
    ) {
      sendToDiscord(60 * SIT_TIME_NOTIFICATION);
      await prisma.tempLog.update({
        where: {
          id: startSit.id,
        },
        data: {
          temp: 1,
          last_logged_at: Datenoms,
        },
      });
      return true;
    }

    await prisma.tempLog.update({
      where: {
        id: startSit.id,
      },
      data: {
        temp: weight,
        last_logged_at: Datenoms,
      },
    });
  }
  return update;
};
