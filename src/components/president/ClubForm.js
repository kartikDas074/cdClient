"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { createClub, getClubById, updateClub } from "@/lib/api";

const emptyForm = {
  name: "",
  description: "",
  logo: "",
  category: "",
};

const inputClassName = "w-full rounded-xl border border-[#DDD6C9] bg-[#F8F6EF] px-3.5 py-3 text-sm text-[#24241F] outline-none transition placeholder:text-[#8A8B7F] focus:border-[#35382D]/60 focus:ring-2 focus:ring-[#D8CCBA]";

function PageHeading({ isEditing }) {
  return (
    <div>
      <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#747566]">President · Club management</p>
      <h1 className="mt-2 text-3xl font-semibold tracking-[-0.045em] text-[#24241F]">
        {isEditing ? "Edit club" : "Add a club"}
      </h1>
      <p className="mt-2 max-w-2xl text-sm leading-6 text-[#68695D]">
        {isEditing ? "Update the club details shown to the CodingHub community." : "Create a new space for students to learn, build, and connect."}
      </p>
    </div>
  );
}

export default function ClubForm({ clubId }) {
  const router = useRouter();
  const isEditing = Boolean(clubId);
  const [form, setForm] = useState(emptyForm);
  const [isLoading, setIsLoading] = useState(isEditing);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    if (!clubId) return undefined;
    let isCurrent = true;

    getClubById(clubId)
      .then((response) => {
        if (!response?.success || !response.club) {
          throw new Error(response?.message || "Club not found.");
        }
        if (isCurrent) {
          const club = response.club;
          setForm({
            name: club.name || "",
            description: club.description || "",
            logo: club.logo || "",
            category: club.category || "",
          });
        }
      })
      .catch((requestError) => {
        if (isCurrent) setError(requestError?.message || "Unable to load this club.");
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
    setError("");
    setSuccess("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const clubData = {
      name: form.name.trim(),
      description: form.description.trim(),
      logo: form.logo.trim(),
      category: form.category.trim(),
    };

    if (!clubData.name || !clubData.description) {
      setError("Club name and description are required.");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setSuccess("");

    try {
      const response = isEditing
        ? await updateClub(clubId, clubData)
        : await createClub(clubData);

      if (!response?.success) {
        throw new Error(response?.message || `Unable to ${isEditing ? "update" : "create"} the club.`);
      }

      if (isEditing) {
        setSuccess("Club details updated successfully.");
        window.setTimeout(() => router.push("/president/clubs"), 900);
      } else {
        setForm(emptyForm);
        setSuccess("Club created successfully.");
      }
    } catch (requestError) {
      setError(requestError?.message || `Unable to ${isEditing ? "update" : "create"} the club. Please try again.`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <main className="flex-1 bg-[#F8F6EF] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-5xl">
        <PageHeading isEditing={isEditing} />
        <div className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1fr)_280px]">
          <section className="rounded-3xl border border-[#DDD6C9] bg-white/75 p-5 shadow-[0_10px_30px_rgba(36,36,31,0.04)] sm:p-8">
            {isLoading ? (
              <div role="status" className="space-y-5" aria-label="Loading club">
                <div className="h-4 w-1/3 animate-pulse rounded bg-[#E7DDCE]" />
                <div className="h-11 animate-pulse rounded-xl bg-[#E7DDCE]/70" />
                <div className="h-4 w-1/4 animate-pulse rounded bg-[#E7DDCE]" />
                <div className="h-32 animate-pulse rounded-xl bg-[#E7DDCE]/70" />
              </div>
            ) : error && isEditing && !form.name ? (
              <div>
                <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>
                <Link href="/president/clubs" className="mt-5 inline-flex text-sm font-medium text-[#35382D] underline underline-offset-4">Back to manage clubs</Link>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                <div>
                  <label htmlFor="club-name" className="mb-2 block text-sm font-medium text-[#35382D]">Club name <span aria-hidden="true">*</span></label>
                  <input
                    id="club-name"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    required
                    maxLength={100}
                    placeholder="e.g. Programming Club"
                    className={inputClassName}
                  />
                </div>
                <div>
                  <label htmlFor="club-description" className="mb-2 block text-sm font-medium text-[#35382D]">Description <span aria-hidden="true">*</span></label>
                  <textarea
                    id="club-description"
                    name="description"
                    value={form.description}
                    onChange={handleChange}
                    required
                    rows={5}
                    maxLength={2000}
                    placeholder="What is this club about?"
                    className={`${inputClassName} resize-y`}
                  />
                </div>
                <div className="grid gap-5 sm:grid-cols-2">
                  <div>
                    <label htmlFor="club-logo" className="mb-2 block text-sm font-medium text-[#35382D]">Club logo URL <span className="font-normal text-[#747566]">(optional)</span></label>
                    <input
                      id="club-logo"
                      name="logo"
                      type="url"
                      value={form.logo}
                      onChange={handleChange}
                      placeholder="https://example.com/logo.png"
                      className={inputClassName}
                    />
                  </div>
                  <div>
                    <label htmlFor="club-category" className="mb-2 block text-sm font-medium text-[#35382D]">Category <span className="font-normal text-[#747566]">(optional)</span></label>
                    <input
                      id="club-category"
                      name="category"
                      value={form.category}
                      onChange={handleChange}
                      maxLength={80}
                      placeholder="e.g. Technology"
                      className={inputClassName}
                    />
                  </div>
                </div>

                {error && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{error}</p>}
                {success && <p role="status" className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">{success}</p>}

                <div className="flex flex-col-reverse gap-3 border-t border-[#DDD6C9] pt-5 sm:flex-row sm:items-center sm:justify-between">
                  <Link href="/president/clubs" className="inline-flex justify-center rounded-xl border border-[#DDD6C9] px-4 py-2.5 text-sm font-medium text-[#35382D] transition hover:bg-[#E7DDCE]/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35382D]/35">
                    Manage clubs
                  </Link>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="inline-flex justify-center rounded-xl bg-[#35382D] px-5 py-2.5 text-sm font-medium text-[#F8F6EF] shadow-sm transition hover:bg-[#24241F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35382D]/45 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSubmitting ? (isEditing ? "Saving changes..." : "Creating club...") : (isEditing ? "Save changes" : "Create club")}
                  </button>
                </div>
              </form>
            )}
          </section>

          <aside className="h-fit rounded-3xl border border-[#DDD6C9] bg-[#E7DDCE]/40 p-5 sm:p-6">
            <p className="text-sm font-semibold text-[#35382D]">A good club profile</p>
            <p className="mt-2 text-sm leading-6 text-[#68695D]">Use a clear name and a concise description so students can quickly understand the club and its focus.</p>
            <div className="mt-5 border-t border-[#DDD6C9] pt-4">
              <p className="text-xs font-medium uppercase tracking-[0.12em] text-[#747566]">Required fields</p>
              <p className="mt-2 text-sm text-[#35382D]">Club name · Description</p>
            </div>
          </aside>
        </div>
      </div>
    </main>
  );
}
