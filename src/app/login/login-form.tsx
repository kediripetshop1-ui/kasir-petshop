"use client";

import { useActionState } from "react";
import { loginAction } from "./actions";

export default function LoginForm() {
  const [state, formAction, pending] = useActionState(loginAction, undefined);

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label className="mb-1 block text-sm text-neutral-300" htmlFor="username">
          Username
        </label>
        <input
          id="username"
          name="username"
          autoComplete="username"
          required
          className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-white outline-none focus:border-emerald-500"
        />
      </div>
      <div>
        <label className="mb-1 block text-sm text-neutral-300" htmlFor="password">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete="current-password"
          required
          className="w-full rounded-lg border border-neutral-700 bg-neutral-800 px-3 py-2 text-white outline-none focus:border-emerald-500"
        />
      </div>

      {state?.error && (
        <p className="rounded-lg bg-red-950 px-3 py-2 text-sm text-red-300">{state.error}</p>
      )}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-lg bg-emerald-600 px-3 py-2 font-medium text-white transition hover:bg-emerald-500 disabled:opacity-60"
      >
        {pending ? "Memproses..." : "Masuk"}
      </button>
    </form>
  );
}
