import { Hono } from "hono";
import type { Context } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { auth } from "../auth";
import { prisma } from "../prisma";

type HonoVariables = {
  user: typeof auth.$Infer.Session.user | null;
  session: typeof auth.$Infer.Session.session | null;
};

type AppEnv = { Variables: HonoVariables };

const commissionsRouter = new Hono<AppEnv>();

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function requireApprovedUser(
  c: Context<AppEnv>
): Promise<{ id: string; role: string; isApproved: boolean } | null> {
  const sessionUser = c.get("user");
  if (!sessionUser) return null;
  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: { id: true, role: true, isApproved: true },
  });
  if (!user || !user.isApproved) return null;
  return user;
}

// ─── Routes ───────────────────────────────────────────────────────────────────

// GET /api/commissions
commissionsRouter.get("/commissions", async (c) => {
  const sessionUser = c.get("user");
  if (!sessionUser) {
    return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);
  }

  const user = await requireApprovedUser(c);
  if (!user) {
    return c.json({ error: { message: "Account not approved", code: "FORBIDDEN" } }, 403);
  }

  let where: Record<string, unknown> = {};

  if (user.role === "ADMIN") {
    where = {};
  } else if (user.role === "PROMOTER") {
    where = { earnerId: user.id, role: "PROMOTER" };
  } else {
    // AGENT sees their own agent commissions
    where = { earnerId: user.id, role: "AGENT" };
  }

  const commissions = await prisma.commission.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      listing: {
        select: { title: true, listingNumber: true },
      },
      inquiry: {
        select: { clientName: true, stage: true },
      },
    },
  });

  return c.json({ data: commissions });
});

// PATCH /api/commissions/:id/status  (ADMIN only)
const updateStatusSchema = z.object({
  status: z.enum(["APPROVED", "PAID"]),
  paidAt: z.string().optional(),
});

commissionsRouter.patch(
  "/commissions/:id/status",
  zValidator("json", updateStatusSchema),
  async (c) => {
    const sessionUser = c.get("user");
    if (!sessionUser) {
      return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);
    }

    const user = await requireApprovedUser(c);
    if (!user) {
      return c.json({ error: { message: "Account not approved", code: "FORBIDDEN" } }, 403);
    }

    if (user.role !== "ADMIN") {
      return c.json({ error: { message: "Forbidden", code: "FORBIDDEN" } }, 403);
    }

    const { id } = c.req.param();
    const { status, paidAt } = c.req.valid("json");

    const commission = await prisma.commission.findUnique({ where: { id } });
    if (!commission) {
      return c.json({ error: { message: "Commission not found", code: "NOT_FOUND" } }, 404);
    }

    const updateData: Record<string, unknown> = { status };
    if (status === "PAID") {
      updateData.paidAt = paidAt ? new Date(paidAt) : new Date();
    }

    const updated = await prisma.commission.update({
      where: { id },
      data: updateData,
      include: {
        listing: {
          select: { title: true, listingNumber: true },
        },
        inquiry: {
          select: { clientName: true, stage: true },
        },
      },
    });

    return c.json({ data: updated });
  }
);

export { commissionsRouter };
