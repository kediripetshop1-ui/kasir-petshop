import { db } from "@/lib/db";
import PosClient from "./pos-client";

export default async function KasirPage() {
  const products = await db.product.findMany({
    where: { stock: { gt: 0 } },
    orderBy: { name: "asc" },
  });

  return <PosClient products={products} />;
}
