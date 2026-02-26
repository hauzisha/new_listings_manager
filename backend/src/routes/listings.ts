import { Hono } from "hono";
import type { Context } from "hono";
import { zValidator } from "@hono/zod-validator";
import { z } from "zod";
import { auth } from "../auth";
import { prisma } from "../prisma";
import { getNextListingNumber, generateSlug } from "../lib/listings";
import { env } from "../env";

type HonoVariables = {
  user: typeof auth.$Infer.Session.user | null;
  session: typeof auth.$Infer.Session.session | null;
};

type AppEnv = { Variables: HonoVariables };

const listingsRouter = new Hono<AppEnv>();

// ─── Helpers ──────────────────────────────────────────────────────────────────

function parseListing(listing: Record<string, unknown>) {
  return {
    ...listing,
    amenities: JSON.parse((listing.amenities as string) || "[]"),
    images: JSON.parse((listing.images as string) || "[]"),
    videos: JSON.parse((listing.videos as string) || "[]"),
    nearbyLandmarks: JSON.parse((listing.nearbyLandmarks as string) || "[]"),
    defaultMedia: (listing.defaultMedia as string) ?? "",
  };
}

async function requireAgent(
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

const PROPERTY_TYPES = [
  "APARTMENT",
  "MAISONETTE",
  "VILLA",
  "STUDIO",
  "BUNGALOW",
  "DUPLEX",
  "PENTHOUSE",
  "TOWNHOUSE",
  "COMMERCIAL",
  "LAND",
] as const;

const createListingSchema = z.object({
  title: z.string().min(1),
  listingType: z.enum(["RENTAL", "SALE"]),
  nature: z.enum(["RESIDENTIAL", "COMMERCIAL", "MIXED"]).default("RESIDENTIAL"),
  propertyType: z.enum(PROPERTY_TYPES),
  location: z.string().min(1),
  nearbyLandmarks: z.array(z.string()).optional().default([]),
  price: z.number().positive(),
  bedrooms: z.number().int().optional(),
  bathrooms: z.number().int().optional(),
  areaSqft: z.number().optional(),
  areaUnit: z.enum(["sqft", "sqm"]).optional().default("sqft"),
  description: z.string().min(1),
  amenities: z.array(z.string()).optional().default([]),
  images: z.array(z.string()).optional().default([]),
  videos: z.array(z.string()).optional().default([]),
  defaultMedia: z.string().optional().default(""),
  agentCommissionPct: z.number().min(0).max(100).default(0),
  promoterCommissionPct: z.number().min(0).max(100).default(0),
  companyCommissionPct: z.number().min(0).max(100).default(0),
});

const updateListingSchema = createListingSchema.partial();

// ─── Routes ───────────────────────────────────────────────────────────────────

// GET /api/listings/slug-preview
// Must be before /:id to avoid param capture
listingsRouter.get("/listings/slug-preview", async (c) => {
  const sessionUser = c.get("user");
  if (!sessionUser) {
    return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);
  }

  const user = await requireAgent(c);
  if (!user) {
    return c.json({ error: { message: "Account not approved", code: "FORBIDDEN" } }, 403);
  }

  const propertyType = c.req.query("propertyType") ?? "";
  const listingType = c.req.query("listingType") ?? "";
  const location = c.req.query("location") ?? "";

  if (!propertyType || !listingType || !location) {
    return c.json(
      { error: { message: "propertyType, listingType and location are required", code: "VALIDATION_ERROR" } },
      400
    );
  }

  const listingNumber = await getNextListingNumber();
  const slug = generateSlug(propertyType, listingType, location, listingNumber);

  return c.json({ data: { slug, listingNumber } });
});

