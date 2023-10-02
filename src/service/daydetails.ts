import { Log, Side } from "@prisma/client";
import prisma from "../prisma";
import {
  BAD_POSITION_TIME,
  SENSOR_THRESHOLD,
  SIT_THRESHOLD,
} from "../constant";

export const daydetails = async (nodeGroup: string) => {
  const now = new Date();
  if (now.getUTCHours() < 17) {
    now.setUTCDate(now.getUTCDate() - 1);
  }
  now.setUTCHours(17, 0, 0, 0);
  const res = await prisma.log.findMany({
    where: {
      logged_at: {
        gte: now,
      },
      node: {
        nodeGroup,
      },
    },
    orderBy: {
      logged_at: "asc",
    },
    include: {
      node: true,
    },
  });
  //find consecutive sit Min, sit total, and bad posture (|1-2| > 10) from weight data
  let badPosture = [];
  const logbyside: { [side: string]: Log[] } = {};
  for (let i = 0; i < res.length; i++) {
    const log = res[i];
    if (!logbyside[log.node.nodeSide]) {
      logbyside[log.node.nodeSide] = [];
    }
    logbyside[log.node.nodeSide].push(log);
  }
  // Constants
  const sideList: string[] = Object.keys(logbyside);
  const timelength = logbyside[sideList[0]] ? logbyside[sideList[0]].length : 0;
  let sitTotalTime = 0;
  let consecutiveSitTime = 0;
  let isBadPosture = false;
  let badPostureTime = 0;
  let startBadPostureTime: Date = now;
  let badPostureSide: Side = Side.LEFT;
  for (let i = 1; i < timelength; i++) {
    let bad: boolean = false;
    let weight: number = 0;
    let leftweight: number = 0;
    let rightweight: number = 0;
    const before_logged_at = logbyside[sideList[0]][i - 1].logged_at;
    const now_logged_at = logbyside[sideList[0]][i].logged_at;
    for (let j = 0; j < sideList.length; j++) {
      const log = logbyside[sideList[j]][i];
      weight += log.weight;
      if (sideList[j] === Side.LEFT) {
        leftweight += log.weight;
      } else {
        rightweight += log.weight;
      }
    }
    if (Math.abs(leftweight - rightweight) > SENSOR_THRESHOLD) {
      bad = true;
    }
    if (weight > SIT_THRESHOLD) {
      sitTotalTime += now_logged_at.getTime() - before_logged_at.getTime();
      consecutiveSitTime +=
        now_logged_at.getTime() - before_logged_at.getTime();
      if (bad) {
        badPostureTime++;
        if (!isBadPosture) {
          startBadPostureTime = logbyside[sideList[0]][i].logged_at;
          badPostureSide = leftweight > rightweight ? Side.LEFT : Side.RIGHT;
          isBadPosture = true;
        }
      } else {
        if (isBadPosture) {
          if (
            now_logged_at.getTime() - startBadPostureTime.getTime() >
            1000 * BAD_POSITION_TIME
          ) {
            badPosture.push({
              start: startBadPostureTime.toISOString(),
              end: now_logged_at.toISOString(),
              side: badPostureSide,
            });
            badPostureTime +=
              now_logged_at.getTime() - startBadPostureTime.getTime();
          }
          isBadPosture = false;
        }
      }
    } else {
      consecutiveSitTime = 0;
      if (isBadPosture) {
        if (
          now_logged_at.getTime() - startBadPostureTime.getTime() >
          1000 * BAD_POSITION_TIME
        ) {
          badPosture.push({
            start: startBadPostureTime.toISOString(),
            end: now_logged_at.toISOString(),
            side: badPostureSide,
          });
          badPostureTime +=
            now_logged_at.getTime() - startBadPostureTime.getTime();
        }
        isBadPosture = false;
      }
    }
  }
  return {
    consecutiveSitMin: parseFloat((consecutiveSitTime / 1000 / 60).toFixed(2)),
    sitTotal: parseFloat((sitTotalTime / 1000 / 60).toFixed(2)),
    badSitMin: parseFloat((badPostureTime / 1000 / 60).toFixed(2)),
    badPosture: badPosture,
  };
};
