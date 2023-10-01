import { Elysia, t } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { cors } from "@elysiajs/cors";
import { daydetails } from "./service/daydetails";
import { daysData } from "./service/daysdata";
import { Side } from "@prisma/client";
import { logToDB } from "./service/logtodb";

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

  return app;
});

app.group("/sitdata", (app) => {
  app.get(
    "/days",
    async () => {
      const data = await daysData();
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
              sitMin: t.Number(),
            })
          ),
        }),
      },
    }
  );

  app.get(
    "/day",
    async () => {
      const res = await daydetails();
      return res;
      // return {
      //   consecutiveSitMin: 2,
      //   sitTotal: 8,
      //   badSitMin: 4,
      //   badPosture: [
      //     {
      //       start: new Date(),
      //       end: new Date(Date.now() + 1000 * 60 * 10),
      //       side: Side.left,
      //     },
      //     {
      //       start: new Date(Date.now() + 1000 * 60 * 60),
      //       end: new Date(Date.now() + 1000 * 60 * 60 + 1000 * 60 * 10),
      //       side: Side.right,
      //     },
      //   ],
      // };
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