// GET /api/listings/public  (no auth required)
listingsRouter.get("/listings/public", async (c) => {
  const typeParam = c.req.query("type") ?? "";
  const location = c.req.query("location") ?? "";
  const propertyType = c.req.query("propertyType") ?? "";
  const nature = c.req.query("nature") ?? "";
  const minPrice = c.req.query("minPrice") ?? "";
  const maxPrice = c.req.query("maxPrice") ?? "";
  const sort = c.req.query("sort") ?? "newest";
  const pageParam = c.req.query("page") ?? "1";
  const limitParam = c.req.query("limit") ?? "12";

  const page = Math.max(1, parseInt(pageParam, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(limitParam, 10) || 12));
  const skip = (page - 1) * limit;

  // Build where clause dynamically
  const where: Record<string, unknown> = { status: "ACTIVE" };

  if (typeParam === "RENTAL" || typeParam === "SALE") {
    where.listingType = typeParam.toUpperCase();
  }

  if (location) {
    where.location = { contains: location, mode: "insensitive" };
  }

  if (propertyType) {
    where.propertyType = propertyType;
  }

  if (nature === "RESIDENTIAL" || nature === "COMMERCIAL" || nature === "MIXED") {
    where.nature = nature;
  }

  if (minPrice || maxPrice) {
    const priceFilter: Record<string, number> = {};
    if (minPrice) priceFilter.gte = parseFloat(minPrice);
    if (maxPrice) priceFilter.lte = parseFloat(maxPrice);
    where.price = priceFilter;
  }

  // Build orderBy
  let orderBy: Record<string, string>;
  if (sort === "price_asc") {
    orderBy = { price: "asc" };
  } else if (sort === "price_desc") {
    orderBy = { price: "desc" };
  } else {
    orderBy = { createdAt: "desc" };
  }

  const [listings, total] = await Promise.all([
    prisma.listing.findMany({
      where,
      orderBy,
      skip,
      take: limit,
    }),
    prisma.listing.count({ where }),
  ]);

  const totalPages = Math.ceil(total / limit);

  return c.json({
    data: {
      listings: listings.map((l) => parseListing(l as unknown as Record<string, unknown>)),
      total,
      page,
      totalPages,
    },
  });
});

// GET /api/listings/agent
listingsRouter.get("/listings/agent", async (c) => {
  const sessionUser = c.get("user");
  if (!sessionUser) {
    return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);
  }

  const user = await requireAgent(c);
  if (!user) {
    return c.json({ error: { message: "Account not approved", code: "FORBIDDEN" } }, 403);
  }

  const listings = await prisma.listing.findMany({
    where: { createdById: user.id },
    orderBy: { createdAt: "desc" },
  });

  return c.json({ data: listings.map((l) => parseListing(l as unknown as Record<string, unknown>)) });
});

// GET /api/listings/admin  (admin only — all listings with agent info)
listingsRouter.get("/listings/admin", async (c) => {
  const sessionUser = c.get("user");
  if (!sessionUser) {
    return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);
  }

  const user = await requireAgent(c);
  if (!user) {
    return c.json({ error: { message: "Account not approved", code: "FORBIDDEN" } }, 403);
  }

  if (user.role !== "ADMIN") {
    return c.json({ error: { message: "Forbidden", code: "FORBIDDEN" } }, 403);
  }

  const search = c.req.query("search") ?? "";
  const status = c.req.query("status") ?? "";
  const listingType = c.req.query("listingType") ?? "";
  const location = c.req.query("location") ?? "";
  const agentId = c.req.query("agentId") ?? "";

  const where: Record<string, unknown> = {};

  if (search) {
    where.title = { contains: search, mode: "insensitive" };
  }

  if (status === "ACTIVE" || status === "INACTIVE" || status === "SOLD" || status === "RENTED") {
    where.status = status;
  }

  if (listingType === "RENTAL" || listingType === "SALE") {
    where.listingType = listingType;
  }

  if (location) {
    where.location = { contains: location, mode: "insensitive" };
  }

  if (agentId) {
    where.createdById = agentId;
  }

  const listings = await prisma.listing.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      createdBy: {
        select: { id: true, name: true },
      },
    },
  });

  const result = listings.map((l) => {
    const { createdBy, ...rest } = l;
    const parsed = parseListing(rest as unknown as Record<string, unknown>);
    return {
      ...parsed,
      agentId: createdBy.id,
      agentName: createdBy.name,
    };
  });

  return c.json({ data: result });
});

// GET /api/listings/by-slug/:slug  (no auth required)
listingsRouter.get("/listings/by-slug/:slug", async (c) => {
  const { slug } = c.req.param();
  const listing = await prisma.listing.findUnique({
    where: { slug },
    include: {
      createdBy: {
        select: { name: true, phone: true }
      }
    }
  });
  if (!listing) {
    return c.json({ error: { message: "Listing not found", code: "NOT_FOUND" } }, 404);
  }
  // Only return ACTIVE listings publicly
  if (listing.status !== "ACTIVE") {
    return c.json({ error: { message: "Listing not found", code: "NOT_FOUND" } }, 404);
  }
  const parsed = parseListing(listing as unknown as Record<string, unknown>);
  return c.json({ data: parsed });
});

