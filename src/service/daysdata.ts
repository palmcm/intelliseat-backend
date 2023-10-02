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
  const last_logged_at: { [key: string]: Date } = {};
  res.forEach((timeLog) => {
    const date = timeLog.logged_at.toDateString();
    console.log(date);
    if (days[date] == null) {
      days[date] = 0;
    } else {
      if (
        last_logged_at[date] != null &&
        timeLog.logged_at.getDay() < 2 &&
        timeLog.logged_at.getMonth() < 10
      ) {
        days[date] +=
          timeLog.logged_at.getTime() - last_logged_at[date].getTime();
      } else {
        days[date]++;
      }
    }
    last_logged_at[date] = timeLog.logged_at;
  });
  const daysWithSitTime = Object.entries(days);
  return daysWithSitTime
    .map((day) => {
      return {
        date: new Date(day[0]).toISOString(),
        sitHour: parseFloat((day[1] / 3600).toFixed(2)),
      };
    })
    .sort();
};
