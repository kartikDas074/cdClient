"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { authClient } from "@/lib/auth-client";
import {
  getAllContests,
  getAllResources,
  getAllWebHackathons,
  getAllWebResources,
  getMyClubs,
} from "@/lib/api";
import { fetchAllPages } from "@/components/wbpresident/management-ui";

function normalizeClubIdentity(club) {
  return [club?.name, club?.slug]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function getClubFamily(club) {
  const identity = normalizeClubIdentity(club);
  if (identity.includes("programmingclub") || identity === "programming") {
    return "programming";
  }
  if (
    identity.includes("webdevelopmentclub") ||
    identity === "webdevelopment" ||
    identity.includes("webdevclub") ||
    identity === "webdev"
  ) {
    return "web-development";
  }
  return "";
}

function formatDate(value) {
  if (!value) return "Not provided";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Not provided"
    : new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
}

function safeExternalUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : "";
  } catch {
    return "";
  }
}

function getResponseData(response, label) {
  if (!response?.success || !Array.isArray(response.data)) {
    throw new Error(response?.message || `${label} could not be loaded.`);
  }
  return response.data;
}

async function loadClubContent(family) {
  if (family === "programming") {
    const [contestResponse, resourceResponse] = await Promise.all([
      getAllContests(),
      getAllResources(),
    ]);
    return {
      contests: getResponseData(contestResponse, "Programming contests"),
      resources: getResponseData(resourceResponse, "Programming resources"),
    };
  }

  const [hackathons, resources] = await Promise.all([
    fetchAllPages(getAllWebHackathons, "Web Development hackathons"),
    fetchAllPages(getAllWebResources, "Web Development resources"),
  ]);
  return { hackathons, resources };
}

