"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  banUser,
  getAllUsers,
  getSingleUser,
  getUserStats,
  unbanUser,
  updateUserRole,
} from "@/lib/api";

const userRoles = [
  { value: "president", label: "President", badge: "bg-[#EEE8D9] text-[#615338]" },
  { value: "pgpresident", label: "Programming Club President", badge: "bg-[#E8EEE4] text-[#465B3E]" },
  { value: "wbpresident", label: "Web Development Club President", badge: "bg-[#E6ECEE] text-[#455C64]" },
  { value: "user", label: "General User", badge: "bg-[#EEECE7] text-[#6C6A5F]" },
  { value: "banuser", label: "Banned User", badge: "bg-[#F4E8E4] text-[#8A433B]" },
];

const initialStats = {
  totalUsers: 0,
  president: 0,
  pgpresident: 0,
  wbpresident: 0,
  user: 0,
  banuser: 0,
};

const fieldClassName = "rounded-xl border border-[#DDD6C9] bg-[#F8F6EF] px-3.5 py-2.5 text-sm text-[#24241F] outline-none transition focus:border-[#35382D]/60 focus:ring-2 focus:ring-[#D8CCBA]";
const buttonClassName = "inline-flex items-center justify-center rounded-xl border border-[#DDD6C9] px-3 py-2 text-xs font-medium text-[#35382D] transition hover:bg-[#E7DDCE]/55 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35382D]/35 disabled:cursor-not-allowed disabled:opacity-50";

function getUserId(user) {
  return String(user?.id || user?._id || "");
}

function getRole(value) {
  return userRoles.find((role) => role.value === value) || userRoles[3];
}

function formatDate(value) {
  if (!value) return "Not available";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Not available"
    : new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
}

function UserAvatar({ user, size = "h-11 w-11" }) {
  const initial = user?.name?.trim()?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || "U";

  return (
    <span className={`relative inline-flex ${size} shrink-0 items-center justify-center overflow-hidden rounded-full bg-[#E7DDCE] text-sm font-semibold text-[#35382D] ring-1 ring-[#DDD6C9]`}>
      {user?.image ? (
        <Image src={user.image} alt="" fill sizes="44px" unoptimized className="object-cover" />
      ) : initial}
    </span>
  );
}

function RoleBadge({ role }) {
  const item = getRole(role);
  return (
    <span className={`inline-flex max-w-full rounded-full px-2.5 py-1 text-xs font-medium ${item.badge}`}>
      {item.label}
    </span>
  );
}

function Modal({ title, onClose, children, labelledBy }) {
  return (
    <div
      className="fixed inset-0 z-[80] flex items-center justify-center overflow-y-auto bg-[#24241F]/45 p-4 backdrop-blur-sm"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose();
      }}
    >
      <section
        role="dialog"
        aria-modal="true"
        aria-labelledby={labelledBy}
        className="my-auto w-full max-w-lg rounded-3xl border border-[#DDD6C9] bg-[#F8F6EF] p-5 shadow-[0_20px_70px_rgba(20,20,16,0.25)] sm:p-7"
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id={labelledBy} className="text-xl font-semibold tracking-tight text-[#24241F]">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close dialog" className="rounded-lg px-2 py-1 text-xl leading-none text-[#68695D] hover:bg-[#E7DDCE]/65">
            ×
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}

