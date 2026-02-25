import { Hono } from "hono";
import type { Context } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { auth } from "../auth";
import { prisma } from "../prisma";
import { createCommissions, deleteCommissions, TERMINAL_STAGES, REVERSIBLE_FROM } from "../lib/commissions";
import { getSettingNumber } from "../lib/settings";

type HonoVariables = {
  user: typeof auth.$Infer.Session.user | null;
  session: typeof auth.$Infer.Session.session | null;
};

type AppEnv = { Variables: HonoVariables };

const inquiriesRouter = new Hono<AppEnv>();

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

const VALID_STAGES = [
  "INQUIRY",
  "WAITING_RESPONSE",
  "SCHEDULED",
  "VIEWED",
  "RENTED",
  "PURCHASED",
  "NO_SHOW",
  "CANCELLED",
] as const;

type InquiryStageHistoryEntry = {
  stage: string;
  timestamp: string;
  note?: string;
  changedById?: string;
};

function parseInquiry(inquiry: Record<string, unknown>) {
  return {
    ...inquiry,
    stageHistory: JSON.parse((inquiry.stageHistory as string) || "[]"),
  };
}

// ─── Routes ───────────────────────────────────────────────────────────────────

// GET /api/inquiries
inquiriesRouter.get("/inquiries", async (c) => {
  const sessionUser = c.get("user");
  if (!sessionUser) {
    return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);
  }

  const user = await requireApprovedUser(c);
  if (!user) {
    return c.json({ error: { message: "Account not approved", code: "FORBIDDEN" } }, 403);
  }

  const staleDays = await getSettingNumber("stale_inquiry_threshold_days", 7);
  const staleThreshold = new Date(Date.now() - staleDays * 24 * 60 * 60 * 1000);

  const where = user.role === "ADMIN" ? {} : { agentId: user.id };

  const inquiries = await prisma.inquiry.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      listing: {
        select: { title: true, slug: true, listingNumber: true },
      },
    },
  });

  const result = inquiries.map((inquiry) => {
    const parsed = parseInquiry(inquiry as unknown as Record<string, unknown>);
    const isTerminal = ["RENTED", "PURCHASED", "NO_SHOW", "CANCELLED"].includes(inquiry.stage);
    const isStale = !isTerminal && inquiry.createdAt < staleThreshold;
    return { ...parsed, isStale };
  });

  return c.json({ data: result });
});

// GET /api/inquiries/:id
inquiriesRouter.get("/inquiries/:id", async (c) => {
  const sessionUser = c.get("user");
  if (!sessionUser) {
    return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);
  }

  const user = await requireApprovedUser(c);
  if (!user) {
    return c.json({ error: { message: "Account not approved", code: "FORBIDDEN" } }, 403);
  }

  const { id } = c.req.param();

  const inquiry = await prisma.inquiry.findUnique({
    where: { id },
    include: {
      listing: {
        select: { title: true, slug: true, listingNumber: true },
      },
    },
  });

  if (!inquiry) {
    return c.json({ error: { message: "Inquiry not found", code: "NOT_FOUND" } }, 404);
  }

  if (user.role !== "ADMIN" && inquiry.agentId !== user.id) {
    return c.json({ error: { message: "Forbidden", code: "FORBIDDEN" } }, 403);
  }

  return c.json({ data: parseInquiry(inquiry as unknown as Record<string, unknown>) });
});

// PATCH /api/inquiries/:id/stage
const updateStageSchema = z.object({
  stage: z.enum(VALID_STAGES),
  note: z.string().optional(),
});

inquiriesRouter.patch(
  "/inquiries/:id/stage",
  zValidator("json", updateStageSchema),
  async (c) => {
    const sessionUser = c.get("user");
    if (!sessionUser) {
      return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);
    }

    const user = await requireApprovedUser(c);
    if (!user) {
      return c.json({ error: { message: "Account not approved", code: "FORBIDDEN" } }, 403);
    }

    const { id } = c.req.param();
    const { stage, note } = c.req.valid("json");

    const inquiry = await prisma.inquiry.findUnique({ where: { id } });

    if (!inquiry) {
      return c.json({ error: { message: "Inquiry not found", code: "NOT_FOUND" } }, 404);
    }

    if (user.role !== "ADMIN" && inquiry.agentId !== user.id) {
      return c.json({ error: { message: "Forbidden", code: "FORBIDDEN" } }, 403);
    }

    const previousStage = inquiry.stage;
    const existingHistory: InquiryStageHistoryEntry[] = JSON.parse(
      inquiry.stageHistory || "[]"
    );

    const newHistoryEntry: InquiryStageHistoryEntry = {
      stage,
      timestamp: new Date().toISOString(),
      changedById: user.id,
      ...(note ? { note } : {}),
    };

    const updatedHistory = [...existingHistory, newHistoryEntry];

    const updateData: Record<string, unknown> = {
      stage,
      stageHistory: JSON.stringify(updatedHistory),
    };

    // Set firstResponseAt when transitioning to WAITING_RESPONSE for the first time
    if (stage === "WAITING_RESPONSE" && inquiry.firstResponseAt === null) {
      updateData.firstResponseAt = new Date();
    }

    const updated = await prisma.inquiry.update({
      where: { id },
      data: updateData,
      include: {
        listing: {
          select: { title: true, slug: true, listingNumber: true },
        },
      },
    });

    // Commission logic
    const wasTerminal = REVERSIBLE_FROM.includes(previousStage);
    const isNowTerminal = TERMINAL_STAGES.includes(stage);

    if (wasTerminal && !isNowTerminal) {
      // Transitioning AWAY from RENTED/PURCHASED — delete commissions
      await deleteCommissions(id);
    } else if (!wasTerminal && isNowTerminal) {
      // Transitioning TO RENTED/PURCHASED — create commissions
      await createCommissions(id);
    }

    return c.json({ data: parseInquiry(updated as unknown as Record<string, unknown>) });
  }
);

export { inquiriesRouter };