function PageSkeleton() {
  return (
    <main className="flex-1 bg-[#F8F6EF] px-4 py-8 sm:px-6 sm:py-10 lg:px-8" role="status" aria-label="Loading your clubs">
      <div className="mx-auto max-w-6xl">
        <div className="h-8 w-40 animate-pulse rounded bg-[#E7DDCE]" />
        <div className="mt-3 h-4 w-72 max-w-full animate-pulse rounded bg-[#E7DDCE]/75" />
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((item) => (
            <div key={item} className="overflow-hidden rounded-3xl border border-[#DDD6C9] bg-white/70 p-5">
              <div className="h-36 animate-pulse rounded-2xl bg-[#E7DDCE]/75" />
              <div className="mt-5 h-5 w-2/3 animate-pulse rounded bg-[#E7DDCE]" />
              <div className="mt-3 h-4 animate-pulse rounded bg-[#E7DDCE]/75" />
              <div className="mt-2 h-4 w-4/5 animate-pulse rounded bg-[#E7DDCE]/75" />
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}

function ClubImage({ club }) {
  const image = club?.logo || club?.image || club?.coverImage;
  return (
    <div className="relative flex h-36 items-center justify-center overflow-hidden rounded-2xl bg-[#E7DDCE]/60">
      {image ? (
        <Image src={image} alt="" fill sizes="(max-width: 640px) 100vw, 380px" unoptimized className="object-cover" />
      ) : (
        <span className="text-sm font-medium text-[#747566]">Club image unavailable</span>
      )}
    </div>
  );
}

function ContentCard({ title, description, image, dates = [], meta, href, linkLabel = "Open link" }) {
  const safeHref = safeExternalUrl(href);
  return (
    <article className="overflow-hidden rounded-2xl border border-[#DDD6C9] bg-white/80">
      {image && (
        <div className="relative h-40 bg-[#E7DDCE]/60">
          <Image src={image} alt="" fill sizes="(max-width: 640px) 100vw, 480px" unoptimized className="object-cover" />
        </div>
      )}
      <div className="p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-2">
          <h4 className="text-base font-semibold text-[#24241F]">{title || "Untitled"}</h4>
          {meta && <span className="rounded-full bg-[#EEECE7] px-2.5 py-1 text-xs font-medium text-[#55574A]">{meta}</span>}
        </div>
        {description && <p className="mt-2 whitespace-pre-line text-sm leading-6 text-[#68695D]">{description}</p>}
        {dates.filter((date) => date.value).map((date) => (
          <p key={date.label} className="mt-3 text-xs text-[#747566]">{date.label}: {formatDate(date.value)}</p>
        ))}
        {safeHref && (
          <a href={safeHref} target="_blank" rel="noopener noreferrer" className="mt-4 inline-flex text-sm font-semibold text-[#35382D] underline decoration-[#A9A99B] underline-offset-4 hover:text-[#24241F]">
            {linkLabel}
            <span className="sr-only"> (opens in a new tab)</span>
          </a>
        )}
      </div>
    </article>
  );
}

function ContentCategory({ title, items, renderItem }) {
  const safeItems = Array.isArray(items) ? items : [];
  return (
    <section className="mt-7">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h3 className="text-lg font-semibold tracking-tight text-[#24241F]">{title}</h3>
        <span className="text-xs text-[#747566]">{safeItems.length} {safeItems.length === 1 ? "item" : "items"}</span>
      </div>
      {safeItems.length === 0 ? (
        <p className="mt-3 rounded-2xl border border-dashed border-[#DDD6C9] bg-[#F8F6EF]/70 px-4 py-5 text-sm text-[#68695D]">
          No {title.toLowerCase()} are available yet.
        </p>
      ) : (
        <div className="mt-3 grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
          {safeItems.map((item, index) => (
            <div key={String(item?._id || item?.id || index)}>{renderItem(item)}</div>
          ))}
        </div>
      )}
    </section>
  );
}

export default function MyClubsPage() {
  const router = useRouter();
  const { data: session, isPending: isSessionPending } = authClient.useSession();
  const [memberships, setMemberships] = useState([]);
  const [selectedMembershipId, setSelectedMembershipId] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [content, setContent] = useState(null);
  const [isContentLoading, setIsContentLoading] = useState(false);
  const [contentError, setContentError] = useState("");
  const [contentReloadCount, setContentReloadCount] = useState(0);
  const contentSectionRef = useRef(null);
  const userId = session?.user?.id || "";

  const loadMemberships = useCallback(async (isCurrent = () => true) => {
    try {
      const response = await getMyClubs();
      if (!response?.success || !Array.isArray(response.data)) {
        throw new Error(response?.message || "Your active clubs could not be loaded.");
      }
      if (isCurrent()) {
        setMemberships(response.data);
        setSelectedMembershipId("");
        setLoadError("");
      }
    } catch (error) {
      if (isCurrent()) setLoadError(error?.message || "Your active clubs could not be loaded. Please try again.");
    } finally {
      if (isCurrent()) setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isSessionPending) return undefined;
    if (!userId) {
      router.replace(`/login?callbackURL=${encodeURIComponent("/dashboard/my-clubs")}`);
      return undefined;
    }

    let isCurrent = true;
    const timer = window.setTimeout(() => {
      setIsLoading(true);
      loadMemberships(() => isCurrent);
    }, 0);
    return () => {
      isCurrent = false;
      window.clearTimeout(timer);
    };
  }, [isSessionPending, loadMemberships, router, userId]);

  const selectedMembership = useMemo(
    () => memberships.find((membership) => membership.membershipId === selectedMembershipId) || null,
    [memberships, selectedMembershipId],
  );
  const selectedFamily = selectedMembership ? getClubFamily(selectedMembership.club) : "";

  useEffect(() => {
    if (!selectedMembership || !selectedFamily) return undefined;

    let isCurrent = true;
    const timer = window.setTimeout(() => {
      setContent(null);
      setContentError("");
      setIsContentLoading(true);
      loadClubContent(selectedFamily)
        .then((result) => {
          if (isCurrent) setContent({ family: selectedFamily, data: result });
        })
        .catch((error) => {
          if (isCurrent) setContentError(error?.message || "Club content could not be loaded. Please try again.");
        })
        .finally(() => {
          if (isCurrent) setIsContentLoading(false);
        });
    }, 0);

    return () => {
      isCurrent = false;
      window.clearTimeout(timer);
    };
  }, [contentReloadCount, selectedFamily, selectedMembership]);

  useEffect(() => {
    if (!selectedMembershipId) return undefined;
    const timer = window.setTimeout(() => {
      contentSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
    return () => window.clearTimeout(timer);
  }, [selectedMembershipId]);

  const activeMemberships = memberships.filter((membership) => membership.status === "active");
  const activeMembershipCount = activeMemberships.length;
  const selectMembership = (membershipId) => {
    if (selectedMembershipId === membershipId) {
      contentSectionRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    setContent(null);
    setContentError("");
    setIsContentLoading(true);
    setSelectedMembershipId(membershipId);
  };

  if (isSessionPending || isLoading) return <PageSkeleton />;
  if (!session?.user) return <main className="flex-1 bg-[#F8F6EF]" />;

  return (
    <main className="flex-1 bg-[#F8F6EF] px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#747566]">Your communities</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.045em] text-[#24241F] sm:text-4xl">My Clubs</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#68695D]">See your active club memberships and access content shared with each club.</p>
          </div>
          <p className="w-fit rounded-full border border-[#DDD6C9] bg-white/70 px-3.5 py-2 text-sm font-medium text-[#55574A]">
            {activeMembershipCount} active {activeMembershipCount === 1 ? "membership" : "memberships"}
          </p>
        </header>

        {loadError ? (
          <section className="mt-7 rounded-3xl border border-red-200 bg-red-50 px-5 py-8 text-center">
            <h2 className="text-lg font-semibold text-[#24241F]">Your clubs could not be loaded</h2>
            <p role="alert" className="mt-2 text-sm text-red-800">{loadError}</p>
            <button type="button" onClick={() => {
              setIsLoading(true);
              loadMemberships();
            }} className="mt-4 rounded-xl bg-[#35382D] px-4 py-2.5 text-sm font-medium text-white hover:bg-[#24241F]">
              Try again
            </button>
          </section>
        ) : activeMemberships.length === 0 ? (
          <section className="mt-7 rounded-3xl border border-dashed border-[#CFC8BA] bg-white/65 px-5 py-12 text-center sm:px-8">
            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-[#E7DDCE]/75 text-[#55574A]" aria-hidden="true">
              <span className="text-xl">+</span>
            </div>
            <h2 className="mt-4 text-xl font-semibold text-[#24241F]">No active club memberships yet.</h2>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#68695D]">Explore the clubs at CodingHub and request to join a community that interests you.</p>
            <Link href="/clubs" className="mt-5 inline-flex rounded-xl bg-[#35382D] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#24241F]">
              Explore Clubs
            </Link>
          </section>
        ) : (
          <>
            <section aria-label="Active club memberships" className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
              {activeMemberships.map((membership) => {
                const club = membership.club;
                const family = getClubFamily(club);
                const selected = membership.membershipId === selectedMembershipId;
                return (
                  <article key={membership.membershipId} className={`rounded-3xl border bg-white/75 p-4 shadow-[0_8px_24px_rgba(36,36,31,0.025)] transition sm:p-5 ${selected ? "border-[#777964] ring-2 ring-[#D8CCBA]" : "border-[#DDD6C9]"}`}>
                    <ClubImage club={club} />
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-2">
                      <h2 className="text-lg font-semibold tracking-tight text-[#24241F]">{club?.name || "Club"}</h2>
                      <span className="rounded-full bg-[#E8EEE4] px-2.5 py-1 text-xs font-semibold text-[#465B3E]">Active member</span>
                    </div>
                    <p className="mt-2 line-clamp-3 min-h-[4.5rem] text-sm leading-6 text-[#68695D]">
                      {club?.shortDescription || club?.description || "No club description is available."}
                    </p>
                    <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-[#E8E3D9] pt-3">
                      <span className="text-xs text-[#747566]">Joined {formatDate(membership.joinedAt)}</span>
                      {club?.category && <span className="rounded-full bg-[#EEECE7] px-2.5 py-1 text-xs text-[#55574A]">{club.category}</span>}
                    </div>
                    <button
                      type="button"
                      disabled={!family}
                      onClick={() => selectMembership(membership.membershipId)}
                      className="mt-4 w-full rounded-xl bg-[#35382D] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#24241F] disabled:cursor-not-allowed disabled:bg-[#A9A99B]"
                    >
                      {family
                        ? selected ? "Viewing Club Content" : "View Club Content"
                        : "Content unavailable"}
                    </button>
                    {!family && <p className="mt-2 text-xs leading-5 text-[#747566]">Member content is not configured for this club yet.</p>}
                  </article>
                );
              })}
            </section>

            {selectedMembership && selectedFamily && (
              <section ref={contentSectionRef} className="mt-8 scroll-mt-24 rounded-3xl border border-[#DDD6C9] bg-white/65 p-5 sm:p-7" aria-live="polite">
                <div className="flex flex-col gap-3 border-b border-[#E8E3D9] pb-5 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#747566]">Member-only content</p>
                    <h2 className="mt-1.5 text-2xl font-semibold tracking-tight text-[#24241F]">{selectedMembership.club.name}</h2>
                  </div>
                  <button type="button" onClick={() => {
                    setContent(null);
                    setContentError("");
                    setIsContentLoading(false);
                    setSelectedMembershipId("");
                  }} className="w-fit rounded-xl border border-[#DDD6C9] px-3.5 py-2 text-sm font-medium text-[#35382D] transition hover:bg-[#E7DDCE]/55">
                    Hide content
                  </button>
                </div>

                {isContentLoading || (content && content.family !== selectedFamily) ? (
                  <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-3" role="status" aria-label="Loading club content">
                    {[0, 1, 2].map((item) => <div key={item} className="h-40 animate-pulse rounded-2xl bg-[#E7DDCE]/65" />)}
                  </div>
                ) : contentError ? (
                  <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 px-4 py-5">
                    <p role="alert" className="text-sm text-red-800">{contentError}</p>
                    <button type="button" onClick={() => setContentReloadCount((count) => count + 1)} className="mt-3 text-sm font-semibold text-[#35382D] underline underline-offset-4">
                      Retry
                    </button>
                  </div>
                ) : content?.family === "programming" && selectedFamily === "programming" ? (
                  <>
                    <ContentCategory title="Contests" items={content.data.contests} renderItem={(item) => (
                      <ContentCard title={item.title} description={item.description} dates={[{ label: "Added", value: item.createdAt }]} href={item.link} />
                    )} />
                    <ContentCategory title="Programming Resources" items={content.data.resources} renderItem={(item) => (
                      <ContentCard title={item.title} description={item.description} dates={[{ label: "Added", value: item.createdAt }]} href={item.link} />
                    )} />
                  </>
                ) : content?.family === "web-development" && selectedFamily === "web-development" ? (
                  <>
                    <ContentCategory title="Hackathons" items={content.data.hackathons} renderItem={(item) => (
                      <ContentCard
                        title={item.title}
                        description={item.shortDescription || item.fullDescription || item.theme}
                        image={item.bannerImage}
                        meta={item.registration?.status}
                        dates={[
                          { label: "Registration deadline", value: item.registration?.deadline },
                          { label: "Starts", value: item.timeline?.startDate },
                          { label: "Ends", value: item.timeline?.endDate },
                        ]}
                        href={item.registration?.link}
                        linkLabel="Register / view details"
                      />
                    )} />
                    <ContentCategory title="Web Development Resources" items={content.data.resources} renderItem={(item) => (
                      <ContentCard title={item.title} description={item.description} meta={item.category} dates={[{ label: "Added", value: item.createdAt }]} href={item.link} />
                    )} />
                  </>
                ) : null}
              </section>
            )}
          </>
        )}
      </div>
    </main>
  );
}
