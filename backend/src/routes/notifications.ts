import { Hono } from "hono";
import { auth } from "../auth";
import { prisma } from "../prisma";

type AppVariables = {
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
  };
};

const notificationsRouter = new Hono<AppVariables>();

// GET /api/notifications — 20 most recent for current user
notificationsRouter.get("/notifications", async (c) => {
  const sessionUser = c.get("user");
  if (!sessionUser) {
    return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);
  }

  const notifications = await prisma.notification.findMany({
    where: { recipientId: sessionUser.id },
    orderBy: { createdAt: "desc" },
    take: 20,
    select: {
      id: true,
      type: true,
      title: true,
      message: true,
      link: true,
      isRead: true,
      createdAt: true,
      recipientId: true,
    },
  });

  return c.json({ data: notifications });
});

// GET /api/notifications/unread-count
notificationsRouter.get("/notifications/unread-count", async (c) => {
  const sessionUser = c.get("user");
  if (!sessionUser) {
    return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);
  }

  const count = await prisma.notification.count({
    where: { recipientId: sessionUser.id, isRead: false },
  });

  return c.json({ data: { count } });
});

// POST /api/notifications/:id/read — mark single notification as read
notificationsRouter.post("/notifications/:id/read", async (c) => {
  const sessionUser = c.get("user");
  if (!sessionUser) {
    return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);
  }

  const { id } = c.req.param();

  const notification = await prisma.notification.findUnique({
    where: { id },
    select: { recipientId: true },
  });

  if (!notification) {
    return c.json({ error: { message: "Notification not found", code: "NOT_FOUND" } }, 404);
  }

  if (notification.recipientId !== sessionUser.id) {
    return c.json({ error: { message: "Forbidden", code: "FORBIDDEN" } }, 403);
  }

  await prisma.notification.update({
    where: { id },
    data: { isRead: true },
  });

  return c.json({ data: { success: true } });
});

// POST /api/notifications/mark-all-read — mark all notifications for user as read
notificationsRouter.post("/notifications/mark-all-read", async (c) => {
  const sessionUser = c.get("user");
  if (!sessionUser) {
    return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);
  }

  await prisma.notification.updateMany({
    where: { recipientId: sessionUser.id, isRead: false },
    data: { isRead: true },
  });

  return c.json({ data: { success: true } });
});

export { notificationsRouter };