function UserActions({ user, busy, onView, onChangeRole, onToggleBan }) {
  const canBeBanned = user.role === "user" || user.role === "banuser";
  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" onClick={() => onView(user)} disabled={busy} className={buttonClassName}>View details</button>
      <button type="button" onClick={() => onChangeRole(user)} disabled={busy} className={buttonClassName}>Change role</button>
      {canBeBanned && (
        <button
          type="button"
          onClick={() => onToggleBan(user)}
          disabled={busy}
          className={`${buttonClassName} ${user.role === "banuser" ? "border-[#C6D0C1] text-[#465B3E]" : "border-[#E6CFC9] text-[#8A433B]"}`}
        >
          {user.role === "banuser" ? "Unban" : "Ban"}
        </button>
      )}
      {busy && <span role="status" className="self-center text-xs text-[#747566]">Saving...</span>}
    </div>
  );
}

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [stats, setStats] = useState(initialStats);
  const [totalUsers, setTotalUsers] = useState(0);
  const [listRefresh, setListRefresh] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [totalPages, setTotalPages] = useState(1);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [statsError, setStatsError] = useState("");
  const [actionError, setActionError] = useState("");
  const [notice, setNotice] = useState("");
  const [statsRefresh, setStatsRefresh] = useState(0);
  const [detailsUser, setDetailsUser] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState("");
  const [roleTarget, setRoleTarget] = useState(null);
  const [selectedRole, setSelectedRole] = useState("user");
  const [confirmRoleChange, setConfirmRoleChange] = useState(false);
  const [banTarget, setBanTarget] = useState(null);
  const [busyUserId, setBusyUserId] = useState("");
  const detailsRequest = useRef(0);

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(search.trim()), 250);
    return () => window.clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let isCurrent = true;
    const timer = window.setTimeout(() => {
      if (!isCurrent) return;
      setIsLoading(true);
      setLoadError("");

      getAllUsers({
        search: debouncedSearch,
        role: roleFilter,
        page: String(page),
        limit: String(pageSize),
      })
        .then((response) => {
          if (!response?.success || !Array.isArray(response.users)) {
            throw new Error(response?.message || "The user list could not be loaded.");
          }
          if (!isCurrent) return;
          const nextTotal = Number(response.totalUsers) || 0;
          const nextTotalPages = Math.max(1, Number(response.totalPages) || 0);
          setUsers(response.users);
          setTotalUsers(nextTotal);
          setTotalPages(nextTotalPages);
          if (Number(response.currentPage) > 0) setPage(Number(response.currentPage));
        })
        .catch((error) => {
          if (isCurrent) setLoadError(error?.message || "Unable to load users. Please try again.");
        })
        .finally(() => {
          if (isCurrent) setIsLoading(false);
        });
    }, 0);

    return () => {
      isCurrent = false;
      window.clearTimeout(timer);
    };
  }, [debouncedSearch, roleFilter, page, pageSize, listRefresh]);

  useEffect(() => {
    let isCurrent = true;
    getUserStats()
      .then((response) => {
        if (!response?.success || !response.statistics) {
          throw new Error(response?.message || "User statistics could not be loaded.");
        }
        if (isCurrent) {
          setStats({ ...initialStats, ...response.statistics });
          setStatsError("");
        }
      })
      .catch((error) => {
        if (isCurrent) setStatsError(error?.message || "Unable to load user statistics.");
      });
    return () => {
      isCurrent = false;
    };
  }, [statsRefresh]);

  useEffect(() => {
    if (!notice) return undefined;
    const timer = window.setTimeout(() => setNotice(""), 4000);
    return () => window.clearTimeout(timer);
  }, [notice]);

  const clearFilters = () => {
    setSearch("");
    setRoleFilter("all");
    setPage(1);
  };

  const handleViewDetails = async (user) => {
    const requestId = detailsRequest.current + 1;
    detailsRequest.current = requestId;
    setDetailsUser(user);
    setDetailsLoading(true);
    setDetailsError("");
    try {
      const response = await getSingleUser(getUserId(user));
      if (!response?.success || !response.user) {
        throw new Error(response?.message || "User details could not be loaded.");
      }
      if (detailsRequest.current === requestId) setDetailsUser(response.user);
    } catch (error) {
      if (detailsRequest.current === requestId) {
        setDetailsError(error?.message || "Unable to load user details.");
      }
    } finally {
      if (detailsRequest.current === requestId) setDetailsLoading(false);
    }
  };

  const closeDetails = () => {
    detailsRequest.current += 1;
    setDetailsUser(null);
    setDetailsLoading(false);
  };

  const openRoleEditor = (user) => {
    setActionError("");
    setRoleTarget(user);
    setSelectedRole(getRole(user.role).value);
    setConfirmRoleChange(false);
  };

  const updateListedRole = (id, previousRole, nextRole) => {
    if (roleFilter !== "all" && previousRole === roleFilter && nextRole !== roleFilter) {
      const nextTotal = Math.max(0, totalUsers - 1);
      const nextPages = Math.max(1, Math.ceil(nextTotal / pageSize));
      setUsers((current) => current.filter((user) => getUserId(user) !== id));
      setTotalUsers(nextTotal);
      setTotalPages(nextPages);
      if (page > nextPages) setPage(nextPages);
      return;
    }

    setUsers((current) => current.map((user) => getUserId(user) === id ? { ...user, role: nextRole } : user));
  };

  const saveRole = async () => {
    if (!roleTarget || !userRoles.some((role) => role.value === selectedRole)) return;
    const id = getUserId(roleTarget);
    setBusyUserId(id);
    setActionError("");
    try {
      const response = await updateUserRole(id, selectedRole);
      if (!response?.success) {
        throw new Error(response?.message || "Unable to update this user's role.");
      }
      updateListedRole(id, roleTarget.role, selectedRole);
      setNotice(response.message || `${roleTarget.name || "User"}'s role was updated.`);
      setRoleTarget(null);
      setConfirmRoleChange(false);
      setStatsRefresh((current) => current + 1);
    } catch (error) {
      setActionError(error?.message || "Unable to update this user's role.");
    } finally {
      setBusyUserId("");
    }
  };

  const toggleBan = async () => {
    if (!banTarget) return;
    const id = getUserId(banTarget);
    const isBanned = banTarget.role === "banuser";
    setBusyUserId(id);
    setActionError("");
    try {
      const response = isBanned ? await unbanUser(id) : await banUser(id);
      if (!response?.success) {
        throw new Error(response?.message || `Unable to ${isBanned ? "unban" : "ban"} this user.`);
      }
      const nextRole = isBanned ? "user" : "banuser";
      updateListedRole(id, banTarget.role, nextRole);
      setNotice(response.message || `${banTarget.name || "User"} was ${isBanned ? "unbanned" : "banned"}.`);
      setBanTarget(null);
      setStatsRefresh((current) => current + 1);
    } catch (error) {
      setActionError(error?.message || `Unable to ${isBanned ? "unban" : "ban"} this user.`);
    } finally {
      setBusyUserId("");
    }
  };

  const visibleRange = useMemo(() => {
    if (totalUsers === 0) return "0 users";
    const start = (page - 1) * pageSize + 1;
    const end = Math.min(page * pageSize, totalUsers);
    return `${start}–${end} of ${totalUsers}`;
  }, [page, pageSize, totalUsers]);

  const statCards = [
    { label: "Total users", value: stats.totalUsers },
    { label: "Presidents", value: stats.president },
    { label: "Programming club presidents", value: stats.pgpresident },
    { label: "Web development club presidents", value: stats.wbpresident },
    { label: "General users", value: stats.user },
    { label: "Banned users", value: stats.banuser },
  ];

  const renderUserActions = (user) => (
    <UserActions
      user={user}
      busy={busyUserId === getUserId(user)}
      onView={handleViewDetails}
      onChangeRole={openRoleEditor}
      onToggleBan={setBanTarget}
    />
  );

  return (
    <main className="flex-1 bg-[#F8F6EF] px-4 py-9 sm:px-6 sm:py-12 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#747566]">President · Community</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.045em] text-[#24241F] sm:text-4xl">Manage Users</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#68695D]">View and manage CodingHub members and their permissions.</p>
          </div>
          <div className="rounded-2xl border border-[#DDD6C9] bg-white/70 px-5 py-3 shadow-sm">
            <p className="text-xs font-medium uppercase tracking-wide text-[#747566]">Total registered users</p>
            <p className="mt-1 text-2xl font-semibold tracking-tight text-[#24241F]">{Number(stats.totalUsers) || 0}</p>
          </div>
        </header>

        {statsError && <p role="status" className="mt-5 rounded-xl border border-[#DDD6C9] bg-white/70 px-4 py-3 text-sm text-[#68695D]">{statsError}</p>}
        <section aria-label="User statistics" className="mt-7 grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
          {statCards.map((item) => (
            <article key={item.label} className="rounded-2xl border border-[#DDD6C9] bg-white/70 p-4 shadow-[0_6px_18px_rgba(36,36,31,0.025)]">
              <p className="min-h-8 text-xs leading-4 text-[#747566]">{item.label}</p>
              <p className="mt-2 text-2xl font-semibold tracking-tight text-[#24241F]">{Number(item.value) || 0}</p>
            </article>
          ))}
        </section>

        {notice && <p role="status" aria-live="polite" className="mt-5 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-800">{notice}</p>}
        {actionError && <p role="alert" className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{actionError}</p>}

        <section className="mt-7 rounded-3xl border border-[#DDD6C9] bg-white/65 p-4 shadow-[0_8px_24px_rgba(36,36,31,0.025)] sm:p-5">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-end">
            <div className="min-w-0 flex-1">
              <label htmlFor="user-search" className="mb-1.5 block text-xs font-medium text-[#55574A]">Search members</label>
              <input
                id="user-search"
                type="search"
                value={search}
                onChange={(event) => {
                  setSearch(event.target.value);
                  setPage(1);
                }}
                placeholder="Search by name or email..."
                className={`w-full ${fieldClassName}`}
              />
            </div>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div>
                <label htmlFor="user-role-filter" className="mb-1.5 block text-xs font-medium text-[#55574A]">Role</label>
                <select id="user-role-filter" value={roleFilter} onChange={(event) => {
                  setRoleFilter(event.target.value);
                  setPage(1);
                }} className={`w-full sm:min-w-52 ${fieldClassName}`}>
                  <option value="all">All roles</option>
                  {userRoles.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="user-page-size" className="mb-1.5 block text-xs font-medium text-[#55574A]">Rows per page</label>
                <select id="user-page-size" value={pageSize} onChange={(event) => {
                  setPageSize(Number(event.target.value));
                  setPage(1);
                }} className={fieldClassName}>
                  {[10, 25, 50].map((size) => <option key={size} value={size}>{size}</option>)}
                </select>
              </div>
              <button type="button" onClick={clearFilters} disabled={!search && roleFilter === "all"} className={`${buttonClassName} h-[42px] px-4`}>
                Clear filters
              </button>
            </div>
          </div>
        </section>

        {loadError ? (
          <section className="mt-6 rounded-3xl border border-red-200 bg-red-50 p-6">
            <p role="alert" className="text-sm text-red-800">{loadError}</p>
            <button type="button" onClick={() => {
              setLoadError("");
              setListRefresh((current) => current + 1);
            }} className="mt-3 rounded-lg px-2 py-1 text-sm font-semibold text-red-900 underline underline-offset-4">Try again</button>
          </section>
        ) : isLoading ? (
          <div className="mt-6 grid gap-3" role="status" aria-label="Loading users">
            {[0, 1, 2].map((item) => <div key={item} className="h-20 animate-pulse rounded-2xl border border-[#DDD6C9] bg-white/70" />)}
          </div>
        ) : users.length === 0 ? (
          <section className="mt-6 rounded-3xl border border-dashed border-[#CFC8B9] bg-white/45 px-6 py-14 text-center">
            <h2 className="text-lg font-semibold text-[#35382D]">{search || roleFilter !== "all" ? "No matching users" : "No users found"}</h2>
            <p className="mt-2 text-sm text-[#68695D]">{search || roleFilter !== "all" ? "Try a different search or clear the selected filters." : "Registered users will appear here."}</p>
          </section>
        ) : (
          <section className="mt-6">
            <div className="hidden overflow-hidden rounded-3xl border border-[#DDD6C9] bg-white/70 shadow-[0_8px_24px_rgba(36,36,31,0.025)] md:block">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[880px] text-left">
                  <thead className="border-b border-[#E8E3D9] bg-[#F3F0E8] text-xs font-semibold uppercase tracking-wide text-[#747566]">
                    <tr>
                      <th scope="col" className="px-5 py-4">User</th>
                      <th scope="col" className="px-5 py-4">Current role</th>
                      <th scope="col" className="px-5 py-4">Email verification</th>
                      <th scope="col" className="px-5 py-4">Joined</th>
                      <th scope="col" className="px-5 py-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E3D9]">
                    {users.map((user) => (
                      <tr key={getUserId(user)} className="align-top">
                        <td className="px-5 py-4">
                          <div className="flex min-w-56 items-center gap-3">
                            <UserAvatar user={user} />
                            <div className="min-w-0">
                              <p className="truncate text-sm font-semibold text-[#24241F]">{user.name || "Unnamed user"}</p>
                              <p className="mt-0.5 truncate text-xs text-[#68695D]">{user.email || "No email available"}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4"><RoleBadge role={user.role} /></td>
                        <td className="px-5 py-4">
                          <span className={`text-xs font-medium ${user.emailVerified ? "text-[#465B3E]" : "text-[#747566]"}`}>
                            {user.emailVerified ? "Verified" : "Not verified"}
                          </span>
                        </td>
                        <td className="whitespace-nowrap px-5 py-4 text-xs text-[#55574A]">{formatDate(user.createdAt)}</td>
                        <td className="max-w-[360px] px-5 py-4">{renderUserActions(user)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid gap-3 md:hidden">
              {users.map((user) => (
                <article key={getUserId(user)} className="rounded-2xl border border-[#DDD6C9] bg-white/70 p-4 shadow-[0_6px_18px_rgba(36,36,31,0.025)]">
                  <div className="flex items-start gap-3">
                    <UserAvatar user={user} />
                    <div className="min-w-0 flex-1">
                      <p className="break-words text-sm font-semibold text-[#24241F]">{user.name || "Unnamed user"}</p>
                      <p className="mt-0.5 break-all text-xs text-[#68695D]">{user.email || "No email available"}</p>
                      <div className="mt-2"><RoleBadge role={user.role} /></div>
                    </div>
                  </div>
                  <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 border-t border-[#E8E3D9] pt-3 text-xs text-[#68695D]">
                    <span>{user.emailVerified ? "Email verified" : "Email not verified"}</span>
                    <span>Joined {formatDate(user.createdAt)}</span>
                  </div>
                  <div className="mt-3">{renderUserActions(user)}</div>
                </article>
              ))}
            </div>
          </section>
        )}

        {!loadError && (
          <footer className="mt-5 flex flex-col gap-3 text-sm text-[#68695D] sm:flex-row sm:items-center sm:justify-between">
            <p>{visibleRange}</p>
            <nav aria-label="User pagination" className="flex items-center gap-2">
              <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1 || isLoading} className={buttonClassName}>Previous</button>
              <span className="min-w-24 text-center text-xs">Page {page} of {totalPages}</span>
              <button type="button" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page >= totalPages || isLoading} className={buttonClassName}>Next</button>
            </nav>
          </footer>
        )}
      </div>

      {detailsUser && (
        <Modal title="User details" labelledBy="user-details-title" onClose={closeDetails}>
          <div className="mt-5 flex items-center gap-4">
            <UserAvatar user={detailsUser} size="h-16 w-16" />
            <div className="min-w-0">
              <p className="break-words text-lg font-semibold text-[#24241F]">{detailsUser.name || "Unnamed user"}</p>
              <p className="break-all text-sm text-[#68695D]">{detailsUser.email || "No email available"}</p>
            </div>
          </div>
          {detailsLoading && <p role="status" className="mt-4 text-sm text-[#68695D]">Loading user information...</p>}
          {detailsError && <p role="alert" className="mt-4 text-sm text-red-800">{detailsError}</p>}
          <dl className="mt-5 grid gap-3 rounded-2xl border border-[#DDD6C9] bg-white/60 p-4 text-sm sm:grid-cols-2">
            <div><dt className="text-xs text-[#747566]">Current role</dt><dd className="mt-1"><RoleBadge role={detailsUser.role} /></dd></div>
            <div><dt className="text-xs text-[#747566]">Email verification</dt><dd className="mt-1 font-medium text-[#35382D]">{detailsUser.emailVerified ? "Verified" : "Not verified"}</dd></div>
            <div><dt className="text-xs text-[#747566]">Registration date</dt><dd className="mt-1 font-medium text-[#35382D]">{formatDate(detailsUser.createdAt)}</dd></div>
            <div><dt className="text-xs text-[#747566]">Last profile update</dt><dd className="mt-1 font-medium text-[#35382D]">{formatDate(detailsUser.updatedAt)}</dd></div>
          </dl>
          <p className="mt-3 text-xs leading-5 text-[#747566]">Authentication credentials and session information are not shown.</p>
        </Modal>
      )}

      {roleTarget && (
        <Modal title={confirmRoleChange ? "Confirm role change" : "Change user role"} labelledBy="change-user-role-title" onClose={() => {
          if (!busyUserId) {
            setRoleTarget(null);
            setConfirmRoleChange(false);
          }
        }}>
          <p className="mt-3 text-sm text-[#68695D]">{roleTarget.name || "This user"} · {roleTarget.email || "No email available"}</p>
          {!confirmRoleChange ? (
            <>
              <label htmlFor="new-user-role" className="mt-5 block text-xs font-medium text-[#55574A]">New role</label>
              <select id="new-user-role" value={selectedRole} onChange={(event) => setSelectedRole(event.target.value)} className={`mt-1.5 w-full ${fieldClassName}`}>
                {userRoles.map((role) => <option key={role.value} value={role.value}>{role.label}</option>)}
              </select>
              <div className="mt-6 flex justify-end gap-2">
                <button type="button" onClick={() => setRoleTarget(null)} disabled={Boolean(busyUserId)} className={buttonClassName}>Cancel</button>
                <button type="button" onClick={() => setConfirmRoleChange(true)} disabled={selectedRole === getRole(roleTarget.role).value} className="rounded-xl bg-[#35382D] px-4 py-2.5 text-sm font-medium text-[#F8F6EF] transition hover:bg-[#24241F] disabled:cursor-not-allowed disabled:opacity-50">Continue</button>
              </div>
            </>
          ) : (
            <>
              <p className="mt-5 rounded-2xl border border-[#DDD6C9] bg-white/60 p-4 text-sm leading-6 text-[#55574A]">
                Change this user from <strong>{getRole(roleTarget.role).label}</strong> to <strong>{getRole(selectedRole).label}</strong>?
              </p>
              <div className="mt-6 flex justify-end gap-2">
                <button type="button" onClick={() => setConfirmRoleChange(false)} disabled={Boolean(busyUserId)} className={buttonClassName}>Back</button>
                <button type="button" onClick={saveRole} disabled={Boolean(busyUserId)} className="rounded-xl bg-[#35382D] px-4 py-2.5 text-sm font-medium text-[#F8F6EF] transition hover:bg-[#24241F] disabled:cursor-not-allowed disabled:opacity-50">
                  {busyUserId ? "Saving..." : "Confirm change"}
                </button>
              </div>
            </>
          )}
        </Modal>
      )}

      {banTarget && (
        <Modal title={banTarget.role === "banuser" ? "Unban this user?" : "Ban this user?"} labelledBy="ban-user-confirm-title" onClose={() => {
          if (!busyUserId) setBanTarget(null);
        }}>
          <p className="mt-3 text-sm leading-6 text-[#68695D]">
            {banTarget.role === "banuser"
              ? `Restore ${banTarget.name || "this user"} to the General User role?`
              : `Assign ${banTarget.name || "this user"} the Banned User role?`}
          </p>
          <div className="mt-6 flex justify-end gap-2">
            <button type="button" onClick={() => setBanTarget(null)} disabled={Boolean(busyUserId)} className={buttonClassName}>Cancel</button>
            <button
              type="button"
              onClick={toggleBan}
              disabled={Boolean(busyUserId)}
              className={`rounded-xl px-4 py-2.5 text-sm font-medium text-white transition disabled:cursor-not-allowed disabled:opacity-50 ${banTarget.role === "banuser" ? "bg-[#465B3E] hover:bg-[#384A32]" : "bg-[#8A433B] hover:bg-[#71372F]"}`}
            >
              {busyUserId ? "Saving..." : banTarget.role === "banuser" ? "Confirm unban" : "Confirm ban"}
            </button>
          </div>
        </Modal>
      )}
    </main>
  );
}
