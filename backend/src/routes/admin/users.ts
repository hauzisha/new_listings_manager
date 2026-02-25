import { Hono } from "hono";
import { z } from "zod";
import { auth } from "../../auth";
import { prisma } from "../../prisma";
import { createNotification } from "../../lib/notifications";

type AppVariables = {
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
  };
};

const adminUsersRouter = new Hono<AppVariables>();

// Helper: fetch Prisma user and assert ADMIN role
async function requireAdmin(
  sessionUserId: string
): Promise<{ id: string; role: string } | null> {
  const user = await prisma.user.findUnique({
    where: { id: sessionUserId },
    select: { id: true, role: true },
  });
  if (!user || user.role !== "ADMIN") return null;
  return user;
}

const filterSchema = z.enum(["all", "pending", "agents", "promoters", "admins"]).default("all");

// GET /api/admin/users
adminUsersRouter.get("/users", async (c) => {
  const sessionUser = c.get("user");
  if (!sessionUser) {
    return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);
  }

  const admin = await requireAdmin(sessionUser.id);
  if (!admin) {
    return c.json({ error: { message: "Forbidden", code: "FORBIDDEN" } }, 403);
  }

  const filterRaw = c.req.query("filter") ?? "all";
  const filterParsed = filterSchema.safeParse(filterRaw);
  const filter = filterParsed.success ? filterParsed.data : "all";

  type WhereClause = {
    role?: string;
    isApproved?: boolean;
  };

  let where: WhereClause = {};
  if (filter === "pending") {
    where = { isApproved: false };
  } else if (filter === "agents") {
    where = { role: "AGENT" };
  } else if (filter === "promoters") {
    where = { role: "PROMOTER" };
  } else if (filter === "admins") {
    where = { role: "ADMIN" };
  }

  const users = await prisma.user.findMany({
    where,
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      role: true,
      isApproved: true,
      createdAt: true,
      referrer: {
        select: {
          name: true,
          email: true,
        },
      },
    },
  });

  return c.json({ data: users });
});

// POST /api/admin/users/:id/approve
adminUsersRouter.post("/users/:id/approve", async (c) => {
  const sessionUser = c.get("user");
  if (!sessionUser) {
    return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);
  }

  const admin = await requireAdmin(sessionUser.id);
  if (!admin) {
    return c.json({ error: { message: "Forbidden", code: "FORBIDDEN" } }, 403);
  }

  const { id } = c.req.param();

  const targetUser = await prisma.user.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!targetUser) {
    return c.json({ error: { message: "User not found", code: "NOT_FOUND" } }, 404);
  }

  await prisma.user.update({
    where: { id },
    data: {
      isApproved: true,
      approvedById: admin.id,
    },
  });

  await createNotification({
    recipientId: id,
    type: "USER_APPROVED",
    title: "Account Approved",
    message: "Your Hauzisha account has been approved. You can now sign in.",
  });

  return c.json({ data: { success: true } });
});

// POST /api/admin/users/:id/reject
adminUsersRouter.post("/users/:id/reject", async (c) => {
  const sessionUser = c.get("user");
  if (!sessionUser) {
    return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);
  }

  const admin = await requireAdmin(sessionUser.id);
  if (!admin) {
    return c.json({ error: { message: "Forbidden", code: "FORBIDDEN" } }, 403);
  }

  const { id } = c.req.param();

  const targetUser = await prisma.user.findUnique({
    where: { id },
    select: { id: true },
  });

  if (!targetUser) {
    return c.json({ error: { message: "User not found", code: "NOT_FOUND" } }, 404);
  }

  // Better Auth cascades sessions/accounts on user delete
  await prisma.user.delete({ where: { id } });

  return c.json({ data: { success: true } });
});

export { adminUsersRouter };
