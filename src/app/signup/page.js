"use client";

import Image from "next/image";
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { uploadToCloudinary } from "@/lib/cloudinary";
import AuthShell from "@/components/auth/AuthShell";

const initialState = {
  name: "",
  email: "",
  password: "",
  confirmPassword: "",
};

export default function SignUpPage() {
  const router = useRouter();
  const fileInputRef = useRef(null);
  const [form, setForm] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [selectedImage, setSelectedImage] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
  };

  const handleImageSelect = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedImage(file);
    setPreviewUrl(URL.createObjectURL(file));
    setErrors((current) => ({ ...current, image: "" }));
  };

  const removeImage = () => {
    setSelectedImage(null);
    setPreviewUrl("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const validateForm = () => {
    const nextErrors = {};
    const trimmedName = form.name.trim();
    const trimmedEmail = form.email.trim();

    if (!trimmedName) nextErrors.name = "Name is required.";
    if (!trimmedEmail) {
      nextErrors.email = "Email is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (!form.password) {
      nextErrors.password = "Password is required.";
    } else if (form.password.length < 8) {
      nextErrors.password = "Password must be at least 8 characters long.";
    }

    if (!form.confirmPassword) {
      nextErrors.confirmPassword = "Please confirm your password.";
    } else if (form.confirmPassword !== form.password) {
      nextErrors.confirmPassword = "Passwords do not match.";
    }

    return nextErrors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const nextErrors = validateForm();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setIsSubmitting(true);
    setErrors({});

    try {
      let imageUrl = "";
      if (selectedImage) {
        imageUrl = await uploadToCloudinary(selectedImage);
      }

      const { data, error } = await authClient.signUp.email({
        name: form.name.trim(),
        email: form.email.trim(),
        password: form.password,
        image: imageUrl || undefined,
        callbackURL: "/",
      });

      if (error) {
        setErrors({ submit: error.message || "Unable to create your account right now." });
        return;
      }

      if (data?.user) {
        router.push("/");
      }
    } catch (error) {
      setErrors({
        submit: error?.message || "Something went wrong while creating your account.",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <AuthShell
      title="Create your account"
      subtitle="Join the GSTU CSE tech community"
      footerText="Already have an account?"
      footerLinkText="Sign in"
      footerHref="/sign-in"
    >
      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        <div className="flex justify-center">
          <div className="relative">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="group flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border border-[#DDD6C9] bg-[#E7DDCE]/60 text-[#35382D] transition hover:border-[#35382D]/35 hover:bg-[#D8CCBA]/70"
              aria-label="Upload profile photo"
            >
              {previewUrl ? (
                <Image
                  src={previewUrl}
                  alt="Profile preview"
                  fill
                  unoptimized
                  className="object-cover"
                />
              ) : (
                <div className="flex flex-col items-center justify-center gap-1">
                  <svg viewBox="0 0 24 24" className="h-7 w-7 fill-none stroke-current stroke-[1.6]" aria-hidden="true">
                    <path d="M12 12.2a3.2 3.2 0 1 0 0-6.4 3.2 3.2 0 0 0 0 6.4Zm-6.5 7.3a6.5 6.5 0 0 1 13 0" strokeLinecap="round" strokeLinejoin="round"/>
                    <path d="M19 7v5m-2.5-2.5h5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  <span className="text-[10px] font-medium uppercase tracking-[0.12em]">Photo</span>
                </div>
              )}
            </button>
            {previewUrl && (
              <div className="absolute -bottom-1 -right-1 flex gap-1 rounded-full border border-[#DDD6C9] bg-[#F8F6EF] p-1 shadow-sm">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="rounded-full bg-[#E7DDCE] px-2 py-1 text-[10px] font-medium text-[#35382D]"
                >
                  Change
                </button>
                <button
                  type="button"
                  onClick={removeImage}
                  className="rounded-full bg-[#F8F6EF] px-2 py-1 text-[10px] font-medium text-[#35382D]"
                >
                  Remove
                </button>
              </div>
            )}
          </div>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={handleImageSelect}
        />

        {!previewUrl && (
          <p className="-mt-2 text-center text-xs text-[#35382D]/70">Upload profile photo (optional)</p>
        )}

        <div>
          <label htmlFor="name" className="mb-2 block text-sm font-medium text-[#24241F]">Name</label>
          <input
            id="name"
            name="name"
            type="text"
            value={form.name}
            onChange={handleChange}
            placeholder="Your full name"
            className="w-full rounded-xl border border-[#DDD6C9] bg-[#F8F6EF] px-3.5 py-3 text-base text-[#24241F] outline-none transition focus:border-[#35382D]/60 focus:ring-2 focus:ring-[#D8CCBA]"
          />
          {errors.name && <p className="mt-1.5 text-xs text-red-700">{errors.name}</p>}
        </div>

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

        <div>
          <label htmlFor="confirmPassword" className="mb-2 block text-sm font-medium text-[#24241F]">Confirm Password</label>
          <div className="relative">
            <input
              id="confirmPassword"
              name="confirmPassword"
              type={showConfirmPassword ? "text" : "password"}
              value={form.confirmPassword}
              onChange={handleChange}
              placeholder="••••••••"
              className="w-full rounded-xl border border-[#DDD6C9] bg-[#F8F6EF] px-3.5 py-3 pr-12 text-base text-[#24241F] outline-none transition focus:border-[#35382D]/60 focus:ring-2 focus:ring-[#D8CCBA]"
            />
            <button
              type="button"
              onClick={() => setShowConfirmPassword((current) => !current)}
              className="absolute inset-y-0 right-0 flex h-11 w-11 items-center justify-center rounded-r-xl text-[#35382D]/70 transition hover:bg-[#E7DDCE]/50 focus:outline-none focus:ring-2 focus:ring-[#D8CCBA] focus:ring-offset-0"
              aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
            >
              {showConfirmPassword ? (
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
          {errors.confirmPassword && <p className="mt-1.5 text-xs text-red-700">{errors.confirmPassword}</p>}
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
          {isSubmitting ? "Creating account..." : "Create Account"}
        </button>
      </form>
    </AuthShell>
  );
}
