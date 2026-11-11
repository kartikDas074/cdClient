"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { deleteClub, getAllClubs, updateClubStatus } from "@/lib/api";

const allowedStatuses = ["active", "inactive"];

async function fetchClubs() {
  const response = await getAllClubs();
  if (!response?.success || !Array.isArray(response.clubs)) {
    throw new Error(response?.message || "The club list could not be loaded.");
  }
  return response.clubs;
}

function displayDate(value) {
  if (!value) return "Not available";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Not available"
    : new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
}

function ClubLogo({ club }) {
  if (club.logo) {
    return (
      <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-2xl border border-[#DDD6C9] bg-white">
        <Image src={club.logo} alt={`${club.name || "Club"} logo`} fill sizes="56px" unoptimized className="object-cover" />
      </div>
    );
  }

  return (
    <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border border-[#DDD6C9] bg-[#E7DDCE]/65 text-lg font-semibold text-[#55574A]" aria-label="No club logo">
      {(club.name?.trim()?.[0] || "C").toUpperCase()}
    </div>
  );
}

function ConfirmDeleteDialog({ club, isDeleting, onCancel, onConfirm }) {
  if (!club) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#24241F]/45 p-4 backdrop-blur-sm">
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby="delete-club-title"
        className="w-full max-w-md rounded-3xl border border-[#DDD6C9] bg-[#F8F6EF] p-6 shadow-[0_20px_70px_rgba(20,20,16,0.25)] sm:p-7"
      >
        <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#F4E8E4] text-[#8A433B]" aria-hidden="true">
          <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.7]" strokeLinecap="round" strokeLinejoin="round">
            <path d="M3 6h18M8 6V4h8v2m3 0-1 14H6L5 6m4 4v6m6-6v6" />
          </svg>
        </div>
        <h2 id="delete-club-title" className="mt-4 text-xl font-semibold tracking-tight text-[#24241F]">Delete {club.name}?</h2>
        <p className="mt-2 text-sm leading-6 text-[#68695D]">This permanently removes the club. Make sure you want to continue.</p>
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <button type="button" onClick={onCancel} disabled={isDeleting} className="rounded-xl border border-[#DDD6C9] px-4 py-2.5 text-sm font-medium text-[#35382D] transition hover:bg-[#E7DDCE]/65 disabled:opacity-60">
            Keep club
          </button>
          <button type="button" onClick={onConfirm} disabled={isDeleting} className="rounded-xl bg-[#8A433B] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#71372F] disabled:cursor-not-allowed disabled:opacity-60">
            {isDeleting ? "Deleting..." : "Delete club"}
          </button>
        </div>
      </section>
    </div>
  );
}

