import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: { db: { url: "file:./prisma/dev.db" } }
});

async function main() {
  // Note: sqlite_sequence is only created when an AUTOINCREMENT table exists.
  // Since listingNumber is managed by app logic (starting at 240226), we skip the sequence step.
  console.log("ℹ️  Listing numbers will start at 240226 (managed by app logic)");

  // Insert default system settings
  const settings = [
    { key: "recruiter_bonus_enabled", value: "true" },
    { key: "recruiter_bonus_amount", value: "500" },
    { key: "agent_response_sla_hours", value: "2" },
    { key: "stale_inquiry_threshold_days", value: "3" },
  ];

  for (const setting of settings) {
    await prisma.systemSetting.upsert({
      where: { key: setting.key },
      update: {},
      create: setting,
    });
  }
  console.log("✅ System settings seeded");

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
