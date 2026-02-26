/**
 * Seed images (and 1 video) onto existing test listings
 * Run: cd backend && bun run seed-media.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: { db: { url: process.env.DATABASE_URL ?? "file:./prisma/prisma/dev.db" } },
});

// Curated Unsplash photo URLs — reliable, no auth needed
const MEDIA: Record<string, { images: string[]; videos?: string[] }> = {
  // 240226 — Spacious 2BR Apartment in Westlands
  "cmm270rs90001m2vcuci167uf": {
    images: [
      "https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=1200&q=80",
      "https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=1200&q=80",
      "https://images.unsplash.com/photo-1560185893-a55cbc8c57e8?w=1200&q=80",
      "https://images.unsplash.com/photo-1484154218962-a197022b5858?w=1200&q=80",
      "https://images.unsplash.com/photo-1556909114-f6e7ad7d3136?w=1200&q=80",
      "https://images.unsplash.com/photo-1555041469-a586c61ea9bc?w=1200&q=80",
    ],
  },

  // 240227 — Modern 2BR Apartment in Kilimani
  "cmm3c5m6h0001m2iejjoh7x6d": {
    images: [
      "https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=1200&q=80",
      "https://images.unsplash.com/photo-1560185127-6ed189bf02f4?w=1200&q=80",
      "https://images.unsplash.com/photo-1586105251261-72a756497a11?w=1200&q=80",
      "https://images.unsplash.com/photo-1631679706909-1844bbd07221?w=1200&q=80",
      "https://images.unsplash.com/photo-1507652313519-d4e9174996dd?w=1200&q=80",
      "https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=1200&q=80",
      "https://images.unsplash.com/photo-1540518614846-7eded433c457?w=1200&q=80",
    ],
  },

  // 240228 — 3BR Townhouse — Lavington
  "cmm3c5m9i0003m2ie1tk83xsf": {
    images: [
      "https://images.unsplash.com/photo-1568605114967-8130f3a36994?w=1200&q=80",
      "https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=1200&q=80",
      "https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=1200&q=80",
      "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=1200&q=80",
      "https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?w=1200&q=80",
      "https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?w=1200&q=80",
      "https://images.unsplash.com/photo-1583608205776-bfd35f0d9f83?w=1200&q=80",
      "https://images.unsplash.com/photo-1576941089067-2de3c901e126?w=1200&q=80",
    ],
  },

  // 240229 — Studio Apartment — Westlands
  "cmm3c5mcj0005m2iel7x1c4sw": {
    images: [
      "https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=1200&q=80",
      "https://images.unsplash.com/photo-1598928506311-c55ded91a20c?w=1200&q=80",
      "https://images.unsplash.com/photo-1616594039964-ae9021a400a0?w=1200&q=80",
      "https://images.unsplash.com/photo-1617098900591-3f90928e8c54?w=1200&q=80",
      "https://images.unsplash.com/photo-1594560913095-e8c3f94e8b71?w=1200&q=80",
    ],
  },

  // 240230 — 4BR Villa — Karen (images + video)
  "cmm3c5mfk0007m2iecofsvgly": {
    images: [
      "https://images.unsplash.com/photo-1613490493576-7fde63acd811?w=1200&q=80",
      "https://images.unsplash.com/photo-1512917774080-9991f1c4c750?w=1200&q=80",
      "https://images.unsplash.com/photo-1600047509807-ba8f99d2cdde?w=1200&q=80",
      "https://images.unsplash.com/photo-1600585154526-990dced4db0d?w=1200&q=80",
      "https://images.unsplash.com/photo-1600047509358-9dc75507daeb?w=1200&q=80",
      "https://images.unsplash.com/photo-1598977123118-4e30ba3c4f5b?w=1200&q=80",
      "https://images.unsplash.com/photo-1416331108676-a22ccb276e35?w=1200&q=80",
      "https://images.unsplash.com/photo-1575517111839-3a3843ee7f5d?w=1200&q=80",
      "https://images.unsplash.com/photo-1564013799919-ab600027ffc6?w=1200&q=80",
      "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=1200&q=80",
    ],
    // Public domain sample property tour video
    videos: [
      "https://www.w3schools.com/html/mov_bbb.mp4",
    ],
  },

  // 240231 — Commercial Land — Thika Road
  "cmm3c5mim0009m2ieq0uqlz98": {
    images: [
      "https://images.unsplash.com/photo-1500382017468-9049fed747ef?w=1200&q=80",
      "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?w=1200&q=80",
      "https://images.unsplash.com/photo-1557804506-669a67965ba0?w=1200&q=80",
      "https://images.unsplash.com/photo-1486325212027-8081e485255e?w=1200&q=80",
      "https://images.unsplash.com/photo-1454165804606-c3d57bc86b40?w=1200&q=80",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=1200&q=80",
    ],
  },
};

async function main() {
  for (const [id, media] of Object.entries(MEDIA)) {
    const listing = await prisma.listing.findUnique({
      where: { id },
      select: { listingNumber: true, title: true },
    });
    if (!listing) {
      console.warn(`⚠️  Listing ${id} not found, skipping`);
      continue;
    }

    await prisma.listing.update({
      where: { id },
      data: {
        images: JSON.stringify(media.images),
        videos: JSON.stringify(media.videos ?? []),
      },
    });

    const videoNote = media.videos?.length ? ` + ${media.videos.length} video` : "";
    console.log(`✅ #${listing.listingNumber} — ${listing.title}: ${media.images.length} images${videoNote}`);
  }

  await prisma.$disconnect();
  console.log("\n🎉 Media seeded on all listings!");
}

main().catch((e) => {
  console.error("❌", e.message);
  process.exit(1);
});