// GET /api/listings/:id
listingsRouter.get("/listings/:id", async (c) => {
  const sessionUser = c.get("user");
  if (!sessionUser) {
    return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);
  }

  const user = await requireAgent(c);
  if (!user) {
    return c.json({ error: { message: "Account not approved", code: "FORBIDDEN" } }, 403);
  }

  const { id } = c.req.param();

  const listing = await prisma.listing.findUnique({ where: { id } });
  if (!listing) {
    return c.json({ error: { message: "Listing not found", code: "NOT_FOUND" } }, 404);
  }

  // Admins can get any listing; agents can only get their own
  if (user.role !== "ADMIN" && listing.createdById !== user.id) {
    return c.json({ error: { message: "Forbidden", code: "FORBIDDEN" } }, 403);
  }

  return c.json({ data: parseListing(listing as unknown as Record<string, unknown>) });
});

const publicInquirySchema = z.object({
  listingId: z.string(),
  clientName: z.string().min(1),
  clientEmail: z.string().email().optional(),
  clientPhone: z.string().min(1),
  message: z.string().optional(),
  refCode: z.string().optional(),
});

// POST /api/inquiries/public  (no auth required)
listingsRouter.post(
  "/inquiries/public",
  zValidator("json", publicInquirySchema),
  async (c) => {
    const body = c.req.valid("json");
    const { listingId, clientName, clientEmail, clientPhone, message, refCode } = body;

    // 1. Find listing (must exist and be ACTIVE)
    const listing = await prisma.listing.findUnique({ where: { id: listingId } });
    if (!listing || listing.status !== "ACTIVE") {
      return c.json({ error: { message: "Listing not found", code: "NOT_FOUND" } }, 404);
    }

    // 2. Resolve tracking link if refCode provided
    let trackingLinkId: string | null = null;
    let promoterId: string | null = null;
    let trackingLink: { id: string; creatorId: string; creatorRole: string } | null = null;

    if (refCode) {
      trackingLink = await prisma.trackingLink.findUnique({
        where: { refCode },
        select: { id: true, creatorId: true, creatorRole: true },
      });
      if (trackingLink) {
        trackingLinkId = trackingLink.id;
        promoterId = trackingLink.creatorRole === "PROMOTER" ? trackingLink.creatorId : null;
      }
    }

    // 3. Create inquiry
    const inquiry = await prisma.inquiry.create({
      data: {
        listingId,
        agentId: listing.createdById,
        promoterId,
        trackingLinkId,
        clientName,
        clientEmail,
        clientPhone,
        message,
        stage: "INQUIRY",
        stageHistory: JSON.stringify([{ stage: "INQUIRY", timestamp: new Date().toISOString() }]),
      },
    });

    // 4. Increment inquiry count on tracking link if found
    if (trackingLink) {
      await prisma.trackingLink.update({
        where: { id: trackingLink.id },
        data: { inquiryCount: { increment: 1 } },
      });
    }

    // 5. Return success
    return c.json({ data: { id: inquiry.id, message: "Inquiry submitted successfully" } }, 201);
  }
);

// POST /api/listings
listingsRouter.post(
  "/listings",
  zValidator("json", createListingSchema),
  async (c) => {
    const sessionUser = c.get("user");
    if (!sessionUser) {
      return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);
    }

    const user = await requireAgent(c);
    if (!user) {
      return c.json({ error: { message: "Account not approved", code: "FORBIDDEN" } }, 403);
    }

    const body = c.req.valid("json");

    const listingNumber = await getNextListingNumber();
    const slug = generateSlug(body.propertyType, body.listingType, body.location, listingNumber);

    const listing = await prisma.listing.create({
      data: {
        listingNumber,
        slug,
        title: body.title,
        listingType: body.listingType,
        nature: body.nature,
        propertyType: body.propertyType,
        location: body.location,
        nearbyLandmarks: JSON.stringify(body.nearbyLandmarks ?? []),
        price: body.price,
        bedrooms: body.bedrooms,
        bathrooms: body.bathrooms,
        areaSqft: body.areaSqft,
        areaUnit: body.areaUnit ?? "sqft",
        description: body.description,
        amenities: JSON.stringify(body.amenities ?? []),
        images: JSON.stringify(body.images ?? []),
        videos: JSON.stringify(body.videos ?? []),
        defaultMedia: body.defaultMedia ?? "",
        agentCommissionPct: body.agentCommissionPct ?? 0,
        promoterCommissionPct: body.promoterCommissionPct ?? 0,
        companyCommissionPct: body.companyCommissionPct ?? 0,
        status: "ACTIVE",
        createdById: user.id,
      },
    });

    return c.json({ data: parseListing(listing as unknown as Record<string, unknown>) }, 201);
  }
);

