import { Elysia, t } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { cors } from "@elysiajs/cors";
import { daydetails } from "./service/daydetails";
import { daysData } from "./service/daysdata";
import { Side } from "@prisma/client";
import { logToDB } from "./service/logtodb";
import { mockData } from "./service/mockdata";

const app = new Elysia().use(swagger()).use(
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
);

app.get("/", () => "Hello Elysia");

app.group("/sensor", (app) => {
  app.post(
    "/log",
    async ({ body }) => {
      await logToDB(body.nodeGroup, body.sensor);
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

  app.post(
    "/mock",
    async ({ body }) => {
      await mockData(body.nodeGroup, body.date, body.sensor);
      return { success: true };
    },
    {
      body: t.Object({
        nodeGroup: t.String(),
        date: t.Date(),
        sensor: t.Array(
          t.Object({
            nodeSide: t.Enum(Side),
            weight: t.Number(),
          })
        ),
      }),
    }
  );

  return app;
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
              date: t.Date(),
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
              start: t.Date(),
              end: t.Date(),
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
