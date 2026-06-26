import { redirect } from "next/navigation";
import Link from "next/link";
import { getCurrentUser } from "@/lib/auth";
import { logoutAction } from "./actions";

const NAV = [
  { href: "/kasir", label: "Kasir" },
  { href: "/produk", label: "Produk" },
  { href: "/stok-masuk", label: "Stok Masuk" },
  { href: "/laporan", label: "Laporan" },
];

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  return (
    <div className="flex min-h-screen">
      <aside className="flex w-56 flex-col border-r border-neutral-800 bg-neutral-900 p-4">
        <div className="mb-6">
          <p className="text-lg font-bold text-white">Kasir Petshop</p>
          <p className="text-xs text-neutral-400">{user.name} · {user.role}</p>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-sm text-neutral-300 transition hover:bg-neutral-800 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <form action={logoutAction}>
          <button
            type="submit"
            className="w-full rounded-lg border border-neutral-700 px-3 py-2 text-sm text-neutral-300 transition hover:bg-neutral-800"
          >
            Keluar
          </button>
        </form>
      </aside>
      <main className="flex-1 bg-neutral-950 p-6">{children}</main>
    </div>
  );
}
