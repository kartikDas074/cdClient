"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { createClub, getClubById, updateClub } from "@/lib/api";
import { uploadToCloudinary } from "@/lib/cloudinary";

const categories = [
  "Programming",
  "Web Development",
  "Competitive Programming",
  "Artificial Intelligence",
  "Cyber Security",
  "Robotics",
  "Other",
];

const acceptedImageTypes = ["image/jpeg", "image/png", "image/webp"];
const maximumImageSize = 5 * 1024 * 1024;
const fieldClassName = "w-full rounded-xl border border-[#DDD6C9] bg-[#F8F6EF] px-3.5 py-3 text-sm text-[#24241F] outline-none transition placeholder:text-[#8A8B7F] focus:border-[#35382D]/60 focus:ring-2 focus:ring-[#D8CCBA]";
const errorFieldClassName = "border-red-300 focus:border-red-500 focus:ring-red-100";

const initialForm = {
  name: "",
  shortDescription: "",
  description: "",
  category: "",
  foundedAt: "",
  mission: "",
  vision: "",
  email: "",
  facebook: "",
  website: "",
  meetingSchedule: "",
  meetingLocation: "",
};

function FieldError({ children, id }) {
  if (!children) return null;
  return <p id={id} className="mt-1.5 text-xs leading-5 text-red-700">{children}</p>;
}

function SectionHeading({ eyebrow, title, description }) {
  return (
    <div className="border-b border-[#E8E3D9] pb-4">
      <p className="text-[11px] font-semibold uppercase tracking-[0.15em] text-[#747566]">{eyebrow}</p>
      <h2 className="mt-1.5 text-lg font-semibold tracking-tight text-[#24241F]">{title}</h2>
      <p className="mt-1 text-sm leading-6 text-[#68695D]">{description}</p>
    </div>
  );
}

