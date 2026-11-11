"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  getAllClubs,
  getClubJoinRequests,
  getClubMembers,
  removeClubMember,
  getSingleUser,
  updateJoinRequestStatus,
} from "@/lib/api";

const clubConfigurations = {
  programming: {
    label: "Programming Club",
    matches(identity) {
      return identity.includes("programmingclub") || identity === "programming";
    },
  },
  "web-development": {
    label: "Web Development Club",
    matches(identity) {
      return identity.includes("webdevelopmentclub") || identity === "webdevelopment";
    },
  },
};

function normalizeClubIdentity(club) {
  return [club.name, club.slug]
    .filter(Boolean)
    .join(" ")
    .toLowerCase()
    .replace(/[^a-z0-9]/g, "");
}

function formatDate(value) {
  if (!value) return "Not provided";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Not provided"
    : new Intl.DateTimeFormat(undefined, { dateStyle: "medium", timeStyle: "short" }).format(date);
}

function displayName(user) {
  return user?.name?.trim() || user?.email || "User details unavailable";
}

function normalizeUser(user, userId) {
  if (!user || typeof user !== "object") return null;
  return {
    ...user,
    id: user.id || userId,
    name: typeof user.name === "string" ? user.name : "",
    email: typeof user.email === "string" ? user.email : "",
    image: user.image || user.imageUrl || user.profileImage || "",
  };
}

function Avatar({ user, size = "h-12 w-12" }) {
  const name = displayName(user);
  return (
    <div className={`relative flex ${size} shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#E7DDCE] text-sm font-semibold text-[#35382D] ring-1 ring-[#DDD6C9]`}>
      {user?.image ? (
        <Image src={user.image} alt="" fill sizes="48px" unoptimized className="object-cover" />
      ) : (
        name.trim()[0]?.toUpperCase() || "?"
      )}
    </div>
  );
}

