import { Hono } from "hono";
import { auth } from "../../auth";
import { prisma } from "../../prisma";

type AppVariables = {
  Variables: {
    user: typeof auth.$Infer.Session.user | null;
    session: typeof auth.$Infer.Session.session | null;
  };
};

const adminStatsRouter = new Hono<AppVariables>();

// ─── Helpers ──────────────────────────────────────────────────────────────────

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

async function requireApprovedUser(
  sessionUserId: string
): Promise<{ id: string; role: string; isApproved: boolean } | null> {
  const user = await prisma.user.findUnique({
    where: { id: sessionUserId },
    select: { id: true, role: true, isApproved: true },
  });
  if (!user || !user.isApproved) return null;
  return user;
}

// ─── Routes ───────────────────────────────────────────────────────────────────

// GET /api/admin/stats/overview  (ADMIN only)
adminStatsRouter.get("/stats/overview", async (c) => {
  const sessionUser = c.get("user");
  if (!sessionUser) {
    return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);
  }

  const admin = await requireAdmin(sessionUser.id);
  if (!admin) {
    return c.json({ error: { message: "Forbidden", code: "FORBIDDEN" } }, 403);
  }

  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

  const [
    totalUsers,
    totalAgents,
    totalPromoters,
    pendingApprovals,
    totalListings,
    activeListings,
    totalInquiries,
    inquiriesThisMonth,
    allCommissions,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { role: "AGENT" } }),
    prisma.user.count({ where: { role: "PROMOTER" } }),
    prisma.user.count({ where: { isApproved: false } }),
    prisma.listing.count(),
    prisma.listing.count({ where: { status: "ACTIVE" } }),
    prisma.inquiry.count(),
    prisma.inquiry.count({ where: { createdAt: { gte: startOfMonth } } }),
    prisma.commission.findMany({ select: { status: true, amount: true, role: true } }),
  ]);

  const totalCommissions = allCommissions.length;
  const pendingCommissions = allCommissions.filter((c) => c.status === "PENDING").length;
  const paidCommissions = allCommissions.filter((c) => c.status === "PAID").length;
  const totalRevenue = allCommissions
    .filter((c) => c.status === "PAID" && c.role === "COMPANY")
    .reduce((sum, c) => sum + c.amount, 0);

  return c.json({
    data: {
      totalUsers,
      totalAgents,
      totalPromoters,
      pendingApprovals,
      totalListings,
      activeListings,
      totalInquiries,
      inquiriesThisMonth,
      totalCommissions,
      pendingCommissions,
      paidCommissions,
      totalRevenue,
    },
  });
});

// GET /api/admin/stats/agent-overview  (current agent's own stats)
adminStatsRouter.get("/stats/agent-overview", async (c) => {
  const sessionUser = c.get("user");
  if (!sessionUser) {
    return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);
  }

  const user = await requireApprovedUser(sessionUser.id);
  if (!user) {
    return c.json({ error: { message: "Account not approved", code: "FORBIDDEN" } }, 403);
  }

  const OPEN_STAGES = ["INQUIRY", "WAITING_RESPONSE", "SCHEDULED", "VIEWED"];
  const CLOSED_STAGES = ["RENTED", "PURCHASED", "NO_SHOW", "CANCELLED"];

  const [
    totalListings,
    activeListings,
    totalInquiries,
    openInquiries,
    closedInquiries,
    agentCommissions,
  ] = await Promise.all([
    prisma.listing.count({ where: { createdById: user.id } }),
    prisma.listing.count({ where: { createdById: user.id, status: "ACTIVE" } }),
    prisma.inquiry.count({ where: { agentId: user.id } }),
    prisma.inquiry.count({ where: { agentId: user.id, stage: { in: OPEN_STAGES } } }),
    prisma.inquiry.count({ where: { agentId: user.id, stage: { in: CLOSED_STAGES } } }),
    prisma.commission.findMany({
      where: { earnerId: user.id, role: "AGENT" },
      select: { status: true, amount: true },
    }),
  ]);

  const totalCommissions = agentCommissions.reduce((sum, c) => sum + c.amount, 0);
  const pendingCommissions = agentCommissions
    .filter((c) => c.status === "PENDING")
    .reduce((sum, c) => sum + c.amount, 0);
  const approvedCommissions = agentCommissions
    .filter((c) => c.status === "APPROVED")
    .reduce((sum, c) => sum + c.amount, 0);
  const paidCommissions = agentCommissions
    .filter((c) => c.status === "PAID")
    .reduce((sum, c) => sum + c.amount, 0);

  return c.json({
    data: {
      totalListings,
      activeListings,
      totalInquiries,
      openInquiries,
      closedInquiries,
      totalCommissions,
      pendingCommissions,
      approvedCommissions,
      paidCommissions,
    },
  });
});

export { adminStatsRouter };
