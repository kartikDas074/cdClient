"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { getAllClubs } from "@/lib/api";

function ClubCard({ club }) {
  const clubHref = `/clubs/${encodeURIComponent(String(club._id))}`;
  const shortDescription = club.shortDescription || club.description || "A community for students to learn, connect, and build together.";
  const foundedYear = club.foundedAt ? new Date(club.foundedAt).getFullYear() : null;

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-[#DDD6C9] bg-white/80 shadow-[0_8px_24px_rgba(36,36,31,0.035)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(36,36,31,0.09)]">
      <Link href={clubHref} className="flex flex-1 flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#35382D]/50">
        <div className="relative aspect-[16/8] overflow-hidden bg-gradient-to-br from-[#E7DDCE] via-[#D9D5C5] to-[#C7C7B5]">
          {club.coverImage && (
            <Image
              src={club.coverImage}
              alt={`${club.name} cover`}
              fill
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              unoptimized
              className="object-cover transition duration-300 group-hover:scale-[1.03]"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#24241F]/35 via-transparent to-transparent" />
          <div className="absolute -bottom-7 left-5 flex h-[68px] w-[68px] items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-[#F8F6EF] text-xl font-semibold text-[#35382D] shadow-md">
            {club.logo ? (
              <Image src={club.logo} alt={`${club.name} logo`} fill sizes="68px" unoptimized className="object-cover" />
            ) : (
              (club.name?.trim()?.[0] || "C").toUpperCase()
            )}
          </div>
          <span className="absolute right-4 top-4 rounded-full border border-white/60 bg-[#F8F6EF]/90 px-3 py-1 text-xs font-medium text-[#35382D] backdrop-blur">
            {club.category || "Community"}
          </span>
        </div>
        <div className="flex flex-1 flex-col px-5 pb-5 pt-11">
          <div className="flex items-start justify-between gap-3">
            <h2 className="text-lg font-semibold tracking-tight text-[#24241F] transition group-hover:text-[#55574A]">{club.name || "Untitled club"}</h2>
            {foundedYear && <span className="shrink-0 pt-1 text-xs text-[#747566]">Est. {foundedYear}</span>}
          </div>
          <p className="mt-2 line-clamp-3 flex-1 text-sm leading-6 text-[#68695D]">{shortDescription}</p>
          <span className="mt-5 inline-flex w-fit items-center gap-2 text-sm font-semibold text-[#35382D]">
            Explore club
            <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>
          </span>
        </div>
      </Link>
    </article>
  );
}

function LoadingCards() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3" role="status" aria-label="Loading clubs">
      {[0, 1, 2, 3, 4, 5].map((item) => (
        <div key={item} className="overflow-hidden rounded-3xl border border-[#DDD6C9] bg-white/70">
          <div className="aspect-[16/8] animate-pulse bg-[#E7DDCE]" />
          <div className="space-y-3 p-5 pt-10">
            <div className="h-5 w-2/3 animate-pulse rounded bg-[#E7DDCE]" />
            <div className="h-3 w-full animate-pulse rounded bg-[#E7DDCE]/75" />
            <div className="h-3 w-4/5 animate-pulse rounded bg-[#E7DDCE]/75" />
          </div>
        </div>
      ))}
    </div>
  );
}

