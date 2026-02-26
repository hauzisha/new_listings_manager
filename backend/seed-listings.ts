/**
 * Seed 5 test listings (3 rental, 2 sale) under jamesagent@gmail.com
 * Run: cd backend && bun run seed-listings.ts
 */

const BASE = process.env.BACKEND_URL ?? "https://preview-xbjzkqwczwbg.dev.vibecode.run";

async function signIn(email: string, password: string) {
  const res = await fetch(`${BASE}/api/auth/sign-in/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Sign-in failed: ${res.status} ${text}`);
  }
  const cookie = res.headers.get("set-cookie");
  if (!cookie) throw new Error("No session cookie returned");
  return cookie;
}

async function createListing(cookie: string, data: object) {
  const res = await fetch(`${BASE}/api/listings`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookie,
    },
    body: JSON.stringify(data),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Create listing failed: ${res.status} ${text}`);
  }
  return res.json();
}

const LISTINGS = [
  // ── 3 RENTAL listings ──────────────────────────────────────────────────────
  {
    title: "Modern 2BR Apartment in Kilimani",
    listingType: "RENTAL",
    propertyType: "APARTMENT",
    nature: "RESIDENTIAL",
    location: "Kilimani, Nairobi",
    nearbyLandmarks: ["Yaya Centre", "Adams Arcade", "Ngong Road"],
    price: 65000,
    bedrooms: 2,
    bathrooms: 2,
    areaSqft: 1100,
    areaUnit: "sqft",
    description:
      "Beautifully finished 2-bedroom apartment in the heart of Kilimani. Features an open-plan living area, fitted kitchen, ample natural light, and a secure parking bay. Located minutes from Yaya Centre and major amenities.",
    amenities: ["Swimming Pool", "Gym", "24hr Security", "Backup Generator", "Fibre Internet", "Covered Parking"],
    agentCommissionPct: 5,
    promoterCommissionPct: 2,
    companyCommissionPct: 3,
  },
  {
    title: "Spacious 3BR Townhouse — Lavington",
    listingType: "RENTAL",
    propertyType: "TOWNHOUSE",
    nature: "RESIDENTIAL",
    location: "Lavington, Nairobi",
    nearbyLandmarks: ["Lavington Green Mall", "Valley Arcade", "Dennis Pritt Road"],
    price: 120000,
    bedrooms: 3,
    bathrooms: 3,
    areaSqft: 2200,
    areaUnit: "sqft",
    description:
      "Executive 3-bedroom townhouse in a serene Lavington compound. Comes with a private garden, DSQ, and two parking spaces. Ideal for families seeking quiet residential living close to international schools.",
    amenities: ["DSQ", "Private Garden", "Borehole Water", "24hr Security", "CCTV", "2 Parking Bays"],
    agentCommissionPct: 5,
    promoterCommissionPct: 2,
    companyCommissionPct: 3,
  },
  {
    title: "Studio Apartment — Westlands (All-Inclusive)",
    listingType: "RENTAL",
    propertyType: "STUDIO",
    nature: "RESIDENTIAL",
    location: "Westlands, Nairobi",
    nearbyLandmarks: ["The Mall Westlands", "Sarit Centre", "Westlands Roundabout"],
    price: 35000,
    bedrooms: 1,
    bathrooms: 1,
    areaSqft: 450,
    areaUnit: "sqft",
    description:
      "Compact and fully fitted studio apartment in Westlands, all utilities included. Perfect for young professionals. Walking distance to restaurants, banks, and public transport.",
    amenities: ["Rooftop Terrace", "Fibre Internet", "24hr Security", "Water Included", "Electricity Included"],
    agentCommissionPct: 5,
    promoterCommissionPct: 2,
    companyCommissionPct: 3,
  },

  // ── 2 SALE listings ────────────────────────────────────────────────────────
  {
    title: "4BR Villa for Sale — Karen",
    listingType: "SALE",
    propertyType: "VILLA",
    nature: "RESIDENTIAL",
    location: "Karen, Nairobi",
    nearbyLandmarks: ["Karen Shopping Centre", "Karen Country Club", "Wilson Airport"],
    price: 42000000,
    bedrooms: 4,
    bathrooms: 4,
    areaSqft: 4500,
    areaUnit: "sqft",
    description:
      "Stunning 4-bedroom villa sitting on half an acre in Karen. Features a large swimming pool, landscaped gardens, staff quarters, and a 3-car garage. Finished to the highest standard with imported fittings throughout.",
    amenities: ["Swimming Pool", "Landscaped Garden", "Staff Quarters", "3-Car Garage", "Solar Panels", "Borehole", "Electric Fence"],
    agentCommissionPct: 3,
    promoterCommissionPct: 1.5,
    companyCommissionPct: 1.5,
  },
  {
    title: "Prime Commercial Land — Thika Road",
    listingType: "SALE",
    propertyType: "LAND",
    nature: "COMMERCIAL",
    location: "Thika Road, Nairobi",
    nearbyLandmarks: ["Two Rivers Mall", "Runda", "Muthaiga"],
    price: 18500000,
    areaSqft: 8712,
    areaUnit: "sqft",
    description:
      "0.2-acre prime commercial plot fronting Thika Superhighway. Suitable for retail, office development, or mixed-use project. Title deed ready, no disputes. High visibility with excellent road frontage.",
    amenities: ["Title Deed Ready", "Road Frontage", "Electricity Connected", "Water Connected"],
    agentCommissionPct: 3,
    promoterCommissionPct: 1.5,
    companyCommissionPct: 1.5,
  },
];

async function main() {
  console.log("🔐 Signing in as jamesagent@gmail.com...");
  const cookie = await signIn("jamesagent@gmail.com", "12345678");
  console.log("✅ Signed in");

  for (const listing of LISTINGS) {
    const result = await createListing(cookie, listing);
    const data = result.data ?? result;
    console.log(`✅ Created [${listing.listingType}] ${listing.title} — #${data.listingNumber}`);
  }

  console.log("\n🎉 All 5 test listings created!");
}

main().catch((e) => {
  console.error("❌", e.message);
  process.exit(1);
});
