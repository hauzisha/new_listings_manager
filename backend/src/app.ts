import { Hono } from "hono";
import { cors } from "hono/cors";
import { logger } from "hono/logger";
import "./env";
import { auth } from "./auth";
import { authExtRouter } from "./routes/auth-ext";
import { notificationsRouter } from "./routes/notifications";
import { listingsRouter } from "./routes/listings";
import { trackingLinksRouter } from "./routes/tracking-links";
import { inquiriesRouter } from "./routes/inquiries";
import { commissionsRouter } from "./routes/commissions";
import { promoterRouter } from "./routes/promoter";
import { adminUsersRouter } from "./routes/admin/users";
import { adminSettingsRouter } from "./routes/admin/settings";
import { adminStatsRouter } from "./routes/admin/stats";
import { uploadRouter } from "./routes/upload";
import { prisma } from "./prisma";

const app = new Hono<{
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
  };
}>();

// CORS middleware
const allowed = [
  /^http:\/\/localhost(:\d+)?$/,
  /^http:\/\/127\.0\.0\.1(:\d+)?$/,
  /^https:\/\/[a-z0-9-]+\.dev\.vibecode\.run$/,
  /^https:\/\/[a-z0-9-]+\.vibecode\.run$/,
  /^https:\/\/[a-z0-9-]+\.vibecodeapp\.com$/,
  /^https:\/\/[a-z0-9-]+\.vibecode\.dev$/,
  /^https:\/\/vibecode\.dev$/,
  /^https:\/\/[a-z0-9-]+\.vercel\.app$/,
];

app.use(
  "*",
  cors({
    origin: (origin) => (origin && allowed.some((re) => re.test(origin)) ? origin : null),
    credentials: true,
  })
);

// Logging
app.use("*", logger());

// Auth session middleware — cookie-based, the standard way
app.use("*", async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers });
  c.set("user", session?.user ?? null);
  c.set("session", session?.session ?? null);
  await next();
});

// Health check
app.get("/health", (c) => c.json({ status: "ok" }));

// One-time admin bootstrap — promotes admin@hauzisha.co.ke to ADMIN if no admin exists yet
// Safe to leave in: only works if there is currently no ADMIN user
app.post("/api/admin/bootstrap", async (c) => {
  const existingAdmin = await prisma.user.findFirst({ where: { role: "ADMIN" } });
  if (existingAdmin) {
    return c.json({ error: { message: "An admin already exists", code: "ALREADY_EXISTS" } }, 409);
  }
  const user = await prisma.user.findUnique({ where: { email: "admin@hauzisha.co.ke" } });
  if (!user) {
    return c.json({ error: { message: "admin@hauzisha.co.ke not found", code: "NOT_FOUND" } }, 404);
  }
  await prisma.user.update({
    where: { id: user.id },
    data: {
      role: "ADMIN",
      isApproved: true,
      permissions: JSON.stringify(["manage_users","manage_listings","manage_commissions","view_all","approve_users","system_settings"]),
    },
  });
  return c.json({ data: { message: "Admin promoted successfully", userId: user.id } });
});

// Extended auth routes (register, user-status) — must be mounted BEFORE Better Auth catch-all
app.route("/api/auth", authExtRouter);

// Better Auth routes
app.on(["GET", "POST"], "/api/auth/*", (c) => auth.handler(c.req.raw));

// Current user endpoint
app.get("/api/me", (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);
  return c.json({ data: user });
});

// Notifications routes
app.route("/api", notificationsRouter);

// Listings routes
app.route("/api", listingsRouter);

// Tracking links routes
app.route("/api", trackingLinksRouter);

// Inquiries routes
app.route("/api", inquiriesRouter);

// Commissions routes
app.route("/api", commissionsRouter);

// Promoter routes
app.route("/api", promoterRouter);

// Admin routes
app.route("/api/admin", adminUsersRouter);
app.route("/api/admin", adminSettingsRouter);
app.route("/api/admin", adminStatsRouter);

// Upload routes
app.route("/api", uploadRouter);

export default app;
