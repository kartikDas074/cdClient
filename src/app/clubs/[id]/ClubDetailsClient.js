"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { authClient } from "@/lib/auth-client";
import { getClubById, getMyJoinRequests, sendClubJoinRequest } from "@/lib/api";

function normalizeId(value) {
  if (value && typeof value === "object") {
    return String(value.$oid || value._id || value.id || "");
  }
  return String(value || "");
}

function findJoinRequestStatus(requests, clubId) {
  const matchingRequests = requests.filter((request) => normalizeId(request.clubId) === clubId);
  if (matchingRequests.some((request) => request.status === "pending")) return "pending";
  if (matchingRequests.some((request) => request.status === "rejected")) return "rejected";
  if (matchingRequests.some((request) => request.status === "approved")) return "approved-unverified";
  return "none";
}

function validExternalUrl(value) {
  if (typeof value !== "string" || !value.trim()) return "";
  try {
    const url = new URL(value);
    return ["http:", "https:"].includes(url.protocol) ? url.href : "";
  } catch {
    return "";
  }
}

function formatFoundedDate(value, options = { dateStyle: "long" }) {
  if (!value) return "Not provided";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Not provided"
    : new Intl.DateTimeFormat(undefined, options).format(date);
}

function DetailCard({ label, children }) {
  return (
    <div className="rounded-2xl bg-[#F8F6EF] p-4">
      <dt className="text-xs font-semibold uppercase tracking-[0.12em] text-[#747566]">{label}</dt>
      <dd className="mt-2 text-sm leading-6 text-[#35382D]">{children}</dd>
    </div>
  );
}

function ClubDetailSkeleton() {
  return (
    <main className="flex-1 bg-[#F8F6EF]">
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8" role="status" aria-label="Loading club">
        <div className="aspect-[16/6] animate-pulse rounded-3xl bg-[#E7DDCE]" />
        <div className="mt-8 max-w-2xl space-y-4">
          <div className="h-8 w-2/3 animate-pulse rounded bg-[#E7DDCE]" />
          <div className="h-4 w-full animate-pulse rounded bg-[#E7DDCE]/75" />
          <div className="h-4 w-4/5 animate-pulse rounded bg-[#E7DDCE]/75" />
        </div>
      </div>
    </main>
  );
}