// PUT /api/listings/:id
listingsRouter.put(
  "/listings/:id",
  zValidator("json", updateListingSchema),
  async (c) => {
    const sessionUser = c.get("user");
    if (!sessionUser) {
      return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);
    }

    const user = await requireAgent(c);
    if (!user) {
      return c.json({ error: { message: "Account not approved", code: "FORBIDDEN" } }, 403);
    }

    const { id } = c.req.param();

    const existing = await prisma.listing.findUnique({ where: { id } });
    if (!existing) {
      return c.json({ error: { message: "Listing not found", code: "NOT_FOUND" } }, 404);
    }

    if (user.role !== "ADMIN" && existing.createdById !== user.id) {
      return c.json({ error: { message: "Forbidden", code: "FORBIDDEN" } }, 403);
    }

    const body = c.req.valid("json");

    const updateData: Record<string, unknown> = {};
    if (body.title !== undefined) updateData.title = body.title;
    if (body.listingType !== undefined) updateData.listingType = body.listingType;
    if (body.nature !== undefined) updateData.nature = body.nature;
    if (body.propertyType !== undefined) updateData.propertyType = body.propertyType;
    if (body.location !== undefined) updateData.location = body.location;
    if (body.nearbyLandmarks !== undefined) updateData.nearbyLandmarks = JSON.stringify(body.nearbyLandmarks);
    if (body.price !== undefined) updateData.price = body.price;
    if (body.bedrooms !== undefined) updateData.bedrooms = body.bedrooms;
    if (body.bathrooms !== undefined) updateData.bathrooms = body.bathrooms;
    if (body.areaSqft !== undefined) updateData.areaSqft = body.areaSqft;
    if (body.areaUnit !== undefined) updateData.areaUnit = body.areaUnit;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.amenities !== undefined) updateData.amenities = JSON.stringify(body.amenities);
    if (body.images !== undefined) updateData.images = JSON.stringify(body.images);
    if (body.videos !== undefined) updateData.videos = JSON.stringify(body.videos);
    if (body.defaultMedia !== undefined) updateData.defaultMedia = body.defaultMedia ?? existing.defaultMedia ?? "";
    if (body.agentCommissionPct !== undefined) updateData.agentCommissionPct = body.agentCommissionPct;
    if (body.promoterCommissionPct !== undefined) updateData.promoterCommissionPct = body.promoterCommissionPct;
    if (body.companyCommissionPct !== undefined) updateData.companyCommissionPct = body.companyCommissionPct;
    // slug is NEVER regenerated on edit

    const updated = await prisma.listing.update({
      where: { id },
      data: updateData,
    });

    return c.json({ data: parseListing(updated as unknown as Record<string, unknown>) });
  }
);

// PATCH /api/listings/:id/status  (admin only)
const updateStatusSchema = z.object({
  status: z.enum(["ACTIVE", "INACTIVE", "SOLD", "RENTED"]),
});

listingsRouter.patch(
  "/listings/:id/status",
  zValidator("json", updateStatusSchema),
  async (c) => {
    const sessionUser = c.get("user");
    if (!sessionUser) {
      return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);
    }

    const user = await requireAgent(c);
    if (!user) {
      return c.json({ error: { message: "Account not approved", code: "FORBIDDEN" } }, 403);
    }

    if (user.role !== "ADMIN") {
      return c.json({ error: { message: "Forbidden", code: "FORBIDDEN" } }, 403);
    }

    const { id } = c.req.param();
    const { status } = c.req.valid("json");

    const existing = await prisma.listing.findUnique({ where: { id } });
    if (!existing) {
      return c.json({ error: { message: "Listing not found", code: "NOT_FOUND" } }, 404);
    }

    const updated = await prisma.listing.update({
      where: { id },
      data: { status },
    });

    return c.json({ data: parseListing(updated as unknown as Record<string, unknown>) });
  }
);

