import { Elysia, t } from "elysia";
import { swagger } from "@elysiajs/swagger";

const app = new Elysia().use(swagger());

enum Side {
  left = "left",
  right = "right",
}

app.get("/", () => "Hello Elysia");

app.group("/sitdata", (app) => {
  app.get(
    "/days",
    () => {
      const now = Date.now();
      const sitHours = [2, 5, 7, 8, 4, 3, 6, 2, 3, 4, 5];
      const data = sitHours.map((sitHour, index) => {
        return {
          date: new Date(now - 1000 * 60 * 60 * 24 * index),
          sitHour,
        };
      });
      return {
        data,
      };
    },
    {
      response: {
        200: t.Object({
          data: t.Array(
            t.Object({
              date: t.Date(),
              sitHour: t.Number(),
            })
          ),
        }),
      },
    }
  );

  app.get(
    "/day",
    () => {
      return {
        consecutiveSitHour: 2,
        sitTotal: 8,
        badSitHour: 4,
        badPosture: [
          {
            start: new Date(),
            end: new Date(Date.now() + 1000 * 60 * 10),
            side: Side.left,
          },
          {
            start: new Date(Date.now() + 1000 * 60 * 60),
            end: new Date(Date.now() + 1000 * 60 * 60 + 1000 * 60 * 10),
            side: Side.right,
          },
        ],
      };
    },
    {
      response: {
        200: t.Object({
          consecutiveSitHour: t.Number(),
          sitTotal: t.Number(),
          badSitHour: t.Number(),
          badPosture: t.Array(
            t.Object({
              start: t.Date(),
              end: t.Date(),
              side: t.Enum(Side),
            })
          ),
        }),
      },
    }
  );

  return app;
});

app.listen(3000);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
