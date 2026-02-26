import { PrismaClient } from "@prisma/client";
import { hashPassword } from "better-auth/crypto";

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

  // Seed test user accounts
  const users = [
    {
      name: "Admin",
      email: "admin@hauzisha.co.ke",
      password: "Admin@2026#",
      role: "ADMIN",
      isApproved: true,
      emailVerified: true,
    },
    {
      name: "James Agent",
      email: "jamesagent@gmail.com",
      password: "12345678",
      role: "AGENT",
      isApproved: true,
      emailVerified: true,
    },
    {
      name: "James Promoter",
      email: "jamespromoter@gmail.com",
      password: "12345678",
      role: "PROMOTER",
      isApproved: true,
      emailVerified: true,
    },
  ];

  for (const userData of users) {
    const hashedPassword = await hashPassword(userData.password);

    // Upsert the user record
    const user = await prisma.user.upsert({
      where: { email: userData.email },
      update: {
        name: userData.name,
        role: userData.role,
        isApproved: userData.isApproved,
        emailVerified: userData.emailVerified,
      },
      create: {
        id: crypto.randomUUID(),
        name: userData.name,
        email: userData.email,
        role: userData.role,
        isApproved: userData.isApproved,
        emailVerified: userData.emailVerified,
      },
    });

    // Upsert the account record (Better Auth credential store)
    // Account model has no @@unique([providerId, accountId]), so use findFirst + create/update
    const existingAccount = await prisma.account.findFirst({
      where: {
        providerId: "credential",
        accountId: userData.email,
      },
    });

    if (existingAccount) {
      await prisma.account.update({
        where: { id: existingAccount.id },
        data: { password: hashedPassword },
      });
    } else {
      await prisma.account.create({
        data: {
          id: crypto.randomUUID(),
          userId: user.id,
          providerId: "credential",
          accountId: userData.email,
          password: hashedPassword,
        },
      });
    }

    console.log(`✅ Seeded user: ${userData.email} (${userData.role})`);
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
