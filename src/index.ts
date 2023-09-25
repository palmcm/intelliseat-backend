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
      return { data: [] };
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
        consecutiveSitHour: 0,
        sitTotal: 0,
        badSitHour: 0,
        badPosture: [],
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
