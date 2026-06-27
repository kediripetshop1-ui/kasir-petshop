import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import LoginForm from "./login-form";

export default async function LoginPage() {
  const user = await getCurrentUser();
  if (user) redirect("/kasir");

  return (
    <main className="flex flex-1 items-center justify-center bg-gray-100 px-4">
      <div className="w-full max-w-sm rounded-xl border border-gray-200 bg-white p-8 shadow-sm">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-bold text-gray-900">Kasir Petshop</h1>
          <p className="mt-1 text-sm text-gray-500">Masuk untuk mulai transaksi</p>
        </div>
        <LoginForm />
      </div>
    </main>
  );
}
