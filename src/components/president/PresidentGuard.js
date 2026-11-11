"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { authClient } from "@/lib/auth-client";

export default function PresidentGuard({ children, requiredRole = "president", roleLabel = "President" }) {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const user = session?.user;
  const isAuthorized = user?.role?.trim().toLowerCase() === requiredRole;

  useEffect(() => {
    if (!isPending && !user) {
      router.replace("/login");
    }
  }, [isPending, router, user]);

  if (isPending || !user) {
    return (
      <main className="flex flex-1 items-center justify-center bg-[#F8F6EF] px-4 py-16">
        <p role="status" className="text-sm font-medium text-[#68695D]">Checking your account...</p>
      </main>
    );
  }

  if (!isAuthorized) {
    return (
      <main className="flex flex-1 items-center justify-center bg-[#F8F6EF] px-4 py-16">
        <section className="w-full max-w-lg rounded-3xl border border-[#DDD6C9] bg-white/70 p-8 text-center shadow-[0_10px_30px_rgba(36,36,31,0.05)]">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#E7DDCE] text-lg font-semibold text-[#35382D]" aria-hidden="true">!</div>
          <h1 className="mt-5 text-2xl font-semibold tracking-tight text-[#24241F]">{roleLabel} access required</h1>
          <p className="mt-2 text-sm leading-6 text-[#68695D]">Your account does not have permission to access this area.</p>
          <Link
            href="/dashboard"
            className="mt-6 inline-flex rounded-xl bg-[#35382D] px-4 py-2.5 text-sm font-medium text-[#F8F6EF] transition hover:bg-[#24241F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35382D]/40 focus-visible:ring-offset-2"
          >
            Go to dashboard
          </Link>
        </section>
      </main>
    );
  }

  return children;
}
