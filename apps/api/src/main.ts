import Fastify from "fastify";
import fastifyJwt from "@fastify/jwt";
import fastifySensible from "@fastify/sensible";
import { pool } from "./db/client.js";
import { auditPlugin } from "./modules/audit/plugin.js";
import { adminRoutes } from "./modules/admin/routes.js";
import { authPlugin } from "./modules/auth/plugin.js";
import { authRoutes } from "./modules/auth/routes.js";
import { confidentialityRoutes } from "./modules/confidentiality/routes.js";
import { jobRoutes } from "./modules/jobs/routes.js";
import { linkedinIntegrationRoutes } from "./modules/integrations/linkedin/routes.js";
import { workspaceContextPlugin } from "./modules/workspace/plugin.js";
import { workspaceRoutes } from "./modules/workspace/routes.js";

const app = Fastify({ logger: true });

app.register(fastifySensible);
app.register(fastifyJwt, {
  secret: process.env.JWT_SECRET ?? "dev-only-secret-change-me",
  sign: {
    expiresIn: process.env.JWT_EXPIRES_IN ?? "15m"
  }
});
app.register(authPlugin);
app.register(workspaceContextPlugin);
app.register(auditPlugin);

app.get("/health", async () => {
  return { status: "ok", service: "api" };
});

app.get("/health/db", async () => {
  const result = await pool.query("SELECT NOW() AS now");
  return { status: "ok", service: "api", databaseTime: result.rows[0]?.now ?? null };
});

app.register(authRoutes);
app.register(workspaceRoutes);
app.register(confidentialityRoutes);
app.register(jobRoutes);
app.register(linkedinIntegrationRoutes);
app.register(adminRoutes);

const port = Number(process.env.PORT ?? 3001);

app.listen({ port, host: "0.0.0.0" }).then(() => {
  const raw = process.env.DATABASE_URL ?? "(default in db/client.ts)";
  try {
    const u = new URL(raw);
    app.log.info(
      { dbHost: u.hostname, dbPort: u.port || "5432", database: u.pathname.replace(/^\//, "") },
      "API database target from DATABASE_URL"
    );
  } catch {
    app.log.warn({ DATABASE_URL: raw }, "DATABASE_URL is not a valid URL; check connection config");
  }
}).catch((err) => {
  app.log.error(err);
  process.exit(1);
});
