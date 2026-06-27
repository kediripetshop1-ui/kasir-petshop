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
    <div className="flex min-h-screen bg-gray-100">
      <aside className="flex w-56 flex-col border-r border-gray-200 bg-white p-4">
        <div className="mb-6">
          <p className="text-lg font-bold text-gray-900">Kasir Petshop</p>
          <p className="text-xs text-gray-500">{user.name} · {user.role}</p>
        </div>
        <nav className="flex flex-1 flex-col gap-1">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="rounded-lg px-3 py-2 text-sm font-medium text-gray-600 transition hover:bg-gray-100 hover:text-gray-900"
            >
              {item.label}
            </Link>
          ))}
        </nav>
        <form action={logoutAction}>
          <button
            type="submit"
            className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm text-gray-600 transition hover:bg-gray-100"
          >
            Keluar
          </button>
        </form>
      </aside>
      <main className="flex-1 p-6">{children}</main>
    </div>
  );
}
