import { prisma } from "../prisma";

const LISTING_NUMBER_START = 240226;

/**
 * Get the next listing number.
 * Numbers start at 240226 and increment by 1.
 */
export async function getNextListingNumber(): Promise<number> {
  const latest = await prisma.listing.findFirst({
    orderBy: { listingNumber: "desc" },
    select: { listingNumber: true },
  });

  if (!latest) return LISTING_NUMBER_START;
  return latest.listingNumber + 1;
}

/**
 * Generate a URL-safe slug from structured listing fields.
 * Format: {propertyType}-for-{rent|sale}-in-{location}-{listingNumber}
 * Example: apartment-for-rent-in-westlands-240226
 */
export function generateSlug(
  propertyType: string,
  listingType: string,
  location: string,
  listingNumber: number
): string {
  const type = propertyType.toLowerCase();
  const action = listingType === "RENTAL" ? "rent" : "sale";
  const loc = location
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");

  return `${type}-for-${action}-in-${loc}-${listingNumber}`;
}

/**
 * Generate a cryptographically secure 12-character reference code for tracking links.
 * Uses URL-safe base64 encoding with 72 bits of entropy.
 */
export function generateRefCode(): string {
  const bytes = new Uint8Array(9); // 9 bytes → 12 base64 chars
  crypto.getRandomValues(bytes);
  return btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=/g, "")
    .slice(0, 12);
}

/**
 * Hash a visitor's identity for click deduplication.
 * Never stores raw IP — uses SHA-256 of (IP + UserAgent + date).
 */
export async function hashVisitor(ip: string, userAgent: string): Promise<string> {
  const date = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  const raw = `${ip}:${userAgent}:${date}`;
  const hashBuffer = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(raw)
  );
  return btoa(String.fromCharCode(...new Uint8Array(hashBuffer))).slice(0, 32);
}