function LoadingRows({ label }) {
  return (
    <div className="space-y-3" role="status" aria-label={`Loading ${label}`}>
      {[0, 1, 2].map((item) => (
        <div key={item} className="flex items-center gap-4 rounded-2xl border border-[#DDD6C9] bg-white/70 p-4">
          <div className="h-12 w-12 animate-pulse rounded-full bg-[#E7DDCE]" />
          <div className="flex-1 space-y-2">
            <div className="h-4 w-1/3 animate-pulse rounded bg-[#E7DDCE]" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-[#E7DDCE]/75" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ members }) {
  return (
    <section className="rounded-3xl border border-dashed border-[#CFC8B9] bg-white/45 px-6 py-14 text-center">
      <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E7DDCE]/75 text-xl text-[#55574A]" aria-hidden="true">
        {members ? "◎" : "✓"}
      </div>
      <h2 className="mt-4 text-lg font-semibold text-[#35382D]">
        {members ? "No active members yet" : "You’re all caught up"}
      </h2>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#68695D]">
        {members
          ? "Approved applicants will appear here while their membership is active."
          : "There are no pending membership requests for this club right now."}
      </p>
    </section>
  );
}

function ConfirmRemoveDialog({ member, isRemoving, onCancel, onConfirm, clubLabel }) {
  if (!member) return null;
  const name = displayName(member.user);

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#24241F]/50 p-4 backdrop-blur-sm">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="remove-member-title"
        className="w-full max-w-md rounded-3xl border border-[#DDD6C9] bg-[#F8F6EF] p-6 shadow-[0_20px_70px_rgba(20,20,16,0.25)] sm:p-7"
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F4E8E4] text-[#8A433B]" aria-hidden="true">!</div>
        <h2 id="remove-member-title" className="mt-4 text-xl font-semibold tracking-tight text-[#24241F]">Remove {name}?</h2>
        <p className="mt-2 text-sm leading-6 text-[#68695D]">
          This will end their active membership in {clubLabel}. They will lose access to member-only activities.
        </p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onCancel} disabled={isRemoving} className="rounded-xl border border-[#DDD6C9] px-4 py-2.5 text-sm font-medium text-[#35382D] transition hover:bg-[#E7DDCE]/65 disabled:opacity-60">
            Keep member
          </button>
          <button type="button" onClick={onConfirm} disabled={isRemoving} className="rounded-xl bg-[#8A433B] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#71372F] disabled:cursor-not-allowed disabled:opacity-60">
            {isRemoving ? "Removing..." : "Remove member"}
          </button>
        </div>
      </section>
    </div>
  );
}

export default function ClubMembershipManager({ clubType, mode }) {
  const configuration = clubConfigurations[clubType];
  const isMembersPage = mode === "members";
  const pageTitle = isMembersPage ? "Club members" : "Membership requests";
  const listLabel = isMembersPage ? "members" : "requests";

  const [club, setClub] = useState(null);
  const [items, setItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [toast, setToast] = useState("");
  const [toastIsError, setToastIsError] = useState(false);
  const [processingId, setProcessingId] = useState("");
  const [search, setSearch] = useState("");
  const [memberToRemove, setMemberToRemove] = useState(null);
  const actionLock = useRef(false);

  const loadData = useCallback(async (isCurrent = () => true) => {
    setIsLoading(true);
    setLoadError("");
    try {
      if (!configuration) throw new Error("This club management page is not configured.");

      const clubsResponse = await getAllClubs();
      if (!clubsResponse?.success || !Array.isArray(clubsResponse.clubs)) {
        throw new Error(clubsResponse?.message || "Clubs could not be loaded.");
      }

      const matchingClubs = clubsResponse.clubs.filter((item) => configuration.matches(normalizeClubIdentity(item)));
      if (matchingClubs.length !== 1 || !matchingClubs[0]?._id) {
        throw new Error(
          matchingClubs.length > 1
            ? `More than one ${configuration.label} was found. Ask an administrator to resolve the club records.`
            : `${configuration.label} could not be found.`,
        );
      }

      const selectedClub = matchingClubs[0];
      const response = isMembersPage
        ? await getClubMembers(String(selectedClub._id))
        : await getClubJoinRequests(String(selectedClub._id));
      if (!response?.success || !Array.isArray(response.data)) {
        throw new Error(response?.message || `${pageTitle} could not be loaded.`);
      }

      const membershipRecords = isMembersPage
        ? response.data.filter((member) => member.status === "active")
        : response.data.filter((request) => request.status === "pending");
      const fallbackUsers = new Map(
        membershipRecords
          .filter((record) => record.userId)
          .map((record) => [String(record.userId), normalizeUser(record.user, String(record.userId))]),
      );
      const userIds = [...new Set(
        membershipRecords.map((record) => String(record.userId || "")).filter(Boolean),
      )];
      const userResults = await Promise.all(userIds.map(async (userId) => {
        try {
          const userResponse = await getSingleUser(userId);
          if (!userResponse?.success || !userResponse.user) {
            throw new Error(userResponse?.message || "User details could not be loaded.");
          }
          return [userId, normalizeUser(userResponse.user, userId), false];
        } catch {
          return [userId, fallbackUsers.get(userId) || null, true];
        }
      }));
      const usersById = new Map(userResults.map(([userId, user]) => [userId, user]));
      const failedUserCount = userResults.filter(([, , failed]) => failed).length;

      if (isCurrent()) {
        setClub(selectedClub);
        setItems(membershipRecords.map((record) => ({
          ...record,
          user: usersById.get(String(record.userId || "")) || null,
        })));
        if (failedUserCount > 0) {
          setToast(`${failedUserCount} user ${failedUserCount === 1 ? "profile could" : "profiles could"} not be fully loaded.`);
          setToastIsError(true);
        }
      }
    } catch (error) {
      if (isCurrent()) setLoadError(error?.message || `${pageTitle} could not be loaded.`);
    } finally {
      if (isCurrent()) setIsLoading(false);
    }
  }, [configuration, isMembersPage, pageTitle]);

  const [reloadVersion, setReloadVersion] = useState(0);
  useEffect(() => {
    let isCurrent = true;
    const timer = window.setTimeout(() => {
      loadData(() => isCurrent);
    }, 0);
    return () => {
      isCurrent = false;
      window.clearTimeout(timer);
    };
  }, [loadData, reloadVersion]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(""), 4500);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const filteredItems = useMemo(() => {
    if (!isMembersPage) return items;
    const query = search.trim().toLocaleLowerCase();
    if (!query) return items;
    return items.filter((member) => (
      member.user?.name?.toLocaleLowerCase().includes(query)
      || member.user?.email?.toLocaleLowerCase().includes(query)
    ));
  }, [isMembersPage, items, search]);

  const showError = (error, fallback) => {
    setToast(error?.message || fallback);
    setToastIsError(true);
  };

  const handleRequestAction = async (request, status) => {
    const requestId = String(request._id || "");
    if (!club?._id || !requestId || actionLock.current) return;
    actionLock.current = true;
    setProcessingId(requestId);
    setToast("");
    try {
      const response = await updateJoinRequestStatus(String(club._id), requestId, status);
      if (!response?.success) throw new Error(response?.message || `Request could not be ${status}.`);
      setItems((current) => current.filter((item) => String(item._id) !== requestId));
      setToast(`${displayName(request.user)} was ${status}.`);
      setToastIsError(false);
    } catch (error) {
      showError(error, `The request could not be ${status}. Please try again.`);
    } finally {
      actionLock.current = false;
      setProcessingId("");
    }
  };

  const handleRemoveMember = async () => {
    const member = memberToRemove;
    const userId = String(member?.userId || "");
    if (!club?._id || !userId || actionLock.current) return;

    actionLock.current = true;
    setProcessingId(userId);
    setToast("");
    try {
      const response = await removeClubMember(String(club._id), userId);
      if (!response?.success) throw new Error(response?.message || "The member could not be removed.");
      setItems((current) => current.filter((item) => String(item.userId || item.user?.id) !== userId));
      setMemberToRemove(null);
      setToast(`${displayName(member.user)} was removed from ${configuration.label}.`);
      setToastIsError(false);
    } catch (error) {
      showError(error, "The member could not be removed. Please try again.");
    } finally {
      actionLock.current = false;
      setProcessingId("");
    }
  };

  const countLabel = `${items.length} ${items.length === 1 ? listLabel.slice(0, -1) : listLabel}`;

  return (
    <main className="flex-1 bg-[#F8F6EF] px-4 py-8 sm:px-6 sm:py-10 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#747566]">Club administration · {configuration?.label || "Membership"}</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.045em] text-[#24241F] sm:text-4xl">{pageTitle}</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#68695D]">
              {isMembersPage
                ? `Review and manage active ${configuration?.label || "club"} members.`
                : `Review and respond to students requesting to join ${configuration?.label || "the club"}.`}
            </p>
          </div>
          {!isLoading && !loadError && (
            <div className="w-fit rounded-2xl border border-[#DDD6C9] bg-white/70 px-4 py-3 shadow-sm">
              <p className="text-[11px] font-medium uppercase tracking-wide text-[#747566]">{isMembersPage ? "Active members" : "Pending requests"}</p>
              <p className="mt-1 text-2xl font-semibold tracking-tight text-[#24241F]" aria-live="polite">{items.length}</p>
            </div>
          )}
        </header>

        {toast && (
          <p role={toastIsError ? "alert" : "status"} aria-live="polite" className={`mt-5 rounded-xl border px-4 py-3 text-sm ${toastIsError ? "border-red-200 bg-red-50 text-red-800" : "border-green-200 bg-green-50 text-green-800"}`}>
            {toast}
          </p>
        )}

        {isMembersPage && !isLoading && !loadError && (
          <section className="mt-7 rounded-3xl border border-[#DDD6C9] bg-white/60 p-4 shadow-[0_8px_24px_rgba(36,36,31,0.025)] sm:p-5">
            <div className="relative w-full sm:max-w-lg">
              <label htmlFor="membership-member-search" className="sr-only">Search members by name or email</label>
              <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 fill-none stroke-[#747566] stroke-[1.8]" aria-hidden="true">
                <circle cx="10.8" cy="10.8" r="6.8" />
                <path d="m16 16 4.5 4.5" strokeLinecap="round" />
              </svg>
              <input
                id="membership-member-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search members by name or email..."
                className="w-full rounded-xl border border-[#DDD6C9] bg-[#F8F6EF] py-2.5 pl-10 pr-3.5 text-sm text-[#24241F] outline-none transition placeholder:text-[#8A8B7F] focus:border-[#35382D]/60 focus:ring-2 focus:ring-[#D8CCBA]"
              />
            </div>
          </section>
        )}

        {loadError ? (
          <section className="mt-7 rounded-3xl border border-red-200 bg-red-50 p-6">
            <h2 className="font-semibold text-red-900">{pageTitle} unavailable</h2>
            <p role="alert" className="mt-2 text-sm leading-6 text-red-800">{loadError}</p>
            <button type="button" onClick={() => setReloadVersion((version) => version + 1)} className="mt-4 rounded-lg px-2 py-1 text-sm font-semibold text-red-900 underline underline-offset-4">Try again</button>
          </section>
        ) : isLoading ? (
          <div className="mt-7"><LoadingRows label={listLabel} /></div>
        ) : filteredItems.length === 0 ? (
          <div className="mt-7">
            {isMembersPage && search
              ? <section className="rounded-3xl border border-dashed border-[#CFC8B9] bg-white/45 px-6 py-12 text-center"><h2 className="text-base font-semibold text-[#35382D]">No matching members</h2><p className="mt-2 text-sm text-[#68695D]">Try another name or email address.</p></section>
              : <EmptyState members={isMembersPage} />}
          </div>
        ) : (
          <section className="mt-7 space-y-3" aria-label={pageTitle}>
            {filteredItems.map((item) => {
              const itemId = String(item._id || item.userId || "");
              const user = item.user || {};
              const isProcessing = processingId === itemId || processingId === String(item.userId || "");
              return (
                <article key={itemId} className="rounded-3xl border border-[#DDD6C9] bg-white/75 p-4 shadow-[0_8px_24px_rgba(36,36,31,0.025)] sm:p-5">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
                    <Avatar user={user} />
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h2 className="break-words text-base font-semibold text-[#24241F]">{displayName(user)}</h2>
                        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${item.status === "active" ? "bg-[#E8EEE4] text-[#465B3E]" : "bg-[#EEECE7] text-[#6C6A5F]"}`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${item.status === "active" ? "bg-[#668254]" : "bg-[#969486]"}`} />
                          {item.status || (isMembersPage ? "active" : "pending")}
                        </span>
                      </div>
                      {user.email && <a href={`mailto:${user.email}`} className="mt-1 inline-block break-all text-sm text-[#68695D] underline decoration-[#CFC8B9] underline-offset-4">{user.email}</a>}

                      {isMembersPage ? (
                        <p className="mt-3 text-xs text-[#747566]">Joined {formatDate(item.joinedAt)}</p>
                      ) : (
                        <>
                          <div className="mt-3 rounded-2xl bg-[#F8F6EF] px-4 py-3">
                            <p className="text-xs font-semibold uppercase tracking-[0.1em] text-[#747566]">Request message</p>
                            <p className="mt-1.5 whitespace-pre-line break-words text-sm leading-6 text-[#55574A]">{item.message || "No message provided."}</p>
                          </div>
                          <p className="mt-3 text-xs text-[#747566]">Submitted {formatDate(item.createdAt)}</p>
                        </>
                      )}
                    </div>

                    {isMembersPage ? (
                      <button
                        type="button"
                        onClick={() => setMemberToRemove(item)}
                        disabled={Boolean(processingId)}
                        className="inline-flex w-full shrink-0 items-center justify-center rounded-xl border border-[#E6CFC9] px-3.5 py-2.5 text-sm font-medium text-[#8A433B] transition hover:bg-[#F4E8E4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8A433B]/30 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
                      >
                        Remove member
                      </button>
                    ) : (
                      <div className="flex shrink-0 gap-2 sm:pt-1">
                        <button
                          type="button"
                          onClick={() => handleRequestAction(item, "rejected")}
                          disabled={Boolean(processingId)}
                          className="flex-1 rounded-xl border border-[#DDD6C9] px-3.5 py-2.5 text-sm font-medium text-[#55574A] transition hover:bg-[#EEECE7] disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
                        >
                          {isProcessing && processingId === itemId ? "Updating..." : "Reject"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleRequestAction(item, "approved")}
                          disabled={Boolean(processingId)}
                          className="flex-1 rounded-xl bg-[#35382D] px-3.5 py-2.5 text-sm font-medium text-[#F8F6EF] transition hover:bg-[#24241F] disabled:cursor-not-allowed disabled:opacity-50 sm:flex-none"
                        >
                          {isProcessing && processingId === itemId ? "Updating..." : "Approve"}
                        </button>
                      </div>
                    )}
                  </div>
                </article>
              );
            })}
          </section>
        )}

        {isMembersPage && !isLoading && !loadError && filteredItems.length !== items.length && (
          <p className="mt-4 text-xs text-[#747566]" aria-live="polite">Showing {filteredItems.length} of {countLabel}.</p>
        )}
      </div>

      <ConfirmRemoveDialog
        member={memberToRemove}
        isRemoving={Boolean(processingId)}
        onCancel={() => setMemberToRemove(null)}
        onConfirm={handleRemoveMember}
        clubLabel={configuration?.label || "this club"}
      />
    </main>
  );
}
