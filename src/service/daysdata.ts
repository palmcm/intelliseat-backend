import { SIT_THRESHOLD } from "../constant";
import prisma from "../prisma";

export const daysData = async () => {
  const res = await prisma.log.groupBy({
    by: ["logged_at"],
    _sum: {
      weight: true,
    },
    where: {
      node: {
        nodeGroup: "chair-1", //TODO: change to varriable
      },
    },
    having: {
      weight: {
        _sum: {
          gte: SIT_THRESHOLD,
        },
      },
    },
  });
  const days: { [key: string]: number } = {};
  res.forEach((timeLog) => {
    const date = timeLog.logged_at.toDateString();
    if (!days[date]) {
      days[date] = 0;
    } else {
      days[date]++;
    }
  });
  const daysWithSitTime = Object.entries(days);
  return daysWithSitTime
    .map((day) => {
      return {
        date: new Date(day[0]),
        sitMin: day[1] / 60,
      };
    })
    .sort();
};
