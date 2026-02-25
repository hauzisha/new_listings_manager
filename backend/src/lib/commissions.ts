import { prisma } from "../prisma";
import { createNotification } from "./notifications";
import { getSetting, getSettingBool, getSettingNumber } from "./settings";

const TERMINAL_STAGES = ["RENTED", "PURCHASED"];
const REVERSIBLE_FROM = ["RENTED", "PURCHASED"];

/**
 * Create commissions when an inquiry reaches RENTED or PURCHASED.
 * - Agent commission: listing.agentCommissionPct % of price
 * - Company commission: listing.companyCommissionPct % of price
 * - Promoter commission: listing.promoterCommissionPct % of price (if attributed)
 * - Recruiter bonus: flat KES amount from settings (if agent was referred and toggle is on)
 */
export async function createCommissions(inquiryId: string): Promise<void> {
  const inquiry = await prisma.inquiry.findUnique({
    where: { id: inquiryId },
    include: {
      listing: true,
      agent: { include: { referrer: true } },
    },
  });

  if (!inquiry) return;

  const { listing, agent, promoterId } = inquiry;
  const price = listing.price;

  const commissionsToCreate: Array<{
    inquiryId: string;
    listingId: string;
    earnerId: string;
    role: string;
    amount: number;
  }> = [];

  // Agent commission
  if (listing.agentCommissionPct > 0) {
    commissionsToCreate.push({
      inquiryId,
      listingId: listing.id,
      earnerId: agent.id,
      role: "AGENT",
      amount: (price * listing.agentCommissionPct) / 100,
    });
  }

  // Company commission (earned by the platform — stored against the agent's account for now)
  // The listing creator represents the company's agent; company commission is tracked separately
  if (listing.companyCommissionPct > 0) {
    commissionsToCreate.push({
      inquiryId,
      listingId: listing.id,
      earnerId: listing.createdById,
      role: "COMPANY",
      amount: (price * listing.companyCommissionPct) / 100,
    });
  }

  // Promoter commission
  if (promoterId && listing.promoterCommissionPct > 0) {
    commissionsToCreate.push({
      inquiryId,
      listingId: listing.id,
      earnerId: promoterId,
      role: "PROMOTER",
      amount: (price * listing.promoterCommissionPct) / 100,
    });

    // Recruiter bonus — if promoter was referred by someone and toggle is on
    const bonusEnabled = await getSettingBool("recruiter_bonus_enabled");
    if (bonusEnabled && agent.referrerId) {
      const bonusAmount = await getSettingNumber("recruiter_bonus_amount", 500);
      commissionsToCreate.push({
        inquiryId,
        listingId: listing.id,
        earnerId: agent.referrerId,
        role: "RECRUITER",
        amount: bonusAmount,
      });
    }
  }

  // Create all commission records
  for (const commission of commissionsToCreate) {
    const created = await prisma.commission.create({ data: commission });

    // Notify earner — but promoter/recruiter notifications must NEVER include client info
    const isPrivateRole = commission.role === "PROMOTER" || commission.role === "RECRUITER";
    await createNotification({
      recipientId: commission.earnerId,
      type: "COMMISSION_APPROVED",
      title: "Commission Earned",
      message: isPrivateRole
        ? `You've earned a ${commission.role.toLowerCase()} commission of KES ${commission.amount.toLocaleString()} on listing #${listing.listingNumber}.`
        : `Commission of KES ${commission.amount.toLocaleString()} has been recorded for inquiry on listing #${listing.listingNumber}.`,
      link: `/commissions/${created.id}`,
    });
  }
}

/**
 * Delete commissions for an inquiry (called when stage is reversed from RENTED/PURCHASED).
 */
export async function deleteCommissions(inquiryId: string): Promise<void> {
  await prisma.commission.deleteMany({ where: { inquiryId } });
}

export { TERMINAL_STAGES, REVERSIBLE_FROM };