function ClubCard({ club, mode, isUpdatingStatus, onEdit, onDelete, onStatusChange }) {
  const status = allowedStatuses.includes(club.status) ? club.status : "inactive";
  return (
    <article className="rounded-3xl border border-[#DDD6C9] bg-white/75 p-5 shadow-[0_8px_24px_rgba(36,36,31,0.035)] transition hover:shadow-[0_12px_30px_rgba(36,36,31,0.07)] sm:p-6">
      <div className="flex min-w-0 items-start gap-4">
        <ClubLogo club={club} />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="break-words text-lg font-semibold tracking-tight text-[#24241F]">{club.name || "Untitled club"}</h2>
            <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold capitalize ${
              status === "active" ? "bg-[#E8EEE4] text-[#465B3E]" : "bg-[#EEECE7] text-[#6C6A5F]"
            }`}>
              <span className={`h-1.5 w-1.5 rounded-full ${status === "active" ? "bg-[#668254]" : "bg-[#969486]"}`} />
              {status}
            </span>
          </div>
          <p className="mt-1 break-words text-xs text-[#747566]">{club.category || "Uncategorized"} <span className="px-1">·</span> Created {displayDate(club.createdAt)}</p>
        </div>
      </div>

      <p className="mt-4 whitespace-pre-line break-words text-sm leading-6 text-[#55574A]">{club.shortDescription || club.description || "No description provided."}</p>

      <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-[#E8E3D9] pt-4">
        {mode === "manage" && (
          <>
            <Link
              href={`/president/clubs/edit/${encodeURIComponent(String(club._id))}`}
              onClick={onEdit}
              className="inline-flex items-center rounded-xl bg-[#35382D] px-3.5 py-2 text-sm font-medium text-[#F8F6EF] transition hover:bg-[#24241F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35382D]/40"
            >
              Edit
            </Link>
            <button
              type="button"
              onClick={() => onStatusChange(club, status === "active" ? "inactive" : "active")}
              disabled={isUpdatingStatus}
              className="inline-flex items-center rounded-xl border border-[#DDD6C9] px-3.5 py-2 text-sm font-medium text-[#35382D] transition hover:bg-[#E7DDCE]/55 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isUpdatingStatus ? "Updating..." : `Set ${status === "active" ? "inactive" : "active"}`}
            </button>
          </>
        )}
        <button
          type="button"
          onClick={() => onDelete(club)}
          className="inline-flex items-center rounded-xl border border-[#E6CFC9] px-3.5 py-2 text-sm font-medium text-[#8A433B] transition hover:bg-[#F4E8E4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8A433B]/30"
        >
          Delete
        </button>
      </div>
    </article>
  );
}

export default function ClubManagement({ mode = "manage" }) {
  const [clubs, setClubs] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [actionError, setActionError] = useState("");
  const [notice, setNotice] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedClub, setSelectedClub] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [updatingClubId, setUpdatingClubId] = useState("");

  const loadClubs = useCallback(async () => {
    setIsLoading(true);
    setLoadError("");
    try {
      setClubs(await fetchClubs());
    } catch (error) {
      setLoadError(error?.message || "Unable to load clubs. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    let isCurrent = true;

    fetchClubs()
      .then((items) => {
        if (isCurrent) setClubs(items);
      })
      .catch((error) => {
        if (isCurrent) setLoadError(error?.message || "Unable to load clubs. Please try again.");
      })
      .finally(() => {
        if (isCurrent) setIsLoading(false);
      });

    return () => {
      isCurrent = false;
    };
  }, []);

  const filteredClubs = useMemo(() => {
    const query = search.trim().toLowerCase();
    return clubs.filter((club) => {
      const matchesName = !query || club.name?.toLowerCase().includes(query);
      const normalizedStatus = allowedStatuses.includes(club.status) ? club.status : "inactive";
      const matchesStatus = statusFilter === "all" || normalizedStatus === statusFilter;
      return matchesName && matchesStatus;
    });
  }, [clubs, search, statusFilter]);

  const handleStatusChange = async (club, status) => {
    if (!allowedStatuses.includes(status)) return;
    setUpdatingClubId(String(club._id));
    setActionError("");
    setNotice("");
    try {
      const response = await updateClubStatus(club._id, status);
      if (!response?.success) {
        throw new Error(response?.message || "Unable to update this club's status.");
      }
      setClubs((current) => current.map((item) => item._id === club._id ? { ...item, status } : item));
      setNotice(`${club.name} is now ${status}.`);
    } catch (error) {
      setActionError(error?.message || "Unable to update this club's status.");
    } finally {
      setUpdatingClubId("");
    }
  };

  const handleDelete = async () => {
    if (!selectedClub?._id) return;
    setIsDeleting(true);
    setActionError("");
    setNotice("");
    try {
      const response = await deleteClub(selectedClub._id);
      if (!response?.success) {
        throw new Error(response?.message || "Unable to delete this club.");
      }
      const deletedName = selectedClub.name;
      setSelectedClub(null);
      setNotice(`${deletedName} was deleted.`);
      await loadClubs();
    } catch (error) {
      setActionError(error?.message || "Unable to delete this club.");
    } finally {
      setIsDeleting(false);
    }
  };

  const isDeletePage = mode === "delete";

  return (
    <main className="flex-1 bg-[#F8F6EF] px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#747566]">President · Club management</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.045em] text-[#24241F]">
              {isDeletePage ? "Delete clubs" : "Manage clubs"}
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#68695D]">
              {isDeletePage ? "Review clubs before removing them from the CodingHub community." : "Search, update, and organize clubs across the community."}
            </p>
          </div>
          {!isDeletePage && (
            <Link href="/president/clubs/create" className="inline-flex w-fit items-center gap-2 rounded-xl bg-[#35382D] px-4 py-2.5 text-sm font-medium text-[#F8F6EF] shadow-sm transition hover:bg-[#24241F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35382D]/45 focus-visible:ring-offset-2">
              <span aria-hidden="true" className="text-lg leading-none">+</span>
              Add new club
            </Link>
          )}
        </div>

        <section className="mt-8 rounded-3xl border border-[#DDD6C9] bg-white/60 p-4 shadow-[0_8px_24px_rgba(36,36,31,0.025)] sm:p-5">
          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <div className="relative w-full md:max-w-md">
              <label htmlFor="club-search" className="sr-only">Search clubs by name</label>
              <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 fill-none stroke-[#747566] stroke-[1.8]" aria-hidden="true">
                <circle cx="10.8" cy="10.8" r="6.8" />
                <path d="m16 16 4.5 4.5" strokeLinecap="round" />
              </svg>
              <input
                id="club-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search clubs by name..."
                className="w-full rounded-xl border border-[#DDD6C9] bg-[#F8F6EF] py-2.5 pl-10 pr-3.5 text-sm text-[#24241F] outline-none transition placeholder:text-[#8A8B7F] focus:border-[#35382D]/60 focus:ring-2 focus:ring-[#D8CCBA]"
              />
            </div>
            {!isDeletePage && (
              <div className="flex items-center gap-2">
                <label htmlFor="club-status-filter" className="text-sm font-medium text-[#55574A]">Status</label>
                <select
                  id="club-status-filter"
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="rounded-xl border border-[#DDD6C9] bg-[#F8F6EF] px-3 py-2.5 text-sm text-[#35382D] outline-none focus:border-[#35382D]/60 focus:ring-2 focus:ring-[#D8CCBA]"
                >
                  <option value="all">All</option>
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            )}
            <p className="text-xs text-[#747566]" aria-live="polite">
              {isLoading ? "Loading clubs..." : `${filteredClubs.length} ${filteredClubs.length === 1 ? "club" : "clubs"}`}
            </p>
          </div>
        </section>

        {actionError && <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{actionError}</p>}
        {notice && <p role="status" className="mt-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">{notice}</p>}

        {loadError ? (
          <section className="mt-6 rounded-3xl border border-red-200 bg-red-50 p-6">
            <p role="alert" className="text-sm text-red-800">{loadError}</p>
            <button type="button" onClick={loadClubs} className="mt-3 rounded-lg px-2 py-1 text-sm font-semibold text-red-900 underline underline-offset-4">Try again</button>
          </section>
        ) : isLoading ? (
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-label="Loading clubs" role="status">
            {[0, 1, 2].map((item) => (
              <div key={item} className="rounded-3xl border border-[#DDD6C9] bg-white/70 p-6">
                <div className="flex gap-4">
                  <div className="h-14 w-14 animate-pulse rounded-2xl bg-[#E7DDCE]" />
                  <div className="flex-1 space-y-3 pt-1">
                    <div className="h-4 w-2/3 animate-pulse rounded bg-[#E7DDCE]" />
                    <div className="h-3 w-1/2 animate-pulse rounded bg-[#E7DDCE]/75" />
                  </div>
                </div>
                <div className="mt-5 h-12 animate-pulse rounded bg-[#E7DDCE]/60" />
                <div className="mt-5 h-9 w-1/2 animate-pulse rounded-xl bg-[#E7DDCE]/75" />
              </div>
            ))}
          </div>
        ) : clubs.length === 0 ? (
          <section className="mt-6 rounded-3xl border border-dashed border-[#CFC8B9] bg-white/45 px-6 py-14 text-center">
            <h2 className="text-lg font-semibold text-[#35382D]">No clubs yet</h2>
            <p className="mt-2 text-sm text-[#68695D]">Create the first club to get your community started.</p>
            {!isDeletePage && <Link href="/president/clubs/create" className="mt-5 inline-flex rounded-xl bg-[#35382D] px-4 py-2.5 text-sm font-medium text-[#F8F6EF]">Add a club</Link>}
          </section>
        ) : filteredClubs.length === 0 ? (
          <section className="mt-6 rounded-3xl border border-dashed border-[#CFC8B9] bg-white/45 px-6 py-12 text-center">
            <h2 className="text-base font-semibold text-[#35382D]">No matching clubs</h2>
            <p className="mt-2 text-sm text-[#68695D]">Try a different name or status filter.</p>
          </section>
        ) : (
          <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredClubs.map((club) => (
              <ClubCard
                key={club._id}
                club={club}
                mode={mode}
                isUpdatingStatus={updatingClubId === String(club._id)}
                onDelete={setSelectedClub}
                onStatusChange={handleStatusChange}
              />
            ))}
          </div>
        )}
      </div>

      <ConfirmDeleteDialog
        club={selectedClub}
        isDeleting={isDeleting}
        onCancel={() => setSelectedClub(null)}
        onConfirm={handleDelete}
      />
    </main>
  );
}