export default function ExploreClubsPage() {
  const [clubs, setClubs] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  const loadClubs = useCallback(async () => {
    setIsLoading(true);
    setLoadError("");
    try {
      const response = await getAllClubs();
      if (!response?.success || !Array.isArray(response.clubs)) {
        throw new Error(response?.message || "The club list could not be loaded.");
      }
      setClubs(response.clubs.filter((club) => club.status === "active"));
    } catch (error) {
      setLoadError(error?.message || "Unable to load clubs. Please try again.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    Promise.resolve().then(loadClubs);
  }, [loadClubs]);

  const categories = useMemo(
    () => [...new Set(clubs.map((club) => club.category).filter(Boolean))].sort((a, b) => a.localeCompare(b)),
    [clubs],
  );
  const filteredClubs = useMemo(() => {
    const query = search.trim().toLocaleLowerCase();
    return clubs.filter((club) => {
      const matchesSearch = !query ||
        `${club.name || ""} ${club.shortDescription || ""} ${club.description || ""}`.toLocaleLowerCase().includes(query);
      return matchesSearch && (!category || club.category === category);
    });
  }, [clubs, search, category]);
  const clearFilters = () => {
    setSearch("");
    setCategory("");
  };

  return (
    <main className="flex-1 bg-[#F8F6EF]">
      <section className="relative overflow-hidden border-b border-[#DDD6C9]/80">
        <div aria-hidden="true" className="absolute -right-28 -top-32 h-96 w-96 rounded-full bg-[#E7DDCE]/55 blur-3xl" />
        <div aria-hidden="true" className="absolute -bottom-40 left-[-6rem] h-80 w-80 rounded-full bg-[#D9D5C5]/45 blur-3xl" />
        <div className="relative mx-auto max-w-7xl px-4 pb-12 pt-14 sm:px-6 sm:pb-16 sm:pt-20 lg:px-8 lg:pb-20">
          <p className="text-xs font-semibold uppercase tracking-[0.18em] text-[#747566]">Find your people · Build your future</p>
          <h1 className="mt-4 max-w-3xl text-4xl font-semibold tracking-[-0.055em] text-[#24241F] sm:text-5xl lg:text-6xl">Discover Your Community</h1>
          <p className="mt-5 max-w-2xl text-base leading-7 text-[#68695D] sm:text-lg sm:leading-8">
            Explore university clubs, meet people who share your interests, and find a community where you can learn, create, and belong.
          </p>

          <div className="mt-8 grid max-w-3xl gap-3 rounded-2xl border border-[#DDD6C9] bg-white/75 p-3 shadow-[0_12px_36px_rgba(36,36,31,0.07)] sm:grid-cols-[1fr_auto] sm:p-2.5">
            <div className="relative">
              <label htmlFor="explore-club-search" className="sr-only">Search clubs by name or description</label>
              <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 fill-none stroke-[#747566] stroke-[1.7]" aria-hidden="true">
                <circle cx="10.8" cy="10.8" r="6.8" />
                <path d="m16 16 4.5 4.5" strokeLinecap="round" />
              </svg>
              <input
                id="explore-club-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by club name or interest..."
                className="w-full rounded-xl border border-transparent bg-transparent py-3.5 pl-12 pr-4 text-sm text-[#24241F] outline-none placeholder:text-[#8A8B7F] focus:border-[#DDD6C9] focus:bg-[#F8F6EF]"
              />
            </div>
            <label className="sr-only" htmlFor="club-category">Filter by category</label>
            <select
              id="club-category"
              value={category}
              onChange={(event) => setCategory(event.target.value)}
              className="rounded-xl border border-[#DDD6C9] bg-[#F8F6EF] px-4 py-3 text-sm text-[#35382D] outline-none focus:border-[#35382D]/60 focus:ring-2 focus:ring-[#D8CCBA] sm:min-w-48"
            >
              <option value="">All categories</option>
              {categories.map((item) => <option key={item} value={item}>{item}</option>)}
            </select>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.15em] text-[#747566]">The community</p>
            <h2 className="mt-1.5 text-2xl font-semibold tracking-tight text-[#24241F]">Explore clubs</h2>
          </div>
          {!isLoading && !loadError && (
            <div className="flex items-center gap-3">
              <p className="text-sm text-[#747566]" aria-live="polite">
                {filteredClubs.length} {filteredClubs.length === 1 ? "club" : "clubs"}
              </p>
              {(search || category) && (
                <button type="button" onClick={clearFilters} className="rounded-lg px-2 py-1 text-sm font-semibold text-[#35382D] underline decoration-[#A9A99B] underline-offset-4 hover:text-[#24241F]">
                  Clear filters
                </button>
              )}
            </div>
          )}
        </div>

        {loadError ? (
          <section className="rounded-3xl border border-red-200 bg-red-50 px-6 py-10 text-center">
            <h3 className="text-lg font-semibold text-[#24241F]">Clubs could not be loaded</h3>
            <p role="alert" className="mt-2 text-sm text-red-800">{loadError}</p>
            <button type="button" onClick={loadClubs} className="mt-5 rounded-xl bg-[#35382D] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#24241F]">
              Try again
            </button>
          </section>
        ) : isLoading ? (
          <LoadingCards />
        ) : filteredClubs.length === 0 ? (
          <section className="rounded-3xl border border-dashed border-[#CFC8B9] bg-white/45 px-6 py-14 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E7DDCE]/75 text-xl text-[#55574A]" aria-hidden="true">⌕</div>
            <h3 className="mt-4 text-lg font-semibold text-[#35382D]">{clubs.length ? "No clubs match your search" : "No clubs to explore yet"}</h3>
            <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#68695D]">
              {clubs.length ? "Try another search or category, or clear your filters to see all active clubs." : "Check back soon to discover new communities at your university."}
            </p>
            {clubs.length > 0 && (search || category) && (
              <button type="button" onClick={clearFilters} className="mt-4 text-sm font-semibold text-[#35382D] underline underline-offset-4">Clear filters</button>
            )}
          </section>
        ) : (
          <div className="grid items-stretch gap-5 sm:grid-cols-2 xl:grid-cols-3">
            {filteredClubs.map((club) => <ClubCard key={String(club._id)} club={club} />)}
          </div>
        )}
      </section>
    </main>
  );
}
