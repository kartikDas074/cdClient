"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import AuthShell from "@/components/auth/AuthShell";

export default function SignInPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = {};

    if (!form.email.trim()) {
      nextErrors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (!form.password) {
      nextErrors.password = "Password is required.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      const requestedCallback = new URLSearchParams(window.location.search).get("callbackURL");
      const callbackDestination = requestedCallback
        ? new URL(requestedCallback, window.location.origin)
        : new URL("/", window.location.origin);
      const callbackURL = callbackDestination.origin === window.location.origin
        ? `${callbackDestination.pathname}${callbackDestination.search}${callbackDestination.hash}`
        : "/";
      const { error } = await authClient.signIn.email({
        email: form.email.trim(),
        password: form.password,
        callbackURL,
      });

      if (error) {
        setErrors({ submit: error.message || "Unable to sign you in right now." });
        return;
      }

      router.replace(callbackURL);
    } catch (error) {
      setErrors({
        submit: error?.message || "Something went wrong while signing you in.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Welcome back"
      subtitle="Sign in to continue your Coding Hub journey"
      footerText="Don't have an account?"
      footerLinkText="Sign up"
      footerHref="/sign-up"
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div>
          <label htmlFor="email" className="mb-2 block text-sm font-medium text-[#24241F]">Email</label>
          <input
            id="email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            placeholder="you@example.com"
            className="w-full rounded-xl border border-[#DDD6C9] bg-[#F8F6EF] px-3.5 py-3 text-base text-[#24241F] outline-none transition focus:border-[#35382D]/60 focus:ring-2 focus:ring-[#D8CCBA]"
          />
          {errors.email && <p className="mt-1.5 text-xs text-red-700">{errors.email}</p>}
        </div>

        <div>
          <label htmlFor="password" className="mb-2 block text-sm font-medium text-[#24241F]">Password</label>
          <div className="relative">
            <input
              id="password"
              name="password"
              type={showPassword ? "text" : "password"}
              value={form.password}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full rounded-xl border border-[#DDD6C9] bg-[#F8F6EF] px-3.5 py-3 pr-12 text-base text-[#24241F] outline-none transition focus:border-[#35382D]/60 focus:ring-2 focus:ring-[#D8CCBA]"
            />
            <button
              type="button"
              onClick={() => setShowPassword((current) => !current)}
              className="absolute inset-y-0 right-0 flex h-11 w-11 items-center justify-center rounded-r-xl text-[#35382D]/70 transition hover:bg-[#E7DDCE]/50 focus:outline-none focus:ring-2 focus:ring-[#D8CCBA] focus:ring-offset-0"
              aria-label={showPassword ? "Hide password" : "Show password"}
            >
              {showPassword ? (
                <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.8]" aria-hidden="true">
                  <path d="M2.5 12s3.5-6.5 9.5-6.5S21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12Z" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="12" cy="12" r="2.7" />
                </svg>
              ) : (
                <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.8]" aria-hidden="true">
                  <path d="M3 3l18 18" strokeLinecap="round" />
                  <path d="M10.6 10.6A2.7 2.7 0 0 0 13.4 13.4" strokeLinecap="round" />
                  <path d="M9.1 5.5A12.5 12.5 0 0 1 12 5c6 0 9.5 7 9.5 7a16.8 16.8 0 0 1-4 5.1M6 6.8A16.8 16.8 0 0 0 2.5 12S5.8 19 12 19a11.6 11.6 0 0 0 5.5-1.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
            </button>
          </div>
          {errors.password && <p className="mt-1.5 text-xs text-red-700">{errors.password}</p>}
        </div>

        {errors.submit && (
          <p className="rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {errors.submit}
          </p>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full rounded-xl bg-[#35382D] px-4 py-3.5 text-base font-medium text-[#F8F6EF] transition hover:bg-[#24241F] disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isSubmitting ? "Signing in..." : "Sign In"}
        </button>
      </form>
    </AuthShell>
  );
}
