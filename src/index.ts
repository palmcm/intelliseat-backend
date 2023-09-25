import { Elysia, t } from "elysia";
import { swagger } from "@elysiajs/swagger";
import { cors } from "@elysiajs/cors";
import prisma from "./prisma";
import { daydetails } from "./service/daydetails";

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

enum Side {
  left = "left",
  right = "right",
}

app.get("/", () => "Hello Elysia");

app.group("/sensor", (app) => {
  app.get(
    "/register",
    async () => {
      return { nodeId: 1 };
    },
    {
      body: t.Object({
        nodeName: t.String(),
        nodeGroup: t.String(),
      }),
      response: {
        200: t.Object({
          nodeId: t.Number(),
        }),
      },
    }
  );

  app.post("/log", async () => {}, {
    body: t.Object({
      nodeId: t.Number(),
      weight: t.Number(),
    }),
  });

  return app;
});

app.group("/sitdata", (app) => {
  app.get(
    "/days",
    () => {
      const node = "node-1";
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
    async () => {
      const res = await daydetails();

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
