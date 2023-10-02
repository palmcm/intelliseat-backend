import { Elysia, t } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { cors } from "@elysiajs/cors";
import { daydetails } from "./service/daydetails";
import { daysData } from "./service/daysdata";
import { Side } from "@prisma/client";
import { logToDB } from "./service/logtodb";
import { mockData } from "./service/mockdata";
import { ws } from "elysia";

const app = new Elysia()
  .use(swagger())
  .use(
    cors({
      origin: (request: Request): boolean => {
        const origin = request.headers.get("origin");
        if (!origin) {
          return false;
        }
        const allowedOrigins = [
          "http://127.0.0.1:5173",
          "https://intelliseat.pkhing.dev",
        ];
        return allowedOrigins.includes(origin);
      },
      credentials: true,
    })
  )
  .use(ws());

app.get("/", () => "Hello Elysia");

app.ws("/ws", {
  open(ws) {
    ws.send("Connected");
    ws.subscribe("daydata");
    ws.subscribe("test");
  },
});

app.group("/sensor", (appGroup) => {
  appGroup.post(
    "/log",
    async ({ body }) => {
      const update: boolean = await logToDB(body.nodeGroup, body.sensor);
      if (update)
        app.server!.publish(
          "daydata",
          JSON.stringify(await daydetails(body.nodeGroup))
        );
      return { success: true };
    },
    {
      body: t.Object({
        nodeGroup: t.String(),
        sensor: t.Array(
          t.Object({
            nodeSide: t.Enum(Side),
            weight: t.Number(),
          })
        ),
      }),
    }
  );

  appGroup.post(
    "/mock",
    async ({ body }) => {
      const date = new Date(body.date);
      if (date.toString() === "Invalid Date") return { success: false };
      await mockData(body.nodeGroup, date, body.sensor);
      return { success: true };
    },
    {
      body: t.Object({
        nodeGroup: t.String(),
        date: t.String(),
        sensor: t.Array(
          t.Object({
            nodeSide: t.Enum(Side),
            weight: t.Number(),
          })
        ),
      }),
    }
  );

  appGroup.post(
    "/test",
    async ({ body }) => {
      if (!body) body = "Test Socket";
      app.server!.publish("test", JSON.stringify(body));
    },
    {
      body: t.Any(),
    }
  );

  appGroup.post("/testWebSocket", async () => {
    app.server!.publish("daydata", JSON.stringify(await daydetails("chair-1")));
  });

  return appGroup;
});

app.group("/sitdata", (app) => {
  app.get(
    "/days",
    async () => {
      const data = await daysData("chair-1");
      return {
        data,
      };
    },
    {
      response: {
        200: t.Object({
          data: t.Array(
            t.Object({
              date: t.String(),
              sitHour: t.Number(),
            })
          ),
        }),
      },
    }
  );

  app.get(
    "/days/:nodeGroup",
    async ({ params }) => {
      const data = await daysData(params.nodeGroup);
      return {
        data,
      };
    },
    {
      params: t.Object({
        nodeGroup: t.String(),
      }),
      response: {
        200: t.Object({
          data: t.Array(
            t.Object({
              date: t.String(),
              sitHour: t.Number(),
            })
          ),
        }),
      },
    }
  );

  app.get(
    "/day",
    async () => {
      const res = await daydetails("chair-1");
      return res;
    },
    {
      response: {
        200: t.Object({
          consecutiveSitMin: t.Number(),
          sitTotal: t.Number(),
          badSitMin: t.Number(),
          badPosture: t.Array(
            t.Object({
              start: t.String(),
              end: t.String(),
              side: t.Enum(Side),
            })
          ),
        }),
      },
    }
  );

  app.get(
    "/day/:nodeGroup",
    async ({ params }) => {
      const res = await daydetails(params.nodeGroup);
      return res;
    },
    {
      params: t.Object({
        nodeGroup: t.String(),
      }),
      response: {
        200: t.Object({
          consecutiveSitMin: t.Number(),
          sitTotal: t.Number(),
          badSitMin: t.Number(),
          badPosture: t.Array(
            t.Object({
              start: t.String(),
              end: t.String(),
              side: t.Enum(Side),
            })
          ),
        }),
      },
    }
  );

  return app;
});

if (process.env.NODE_ENV === "production") {
  app.listen({
    port: 443,
    tls: {
      key: Bun.file(process.env.KEY_PATH!),
      cert: Bun.file(process.env.CERT_PATH!),
    },
  });
} else {
  app.listen({ port: 3000 });
}

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`
);
