import { PrismaClient } from "../src/generated/prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

const adapter = new PrismaPg({ connectionString: process.env.DATABASE_URL });
const db = new PrismaClient({ adapter });

async function main() {
  const adminPassword = await bcrypt.hash("admin123", 10);
  await db.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      name: "Admin",
      username: "admin",
      password: adminPassword,
      role: "admin",
    },
  });

  const categories = ["Pakan", "Aksesoris", "Obat & Vitamin", "Grooming", "Kandang & Perlengkapan"];
  for (const name of categories) {
    await db.category.upsert({ where: { name }, update: {}, create: { name } });
  }

  const pakan = await db.category.findUnique({ where: { name: "Pakan" } });
  await db.product.upsert({
    where: { sku: "PKN-001" },
    update: {},
    create: {
      sku: "PKN-001",
      name: "Royal Canin Adult 1kg",
      categoryId: pakan?.id,
      unit: "pcs",
      costPrice: 85000,
      sellPrice: 110000,
      stock: 20,
      minStock: 5,
    },
  });

  console.log("Seed selesai. Login: admin / admin123");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await db.$disconnect();
  });
