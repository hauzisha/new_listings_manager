import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient({
  datasources: { db: { url: "file:./prisma/dev.db" } }
});

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: "admin@hauzisha.co.ke" }
  });
  
  if (!user) {
    console.error("❌ Admin user not found — sign-up may have failed");
    process.exit(1);
  }

  await prisma.user.update({
    where: { email: "admin@hauzisha.co.ke" },
    data: {
      role: "ADMIN",
      isApproved: true,
      permissions: JSON.stringify(["manage_users", "manage_listings", "manage_commissions", "view_all", "approve_users", "system_settings"]),
    },
  });
  console.log("✅ Admin user role and permissions set");
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
