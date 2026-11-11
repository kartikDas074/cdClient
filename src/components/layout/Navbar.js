"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { authClient } from "@/lib/auth-client";

const publicLinks = [
  { label: "Home", href: "/", icon: "home" },
  { label: "Explore Clubs", href: "/clubs", icon: "compass" },
];

const roleMenus = {
  president: [
    
    {
      label: "Club Management",
      icon: "clubs",
      children: [
        { label: "Add Club", href: "/president/clubs/create" },
        { label: "Manage Clubs", href: "/president/clubs" },
        { label: "Edit Club", href: "/president/clubs" },
        { label: "Delete Club", href: "/president/clubs/delete" },
      ],
    },
    {
      label: "User Management",
      icon: "users",
      children: [
        { label: "Manage Users", href: "/president/users" },
      ],
    },
    { label: "My Clubs", href: "/dashboard/my-clubs", icon: "clubs" },
    { label: "My Profile", href: "/dashboard/my-profile", icon: "profile" },
  ],
  "pgpresident": [
    
    {
      label: "Programming Club",
      icon: "code",
      children: [
        { label: "Manage Membership Requests", href: "/dashboard/programming/membership-requests" },
        { label: "Manage Club Members", href: "/dashboard/programming/members" },
        { label: "Manage Contests", href: "/pgpresident/contests" },
        { label: "Manage Resources", href: "/pgpresident/resources" },
      ],
    },
   
    { label: "My Clubs", href: "/dashboard/my-clubs", icon: "clubs" },
    { label: "My Profile", href: "/dashboard/my-profile", icon: "profile" },
  ],
  "wbpresident": [
    {
      label: "Web Development Club",
      icon: "code",
      children: [
        { label: "Manage Membership Requests", href: "/dashboard/webdevelopment/membership-requests" },
        { label: "Manage Club Members", href: "/dashboard/webdevelopment/members" },
        { label: "Manage Hackathons", href: "/wbpresident/hackathons" },
        { label: "Manage Resources", href: "/wbpresident/resources" },
      ],
    },
    
    { label: "My Clubs", href: "/dashboard/my-clubs", icon: "clubs" },
    { label: "My Profile", href: "/dashboard/my-profile", icon: "profile" },
  ],
  user: [
   
    { label: "My Clubs", href: "/dashboard/my-clubs", icon: "clubs" },
    { label: "My Notifications", href: "/notifications", icon: "bell" },
    { label: "My Profile", href: "/dashboard/my-profile", icon: "profile" },
  ],
};

const roleLabels = {
  president: "President",
  pgpresident: "Programming Club President",
  wbpresident: "Web Development Club President",
  user: "Normal User",
};

function Icon({ name, className = "h-5 w-5" }) {
  const paths = {
    home: <><path d="m3 10 9-7 9 7" /><path d="M5 9v11h14V9M9 20v-6h6v6" /></>,
    compass: <><circle cx="12" cy="12" r="9" /><path d="m15.5 8.5-2.2 4.8-4.8 2.2 2.2-4.8 4.8-2.2Z" /></>,
    article: <><path d="M6 3h9l4 4v14H6z" /><path d="M14 3v5h5M9 12h7M9 16h7" /></>,
    calendar: <><rect x="3" y="5" width="18" height="16" rx="2" /><path d="M16 3v4M8 3v4M3 10h18m-13 4h2m4 0h2m-8 3h2" /></>,
    info: <><circle cx="12" cy="12" r="9" /><path d="M12 11v5m0-8h.01" /></>,
    bell: <><path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9" /><path d="M10 21h4" /></>,
    dashboard: <><rect x="3" y="3" width="8" height="8" rx="1.5" /><rect x="13" y="3" width="8" height="5" rx="1.5" /><rect x="13" y="10" width="8" height="11" rx="1.5" /><rect x="3" y="13" width="8" height="8" rx="1.5" /></>,
    clubs: <><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="10" cy="7" r="4" /><path d="M20 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75" /></>,
    users: <><path d="M16 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="10" cy="7" r="4" /><path d="M20 8v6m3-3h-6" /></>,
    profile: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
    code: <><path d="m8 8-4 4 4 4m8-8 4 4-4 4m-2-11-4 14" /></>,
    logout: <><path d="M10 17l5-5-5-5m5 5H3" /><path d="M12 3h6a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-6" /></>,
    menu: <><path d="M4 6h16M4 12h16M4 18h16" /></>,
    close: <><path d="m6 6 12 12M18 6 6 18" /></>,
    chevron: <path d="m7 10 5 5 5-5" />,
    mark: <><path d="m8 8-4 4 4 4m8-8 4 4-4 4m-2-11-4 14" /></>,
  };

  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {paths[name]}
    </svg>
  );
}

