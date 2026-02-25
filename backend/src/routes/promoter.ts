import { Hono } from "hono";
import type { Context } from "hono";
import { auth } from "../auth";
import { prisma } from "../prisma";

type HonoVariables = {
  user: typeof auth.$Infer.Session.user | null;
  session: typeof auth.$Infer.Session.session | null;
};

type AppEnv = { Variables: HonoVariables };

const promoterRouter = new Hono<AppEnv>();

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function requireApprovedPromoter(
  c: Context<AppEnv>
): Promise<{ id: string; role: string; isApproved: boolean } | null> {
  const sessionUser = c.get("user");
  if (!sessionUser) return null;
  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: { id: true, role: true, isApproved: true },
  });
  if (!user || !user.isApproved || user.role !== "PROMOTER") return null;
  return user;
}

// ─── Routes ───────────────────────────────────────────────────────────────────

// GET /api/promoter/tracking-links
promoterRouter.get("/promoter/tracking-links", async (c) => {
  const sessionUser = c.get("user");
  if (!sessionUser) {
    return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);
  }

  const user = await requireApprovedPromoter(c);
  if (!user) {
    return c.json({ error: { message: "Forbidden: Approved PROMOTER role required", code: "FORBIDDEN" } }, 403);
  }

  const links = await prisma.trackingLink.findMany({
    where: { creatorId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      listing: {
        select: { title: true, slug: true, listingNumber: true },
      },
    },
  });

  const result = links.map((link) => ({
    ...link,
    shareUrl: `https://hauzisha.co.ke/l/${link.refCode}`,
  }));

  return c.json({ data: result });
});

// GET /api/promoter/promotions
promoterRouter.get("/promoter/promotions", async (c) => {
  const sessionUser = c.get("user");
  if (!sessionUser) {
    return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);
  }

  const user = await requireApprovedPromoter(c);
  if (!user) {
    return c.json({ error: { message: "Forbidden: Approved PROMOTER role required", code: "FORBIDDEN" } }, 403);
  }

  const promotions = await prisma.promotion.findMany({
    where: { promoterId: user.id },
    orderBy: { createdAt: "desc" },
    include: {
      listing: {
        select: {
          id: true,
          title: true,
          location: true,
          price: true,
          status: true,
          listingType: true,
          propertyType: true,
          listingNumber: true,
          slug: true,
        },
      },
    },
  });

  return c.json({ data: promotions });
});

// GET /api/promoter/stats
promoterRouter.get("/promoter/stats", async (c) => {
  const sessionUser = c.get("user");
  if (!sessionUser) {
    return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);
  }

  const user = await requireApprovedPromoter(c);
  if (!user) {
    return c.json({ error: { message: "Forbidden: Approved PROMOTER role required", code: "FORBIDDEN" } }, 403);
  }

  const [trackingLinks, promoterCommissions] = await Promise.all([
    prisma.trackingLink.findMany({
      where: { creatorId: user.id },
      select: {
        id: true,
        clickCount: true,
        inquiryCount: true,
        listingId: true,
        listing: {
          select: { title: true },
        },
      },
    }),
    prisma.commission.findMany({
      where: { earnerId: user.id, role: "PROMOTER" },
      select: { status: true, amount: true },
    }),
  ]);

  const totalClicks = trackingLinks.reduce((sum, l) => sum + l.clickCount, 0);
  const totalInquiries = trackingLinks.reduce((sum, l) => sum + l.inquiryCount, 0);
  const totalCommissions = promoterCommissions.reduce((sum, c) => sum + c.amount, 0);
  const pendingCommissions = promoterCommissions
    .filter((c) => c.status === "PENDING")
    .reduce((sum, c) => sum + c.amount, 0);
  const paidCommissions = promoterCommissions
    .filter((c) => c.status === "PAID")
    .reduce((sum, c) => sum + c.amount, 0);

  // Aggregate per listing for top listings
  const listingMap = new Map<string, { listingTitle: string; clicks: number; inquiries: number }>();
  for (const link of trackingLinks) {
    const existing = listingMap.get(link.listingId);
    if (existing) {
      existing.clicks += link.clickCount;
      existing.inquiries += link.inquiryCount;
    } else {
      listingMap.set(link.listingId, {
        listingTitle: link.listing.title,
        clicks: link.clickCount,
        inquiries: link.inquiryCount,
      });
    }
  }

  const topListings = Array.from(listingMap.values())
    .sort((a, b) => b.clicks - a.clicks)
    .slice(0, 10);

  return c.json({
    data: {
      totalClicks,
      totalInquiries,
      totalCommissions,
      pendingCommissions,
      paidCommissions,
      topListings,
    },
  });
});

// GET /api/promoter/commissions
promoterRouter.get("/promoter/commissions", async (c) => {
  const sessionUser = c.get("user");
  if (!sessionUser) {
    return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);
  }

  const user = await requireApprovedPromoter(c);
  if (!user) {
    return c.json({ error: { message: "Forbidden: Approved PROMOTER role required", code: "FORBIDDEN" } }, 403);
  }

  const commissions = await prisma.commission.findMany({
    where: { earnerId: user.id, role: "PROMOTER" },
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

export { promoterRouter };
