"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import { getMyClubs, getMyProfile, updateMyProfile } from "@/lib/api";
import { uploadToCloudinary } from "@/lib/cloudinary";

const editableFields = [
  { key: "phoneNumber", label: "Phone number", type: "tel", maxLength: 40 },
  { key: "university", label: "University", type: "text", maxLength: 120 },
  { key: "department", label: "Department", type: "text", maxLength: 120 },
  { key: "studentId", label: "Student ID", type: "text", maxLength: 60 },
  { key: "academicSession", label: "Academic session", type: "text", maxLength: 60 },
  { key: "github", label: "GitHub profile URL", type: "url", maxLength: 2048 },
  { key: "linkedin", label: "LinkedIn profile URL", type: "url", maxLength: 2048 },
  { key: "portfolio", label: "Personal portfolio URL", type: "url", maxLength: 2048 },
];

const roleInformation = {
  president: {
    label: "Platform Administrator",
    description: "Platform administration",
    badge: "bg-[#EEE8D9] text-[#615338]",
  },
  pgpresident: {
    label: "Programming Club President",
    description: "Associated with the Programming Club",
    badge: "bg-[#E8EEE4] text-[#465B3E]",
  },
  wbpresident: {
    label: "Web Development Club President",
    description: "Associated with the Web Development Club",
    badge: "bg-[#E6ECEE] text-[#455C64]",
  },
  user: {
    label: "General Member",
    description: "CodingHub community member",
    badge: "bg-[#EEECE7] text-[#6C6A5F]",
  },
  banuser: {
    label: "Restricted Account",
    description: "Account access is restricted",
    badge: "bg-[#F4E8E4] text-[#8A433B]",
  },
};

const imageTypes = ["image/jpeg", "image/png", "image/webp"];
const maximumImageSize = 5 * 1024 * 1024;
const fieldClassName = "w-full rounded-xl border border-[#DDD6C9] bg-[#F8F6EF] px-3.5 py-2.5 text-sm text-[#24241F] outline-none transition placeholder:text-[#8A8B7F] focus:border-[#35382D]/60 focus:ring-2 focus:ring-[#D8CCBA]";

function getRoleInformation(role) {
  return roleInformation[role] || {
    label: "CodingHub Member",
    description: "CodingHub account",
    badge: "bg-[#EEECE7] text-[#6C6A5F]",
  };
}

function formatDate(value) {
  if (!value) return "Not available";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Not available"
    : new Intl.DateTimeFormat(undefined, { dateStyle: "long" }).format(date);
}

function getDraft(user) {
  return {
    name: user.name || "",
    phoneNumber: user.phoneNumber || "",
    university: user.university || "",
    department: user.department || "",
    studentId: user.studentId || "",
    academicSession: user.academicSession || "",
    bio: user.bio || "",
    github: user.github || "",
    linkedin: user.linkedin || "",
    portfolio: user.portfolio || "",
  };
}

function isValidHttpUrl(value) {
  if (!value) return true;
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}

