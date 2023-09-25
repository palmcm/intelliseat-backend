import { Log } from "@prisma/client";
import prisma from "../prisma";

export const daydetails = async () => {
  const res = await prisma.log.findMany({
    where: {
      logged_at: {
        gte: new Date(Date.now() - 1000 * 60 * 60 * 24),
      },
      node: {
        nodeGroup: "chair-1", //TODO: change to varriable
      },
    },
    orderBy: {
      logged_at: "asc",
    },
  });
  //find consecutive sit hour, sit total, and bad posture (|1-2| > 10) from weight data
  let badPosture = [];
  const logbynode: { [node: number]: Log[] } = {};
  const nodebyside: { [node: number]: string } = {};
  for (let i = 0; i < res.length; i++) {
    const log = res[i];
    if (!logbynode[log.nodeId]) {
      logbynode[log.nodeId] = [];
    }
    logbynode[log.nodeId].push(log);
  }
  // Constants
  const SENSOR_THRESHOLD = 50; // Define your threshold for sensor difference
  const SIT_THRESHOLD = 200; // Define your threshold for detecting a person sitting
  const nodelist: string[] = Object.keys(logbynode);
  const timelength = logbynode[parseInt(nodelist[0])].length;
  let sitTotalTime = 0;
  let consecutiveSitTime = 0;
  let isBadPosture = false;
  let badPostureTime = 0;
  let startBadPostureTime: Date = new Date(Date.now() - 1000 * 60 * 60 * 24);
  let badPostureSide = "";
  for (let i = 0; i < timelength; i++) {
    let sit: boolean = false;
    let bad: boolean = false;
    let weight: number = 0;
    let leftweight: number = 0;
    let rightweight: number = 0;
    for (let j = 0; j < nodelist.length; j++) {
      const log = logbynode[parseInt(nodelist[j])][i];
      const side = nodebyside[parseInt(nodelist[j])];
      weight += log.weight;
      if (side === "left") {
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
          startBadPostureTime = logbynode[parseInt(nodelist[0])][i].logged_at;
          badPostureSide = leftweight > rightweight ? "left" : "right";
          isBadPosture = true;
        }
      } else {
        if (isBadPosture) {
          badPosture.push({
            start: startBadPostureTime,
            end: logbynode[parseInt(nodelist[0])][i].logged_at,
            side: badPostureSide,
          });
          isBadPosture = false;
        }
      }
    } else {
      consecutiveSitTime = 0;
      badPosture.push({
        start: startBadPostureTime,
        end: logbynode[parseInt(nodelist[0])][i].logged_at,
        side: badPostureSide,
      });
      isBadPosture = false;
    }
  }
  return {
    consecutiveSitHour: consecutiveSitTime / 60,
    sitTotal: sitTotalTime / 60,
    badSitHour: badPostureTime / 60,
    badPosture: badPosture,
  };
};
