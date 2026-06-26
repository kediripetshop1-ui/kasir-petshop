import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import LoginForm from "./login-form";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/kasir");

  return (
    <main className="flex flex-1 items-center justify-center px-4">
      <div className="w-full max-w-sm rounded-2xl border border-neutral-800 bg-neutral-900 p-8 shadow-xl">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-white">Kasir Petshop</h1>
          <p className="mt-1 text-sm text-neutral-400">Masuk untuk mulai transaksi</p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
