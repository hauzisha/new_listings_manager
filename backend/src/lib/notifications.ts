import { prisma } from "../prisma";

type NotificationType =
  | "INQUIRY_RECEIVED"
  | "STAGE_CHANGED"
  | "COMMISSION_APPROVED"
  | "COMMISSION_PAID"
  | "LISTING_APPROVED"
  | "USER_APPROVED"
  | "STALE_INQUIRY"
  | "RESPONSE_SLA_BREACH"
  | "CLICK_MILESTONE"
  | "SYSTEM";

export async function createNotification(params: {
  recipientId: string;
  type: NotificationType;
  title: string;
  message: string;
  link?: string;
}) {
  return prisma.notification.create({ data: params });
}
