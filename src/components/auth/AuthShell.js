import Link from "next/link";

export default function AuthShell({
  title,
  subtitle,
  children,
  footerText,
  footerLinkText,
  footerHref,
}) {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#F8F6EF] text-[#24241F]">
      <div aria-hidden="true" className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-24 top-10 h-[22rem] w-[22rem] rounded-full border border-[#E7DDCE] bg-[#E7DDCE]/30" />
        <div className="absolute right-[-6rem] top-[-3rem] h-[28rem] w-[28rem] rounded-full border border-[#D8CCBA]/70 bg-[#D8CCBA]/20" />
        <div className="absolute bottom-[-7rem] left-1/2 h-[26rem] w-[26rem] -translate-x-1/2 rounded-full border border-[#DDD6C9] bg-[#E7DDCE]/20" />
        <div className="absolute inset-0 opacity-40 [background-image:radial-gradient(circle_at_center,_rgba(53,56,45,0.07)_1px,_transparent_1px)] [background-size:26px_26px]" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-5xl items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
        <div className="w-full max-w-[460px]">
          <div className="rounded-[28px] border border-[#DDD6C9] bg-[#F8F6EF]/90 px-5 py-7 shadow-[0_10px_30px_rgba(36,36,31,0.04)] backdrop-blur-[1px] sm:px-8 sm:py-8">
            <div className="mb-6 text-center">
              <h1 className="text-3xl font-semibold tracking-[-0.06em] text-[#24241F] sm:text-[2.2rem]">
                {title}
              </h1>
              <p className="mt-2 text-sm text-[#35382D]/75 sm:text-base">{subtitle}</p>
            </div>

            {children}

            <p className="mt-6 text-center text-sm text-[#35382D]/80">
              {footerText}{" "}
              <Link href={footerHref} className="font-medium text-[#24241F] underline decoration-[#35382D]/30 underline-offset-4 transition hover:text-[#35382D]">
                {footerLinkText}
              </Link>
            </p>
          </div>
        </div>
      </div>
    </main>
  );
}