function ProfileAvatar({ image, name, size = "h-20 w-20" }) {
  return (
    <div className={`relative flex ${size} shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#E7DDCE] text-2xl font-semibold text-[#35382D] ring-4 ring-white shadow-sm`}>
      {image ? (
        <Image src={image} alt="" fill sizes="80px" unoptimized className="object-cover" />
      ) : (
        name?.trim()?.[0]?.toUpperCase() || "U"
      )}
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <main className="flex-1 bg-[#F8F6EF] px-4 py-10 sm:px-6 lg:px-8" role="status" aria-label="Loading profile">
      <div className="mx-auto max-w-5xl">
        <div className="h-8 w-48 animate-pulse rounded bg-[#E7DDCE]" />
        <div className="mt-7 flex items-center gap-5 rounded-3xl border border-[#DDD6C9] bg-white/70 p-6">
          <div className="h-20 w-20 animate-pulse rounded-full bg-[#E7DDCE]" />
          <div className="flex-1 space-y-3">
            <div className="h-5 w-1/3 animate-pulse rounded bg-[#E7DDCE]" />
            <div className="h-4 w-1/2 animate-pulse rounded bg-[#E7DDCE]/75" />
            <div className="h-5 w-40 animate-pulse rounded-full bg-[#E7DDCE]/75" />
          </div>
        </div>
        <div className="mt-5 grid gap-5 md:grid-cols-2">
          {[0, 1].map((item) => (
            <div key={item} className="space-y-4 rounded-3xl border border-[#DDD6C9] bg-white/70 p-6">
              <div className="h-5 w-1/3 animate-pulse rounded bg-[#E7DDCE]" />
              <div className="h-10 animate-pulse rounded-xl bg-[#E7DDCE]/70" />
              <div className="h-10 animate-pulse rounded-xl bg-[#E7DDCE]/70" />
              <div className="h-10 animate-pulse rounded-xl bg-[#E7DDCE]/70" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

function InformationValue({ label, value, href }) {
  if (!value) return null;
  return (
    <div className="min-w-0">
      <dt className="text-xs font-medium text-[#747566]">{label}</dt>
      <dd className="mt-1 break-words text-sm text-[#35382D]">
        {href
          ? <a href={href} target="_blank" rel="noopener noreferrer" className="font-medium underline decoration-[#A9A99B] underline-offset-4 hover:text-[#24241F]">{value}</a>
          : value}
      </dd>
    </div>
  );
}

export default function MyProfilePage() {
  const router = useRouter();
  const { data: session, isPending: isSessionPending } = authClient.useSession();
  const [profile, setProfile] = useState(null);
  const [draft, setDraft] = useState(null);
  const [myClubs, setMyClubs] = useState([]);
  const [areClubsLoading, setAreClubsLoading] = useState(true);
  const [clubsError, setClubsError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [uploadMessage, setUploadMessage] = useState("");
  const [loadError, setLoadError] = useState("");
  const [toast, setToast] = useState("");
  const [toastIsError, setToastIsError] = useState(false);
  const [formError, setFormError] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [imageError, setImageError] = useState("");
  const fileInputRef = useRef(null);
  const userId = session?.user?.id || "";

  const loadProfile = useCallback(async (isCurrent = () => true) => {
    try {
      const response = await getMyProfile();
      if (!response?.success || !response.user) {
        throw new Error(response?.message || "Your profile could not be loaded.");
      }
      if (isCurrent()) {
        setProfile(response.user);
        setDraft(getDraft(response.user));
        setLoadError("");
      }
    } catch (error) {
      if (isCurrent()) setLoadError(error?.message || "Your profile could not be loaded. Please try again.");
    } finally {
      if (isCurrent()) setIsLoading(false);
    }
  }, []);

  const loadClubs = useCallback(async (isCurrent = () => true) => {
    try {
      const response = await getMyClubs();
      if (!response?.success || !Array.isArray(response.data)) {
        throw new Error(response?.message || "Your club memberships could not be loaded.");
      }
      if (isCurrent()) {
        setMyClubs(response.data.filter((membership) => membership.status === "active"));
        setClubsError("");
      }
    } catch (error) {
      if (isCurrent()) setClubsError(error?.message || "Your club memberships could not be loaded.");
    } finally {
      if (isCurrent()) setAreClubsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isSessionPending) return undefined;
    if (!userId) {
      router.replace(`/login?callbackURL=${encodeURIComponent("/dashboard/my-profile")}`);
      return undefined;
    }

    let isCurrent = true;
    const timer = window.setTimeout(() => {
      setIsLoading(true);
      loadProfile(() => isCurrent);
    }, 0);
    return () => {
      isCurrent = false;
      window.clearTimeout(timer);
    };
  }, [isSessionPending, loadProfile, router, userId]);

  useEffect(() => {
    if (isSessionPending || !userId) return undefined;

    let isCurrent = true;
    const timer = window.setTimeout(() => loadClubs(() => isCurrent), 0);
    return () => {
      isCurrent = false;
      window.clearTimeout(timer);
    };
  }, [isSessionPending, loadClubs, userId]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(""), 5000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  useEffect(() => () => {
    if (imagePreview.startsWith("blob:")) URL.revokeObjectURL(imagePreview);
  }, [imagePreview]);

  const role = profile?.role || session?.user?.role || "user";
  const roleInfo = getRoleInformation(role);
  const safeProfileUrl = (value) => isValidHttpUrl(value) && value ? value : "";

  const beginEditing = () => {
    setDraft(getDraft(profile));
    setImageFile(null);
    setImagePreview("");
    setImageError("");
    setFormError("");
    setIsEditing(true);
  };

  const cancelEditing = () => {
    setDraft(getDraft(profile));
    setImageFile(null);
    setImagePreview("");
    setImageError("");
    setFormError("");
    setIsEditing(false);
  };

  const handleImageChange = (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!imageTypes.includes(file.type)) {
      setImageError("Choose a JPG, PNG, or WEBP image.");
      return;
    }
    if (file.size > maximumImageSize) {
      setImageError("Choose an image smaller than 5 MB.");
      return;
    }

    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
    setImageError("");
  };

  const validateDraft = () => {
    if (!draft.name.trim()) return "Name is required.";
    if (draft.name.trim().length > 100) return "Name must be 100 characters or fewer.";
    if (draft.phoneNumber && !/^[+\d\s().-]{5,40}$/.test(draft.phoneNumber.trim())) {
      return "Enter a valid phone number.";
    }
    for (const field of ["github", "linkedin", "portfolio"]) {
      if (draft[field] && !isValidHttpUrl(draft[field].trim())) {
        const label = editableFields.find((item) => item.key === field)?.label || field;
        return `${label} must be a valid HTTP or HTTPS URL.`;
      }
    }
    for (const field of editableFields) {
      if (draft[field.key].length > field.maxLength) {
        return `${field.label} must be ${field.maxLength} characters or fewer.`;
      }
    }
    if (draft.bio.length > 500) return "Bio must be 500 characters or fewer.";
    return "";
  };

  const handleSave = async (event) => {
    event.preventDefault();
    const validationError = validateDraft();
    if (validationError) {
      setFormError(validationError);
      return;
    }

    setIsSaving(true);
    setFormError("");
    setToast("");
    try {
      let image = profile.image || "";
      if (imageFile) {
        setUploadMessage("Uploading profile picture...");
        image = await uploadToCloudinary(imageFile);
      }
      setUploadMessage("Saving your changes...");
      const response = await updateMyProfile({
        ...draft,
        name: draft.name.trim(),
        image,
      });
      if (!response?.success || !response.user) {
        throw new Error(response?.message || "Your profile could not be updated.");
      }
      setProfile(response.user);
      setDraft(getDraft(response.user));
      setImageFile(null);
      setImagePreview("");
      setIsEditing(false);
      setToast(response.message || "Your profile was updated.");
      setToastIsError(false);
    } catch (error) {
      const message = error?.message || "Your profile could not be updated. Please try again.";
      setFormError(message);
      setToast(message);
      setToastIsError(true);
    } finally {
      setUploadMessage("");
      setIsSaving(false);
    }
  };

  if (isSessionPending || isLoading) return <ProfileSkeleton />;

  if (!session?.user) return <main className="flex-1 bg-[#F8F6EF]" />;

  if (loadError || !profile) {
    return (
      <main className="flex flex-1 items-center justify-center bg-[#F8F6EF] px-4 py-16">
        <section className="w-full max-w-xl rounded-3xl border border-red-200 bg-red-50 px-6 py-10 text-center">
          <h1 className="text-xl font-semibold text-[#24241F]">Profile unavailable</h1>
          <p role="alert" className="mt-2 text-sm leading-6 text-red-800">{loadError || "Your profile could not be found."}</p>
          <button type="button" onClick={() => {
            setIsLoading(true);
            loadProfile();
          }} className="mt-5 rounded-xl bg-[#35382D] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#24241F]">
            Try again
          </button>
        </section>
      </main>
    );
  }

  const externalProfiles = [
    { key: "github", label: "GitHub" },
    { key: "linkedin", label: "LinkedIn" },
    { key: "portfolio", label: "Portfolio" },
  ].filter((item) => profile[item.key]);
  const displayFields = [
    { key: "phoneNumber", label: "Phone number" },
    { key: "university", label: "University" },
    { key: "department", label: "Department" },
    { key: "studentId", label: "Student ID" },
    { key: "academicSession", label: "Academic session" },
  ].filter((item) => profile[item.key]);
  const image = imagePreview || profile.image || "";
  const name = profile.name || session.user.name || "CodingHub member";

  return (
    <main className="flex-1 bg-[#F8F6EF] px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#747566]">Your account</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.045em] text-[#24241F] sm:text-4xl">My Profile</h1>
            <p className="mt-2 text-sm leading-6 text-[#68695D]">Manage your CodingHub profile and personal information.</p>
          </div>
          {!isEditing && (
            <button type="button" onClick={beginEditing} className="inline-flex w-fit items-center justify-center rounded-xl bg-[#35382D] px-4 py-2.5 text-sm font-medium text-[#F8F6EF] transition hover:bg-[#24241F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35382D]/45 focus-visible:ring-offset-2">
              Edit Profile
            </button>
          )}
        </header>

        {toast && (
          <p role={toastIsError ? "alert" : "status"} aria-live="polite" className={`mt-5 rounded-xl border px-4 py-3 text-sm ${toastIsError ? "border-red-200 bg-red-50 text-red-800" : "border-green-200 bg-green-50 text-green-800"}`}>
            {toast}
          </p>
        )}

        <section className="mt-7 flex flex-col gap-5 rounded-3xl border border-[#DDD6C9] bg-white/75 p-5 shadow-[0_8px_24px_rgba(36,36,31,0.035)] sm:flex-row sm:items-center sm:p-7">
          <ProfileAvatar image={image} name={name} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2.5">
              <h2 className="break-words text-2xl font-semibold tracking-tight text-[#24241F]">{name}</h2>
              <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${roleInfo.badge}`}>{roleInfo.label}</span>
            </div>
            <p className="mt-1 break-all text-sm text-[#68695D]">{profile.email || session.user.email || "Email not available"}</p>
            <p className="mt-2 text-xs text-[#747566]">{roleInfo.description}</p>
          </div>
          {isEditing && (
            <div className="sm:ml-auto">
              <input ref={fileInputRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" onChange={handleImageChange} />
              <button type="button" onClick={() => fileInputRef.current?.click()} disabled={isSaving} className="rounded-xl border border-[#DDD6C9] px-3.5 py-2.5 text-sm font-medium text-[#35382D] transition hover:bg-[#E7DDCE]/55 disabled:opacity-50">
                Change picture
              </button>
              {imageFile && <p className="mt-1.5 max-w-48 truncate text-xs text-[#747566]">{imageFile.name}</p>}
              {imageError && <p role="alert" className="mt-1 text-xs text-red-700">{imageError}</p>}
            </div>
          )}
        </section>

        {role === "banuser" && (
          <section className="mt-5 rounded-2xl border border-[#E6CFC9] bg-[#F4E8E4] px-4 py-3.5 text-sm leading-6 text-[#71372F]" role="alert">
            Your account is restricted. You can view and update your profile, but restricted account permissions remain in effect.
          </section>
        )}

        {isEditing ? (
          <form onSubmit={handleSave} className="mt-5 rounded-3xl border border-[#DDD6C9] bg-white/75 p-5 shadow-[0_8px_24px_rgba(36,36,31,0.025)] sm:p-7">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#747566]">Personal details</p>
              <h2 className="mt-1.5 text-xl font-semibold tracking-tight text-[#24241F]">Edit profile</h2>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2">
                <label htmlFor="profile-name" className="mb-1.5 block text-sm font-medium text-[#35382D]">Full name</label>
                <input id="profile-name" value={draft.name} onChange={(event) => setDraft((current) => ({ ...current, name: event.target.value }))} maxLength={100} required className={fieldClassName} autoComplete="name" />
              </div>
              <div className="sm:col-span-2">
                <label htmlFor="profile-email" className="mb-1.5 block text-sm font-medium text-[#35382D]">Email address</label>
                <input id="profile-email" value={profile.email || ""} readOnly aria-readonly="true" className={`${fieldClassName} cursor-not-allowed bg-[#EEECE7] text-[#747566]`} />
                <p className="mt-1 text-xs text-[#747566]">Email changes are managed through account security.</p>
              </div>
              {editableFields.map((field) => (
                <div key={field.key}>
                  <label htmlFor={`profile-${field.key}`} className="mb-1.5 block text-sm font-medium text-[#35382D]">{field.label}</label>
                  <input
                    id={`profile-${field.key}`}
                    type={field.type}
                    value={draft[field.key]}
                    onChange={(event) => setDraft((current) => ({ ...current, [field.key]: event.target.value }))}
                    maxLength={field.maxLength}
                    className={fieldClassName}
                    autoComplete={field.key === "phoneNumber" ? "tel" : "off"}
                  />
                </div>
              ))}
              <div className="sm:col-span-2">
                <label htmlFor="profile-bio" className="mb-1.5 block text-sm font-medium text-[#35382D]">Bio</label>
                <textarea id="profile-bio" value={draft.bio} onChange={(event) => setDraft((current) => ({ ...current, bio: event.target.value }))} maxLength={500} rows={4} className={`${fieldClassName} resize-y`} />
                <p className="mt-1 text-right text-xs text-[#747566]">{draft.bio.length}/500</p>
              </div>
            </div>

            {formError && <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{formError}</p>}
            {uploadMessage && <p role="status" className="mt-4 text-sm text-[#68695D]">{uploadMessage}</p>}

            <div className="mt-6 flex flex-col-reverse gap-2 border-t border-[#E8E3D9] pt-5 sm:flex-row sm:justify-end">
              <button type="button" onClick={cancelEditing} disabled={isSaving} className="rounded-xl border border-[#DDD6C9] px-4 py-2.5 text-sm font-medium text-[#35382D] transition hover:bg-[#E7DDCE]/55 disabled:opacity-50">
                Cancel
              </button>
              <button type="submit" disabled={isSaving || Boolean(imageError)} className="rounded-xl bg-[#35382D] px-4 py-2.5 text-sm font-medium text-[#F8F6EF] transition hover:bg-[#24241F] disabled:cursor-not-allowed disabled:opacity-60">
                {isSaving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </form>
        ) : (
          <div className="mt-5 grid gap-5 md:grid-cols-2">
            <section className="rounded-3xl border border-[#DDD6C9] bg-white/70 p-5 shadow-[0_8px_24px_rgba(36,36,31,0.025)] sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#747566]">About you</p>
              <h2 className="mt-1.5 text-xl font-semibold tracking-tight text-[#24241F]">Profile information</h2>
              {profile.bio ? (
                <p className="mt-4 whitespace-pre-line break-words text-sm leading-6 text-[#55574A]">{profile.bio}</p>
              ) : (
                <p className="mt-4 text-sm text-[#747566]">Add a short bio to tell the community about yourself.</p>
              )}
              {displayFields.length > 0 && (
                <dl className="mt-5 grid gap-x-5 gap-y-4 border-t border-[#E8E3D9] pt-5 sm:grid-cols-2">
                  {displayFields.map((field) => <InformationValue key={field.key} label={field.label} value={profile[field.key]} />)}
                </dl>
              )}
              {externalProfiles.length > 0 && (
                <div className="mt-5 border-t border-[#E8E3D9] pt-5">
                  <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-[#747566]">Links</h3>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {externalProfiles.map((item) => {
                      const href = safeProfileUrl(profile[item.key]);
                      return href ? (
                        <a key={item.key} href={href} target="_blank" rel="noopener noreferrer" className="rounded-xl border border-[#DDD6C9] px-3 py-2 text-sm font-medium text-[#35382D] transition hover:bg-[#E7DDCE]/55">
                          {item.label}<span className="sr-only"> (opens in a new tab)</span>
                        </a>
                      ) : null;
                    })}
                  </div>
                </div>
              )}
            </section>

            <section className="rounded-3xl border border-[#DDD6C9] bg-white/70 p-5 shadow-[0_8px_24px_rgba(36,36,31,0.025)] sm:p-6">
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#747566]">Account details</p>
              <h2 className="mt-1.5 text-xl font-semibold tracking-tight text-[#24241F]">Account information</h2>
              <dl className="mt-5 grid gap-4">
                <InformationValue label="Email address" value={profile.email || session.user.email} />
                <InformationValue label="User ID" value={profile.id || userId} />
                <InformationValue label="Role" value={roleInfo.label} />
                <InformationValue label="Joined CodingHub" value={formatDate(profile.createdAt)} />
              </dl>
            </section>
          </div>
        )}

        {!isEditing && (
          <section className="mt-5 rounded-3xl border border-[#DDD6C9] bg-white/70 p-5 shadow-[0_8px_24px_rgba(36,36,31,0.025)] sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#747566]">Your communities</p>
            <h2 className="mt-1.5 text-xl font-semibold tracking-tight text-[#24241F]">My Clubs</h2>
            {areClubsLoading ? (
              <div className="mt-4 h-16 animate-pulse rounded-2xl bg-[#E7DDCE]/65" role="status" aria-label="Loading club memberships" />
            ) : clubsError ? (
              <div className="mt-3">
                <p role="alert" className="text-sm text-red-800">{clubsError}</p>
                <button type="button" onClick={() => {
                  setAreClubsLoading(true);
                  loadClubs();
                }} className="mt-2 text-sm font-semibold text-[#35382D] underline underline-offset-4">Retry</button>
              </div>
            ) : myClubs.length > 0 ? (
              <ul className="mt-4 divide-y divide-[#E8E3D9]">
                {myClubs.map((membership) => (
                  <li key={membership.membershipId} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                    <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-xl bg-[#E7DDCE]/70 text-xs font-medium text-[#55574A]">
                      {membership.club?.logo ? (
                        <Image src={membership.club.logo} alt="" fill sizes="44px" unoptimized className="object-cover" />
                      ) : membership.club?.name?.trim()?.[0]?.toUpperCase() || "C"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-semibold text-[#35382D]">{membership.club?.name || "Club"}</p>
                      <p className="mt-0.5 text-xs text-[#747566]">Active · Joined {formatDate(membership.joinedAt)}</p>
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-2 text-sm leading-6 text-[#68695D]">You do not have any active club memberships yet.</p>
            )}
            <Link href="/dashboard/my-clubs" className="mt-4 inline-flex text-sm font-semibold text-[#35382D] underline decoration-[#A9A99B] underline-offset-4 hover:text-[#24241F]">View My Clubs</Link>
          </section>
        )}
      </div>
    </main>
  );
}
