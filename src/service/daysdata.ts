import { SIT_THRESHOLD } from "../constant";
import prisma from "../prisma";

export const daysData = async (nodeGroup: string) => {
  const res = await prisma.log.groupBy({
    by: ["logged_at"],
    _sum: {
      weight: true,
    },
    where: {
      node: {
        nodeGroup,
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
    if (days[date] == null) {
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
        sitHour: parseFloat((day[1] / 3600).toFixed(2)),
      };
    })
    .sort();
};
