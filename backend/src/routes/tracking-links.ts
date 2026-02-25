import { Hono } from "hono";
import type { Context } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { auth } from "../auth";
import { prisma } from "../prisma";
import { generateRefCode } from "../lib/listings";
import { env } from "../env";

const APP_BASE_URL = env.VITE_BASE_URL;

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

/**
 * Hash a visitor's identity for click deduplication using a 10-minute window.
 * Never stores raw IP — uses SHA-256 of (IP + UserAgent + 10-min bucket).
 */
async function hashVisitor10min(ip: string, userAgent: string): Promise<string> {
  const bucket = Math.floor(Date.now() / 600000); // 10-minute bucket
  const raw = `${ip}:${userAgent}:${bucket}`;
  const hashBuffer = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(raw)
  );
  return btoa(String.fromCharCode(...new Uint8Array(hashBuffer))).slice(0, 32);
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

// GET /api/tracking-links
trackingLinksRouter.get("/tracking-links", async (c) => {
  const sessionUser = c.get("user");
  if (!sessionUser) {
    return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);
  }

  const user = await requireApprovedUser(c);
  if (!user) {
    return c.json({ error: { message: "Account not approved", code: "FORBIDDEN" } }, 403);
  }

  const where = user.role === "ADMIN" ? {} : { creatorId: user.id };

  const links = await prisma.trackingLink.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      listing: {
        select: { title: true, slug: true },
      },
    },
  });

  const result = links.map((link) => ({
    ...link,
    shareUrl: `${APP_BASE_URL}/listings/${link.listing.slug}/r/${link.refCode}`,
  }));

  return c.json({ data: result });
});

// DELETE /api/tracking-links/:id
trackingLinksRouter.delete("/tracking-links/:id", async (c) => {
  const sessionUser = c.get("user");
  if (!sessionUser) {
    return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);
  }

  const user = await requireApprovedUser(c);
  if (!user) {
    return c.json({ error: { message: "Account not approved", code: "FORBIDDEN" } }, 403);
  }

  const { id } = c.req.param();

  const link = await prisma.trackingLink.findUnique({ where: { id } });
  if (!link) {
    return c.json({ error: { message: "Tracking link not found", code: "NOT_FOUND" } }, 404);
  }

  if (user.role !== "ADMIN" && link.creatorId !== user.id) {
    return c.json({ error: { message: "Forbidden", code: "FORBIDDEN" } }, 403);
  }

  await prisma.trackingLink.delete({ where: { id } });

  return c.json({ data: { success: true } });
});

// POST /api/tracking-links/:refCode/click  (public — no auth required)
trackingLinksRouter.post("/tracking-links/:refCode/click", async (c) => {
  const { refCode } = c.req.param();

  const trackingLink = await prisma.trackingLink.findUnique({
    where: { refCode },
    select: { id: true },
  });

  if (!trackingLink) {
    return c.json({ error: { message: "Tracking link not found", code: "NOT_FOUND" } }, 404);
  }

  const forwardedFor = c.req.header("x-forwarded-for");
  const realIp = c.req.header("x-real-ip");
  const ip = (forwardedFor ? (forwardedFor.split(",")[0] ?? "").trim() : null) ?? realIp ?? "unknown";
  const userAgent = c.req.header("user-agent") ?? "";

  const visitorHash = await hashVisitor10min(ip, userAgent);

  const tenMinutesAgo = new Date(Date.now() - 10 * 60 * 1000);
  const duplicate = await prisma.clickEvent.findFirst({
    where: {
      trackingLinkId: trackingLink.id,
      visitorHash,
      timestamp: { gt: tenMinutesAgo },
    },
    select: { id: true },
  });

  if (duplicate) {
    return c.json({ data: { recorded: false, reason: "duplicate" } });
  }

  await prisma.clickEvent.create({
    data: {
      trackingLinkId: trackingLink.id,
      visitorHash,
    },
  });

  await prisma.trackingLink.update({
    where: { id: trackingLink.id },
    data: { clickCount: { increment: 1 } },
  });

  return c.json({ data: { recorded: true } });
});

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
      select: { id: true, slug: true, createdById: true },
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
        promoterId: user.role === "PROMOTER" ? user.id : null,
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

    const shareUrl = `${APP_BASE_URL}/listings/${listing.slug}/r/${trackingLink.refCode}`;

    return c.json({ data: { ...trackingLink, shareUrl } }, 201);
  }
);

export { trackingLinksRouter };
