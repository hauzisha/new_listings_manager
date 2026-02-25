import { Hono } from "hono";
import { z } from "zod";
import { auth } from "../../auth";
import { prisma } from "../../prisma";
import { getSetting, getSettingBool, getSettingNumber, setSetting } from "../../lib/settings";

type AppVariables = {
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
  };
};

const adminSettingsRouter = new Hono<AppVariables>();

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

const updateSettingsSchema = z.object({
  recruiter_bonus_enabled: z.boolean().optional(),
  recruiter_bonus_amount: z.number().optional(),
  agent_response_sla_hours: z.number().optional(),
  stale_inquiry_threshold_days: z.number().optional(),
});

// GET /api/admin/settings
adminSettingsRouter.get("/settings", async (c) => {
  const sessionUser = c.get("user");
  if (!sessionUser) {
    return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);
  }

  const admin = await requireAdmin(sessionUser.id);
  if (!admin) {
    return c.json({ error: { message: "Forbidden", code: "FORBIDDEN" } }, 403);
  }

  const [recruiter_bonus_enabled, recruiter_bonus_amount, agent_response_sla_hours, stale_inquiry_threshold_days] =
    await Promise.all([
      getSettingBool("recruiter_bonus_enabled"),
      getSettingNumber("recruiter_bonus_amount", 0),
      getSettingNumber("agent_response_sla_hours", 24),
      getSettingNumber("stale_inquiry_threshold_days", 7),
    ]);

  return c.json({
    data: {
      recruiter_bonus_enabled,
      recruiter_bonus_amount,
      agent_response_sla_hours,
      stale_inquiry_threshold_days,
    },
  });
});

// PUT /api/admin/settings
adminSettingsRouter.put("/settings", async (c) => {
  const sessionUser = c.get("user");
  if (!sessionUser) {
    return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);
  }

  const admin = await requireAdmin(sessionUser.id);
  if (!admin) {
    return c.json({ error: { message: "Forbidden", code: "FORBIDDEN" } }, 403);
  }

  let rawBody: unknown;
  try {
    rawBody = await c.req.json();
  } catch {
    return c.json({ error: { message: "Invalid JSON body", code: "VALIDATION_ERROR" } }, 400);
  }

  const parsed = updateSettingsSchema.safeParse(rawBody);
  if (!parsed.success) {
    const firstMessage = parsed.error.issues[0]?.message ?? "Validation failed";
    return c.json({ error: { message: firstMessage, code: "VALIDATION_ERROR" } }, 400);
  }

  const updates = parsed.data;
  const promises: Promise<void>[] = [];

  if (updates.recruiter_bonus_enabled !== undefined) {
    promises.push(setSetting("recruiter_bonus_enabled", String(updates.recruiter_bonus_enabled)));
  }
  if (updates.recruiter_bonus_amount !== undefined) {
    promises.push(setSetting("recruiter_bonus_amount", String(updates.recruiter_bonus_amount)));
  }
  if (updates.agent_response_sla_hours !== undefined) {
    promises.push(setSetting("agent_response_sla_hours", String(updates.agent_response_sla_hours)));
  }
  if (updates.stale_inquiry_threshold_days !== undefined) {
    promises.push(setSetting("stale_inquiry_threshold_days", String(updates.stale_inquiry_threshold_days)));
  }

  await Promise.all(promises);

  return c.json({ data: { success: true } });
});

export { adminSettingsRouter };
