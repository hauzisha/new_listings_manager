import { Hono } from "hono";
import type { Context } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { auth } from "../auth";
import { prisma } from "../prisma";
import { generateRefCode } from "../lib/listings";

type HonoVariables = {
  user: typeof auth.$Infer.Session.user | null;
  session: typeof auth.$Infer.Session.session | null;
};

type AppEnv = { Variables: HonoVariables };

const trackingLinksRouter = new Hono<AppEnv>();

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

// ─── Schemas ──────────────────────────────────────────────────────────────────

const PLATFORMS = [
  "WHATSAPP",
  "FACEBOOK",
  "INSTAGRAM",
  "TWITTER_X",
  "TIKTOK",
  "LINKEDIN",
  "EMAIL",
  "SMS",
  "WEBSITE",
  "OTHER",
] as const;

const createTrackingLinkSchema = z.object({
  listingId: z.string().min(1),
  platform: z.enum(PLATFORMS),
  targetLocation: z.string().optional(),
  customTag: z.string().optional(),
});

// ─── Routes ───────────────────────────────────────────────────────────────────

// POST /api/tracking-links
trackingLinksRouter.post(
  "/tracking-links",
  zValidator("json", createTrackingLinkSchema),
  async (c) => {
    const sessionUser = c.get("user");
    if (!sessionUser) {
      return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);
    }

    const user = await requireApprovedUser(c);
    if (!user) {
      return c.json({ error: { message: "Account not approved", code: "FORBIDDEN" } }, 403);
    }

    const body = c.req.valid("json");

    const listing = await prisma.listing.findUnique({
      where: { id: body.listingId },
      select: { id: true, createdById: true },
    });

    if (!listing) {
      return c.json({ error: { message: "Listing not found", code: "NOT_FOUND" } }, 404);
    }

    if (user.role !== "ADMIN" && listing.createdById !== user.id) {
      return c.json({ error: { message: "Forbidden", code: "FORBIDDEN" } }, 403);
    }

    const refCode = generateRefCode();

    const trackingLink = await prisma.trackingLink.create({
      data: {
        refCode,
        listingId: body.listingId,
        creatorId: user.id,
        creatorRole: user.role,
        platform: body.platform,
        targetLocation: body.targetLocation ?? null,
        customTag: body.customTag ?? null,
      },
      select: {
        id: true,
        refCode: true,
        listingId: true,
        platform: true,
        targetLocation: true,
        customTag: true,
        clickCount: true,
        inquiryCount: true,
        createdAt: true,
      },
    });

    const shareUrl = `https://hauzisha.co.ke/l/${trackingLink.refCode}`;

    return c.json({ data: { ...trackingLink, shareUrl } }, 201);
  }
);

export { trackingLinksRouter };