// DELETE /api/listings/:id (soft delete)
listingsRouter.delete("/listings/:id", async (c) => {
  const sessionUser = c.get("user");
  if (!sessionUser) {
    return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);
  }

  const user = await requireAgent(c);
  if (!user) {
    return c.json({ error: { message: "Account not approved", code: "FORBIDDEN" } }, 403);
  }

  const { id } = c.req.param();

  const existing = await prisma.listing.findUnique({ where: { id } });
  if (!existing) {
    return c.json({ error: { message: "Listing not found", code: "NOT_FOUND" } }, 404);
  }

  if (user.role !== "ADMIN" && existing.createdById !== user.id) {
    return c.json({ error: { message: "Forbidden", code: "FORBIDDEN" } }, 403);
  }

  await prisma.listing.update({
    where: { id },
    data: { status: "INACTIVE" },
  });

  return c.json({ data: { success: true } });
});

// POST /api/listings/generate-description
// Uses OpenAI to generate a professional property description
const generateDescriptionSchema = z.object({
  propertyType: z.string(),
  listingType: z.string(),
  nature: z.string().optional(),
  location: z.string(),
  bedrooms: z.number().optional(),
  bathrooms: z.number().optional(),
  areaSqft: z.number().optional(),
  areaUnit: z.string().optional().default("sqft"),
  price: z.number().optional(),
  amenities: z.array(z.string()).optional().default([]),
  nearbyLandmarks: z.array(z.string()).optional().default([]),
});

listingsRouter.post(
  "/listings/generate-description",
  zValidator("json", generateDescriptionSchema),
  async (c) => {
    const sessionUser = c.get("user");
    if (!sessionUser) {
      return c.json({ error: { message: "Unauthorized", code: "UNAUTHORIZED" } }, 401);
    }

    if (!env.OPENAI_API_KEY) {
      return c.json({ error: { message: "AI description generation is not configured", code: "NOT_CONFIGURED" } }, 503);
    }

    const data = c.req.valid("json");
    const {
      propertyType, listingType, nature, location, bedrooms, bathrooms,
      areaSqft, areaUnit, price, amenities, nearbyLandmarks,
    } = data;

    const listingTypeLabel = listingType === "RENTAL" ? "for rent" : "for sale";
    const bedsStr = bedrooms != null ? `${bedrooms} bedroom${bedrooms !== 1 ? "s" : ""}` : "";
    const bathsStr = bathrooms != null ? `${bathrooms} bathroom${bathrooms !== 1 ? "s" : ""}` : "";
    const areaStr = areaSqft != null ? `${areaSqft} ${areaUnit ?? "sqft"}` : "";
    const priceStr = price != null ? `KES ${price.toLocaleString("en-KE")}` : "";
    const amenitiesStr = amenities && amenities.length > 0 ? amenities.join(", ") : "";
    const landmarksStr = nearbyLandmarks && nearbyLandmarks.length > 0 ? nearbyLandmarks.join(", ") : "";

    const prompt = `Write a professional, compelling real estate listing description for a Kenyan property.
Property details:
- Type: ${propertyType} (${nature ?? "Residential"}) ${listingTypeLabel}
- Location: ${location}, Kenya
${bedsStr ? `- Bedrooms: ${bedsStr}` : ""}
${bathsStr ? `- Bathrooms: ${bathsStr}` : ""}
${areaStr ? `- Size: ${areaStr}` : ""}
${priceStr ? `- Price: ${priceStr}` : ""}
${amenitiesStr ? `- Amenities: ${amenitiesStr}` : ""}
${landmarksStr ? `- Nearby landmarks: ${landmarksStr}` : ""}

Write 3-4 engaging paragraphs that:
1. Opens with a strong headline sentence about the property
2. Describes the key features and living experience
3. Highlights the location advantages and nearby amenities
4. Closes with a compelling call to action

Use professional Kenyan real estate language. Do not use bullet points. Output only the description text, no headings.`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        max_tokens: 600,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      return c.json({ error: { message: "Failed to generate description", code: "AI_ERROR" } }, 502);
    }

    const result = await response.json() as { choices: Array<{ message: { content: string } }> };
    const description = result.choices?.[0]?.message?.content?.trim();

    if (!description) {
      return c.json({ error: { message: "No description generated", code: "AI_ERROR" } }, 502);
    }

    return c.json({ data: { description } });
  }
);

export { listingsRouter };
