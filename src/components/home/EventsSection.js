"use client";

import { useState } from "react";

// These fictional sample events are illustrative only, not official GSTU schedules.
const demoEvents = [
  {
    title: "GSTU Inter-University Programming Contest",
    category: "Programming contest",
    organizer: "Programming Club",
    date: "December 5, 2026",
    location: "GSTU Campus",
    description: "A sample competitive programming event where teams solve algorithmic challenges and learn from one another.",
  },
  {
    title: "Introduction to Generative AI",
    category: "AI workshop",
    organizer: "AI & Robotics Club",
    date: "December 12, 2026",
    location: "GSTU",
    description: "A sample beginner-friendly workshop introducing generative AI concepts, creative applications, and responsible use.",
  },
  {
    title: "Web Development Bootcamp",
    category: "Workshop",
    organizer: "Web Development Club",
    date: "January 16, 2027",
    location: "Computer Lab",
    description: "A sample hands-on learning session exploring the building blocks of modern websites and collaborative projects.",
  },
  {
    title: "Mathematics Olympiad",
    category: "Competition",
    organizer: "Mathematics Club",
    date: "February 4, 2027",
    location: "GSTU",
    description: "A sample campus mathematics challenge focused on creative reasoning, problem solving, and friendly competition.",
  },
];

function EventCard({ event, onViewDetails }) {
  return (
    <article className="flex h-full flex-col rounded-3xl border border-[#DDD6C9] bg-white/75 p-5 shadow-[0_8px_24px_rgba(36,36,31,0.03)] transition hover:-translate-y-1 hover:shadow-[0_14px_32px_rgba(36,36,31,0.07)] sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <span className="rounded-full bg-[#E7DDCE]/75 px-3 py-1.5 text-[11px] font-semibold capitalize text-[#55574A]">{event.category}</span>
        <span className="rounded-full border border-[#DDD6C9] px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-[#747566]">Sample</span>
      </div>
      <h3 className="mt-4 text-lg font-semibold leading-6 tracking-tight text-[#24241F]">{event.title}</h3>
      <p className="mt-2 flex-1 text-sm leading-6 text-[#68695D]">{event.description}</p>
      <dl className="mt-5 space-y-2 border-t border-[#E8E3D9] pt-4 text-xs leading-5 text-[#68695D]">
        <div className="flex gap-2"><dt className="font-semibold text-[#55574A]">Organizer</dt><dd>{event.organizer}</dd></div>
        <div className="flex gap-2"><dt className="font-semibold text-[#55574A]">Date</dt><dd>{event.date}</dd></div>
        <div className="flex gap-2"><dt className="font-semibold text-[#55574A]">Location</dt><dd>{event.location}</dd></div>
      </dl>
      <button type="button" onClick={() => onViewDetails(event)} className="mt-5 inline-flex w-fit items-center gap-2 rounded-lg py-1 text-sm font-semibold text-[#35382D] transition hover:text-[#24241F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35382D]/35">
        View Details <span aria-hidden="true">→</span>
      </button>
    </article>
  );
}

export default function EventsSection() {
  const [selectedEvent, setSelectedEvent] = useState(null);

  return (
    <section id="events" className="scroll-mt-24 bg-[#F1EEE5] py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#747566]">Get involved</p>
            <h2 className="mt-2 text-3xl font-semibold tracking-[-0.04em] text-[#24241F] sm:text-4xl">What’s happening</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-[#68695D] sm:text-base">Workshops, competitions, and new ways to learn with your community.</p>
          </div>
          <p className="max-w-xs rounded-xl border border-[#D8CCBA] bg-[#F8F6EF]/70 px-3.5 py-2.5 text-xs leading-5 text-[#68695D]">
            These are fictional sample events for illustration only, not official university schedules.
          </p>
        </div>

        <div className="grid items-stretch gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {demoEvents.map((event) => <EventCard key={event.title} event={event} onViewDetails={setSelectedEvent} />)}
        </div>
      </div>

      {selectedEvent && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-[#24241F]/50 p-4 backdrop-blur-sm" onMouseDown={(event) => {
          if (event.target === event.currentTarget) setSelectedEvent(null);
        }}>
          <section role="dialog" aria-modal="true" aria-labelledby="sample-event-title" className="w-full max-w-lg rounded-3xl border border-[#DDD6C9] bg-[#F8F6EF] p-6 shadow-[0_20px_70px_rgba(20,20,16,0.25)] sm:p-8">
            <div className="flex items-start justify-between gap-4">
              <div>
                <span className="rounded-full bg-[#E7DDCE]/75 px-3 py-1.5 text-xs font-semibold capitalize text-[#55574A]">{selectedEvent.category}</span>
                <h2 id="sample-event-title" className="mt-4 text-xl font-semibold tracking-tight text-[#24241F]">{selectedEvent.title}</h2>
              </div>
              <button type="button" onClick={() => setSelectedEvent(null)} aria-label="Close event details" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-lg text-[#55574A] hover:bg-[#E7DDCE]/65 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35382D]/35">×</button>
            </div>
            <p className="mt-4 text-sm leading-6 text-[#68695D]">{selectedEvent.description}</p>
            <dl className="mt-5 space-y-3 rounded-2xl bg-white/70 p-4 text-sm text-[#55574A]">
              <div><dt className="font-semibold text-[#35382D]">Organizer</dt><dd className="mt-0.5">{selectedEvent.organizer}</dd></div>
              <div><dt className="font-semibold text-[#35382D]">Sample date</dt><dd className="mt-0.5">{selectedEvent.date}</dd></div>
              <div><dt className="font-semibold text-[#35382D]">Sample location</dt><dd className="mt-0.5">{selectedEvent.location}</dd></div>
            </dl>
            <p className="mt-4 text-xs leading-5 text-[#747566]">This is demonstration content only. Event details have not been officially announced.</p>
          </section>
        </div>
      )}
    </section>
  );
}
