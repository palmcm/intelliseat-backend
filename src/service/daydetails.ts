import { Log, Side } from "@prisma/client";
import prisma from "../prisma";
import { SENSOR_THRESHOLD, SIT_THRESHOLD } from "../constant";

export const daydetails = async (nodeGroup: string) => {
  const res = await prisma.log.findMany({
    where: {
      logged_at: {
        gte: new Date(Date.now() - 1000 * 60 * 60 * 24),
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
  let startBadPostureTime: Date = new Date(Date.now() - 1000 * 60 * 60 * 24);
  let badPostureSide: Side = Side.LEFT;
  for (let i = 0; i < timelength; i++) {
    let bad: boolean = false;
    let weight: number = 0;
    let leftweight: number = 0;
    let rightweight: number = 0;
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
      sitTotalTime++;
      consecutiveSitTime++;
      if (bad) {
        badPostureTime++;
        if (!isBadPosture) {
          startBadPostureTime = logbyside[sideList[0]][i].logged_at;
          badPostureSide = leftweight > rightweight ? Side.LEFT : Side.RIGHT;
          isBadPosture = true;
        }
      } else {
        if (isBadPosture) {
          badPosture.push({
            start: startBadPostureTime,
            end: logbyside[sideList[0]][i].logged_at,
            side: badPostureSide,
          });
          isBadPosture = false;
        }
      }
    } else {
      consecutiveSitTime = 0;
      if (isBadPosture) {
        badPosture.push({
          start: startBadPostureTime,
          end: logbyside[sideList[0]][i].logged_at,
          side: badPostureSide,
        });
        isBadPosture = false;
      }
    }
  }
  return {
    consecutiveSitMin: parseFloat((consecutiveSitTime / 60).toFixed(2)),
    sitTotal: parseFloat((sitTotalTime / 60).toFixed(2)),
    badSitMin: parseFloat((badPostureTime / 60).toFixed(2)),
    badPosture: badPosture,
  };
};