function normalizeRole(role) {
  const normalized = typeof role === "string"
    ? role.trim().toLowerCase().replace(/[_-]+/g, " ")
    : "";
  return Object.hasOwn(roleMenus, normalized) ? normalized : "user";
}

function MenuEntries({ entries, onNavigate }) {
  return entries.map((entry) => {
    if (entry.children) {
      return (
        <details key={entry.label} className="group">
          <summary className="flex cursor-pointer list-none items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[#35382D] transition hover:bg-[#E7DDCE]/65 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35382D]/35 [&::-webkit-details-marker]:hidden">
            <Icon name={entry.icon} className="h-[18px] w-[18px] shrink-0 text-[#676954]" />
            <span className="flex-1">{entry.label}</span>
            <Icon name="chevron" className="h-4 w-4 transition-transform group-open:rotate-180" />
          </summary>
          <div className="ml-5 mt-1 space-y-0.5 border-l border-[#DDD6C9] pl-3">
            {entry.children.map((child) => (
              <Link
                key={`${entry.label}-${child.label}`}
                href={child.href}
                onClick={onNavigate}
                className="block rounded-lg px-3 py-2 text-sm text-[#55574A] transition hover:bg-[#E7DDCE]/65 hover:text-[#24241F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35382D]/35"
              >
                {child.label}
              </Link>
            ))}
          </div>
        </details>
      );
    }

    return (
      <Link
        key={entry.label}
        href={entry.href}
        onClick={onNavigate}
        className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium text-[#35382D] transition hover:bg-[#E7DDCE]/65 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35382D]/35"
      >
        {entry.icon && <Icon name={entry.icon} className="h-[18px] w-[18px] shrink-0 text-[#676954]" />}
        {entry.label}
      </Link>
    );
  });
}

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [logoutError, setLogoutError] = useState("");
  const dropdownRef = useRef(null);
  const avatarButtonRef = useRef(null);

  const user = session?.user;
  const role = normalizeRole(user?.role);
  const roleLabel = role === "user" && !user?.role
    ? roleLabels.user
    : roleLabels[role] || roleLabels.user;
  const entries = roleMenus[role];
  const initial = user?.name?.trim()?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U";

  useEffect(() => {
    if (!isDropdownOpen) return undefined;

    const handlePointerDown = (event) => {
      if (!dropdownRef.current?.contains(event.target)) {
        setIsDropdownOpen(false);
      }
    };
    const handleKeyDown = (event) => {
      if (event.key === "Escape") {
        setIsDropdownOpen(false);
        avatarButtonRef.current?.focus();
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isDropdownOpen]);

  const closeMenus = () => {
    setIsDropdownOpen(false);
    setIsMobileOpen(false);
  };

  const handleLogout = async () => {
    setLogoutError("");
    try {
      const { error } = await authClient.signOut();
      if (error) {
        setLogoutError(error.message || "Unable to sign out. Please try again.");
        return;
      }
      closeMenus();
      router.replace("/");
    } catch (error) {
      setLogoutError(error?.message || "Unable to sign out. Please try again.");
    }
  };

  const isActive = (href) => href === "/" ? pathname === "/" : pathname.startsWith(href);
  const renderPublicLink = (item) => (
    <Link
      key={item.href}
      href={item.href}
      aria-current={isActive(item.href) ? "page" : undefined}
      onClick={closeMenus}
      className={`group relative flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35382D]/35 ${
        isActive(item.href)
          ? "bg-[#E7DDCE]/70 text-[#24241F]"
          : "text-[#55574A] hover:bg-[#E7DDCE]/50 hover:text-[#24241F]"
      }`}
    >
      <Icon name={item.icon} className="h-[18px] w-[18px] lg:hidden" />
      {item.label}
    </Link>
  );

  const renderProfile = (mobile = false) => (
    <div className={mobile ? "rounded-2xl border border-[#DDD6C9] bg-[#F8F6EF] p-3" : ""}>
      <div className="flex items-center gap-3 px-1 py-2">
        <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#E7DDCE] text-sm font-semibold text-[#35382D] ring-1 ring-[#DDD6C9]">
          {user?.image ? (
            <Image src={user.image} alt="" fill sizes="44px" unoptimized className="object-cover" />
          ) : (
            initial
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[#24241F]">{user?.name || "CodingHub member"}</p>
          <p className="truncate text-xs text-[#68695D]">{user?.email}</p>
        </div>
      </div>
      <div className="mt-1 flex items-center justify-between border-t border-[#DDD6C9] px-1 pt-2">
        <span className="text-[11px] font-medium uppercase tracking-[0.12em] text-[#747566]">Account role</span>
        <span className="rounded-full bg-[#E7DDCE]/75 px-2.5 py-1 text-xs font-medium text-[#35382D]">{roleLabel}</span>
      </div>
    </div>
  );

  const renderRoleEntries = () => (
    <>
      <MenuEntries entries={entries} onNavigate={closeMenus} />
      <button
        type="button"
        onClick={handleLogout}
        className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-medium text-[#8A433B] transition hover:bg-[#F4E8E4] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#8A433B]/35"
      >
        <Icon name="logout" className="h-[18px] w-[18px]" />
        Log out
      </button>
      {logoutError && <p role="alert" className="px-3 py-1 text-xs text-red-700">{logoutError}</p>}
    </>
  );

  return (
    <header className="sticky top-0 z-50 border-b border-[#DDD6C9]/90 bg-[#F8F6EF]/95 shadow-[0_4px_18px_rgba(36,36,31,0.04)] backdrop-blur-xl">
      <div className="mx-auto grid h-[72px] max-w-7xl grid-cols-[1fr_auto_1fr] items-center px-4 sm:px-6 lg:px-8">
        <Link
          href="/"
          onClick={closeMenus}
          className="group inline-flex w-fit items-center gap-2.5 rounded-lg text-[#24241F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35382D]/35"
          aria-label="CodingHub home"
        >
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-[#35382D] text-[#F8F6EF] shadow-sm transition group-hover:bg-[#24241F]">
            <Icon name="mark" className="h-[21px] w-[21px]" />
          </span>
          <span className="text-[18px] font-semibold tracking-[-0.055em] sm:text-xl">CodingHub</span>
        </Link>

        <nav aria-label="Primary navigation" className="hidden items-center gap-1 lg:flex">
          {publicLinks.map(renderPublicLink)}
        </nav>

        <div className="hidden items-center justify-self-end gap-2 lg:flex">
          {isPending ? (
            <div className="h-10 w-24 animate-pulse rounded-full bg-[#E7DDCE]" aria-label="Loading account" />
          ) : user ? (
            <div className="relative" ref={dropdownRef}>
              <button
                ref={avatarButtonRef}
                type="button"
                onClick={() => setIsDropdownOpen((open) => !open)}
                aria-label="Open account menu"
                aria-expanded={isDropdownOpen}
                aria-controls="account-navigation"
                className="flex items-center gap-2 rounded-full p-1 pr-2.5 transition hover:bg-[#E7DDCE]/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35382D]/35"
              >
                <span className="relative flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-[#E7DDCE] text-sm font-semibold text-[#35382D] ring-1 ring-[#DDD6C9]">
                  {user.image ? (
                    <Image src={user.image} alt="" fill sizes="36px" unoptimized className="object-cover" />
                  ) : initial}
                </span>
                <Icon name="chevron" className={`h-4 w-4 text-[#676954] transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
              </button>

              <div
                className={`absolute right-0 top-[calc(100%+12px)] w-[316px] origin-top-right rounded-2xl border border-[#DDD6C9] bg-[#F8F6EF] p-2.5 shadow-[0_18px_50px_rgba(36,36,31,0.14)] transition duration-150 ${
                  isDropdownOpen
                    ? "visible translate-y-0 scale-100 opacity-100"
                    : "invisible -translate-y-1 scale-[0.98] opacity-0"
                }`}
                id="account-navigation"
                aria-hidden={!isDropdownOpen}
                inert={!isDropdownOpen}
              >
                {renderProfile()}
                <div className="my-2 border-t border-[#DDD6C9]" />
                <nav aria-label="Account navigation" className="max-h-[min(60vh,520px)] space-y-0.5 overflow-y-auto">
                  {renderRoleEntries()}
                </nav>
              </div>
            </div>
          ) : (
            <>
              <Link
                href="/login"
                className="rounded-xl px-4 py-2.5 text-sm font-medium text-[#35382D] transition hover:bg-[#E7DDCE]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35382D]/35"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="rounded-xl bg-[#35382D] px-4 py-2.5 text-sm font-medium text-[#F8F6EF] shadow-sm transition hover:bg-[#24241F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35382D]/50 focus-visible:ring-offset-2 focus-visible:ring-offset-[#F8F6EF]"
              >
                Sign up
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setIsMobileOpen((open) => !open)}
          aria-label={isMobileOpen ? "Close navigation menu" : "Open navigation menu"}
          aria-expanded={isMobileOpen}
          aria-controls="mobile-navigation"
          className="col-start-3 flex h-10 w-10 items-center justify-center justify-self-end rounded-xl text-[#35382D] transition hover:bg-[#E7DDCE]/70 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35382D]/35 lg:hidden"
        >
          <Icon name={isMobileOpen ? "close" : "menu"} />
        </button>
      </div>

      <div
        id="mobile-navigation"
        className={`overflow-hidden border-t border-[#DDD6C9]/80 bg-[#F8F6EF] transition-[max-height,opacity] duration-200 lg:hidden ${
          isMobileOpen ? "max-h-[calc(100dvh-72px)] opacity-100" : "max-h-0 border-t-transparent opacity-0"
        }`}
        aria-hidden={!isMobileOpen}
        inert={!isMobileOpen}
      >
        <div className="mx-auto max-w-7xl space-y-3 overflow-y-auto px-4 py-4 sm:px-6">
          <nav aria-label="Mobile primary navigation" className="grid gap-1">
            {publicLinks.map(renderPublicLink)}
          </nav>

          {isPending ? (
            <div className="h-12 animate-pulse rounded-xl bg-[#E7DDCE]" aria-label="Loading account" />
          ) : user ? (
            <div className="space-y-2 border-t border-[#DDD6C9] pt-3">
              {renderProfile(true)}
              <div className="space-y-0.5">{renderRoleEntries()}</div>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2 border-t border-[#DDD6C9] pt-3">
              <Link
                href="/login"
                onClick={closeMenus}
                className="rounded-xl border border-[#DDD6C9] px-4 py-2.5 text-center text-sm font-medium text-[#35382D] transition hover:bg-[#E7DDCE]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35382D]/35"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                onClick={closeMenus}
                className="rounded-xl bg-[#35382D] px-4 py-2.5 text-center text-sm font-medium text-[#F8F6EF] transition hover:bg-[#24241F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35382D]/50"
              >
                Sign up
              </Link>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