function ImageUploader({ id, label, required, image, error, onSelect, onRemove, onRetry }) {
  const fileInputRef = useRef(null);
  const isUploading = image?.status === "uploading";
  const isUploaded = image?.status === "uploaded";

  return (
    <div>
      <div className="mb-2 flex items-center justify-between gap-3">
        <label htmlFor={id} className="text-sm font-medium text-[#35382D]">
          {label} {required ? <span aria-hidden="true">*</span> : <span className="font-normal text-[#747566]">(optional)</span>}
        </label>
        {image?.file && (
          <span className="text-xs text-[#747566]">{(image.file.size / (1024 * 1024)).toFixed(2)} MB</span>
        )}
      </div>

      <input
        ref={fileInputRef}
        id={id}
        type="file"
        accept="image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp"
        className="sr-only"
        aria-describedby={`${id}-hint${error ? ` ${id}-error` : ""}`}
        onChange={(event) => {
          onSelect(event.target.files?.[0]);
          event.target.value = "";
        }}
      />

      <div className={`overflow-hidden rounded-2xl border ${error ? "border-red-300" : "border-[#DDD6C9]"} bg-[#F8F6EF]`}>
        {image?.preview ? (
          <>
            <div className={`${id === "club-logo" ? "aspect-[16/8]" : "aspect-[16/6]"} relative bg-[#E7DDCE]/50`}>
              <Image
                src={image.preview}
                alt={`${label} preview`}
                fill
                sizes="(max-width: 640px) 100vw, 520px"
                unoptimized
                className="object-cover"
              />
              {isUploading && <div className="absolute inset-0 animate-pulse bg-[#24241F]/10" aria-hidden="true" />}
            </div>
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#DDD6C9] px-3.5 py-3">
              <span className={`inline-flex items-center gap-2 text-xs font-medium ${isUploaded ? "text-[#465B3E]" : isUploading ? "text-[#68695D]" : "text-red-700"}`} role="status">
                {isUploading ? (
                  <>
                    <span className="h-3.5 w-3.5 animate-spin rounded-full border-2 border-[#A9A99B] border-t-[#35382D]" aria-hidden="true" />
                    Uploading to Cloudinary…
                  </>
                ) : isUploaded ? (
                  <>
                    <span className="flex h-4 w-4 items-center justify-center rounded-full bg-[#E8EEE4]" aria-hidden="true">✓</span>
                    Image uploaded
                  </>
                ) : "Upload failed"}
              </span>
              <div className="flex items-center gap-3">
                {image.status === "error" && (
                  <button type="button" onClick={onRetry} className="text-xs font-semibold text-[#35382D] underline underline-offset-4">
                    Retry
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="text-xs font-semibold text-[#35382D] underline underline-offset-4"
                >
                  Replace
                </button>
                <button
                  type="button"
                  onClick={onRemove}
                  className="text-xs font-semibold text-[#8A433B] underline underline-offset-4"
                >
                  Remove
                </button>
              </div>
            </div>
          </>
        ) : (
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex min-h-36 w-full flex-col items-center justify-center px-4 py-6 text-center transition hover:bg-[#E7DDCE]/35 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#35382D]/40"
          >
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#E7DDCE]/75 text-[#55574A]" aria-hidden="true">
              <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.7]" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 16V4m0 0L7.5 8.5M12 4l4.5 4.5M4 15v4a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-4" />
              </svg>
            </span>
            <span className="mt-3 text-sm font-medium text-[#35382D]">Choose an image</span>
            <span className="mt-1 text-xs text-[#747566]">JPG, PNG or WEBP · up to 5 MB</span>
          </button>
        )}
      </div>
      <p id={`${id}-hint`} className="mt-1.5 text-xs text-[#747566]">
        {required ? "A clear logo helps students recognize your club." : "Wide images work best for the club cover."}
      </p>
      <FieldError id={`${id}-error`}>{error}</FieldError>
    </div>
  );
}

export default function CreateClubForm({ clubId }) {
  const router = useRouter();
  const isEditing = Boolean(clubId);
  const [form, setForm] = useState(initialForm);
  const [images, setImages] = useState({ logo: null, coverImage: null });
  const [errors, setErrors] = useState({});
  const [isAdditionalOpen, setIsAdditionalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasCreated, setHasCreated] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [success, setSuccess] = useState("");
  const uploadTokens = useRef({ logo: 0, coverImage: 0 });
  const submitLock = useRef(false);
  const redirectTimer = useRef(null);

  useEffect(() => () => {
    if (redirectTimer.current) window.clearTimeout(redirectTimer.current);
  }, []);

  useEffect(() => () => {
    if (images.logo?.preview?.startsWith("blob:")) URL.revokeObjectURL(images.logo.preview);
  }, [images.logo?.preview]);

  useEffect(() => () => {
    if (images.coverImage?.preview?.startsWith("blob:")) URL.revokeObjectURL(images.coverImage.preview);
  }, [images.coverImage?.preview]);

  useEffect(() => {
    if (!clubId) return undefined;
    let isCurrent = true;

    getClubById(clubId)
      .then((response) => {
        if (!response?.success || !response.club) {
          throw new Error(response?.message || "Club not found.");
        }
        if (!isCurrent) return;

        const club = response.club;
        const foundedDate = club.foundedAt ? new Date(club.foundedAt) : null;
        setForm({
          name: club.name || "",
          shortDescription: (club.shortDescription || club.description || "").slice(0, 200),
          description: club.description || "",
          category: club.category || "",
          foundedAt: foundedDate && !Number.isNaN(foundedDate.getTime())
            ? foundedDate.toISOString().slice(0, 10)
            : "",
          mission: club.mission || "",
          vision: club.vision || "",
          email: club.email || "",
          facebook: club.socialLinks?.facebook || "",
          website: club.socialLinks?.website || "",
          meetingSchedule: club.meetingSchedule || "",
          meetingLocation: club.meetingLocation || "",
        });
        setImages({
          logo: club.logo ? { preview: club.logo, url: club.logo, status: "uploaded" } : null,
          coverImage: club.coverImage ? { preview: club.coverImage, url: club.coverImage, status: "uploaded" } : null,
        });
        setIsAdditionalOpen(Boolean(
          club.foundedAt || club.mission || club.vision || club.email ||
          club.socialLinks?.facebook || club.socialLinks?.website ||
          club.meetingSchedule || club.meetingLocation
        ));
      })
      .catch((error) => {
        if (isCurrent) setSubmitError(error?.message || "Unable to load this club.");
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, [clubId]);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setErrors((current) => ({ ...current, [name]: "" }));
    setSubmitError("");
  };

  const uploadImage = async (slot, file, preview) => {
    const token = ++uploadTokens.current[slot];
    setImages((current) => ({
      ...current,
      [slot]: { file, preview, url: "", status: "uploading" },
    }));
    setErrors((current) => ({ ...current, [slot]: "" }));
    setSubmitError("");

    try {
      const url = await uploadToCloudinary(file);
      if (uploadTokens.current[slot] === token) {
        setImages((current) => ({
          ...current,
          [slot]: { file, preview, url, status: "uploaded" },
        }));
      }
    } catch (error) {
      if (uploadTokens.current[slot] === token) {
        setImages((current) => ({
          ...current,
          [slot]: { file, preview, url: "", status: "error" },
        }));
        setErrors((current) => ({
          ...current,
          [slot]: error?.message || `Unable to upload the ${slot === "logo" ? "club logo" : "cover image"}. Please try again.`,
        }));
      }
    }
  };

  const handleImageSelect = (slot, file) => {
    if (!file) return;
    const errorKey = slot;
    if (!acceptedImageTypes.includes(file.type)) {
      setErrors((current) => ({ ...current, [errorKey]: "Choose a JPG, PNG, or WEBP image." }));
      return;
    }
    if (file.size > maximumImageSize) {
      setErrors((current) => ({ ...current, [errorKey]: "Image must be 5 MB or smaller." }));
      return;
    }
    void uploadImage(slot, file, URL.createObjectURL(file));
  };

  const removeImage = (slot) => {
    uploadTokens.current[slot] += 1;
    setImages((current) => ({ ...current, [slot]: null }));
    setErrors((current) => ({ ...current, [slot]: "" }));
    setSubmitError("");
  };

  const validate = () => {
    const nextErrors = {};
    if (!form.name.trim()) nextErrors.name = "Club name is required.";
    if (!form.shortDescription.trim()) nextErrors.shortDescription = "Short description is required.";
    if (form.shortDescription.length > 200) nextErrors.shortDescription = "Use 200 characters or fewer.";
    if (!form.category) nextErrors.category = "Choose a category.";
    if (!images.logo?.url || images.logo.status !== "uploaded") {
      nextErrors.logo = images.logo?.status === "uploading"
        ? "Wait for the logo upload to finish."
        : "Upload a club logo before creating the club.";
    }
    if (images.coverImage && images.coverImage.status !== "uploaded") {
      nextErrors.coverImage = images.coverImage.status === "uploading"
        ? "Wait for the cover image upload to finish."
        : "Upload the selected cover image or remove it.";
    }
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      nextErrors.email = "Enter a valid email address.";
    }

    for (const [key, label] of [["facebook", "Facebook page"], ["website", "Official website"]]) {
      const value = form[key].trim();
      if (!value) continue;
      try {
        const url = new URL(value);
        if (!["http:", "https:"].includes(url.protocol)) throw new Error("Invalid URL protocol");
      } catch {
        nextErrors[key] = `Enter a valid ${label.toLowerCase()} URL starting with https://.`;
      }
    }
    return nextErrors;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (submitLock.current || hasCreated) return;
    const nextErrors = validate();
    setErrors(nextErrors);
    setSubmitError("");
    if (Object.keys(nextErrors).length > 0) {
      const additionalField = ["foundedAt", "mission", "vision", "email", "facebook", "website", "meetingSchedule", "meetingLocation"]
        .some((field) => nextErrors[field]);
      if (additionalField) setIsAdditionalOpen(true);
      return;
    }

    submitLock.current = true;
    setIsSubmitting(true);
    try {
      const payload = {
        name: form.name.trim(),
        shortDescription: form.shortDescription.trim(),
        description: form.description.trim(),
        logo: images.logo.url,
        coverImage: images.coverImage?.url || "",
        category: form.category,
        foundedAt: form.foundedAt ? new Date(`${form.foundedAt}T00:00:00.000Z`) : null,
        mission: form.mission.trim(),
        vision: form.vision.trim(),
        email: form.email.trim(),
        socialLinks: {
          facebook: form.facebook.trim(),
          website: form.website.trim(),
        },
        meetingSchedule: form.meetingSchedule.trim(),
        meetingLocation: form.meetingLocation.trim(),
      };
      if (!isEditing) payload.status = "active";
      const response = isEditing
        ? await updateClub(clubId, payload)
        : await createClub(payload);
      if (!response?.success) {
        throw new Error(response?.message || `Unable to ${isEditing ? "save changes" : "create the club"}. Please try again.`);
      }
      setHasCreated(true);
      setSuccess(isEditing
        ? "Club updated successfully. Returning to Manage Clubs…"
        : "Club created successfully. Taking you to Manage Clubs…");
      redirectTimer.current = window.setTimeout(() => router.replace("/president/clubs"), 900);
    } catch (error) {
      submitLock.current = false;
      setSubmitError(error?.message || `Unable to ${isEditing ? "save changes" : "create the club"}. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const anyImageUploading = images.logo?.status === "uploading" || images.coverImage?.status === "uploading";

  return (
    <main className="flex-1 bg-[#F8F6EF] px-4 py-9 sm:px-6 sm:py-12 lg:px-8">
      <div className="mx-auto max-w-3xl">
        <div className="mb-7">
          <Link href="/president/clubs" className="inline-flex items-center gap-2 text-sm font-medium text-[#68695D] transition hover:text-[#24241F]">
            <span aria-hidden="true">←</span> Manage clubs
          </Link>
          <p className="mt-5 text-xs font-semibold uppercase tracking-[0.16em] text-[#747566]">President · Club management</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-[-0.045em] text-[#24241F] sm:text-4xl">{isEditing ? "Edit club" : "Create a club"}</h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-[#68695D]">{isEditing ? "Update your club profile and the details students see across CodingHub." : "Set up a home for students to learn, build, and connect. You can update these details at any time."}</p>
        </div>

        {success && (
          <div role="status" className="mb-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800 shadow-sm">
            {success}
          </div>
        )}

        {isLoading ? (
          <section role="status" aria-label="Loading club details" className="space-y-5 rounded-3xl border border-[#DDD6C9] bg-white/80 p-6 shadow-[0_12px_36px_rgba(36,36,31,0.055)] sm:p-8">
            <div className="h-4 w-1/3 animate-pulse rounded bg-[#E7DDCE]" />
            <div className="h-11 animate-pulse rounded-xl bg-[#E7DDCE]/70" />
            <div className="h-24 animate-pulse rounded-xl bg-[#E7DDCE]/70" />
            <div className="h-40 animate-pulse rounded-2xl bg-[#E7DDCE]/60" />
          </section>
        ) : submitError && isEditing && !form.name ? (
          <section className="rounded-3xl border border-[#DDD6C9] bg-white/80 p-6 shadow-[0_12px_36px_rgba(36,36,31,0.055)] sm:p-8">
            <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{submitError}</p>
            <Link href="/president/clubs" className="mt-5 inline-flex text-sm font-medium text-[#35382D] underline underline-offset-4">Back to Manage Clubs</Link>
          </section>
        ) : (
        <>
        <form onSubmit={handleSubmit} noValidate className="overflow-hidden rounded-3xl border border-[#DDD6C9] bg-white/80 shadow-[0_12px_36px_rgba(36,36,31,0.055)]">
          <section className="space-y-6 p-5 sm:p-8">
            <SectionHeading
              eyebrow="Section 01"
              title="Basic information"
              description="The essentials students will see when discovering your club."
            />

            <div>
              <label htmlFor="club-name" className="mb-2 block text-sm font-medium text-[#35382D]">Club name <span aria-hidden="true">*</span></label>
              <input
                id="club-name"
                name="name"
                value={form.name}
                onChange={handleChange}
                maxLength={100}
                placeholder="e.g. Programming Club"
                aria-invalid={Boolean(errors.name)}
                aria-describedby={errors.name ? "club-name-error" : undefined}
                className={`${fieldClassName} ${errors.name ? errorFieldClassName : ""}`}
              />
              <FieldError id="club-name-error">{errors.name}</FieldError>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <label htmlFor="club-short-description" className="text-sm font-medium text-[#35382D]">Short description <span aria-hidden="true">*</span></label>
                <span className={`text-xs ${form.shortDescription.length > 190 ? "text-[#8A433B]" : "text-[#747566]"}`} aria-live="polite">
                  {form.shortDescription.length}/200
                </span>
              </div>
              <textarea
                id="club-short-description"
                name="shortDescription"
                value={form.shortDescription}
                onChange={handleChange}
                rows={3}
                maxLength={200}
                placeholder="A concise introduction for club cards and previews."
                aria-invalid={Boolean(errors.shortDescription)}
                aria-describedby={errors.shortDescription ? "club-short-description-error" : undefined}
                className={`${fieldClassName} resize-y ${errors.shortDescription ? errorFieldClassName : ""}`}
              />
              <FieldError id="club-short-description-error">{errors.shortDescription}</FieldError>
            </div>

            <div>
              <label htmlFor="club-description" className="mb-2 block text-sm font-medium text-[#35382D]">
                Full description <span className="font-normal text-[#747566]">(optional)</span>
              </label>
              <textarea
                id="club-description"
                name="description"
                value={form.description}
                onChange={handleChange}
                rows={5}
                placeholder="Share more about the club, its activities, and who can join."
                className={`${fieldClassName} resize-y`}
              />
            </div>

            <div>
              <label htmlFor="club-category" className="mb-2 block text-sm font-medium text-[#35382D]">Category <span aria-hidden="true">*</span></label>
              <select
                id="club-category"
                name="category"
                value={form.category}
                onChange={handleChange}
                aria-invalid={Boolean(errors.category)}
                aria-describedby={errors.category ? "club-category-error" : undefined}
                className={`${fieldClassName} ${form.category ? "" : "text-[#747566]"} ${errors.category ? errorFieldClassName : ""}`}
              >
                <option value="" disabled>Select a category</option>
                {form.category && !categories.includes(form.category) && (
                  <option value={form.category}>{form.category} (current category)</option>
                )}
                {categories.map((category) => <option key={category} value={category}>{category}</option>)}
              </select>
              <FieldError id="club-category-error">{errors.category}</FieldError>
            </div>

            <div className="grid gap-5 sm:grid-cols-2">
              <ImageUploader
                id="club-logo"
                label="Club logo"
                required
                image={images.logo}
                error={errors.logo}
                onSelect={(file) => handleImageSelect("logo", file)}
                onRemove={() => removeImage("logo")}
                onRetry={() => uploadImage("logo", images.logo.file, images.logo.preview)}
              />
              <ImageUploader
                id="club-cover"
                label="Cover image"
                image={images.coverImage}
                error={errors.coverImage}
                onSelect={(file) => handleImageSelect("coverImage", file)}
                onRemove={() => removeImage("coverImage")}
                onRetry={() => uploadImage("coverImage", images.coverImage.file, images.coverImage.preview)}
              />
            </div>
          </section>

          <section className="border-t border-[#E8E3D9]">
            <button
              type="button"
              onClick={() => setIsAdditionalOpen((open) => !open)}
              aria-expanded={isAdditionalOpen}
              aria-controls="additional-club-information"
              className="flex w-full items-center justify-between gap-4 px-5 py-5 text-left transition hover:bg-[#E7DDCE]/20 sm:px-8"
            >
              <span>
                <span className="block text-[11px] font-semibold uppercase tracking-[0.15em] text-[#747566]">Section 02</span>
                <span className="mt-1 block text-base font-semibold text-[#24241F]">Additional information <span className="font-normal text-[#747566]">(optional)</span></span>
                <span className="mt-1 block text-sm text-[#68695D]">Add the details that help students connect with your club.</span>
              </span>
              <svg viewBox="0 0 24 24" className={`h-5 w-5 shrink-0 fill-none stroke-[#68695D] stroke-[1.8] transition-transform ${isAdditionalOpen ? "rotate-180" : ""}`} aria-hidden="true">
                <path d="m6 9 6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>

            {isAdditionalOpen && (
              <div id="additional-club-information" className="space-y-5 border-t border-[#E8E3D9] px-5 py-6 sm:px-8">
                <div>
                  <label htmlFor="club-founded-at" className="mb-2 block text-sm font-medium text-[#35382D]">Founded date <span className="font-normal text-[#747566]">(optional)</span></label>
                  <input id="club-founded-at" name="foundedAt" type="date" value={form.foundedAt} onChange={handleChange} className={fieldClassName} />
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="club-mission" className="mb-2 block text-sm font-medium text-[#35382D]">Mission <span className="font-normal text-[#747566]">(optional)</span></label>
                    <textarea id="club-mission" name="mission" value={form.mission} onChange={handleChange} rows={4} placeholder="What is the main purpose of this club?" className={`${fieldClassName} resize-y`} />
                  </div>
                  <div>
                    <label htmlFor="club-vision" className="mb-2 block text-sm font-medium text-[#35382D]">Vision <span className="font-normal text-[#747566]">(optional)</span></label>
                    <textarea id="club-vision" name="vision" value={form.vision} onChange={handleChange} rows={4} placeholder="What does the club want to achieve?" className={`${fieldClassName} resize-y`} />
                  </div>
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="club-email" className="mb-2 block text-sm font-medium text-[#35382D]">Official email <span className="font-normal text-[#747566]">(optional)</span></label>
                    <input id="club-email" name="email" type="email" value={form.email} onChange={handleChange} placeholder="hello@codingclub.org" aria-invalid={Boolean(errors.email)} aria-describedby={errors.email ? "club-email-error" : undefined} className={`${fieldClassName} ${errors.email ? errorFieldClassName : ""}`} />
                    <FieldError id="club-email-error">{errors.email}</FieldError>
                  </div>
                  <div>
                    <label htmlFor="club-facebook" className="mb-2 block text-sm font-medium text-[#35382D]">Facebook page <span className="font-normal text-[#747566]">(optional)</span></label>
                    <input id="club-facebook" name="facebook" type="url" value={form.facebook} onChange={handleChange} placeholder="https://facebook.com/yourclub" aria-invalid={Boolean(errors.facebook)} aria-describedby={errors.facebook ? "club-facebook-error" : undefined} className={`${fieldClassName} ${errors.facebook ? errorFieldClassName : ""}`} />
                    <FieldError id="club-facebook-error">{errors.facebook}</FieldError>
                  </div>
                </div>
                <div>
                  <label htmlFor="club-website" className="mb-2 block text-sm font-medium text-[#35382D]">Official website <span className="font-normal text-[#747566]">(optional)</span></label>
                  <input id="club-website" name="website" type="url" value={form.website} onChange={handleChange} placeholder="https://yourclub.org" aria-invalid={Boolean(errors.website)} aria-describedby={errors.website ? "club-website-error" : undefined} className={`${fieldClassName} ${errors.website ? errorFieldClassName : ""}`} />
                  <FieldError id="club-website-error">{errors.website}</FieldError>
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="club-meeting-schedule" className="mb-2 block text-sm font-medium text-[#35382D]">Meeting schedule <span className="font-normal text-[#747566]">(optional)</span></label>
                    <input id="club-meeting-schedule" name="meetingSchedule" value={form.meetingSchedule} onChange={handleChange} placeholder="Every Thursday, 3:00 PM" className={fieldClassName} />
                  </div>
                  <div>
                    <label htmlFor="club-meeting-location" className="mb-2 block text-sm font-medium text-[#35382D]">Meeting location <span className="font-normal text-[#747566]">(optional)</span></label>
                    <input id="club-meeting-location" name="meetingLocation" value={form.meetingLocation} onChange={handleChange} placeholder="GSTU CSE Building" className={fieldClassName} />
                  </div>
                </div>
              </div>
            )}
          </section>

          {submitError && <p role="alert" className="mx-5 mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800 sm:mx-8">{submitError}</p>}

          <div className="flex flex-col-reverse gap-3 border-t border-[#E8E3D9] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-8">
            <Link href="/president/clubs" className="inline-flex justify-center rounded-xl border border-[#DDD6C9] px-4 py-2.5 text-sm font-medium text-[#35382D] transition hover:bg-[#E7DDCE]/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35382D]/35">
              Cancel
            </Link>
            <button
              type="submit"
              disabled={isSubmitting || hasCreated || anyImageUploading}
              className="inline-flex justify-center rounded-xl bg-[#35382D] px-5 py-2.5 text-sm font-medium text-[#F8F6EF] shadow-sm transition hover:bg-[#24241F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35382D]/45 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (isEditing ? "Saving changes…" : "Creating club…") : anyImageUploading ? "Uploading images…" : hasCreated ? (isEditing ? "Changes saved" : "Club created") : (isEditing ? "Save changes" : "Create club")}
            </button>
          </div>
        </form>

        <p className="mt-4 text-center text-xs leading-5 text-[#747566]">
          Fields marked with <span className="font-semibold text-[#35382D]">*</span> are required. {!isEditing && "Your club will be created as active."}
        </p>
        </>
        )}
      </div>
    </main>
  );
}
