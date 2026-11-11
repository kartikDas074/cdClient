import Link from "next/link";
import ClubsSection from "@/components/home/ClubsSection";
import EventsSection from "@/components/home/EventsSection";

function CommunityArtwork() {
  return (
    <div className="relative mx-auto aspect-[1.05/1] w-full max-w-[540px] sm:aspect-[1.12/1]" aria-label="Illustration of connected student communities" role="img">
      <div className="absolute inset-[8%] rounded-[36%] bg-[#D9D5C5]/55 blur-2xl" />
      <svg viewBox="0 0 520 470" fill="none" className="absolute inset-0 h-full w-full" aria-hidden="true">
        <path d="M92 235c36-105 105-149 169-102s107 172 173 101" stroke="#A8A993" strokeWidth="2" strokeDasharray="5 8" />
        <path d="M151 354c45-70 92-105 141-105s81-37 108-102" stroke="#A8A993" strokeWidth="2" strokeDasharray="5 8" />
        <circle cx="260" cy="145" r="95" fill="#E9E3D7" />
        <circle cx="260" cy="145" r="70" fill="#F8F6EF" />
        <circle cx="260" cy="145" r="47" fill="#35382D" />
        <path d="m244 144 11 11 23-26" stroke="#F8F6EF" strokeWidth="6" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="94" cy="235" r="39" fill="#D7DDD0" />
        <circle cx="94" cy="222" r="9" fill="#59684E" />
        <path d="M75 250c4-13 12-19 19-19s15 6 19 19" stroke="#59684E" strokeWidth="5" strokeLinecap="round" />
        <circle cx="434" cy="235" r="39" fill="#E5D9C8" />
        <path d="m420 225 14-8 14 8v17l-14 8-14-8v-17Z" stroke="#775B3C" strokeWidth="4" strokeLinejoin="round" />
        <path d="M434 217v33m-14-25 28 17m0-17-28 17" stroke="#775B3C" strokeWidth="3" />
        <circle cx="147" cy="355" r="37" fill="#D9DCE0" />
        <path d="m132 355 10 10 20-22" stroke="#536474" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" />
        <circle cx="400" cy="147" r="34" fill="#E6D8D6" />
        <path d="M386 146h28m-14-14v28" stroke="#815D5A" strokeWidth="4" strokeLinecap="round" />
      </svg>
      <div className="absolute left-[3%] top-[39%] -rotate-3 rounded-2xl border border-[#DDD6C9] bg-[#F8F6EF] px-4 py-3 shadow-[0_12px_30px_rgba(36,36,31,0.10)] sm:left-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#747566]">Find your people</p>
        <p className="mt-1 text-sm font-semibold text-[#35382D]">Shared interests, real community</p>
      </div>
      <div className="absolute bottom-[9%] right-[2%] rotate-2 rounded-2xl border border-[#DDD6C9] bg-[#F8F6EF] px-4 py-3 shadow-[0_12px_30px_rgba(36,36,31,0.10)] sm:right-0">
        <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-[#747566]">Make something meaningful</p>
        <p className="mt-1 text-sm font-semibold text-[#35382D]">Learn · Build · Belong</p>
      </div>
    </div>
  );
}

function WhyJoinSection() {
  const benefits = [
    { number: "01", title: "Learn Together", description: "Pick up practical skills and explore new ideas alongside curious students.", icon: "book" },
    { number: "02", title: "Build Real Projects", description: "Turn what you are learning into thoughtful projects through collaboration.", icon: "build" },
    { number: "03", title: "Compete & Achieve", description: "Challenge yourself in contests, hackathons, olympiads, and more.", icon: "trophy" },
    { number: "04", title: "Connect & Grow", description: "Meet your people, share perspectives, and grow as a leader.", icon: "connect" },
  ];

  return (
    <section id="about" className="scroll-mt-24 bg-white/55 py-16 sm:py-20 lg:py-24">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#747566]">More than a club</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[#24241F] sm:text-4xl">Make university yours</h2>
          <p className="mt-4 text-base leading-7 text-[#68695D]">The best parts of university happen when you find a community that helps you grow.</p>
        </div>
        <div className="mt-10 grid gap-4 sm:grid-cols-2 lg:mt-12 lg:grid-cols-4">
          {benefits.map((benefit) => (
            <article key={benefit.number} className="rounded-3xl border border-[#DDD6C9] bg-[#F8F6EF]/80 p-5 transition hover:-translate-y-1 hover:shadow-[0_12px_30px_rgba(36,36,31,0.06)] sm:p-6">
              <div className="flex items-center justify-between">
                <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[#E7DDCE]/75 text-[#55574A]">
                  <BenefitIcon name={benefit.icon} />
                </span>
                <span className="text-xs font-semibold tracking-[0.12em] text-[#9A9A8C]">{benefit.number}</span>
              </div>
              <h3 className="mt-5 text-lg font-semibold tracking-tight text-[#24241F]">{benefit.title}</h3>
              <p className="mt-2 text-sm leading-6 text-[#68695D]">{benefit.description}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function BenefitIcon({ name }) {
  const paths = {
    book: <><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v16H6.5A2.5 2.5 0 0 0 4 21.5z" /><path d="M4 5.5v16M8 7h8m-8 4h7" /></>,
    build: <><path d="m14 7 3 3m-8 8-5 1 1-5L16 3a2.1 2.1 0 0 1 3 3z" /><path d="M13 5 18 10" /></>,
    trophy: <><path d="M8 21h8m-4-4v4M7 4h10v5a5 5 0 0 1-10 0zM7 7H4v2a4 4 0 0 0 4 4m9-6h3v2a4 4 0 0 1-4 4" /></>,
    connect: <><circle cx="9" cy="8" r="3" /><path d="M3 20v-1a6 6 0 0 1 12 0v1zm13-9a3 3 0 1 0-2-5.2m3 8a5 5 0 0 1 4 5v1h-3" /></>,
  };
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5 fill-none stroke-current stroke-[1.7]" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  );
}

function CallToAction() {
  return (
    <section className="px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
      <div className="relative mx-auto max-w-7xl overflow-hidden rounded-[2rem] bg-[#35382D] px-6 py-10 text-center sm:px-12 sm:py-14 lg:px-16">
        <div aria-hidden="true" className="absolute -right-20 -top-32 h-72 w-72 rounded-full border border-white/10" />
        <div aria-hidden="true" className="absolute -bottom-48 left-[-3rem] h-80 w-80 rounded-full border border-white/10" />
        <div className="relative mx-auto max-w-2xl">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#D9D5C5]">Your next chapter starts here</p>
          <h2 className="mt-3 text-3xl font-semibold tracking-[-0.04em] text-[#F8F6EF] sm:text-4xl">Your University Journey Deserves More.</h2>
          <p className="mt-4 text-sm leading-7 text-[#E7DDCE]/85 sm:text-base">Don’t just attend classes. Explore your interests, meet your community, and become part of something bigger at GSTU.</p>
          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Link href="/clubs" className="rounded-xl bg-[#F8F6EF] px-5 py-3 text-sm font-semibold text-[#35382D] transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white focus-visible:ring-offset-2 focus-visible:ring-offset-[#35382D]">Explore Clubs</Link>
            <Link href="/signup" className="rounded-xl border border-white/30 px-5 py-3 text-sm font-semibold text-[#F8F6EF] transition hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white">Join CodingHub</Link>
          </div>
        </div>
      </div>
    </section>
  );
}

function HomeFooter() {
  return (
    <footer className="border-t border-[#DDD6C9] bg-[#F1EEE5]">
      <div className="mx-auto grid max-w-7xl gap-10 px-4 py-10 sm:px-6 md:grid-cols-[1.5fr_1fr_1fr] lg:px-8">
        <div>
          <Link href="/" className="inline-flex items-center gap-2.5 rounded-lg text-[#24241F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35382D]/35">
            <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#35382D] text-sm font-semibold text-[#F8F6EF]" aria-hidden="true">&lt;/&gt;</span>
            <span className="text-lg font-semibold tracking-[-0.05em]">CodingHub</span>
          </Link>
          <p className="mt-3 max-w-sm text-sm leading-6 text-[#68695D]">A home for student communities, shared interests, and ideas in the making.</p>
          <p className="mt-4 text-sm font-medium text-[#55574A]">Gopalganj Science and Technology University</p>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-[#24241F]">Quick links</h2>
          <nav aria-label="Footer navigation" className="mt-3 flex flex-col items-start gap-2.5">
            <Link href="/" className="text-sm text-[#68695D] hover:text-[#24241F]">Home</Link>
            <Link href="/clubs" className="text-sm text-[#68695D] hover:text-[#24241F]">Explore Clubs</Link>
            <Link href="/#events" className="text-sm text-[#68695D] hover:text-[#24241F]">Events</Link>
            <Link href="/#about" className="text-sm text-[#68695D] hover:text-[#24241F]">About</Link>
          </nav>
        </div>
        <div>
          <h2 className="text-sm font-semibold text-[#24241F]">Get started</h2>
          <nav aria-label="Account links" className="mt-3 flex flex-col items-start gap-2.5">
            <Link href="/login" className="text-sm text-[#68695D] hover:text-[#24241F]">Log in</Link>
            <Link href="/signup" className="text-sm text-[#68695D] hover:text-[#24241F]">Create an account</Link>
          </nav>
        </div>
      </div>
      <div className="mx-auto max-w-7xl px-4 pb-6 text-xs text-[#747566] sm:px-6 lg:px-8">
        © 2026 CodingHub · Gopalganj Science and Technology University
      </div>
    </footer>
  );
}

export default function Home() {
  return (
    <>
      <main className="flex-1 bg-[#F8F6EF]">
        <section className="overflow-hidden">
          <div className="mx-auto grid max-w-7xl items-center gap-8 px-4 pb-12 pt-10 sm:px-6 sm:pb-16 sm:pt-14 lg:grid-cols-[1.08fr_0.92fr] lg:gap-4 lg:px-8 lg:pb-20 lg:pt-16">
            <div className="relative z-10">
              <span className="inline-flex items-center gap-2 rounded-full border border-[#DDD6C9] bg-white/65 px-3.5 py-2 text-[11px] font-semibold uppercase tracking-[0.13em] text-[#55574A]">
                <span className="h-2 w-2 rounded-full bg-[#78876B]" />
                GSTU student community
              </span>
              <h1 className="mt-6 max-w-2xl text-[2.8rem] font-semibold leading-[1.08] tracking-[-0.06em] text-[#24241F] sm:text-6xl lg:text-[4.25rem]">
                Find Your People.<br />
                <span className="text-[#68695D]">Build Your Future.</span>
              </h1>
              <p className="mt-6 max-w-xl text-base leading-7 text-[#68695D] sm:text-lg sm:leading-8">
                One university, endless possibilities. Discover student clubs, explore your interests, collaborate with passionate people, and turn your ideas into reality at GSTU.
              </p>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <Link href="/clubs" className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#35382D] px-5 py-3.5 text-sm font-semibold text-[#F8F6EF] shadow-sm transition hover:bg-[#24241F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35382D]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#F8F6EF]">
                  Explore Clubs <span aria-hidden="true">→</span>
                </Link>
                <Link href="/#events" className="inline-flex items-center justify-center rounded-xl border border-[#DDD6C9] bg-white/55 px-5 py-3.5 text-sm font-semibold text-[#35382D] transition hover:bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35382D]/35">
                  Discover Events
                </Link>
              </div>
              <p className="mt-6 text-xs font-medium tracking-wide text-[#747566]">One University <span className="px-1.5 text-[#A9A99B]">·</span> Many Communities <span className="px-1.5 text-[#A9A99B]">·</span> Endless Possibilities</p>
            </div>
            <CommunityArtwork />
          </div>
        </section>
        <ClubsSection />
        <EventsSection />
        <WhyJoinSection />
        <CallToAction />
      </main>
      <HomeFooter />
    </>
  );
}
