"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { getAllClubs } from "@/lib/api";

function ClubCard({ club }) {
  const href = `/clubs/${encodeURIComponent(String(club._id))}`;
  const description = club.shortDescription || club.description || "A place to learn, connect, and build together.";

  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-3xl border border-[#DDD6C9] bg-white/80 shadow-[0_8px_24px_rgba(36,36,31,0.035)] transition duration-200 hover:-translate-y-1 hover:shadow-[0_16px_36px_rgba(36,36,31,0.09)]">
      <Link href={href} className="flex flex-1 flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#35382D]/50">
        <div className="relative aspect-[16/8] overflow-hidden bg-gradient-to-br from-[#E7DDCE] via-[#D9D5C5] to-[#C7C7B5]">
          {club.coverImage && (
            <Image src={club.coverImage} alt={`${club.name} cover`} fill sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw" unoptimized className="object-cover transition duration-300 group-hover:scale-[1.03]" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#24241F]/35 via-transparent to-transparent" />
          <div className="absolute -bottom-6 left-5 flex h-16 w-16 items-center justify-center overflow-hidden rounded-2xl border-4 border-white bg-[#F8F6EF] text-xl font-semibold text-[#35382D] shadow-md">
            {club.logo
              ? <Image src={club.logo} alt={`${club.name} logo`} fill sizes="64px" unoptimized className="object-cover" />
              : (club.name?.trim()?.[0] || "C").toUpperCase()}
          </div>
          {club.category && <span className="absolute right-4 top-4 rounded-full border border-white/60 bg-[#F8F6EF]/90 px-3 py-1 text-xs font-medium text-[#35382D] backdrop-blur">{club.category}</span>}
        </div>
        <div className="flex flex-1 flex-col px-5 pb-5 pt-10">
          <h3 className="text-lg font-semibold tracking-tight text-[#24241F] transition group-hover:text-[#55574A]">{club.name || "Untitled club"}</h3>
          <p className="mt-2 line-clamp-3 flex-1 text-sm leading-6 text-[#68695D]">{description}</p>
          <span className="mt-5 inline-flex w-fit items-center gap-2 text-sm font-semibold text-[#35382D]">
            Explore club <span aria-hidden="true" className="transition-transform group-hover:translate-x-1">→</span>
          </span>
        </div>
      </Link>
    </article>
  );
}

function LoadingClubs() {
  return (
    <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3" role="status" aria-label="Loading clubs">
      {[0, 1, 2].map((item) => (
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

export default function ClubsSection() {
  const [clubs, setClubs] = useState([]);
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

  return (
    <>
      <section aria-label="CodingHub community at a glance" className="border-y border-[#DDD6C9]/80 bg-[#F1EEE5]">
        <div className="mx-auto grid max-w-7xl gap-5 px-4 py-7 sm:grid-cols-3 sm:px-6 lg:px-8">
          <div className="text-center sm:text-left">
            <p className="text-2xl font-semibold tracking-tight text-[#35382D]" aria-live="polite">
              {isLoading ? <span className="inline-block h-7 w-12 animate-pulse rounded bg-[#DDD6C9]" aria-label="Loading club count" /> : clubs.length}
            </p>
            <p className="mt-1 text-sm text-[#747566]">Active clubs to discover</p>
          </div>
          <div className="text-center">
            <p className="text-lg font-semibold tracking-tight text-[#35382D]">One university</p>
            <p className="mt-1 text-sm text-[#747566]">A campus full of possibility</p>
          </div>
          <div className="text-center sm:text-right">
            <p className="text-lg font-semibold tracking-tight text-[#35382D]">Endless possibilities</p>
            <p className="mt-1 text-sm text-[#747566]">Learn, make, and grow together</p>
          </div>
        </div>
      </section>

      <section id="clubs" className="scroll-mt-24 py-16 sm:py-20 lg:py-24">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#747566]">Find your community</p>
              <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[#24241F] sm:text-4xl">Explore Clubs</h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-[#68695D] sm:text-base">Discover active student communities at GSTU and find the one that feels right for you.</p>
            </div>
            <Link href="/clubs" className="inline-flex w-fit items-center gap-2 rounded-xl border border-[#DDD6C9] bg-white/60 px-4 py-2.5 text-sm font-semibold text-[#35382D] transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35382D]/35">
              Explore all clubs <span aria-hidden="true">→</span>
            </Link>
          </div>

          {loadError ? (
            <div className="rounded-3xl border border-red-200 bg-red-50 px-6 py-10 text-center">
              <h3 className="text-lg font-semibold text-[#24241F]">We couldn’t load the clubs</h3>
              <p role="alert" className="mt-2 text-sm text-red-800">{loadError}</p>
              <button type="button" onClick={loadClubs} className="mt-5 rounded-xl bg-[#35382D] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#24241F]">Try again</button>
            </div>
          ) : isLoading ? (
            <LoadingClubs />
          ) : clubs.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-[#CFC8B9] bg-white/45 px-6 py-12 text-center">
              <h3 className="text-lg font-semibold text-[#35382D]">New communities are on the way</h3>
              <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-[#68695D]">There are no active clubs to show just yet. Check back soon to find your people at GSTU.</p>
            </div>
          ) : (
            <div className="grid items-stretch gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {clubs.map((club) => <ClubCard key={String(club._id)} club={club} />)}
            </div>
          )}
        </div>
      </section>
    </>
  );
}