export default function ClubDetailsClient({ id }) {
  const router = useRouter();
  const { data: session, isPending: isSessionPending } = authClient.useSession();
  const [club, setClub] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [unavailable, setUnavailable] = useState(false);
  const [membershipNotice, setMembershipNotice] = useState("");
  const [membershipNoticeIsError, setMembershipNoticeIsError] = useState(false);
  const [membershipStatus, setMembershipStatus] = useState("unknown");
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false);
  const membershipSubmitLock = useRef(false);

  const user = session?.user;
  const userId = user?.id || "";
  const userRole = user?.role;
  const loadClub = useCallback(async () => {
    if (!id) return;
    setIsLoading(true);
    setLoadError("");
    setUnavailable(false);
    try {
      const response = await getClubById(id);
      if (!response?.success || !response.club) {
        throw new Error(response?.message || "Club not found.");
      }
      if (response.club.status !== "active") {
        setUnavailable(true);
        return;
      }
      setClub(response.club);
    } catch (error) {
      const message = error?.message || "Unable to load this club.";
      if (/not found|invalid club id/i.test(message)) {
        setUnavailable(true);
      } else {
        setLoadError(message);
      }
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  useEffect(() => {
    Promise.resolve().then(loadClub);
  }, [loadClub]);

  useEffect(() => {
    if (isSessionPending || !club?._id || !userId) return undefined;

    let isCurrent = true;
    const timer = window.setTimeout(() => {
      if (userRole !== "user") {
        setMembershipStatus(userRole === "banuser" ? "restricted" : "role-restricted");
        return;
      }

      setMembershipStatus("checking");
      getMyJoinRequests()
        .then((response) => {
          if (!response?.success || !Array.isArray(response.data)) {
            throw new Error(response?.message || "Your membership request status could not be checked.");
          }
          if (isCurrent) {
            setMembershipStatus(findJoinRequestStatus(response.data, String(club._id)));
          }
        })
        .catch((error) => {
          if (!isCurrent) return;
          if (error?.status === 401) {
            setMembershipStatus("login-required");
            setMembershipNotice("Your session may have expired. Please log in again to continue.");
            setMembershipNoticeIsError(true);
          } else {
            setMembershipStatus("lookup-error");
            setMembershipNotice(error?.message || "Your membership request status could not be checked.");
            setMembershipNoticeIsError(true);
          }
        });
    }, 0);

    return () => {
      isCurrent = false;
      window.clearTimeout(timer);
    };
  }, [club?._id, isSessionPending, userId, userRole]);

  useEffect(() => {
    if (!membershipNotice) return undefined;
    const timer = window.setTimeout(() => setMembershipNotice(""), 5000);
    return () => window.clearTimeout(timer);
  }, [membershipNotice]);

  const handleMembershipClick = async () => {
    setMembershipNotice("");
    setMembershipNoticeIsError(false);
    if (!user || membershipStatus === "login-required") {
      const callbackURL = `/clubs/${encodeURIComponent(id)}`;
      router.push(`/login?callbackURL=${encodeURIComponent(callbackURL)}`);
      return;
    }
    if (user.role === "banuser" || membershipStatus === "restricted") {
      setMembershipNotice("Your account is restricted and cannot request club membership.");
      setMembershipNoticeIsError(true);
      return;
    }
    if (user.role !== "user") {
      setMembershipNotice("Only regular student accounts can request club membership.");
      setMembershipNoticeIsError(true);
      return;
    }
    if (!club?._id || membershipSubmitLock.current || isSubmittingRequest) return;
    if (membershipStatus === "pending" || membershipStatus === "member") return;

    membershipSubmitLock.current = true;
    setIsSubmittingRequest(true);
    try {
      const response = await sendClubJoinRequest(String(club._id), "");
      if (!response?.success) {
        throw new Error(response?.message || "Your membership request could not be submitted.");
      }
      setMembershipStatus("pending");
      setMembershipNotice(response.message || "Your membership request has been submitted.");
    } catch (error) {
      const message = error?.message || "Your membership request could not be submitted. Please try again.";
      const normalizedMessage = message.toLowerCase();

      if (error?.status === 409 && normalizedMessage.includes("member")) {
        setMembershipStatus("member");
        setMembershipNotice("You are already a member of this club.");
      } else if (error?.status === 409 && normalizedMessage.includes("pending")) {
        setMembershipStatus("pending");
        setMembershipNotice("You already have a pending request for this club.");
      } else if (error?.status === 401) {
        setMembershipStatus("login-required");
        setMembershipNotice("Your session may have expired. Please log in again to request membership.");
        setMembershipNoticeIsError(true);
      } else if (error?.status === 403 && normalizedMessage.includes("restricted")) {
        setMembershipStatus("restricted");
        setMembershipNotice("Your account is restricted and cannot request club membership.");
        setMembershipNoticeIsError(true);
      } else if (error?.status === 403) {
        setMembershipStatus("role-restricted");
        setMembershipNotice("Only regular student accounts can request club membership.");
        setMembershipNoticeIsError(true);
      } else if (error?.status === 400 || error?.status === 404) {
        setMembershipNotice("This club could not be identified. Please return to Explore Clubs and try again.");
        setMembershipNoticeIsError(true);
      } else {
        setMembershipNotice(message);
        setMembershipNoticeIsError(true);
      }
    } finally {
      membershipSubmitLock.current = false;
      setIsSubmittingRequest(false);
    }
  };

  if (isLoading || isSessionPending) return <ClubDetailSkeleton />;

  if (loadError || unavailable || !club) {
    const isUnavailable = unavailable || !club;
    return (
      <main className="flex flex-1 items-center justify-center bg-[#F8F6EF] px-4 py-16">
        <section className="w-full max-w-xl rounded-3xl border border-[#DDD6C9] bg-white/75 px-6 py-12 text-center shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#747566]">Club details</p>
          <h1 className="mt-3 text-2xl font-semibold tracking-tight text-[#24241F]">
            {isUnavailable ? "Club unavailable" : "We couldn’t load this club"}
          </h1>
          <p role={loadError ? "alert" : undefined} className={`mx-auto mt-3 max-w-md text-sm leading-6 ${loadError ? "text-red-800" : "text-[#68695D]"}`}>
            {isUnavailable ? "This club could not be found or is no longer active." : loadError}
          </p>
          {loadError && (
            <button type="button" onClick={loadClub} className="mt-5 rounded-xl bg-[#35382D] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#24241F]">
              Try again
            </button>
          )}
          <div className={loadError ? "mt-3" : "mt-6"}>
            <Link href="/clubs" className="text-sm font-semibold text-[#35382D] underline underline-offset-4">Browse active clubs</Link>
          </div>
        </section>
      </main>
    );
  }

  const facebookUrl = validExternalUrl(club.socialLinks?.facebook);
  const websiteUrl = validExternalUrl(club.socialLinks?.website);
  const foundedYear = club.foundedAt ? new Date(club.foundedAt).getFullYear() : null;
  const safeFoundedYear = foundedYear && !Number.isNaN(foundedYear) ? foundedYear : null;

  return (
    <main className="flex-1 bg-[#F8F6EF]">
      <div className="mx-auto max-w-7xl px-4 pb-16 pt-6 sm:px-6 sm:pb-20 lg:px-8">
        <Link href="/clubs" className="inline-flex items-center gap-2 rounded-lg py-2 text-sm font-medium text-[#55574A] transition hover:text-[#24241F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35382D]/35">
          <span aria-hidden="true">←</span> All clubs
        </Link>

        <section className="relative mt-3 overflow-hidden rounded-3xl bg-gradient-to-br from-[#D9D5C5] via-[#C9C9B8] to-[#AFAF9E]">
          <div className="relative aspect-[16/7] min-h-64 max-h-[520px]">
            {club.coverImage && (
              <Image
                src={club.coverImage}
                alt={`${club.name} cover`}
                fill
                priority
                sizes="100vw"
                unoptimized
                className="object-cover"
              />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-[#24241F]/80 via-[#24241F]/15 to-transparent" />
            <div className="absolute inset-x-0 bottom-0 flex flex-col gap-5 p-5 sm:p-8 lg:flex-row lg:items-end lg:justify-between lg:p-10">
              <div className="flex min-w-0 items-end gap-4 sm:gap-5">
                <div className="relative flex h-[76px] w-[76px] shrink-0 items-center justify-center overflow-hidden rounded-2xl border-4 border-[#F8F6EF] bg-white text-2xl font-semibold text-[#35382D] shadow-lg sm:h-24 sm:w-24">
                  {club.logo ? (
                    <Image src={club.logo} alt={`${club.name} logo`} fill sizes="96px" unoptimized className="object-cover" />
                  ) : (club.name?.trim()?.[0] || "C").toUpperCase()}
                </div>
                <div className="min-w-0 pb-1 text-white">
                  <div className="mb-2 flex flex-wrap items-center gap-2">
                    <span className="rounded-full bg-white/90 px-3 py-1 text-xs font-semibold text-[#35382D]">{club.category || "Community"}</span>
                    <span className="inline-flex items-center gap-1.5 rounded-full border border-white/35 bg-[#24241F]/25 px-3 py-1 text-xs font-medium capitalize text-white">
                      <span className="h-1.5 w-1.5 rounded-full bg-[#B7D1A8]" />{club.status}
                    </span>
                  </div>
                  <h1 className="break-words text-2xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">{club.name || "Untitled club"}</h1>
                  {safeFoundedYear && <p className="mt-1.5 text-sm text-white/80">Building community since {safeFoundedYear}</p>}
                </div>
              </div>
              <button
                type="button"
                onClick={handleMembershipClick}
                disabled={
                  isSessionPending ||
                  isSubmittingRequest ||
                  membershipStatus === "checking" ||
                  membershipStatus === "pending" ||
                  membershipStatus === "member" ||
                  membershipStatus === "restricted" ||
                  membershipStatus === "role-restricted"
                }
                className="inline-flex shrink-0 items-center justify-center rounded-xl bg-[#F8F6EF] px-5 py-3 text-sm font-semibold text-[#35382D] shadow-lg transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#35382D] disabled:cursor-not-allowed disabled:opacity-70"
              >
                {isSessionPending
                  ? "Loading..."
                  : isSubmittingRequest
                    ? "Submitting..."
                    : membershipStatus === "checking"
                      ? "Checking..."
                      : membershipStatus === "pending"
                        ? "Request Pending"
                        : membershipStatus === "member"
                          ? "Already a Member"
                          : membershipStatus === "restricted"
                            ? "Account Restricted"
                            : membershipStatus === "role-restricted"
                              ? "Student Accounts Only"
                              : !user || membershipStatus === "login-required"
                                ? "Login to Join"
                                : "Be a Member"}
              </button>
            </div>
          </div>
        </section>

        <p className="mt-6 max-w-4xl text-base leading-7 text-[#55574A] sm:text-lg sm:leading-8">{club.shortDescription || club.description || "Discover what this community is all about."}</p>
        {membershipStatus === "restricted" && (
          <div className="mt-5 max-w-3xl rounded-2xl border border-red-200 bg-red-50 px-4 py-3.5 text-sm leading-6 text-red-800" role="alert">
            Your account is restricted and cannot request club membership.
          </div>
        )}
        {membershipStatus === "role-restricted" && (
          <div className="mt-5 max-w-3xl rounded-2xl border border-[#DDD6C9] bg-white/75 px-4 py-3.5 text-sm leading-6 text-[#55574A]" role="status">
            Only regular student accounts can request club membership.
          </div>
        )}
        {membershipNotice && (
          <div className={`mt-5 max-w-3xl rounded-2xl border px-4 py-3.5 text-sm leading-6 ${membershipNoticeIsError ? "border-red-200 bg-red-50 text-red-800" : "border-green-200 bg-green-50 text-green-800"}`} role={membershipNoticeIsError ? "alert" : "status"} aria-live="polite">
            {membershipNotice}
          </div>
        )}
        {membershipStatus === "approved-unverified" && (
          <p className="mt-4 max-w-3xl text-sm leading-6 text-[#68695D]" role="status">
            Your join request was approved previously, but current membership status cannot be verified with the available user APIs. You can try requesting again; the server will prevent a duplicate active membership.
          </p>
        )}

        <div className="mt-10 grid gap-8 lg:grid-cols-[minmax(0,1.5fr)_minmax(280px,0.8fr)] lg:gap-12">
          <section className="space-y-8">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#747566]">Get to know us</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-[#24241F]">About the club</h2>
              <p className="mt-4 whitespace-pre-line text-sm leading-7 text-[#55574A] sm:text-base">
                {club.description || club.shortDescription || "More information about this club will be added soon."}
              </p>
            </div>
            {(club.mission || club.vision) && (
              <div className="grid gap-4 sm:grid-cols-2">
                {club.mission && (
                  <section className="rounded-3xl border border-[#DDD6C9] bg-white/65 p-5 sm:p-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#747566]">Our mission</p>
                    <p className="mt-3 whitespace-pre-line text-sm leading-7 text-[#55574A]">{club.mission}</p>
                  </section>
                )}
                {club.vision && (
                  <section className="rounded-3xl border border-[#DDD6C9] bg-white/65 p-5 sm:p-6">
                    <p className="text-xs font-semibold uppercase tracking-[0.14em] text-[#747566]">Our vision</p>
                    <p className="mt-3 whitespace-pre-line text-sm leading-7 text-[#55574A]">{club.vision}</p>
                  </section>
                )}
              </div>
            )}
          </section>

          <aside className="h-fit rounded-3xl border border-[#DDD6C9] bg-white/70 p-5 sm:p-6">
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#747566]">Good to know</p>
            <h2 className="mt-2 text-xl font-semibold tracking-tight text-[#24241F]">Club information</h2>
            <dl className="mt-5 grid gap-3">
              {club.email && (
                <DetailCard label="Contact">
                  <a href={`mailto:${club.email}`} className="break-all font-medium text-[#35382D] underline decoration-[#A9A99B] underline-offset-4 hover:text-[#24241F]">{club.email}</a>
                </DetailCard>
              )}
              {club.meetingSchedule && <DetailCard label="Meeting schedule">{club.meetingSchedule}</DetailCard>}
              {club.meetingLocation && <DetailCard label="Meeting location">{club.meetingLocation}</DetailCard>}
              <DetailCard label="Founded">{formatFoundedDate(club.foundedAt)}</DetailCard>
            </dl>

            {(facebookUrl || websiteUrl) && (
              <div className="mt-6">
                <p className="text-xs font-semibold uppercase tracking-[0.12em] text-[#747566]">Find us online</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {facebookUrl && (
                    <a href={facebookUrl} target="_blank" rel="noopener noreferrer" className="rounded-xl border border-[#DDD6C9] px-3.5 py-2 text-sm font-medium text-[#35382D] transition hover:bg-[#E7DDCE]/55">
                      Facebook <span className="sr-only">(opens in a new tab)</span>
                    </a>
                  )}
                  {websiteUrl && (
                    <a href={websiteUrl} target="_blank" rel="noopener noreferrer" className="rounded-xl border border-[#DDD6C9] px-3.5 py-2 text-sm font-medium text-[#35382D] transition hover:bg-[#E7DDCE]/55">
                      Website <span className="sr-only">(opens in a new tab)</span>
                    </a>
                  )}
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </main>
  );
}
