export const inputClassName = "w-full rounded-xl border border-[#DDD6C9] bg-[#F8F6EF] px-3.5 py-3 text-sm text-[#24241F] outline-none transition placeholder:text-[#8A8B7F] focus:border-[#35382D]/60 focus:ring-2 focus:ring-[#D8CCBA]";
export const secondaryButtonClassName = "inline-flex items-center justify-center rounded-xl border border-[#DDD6C9] px-4 py-2.5 text-sm font-medium text-[#35382D] transition hover:bg-[#E7DDCE]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35382D]/35 disabled:cursor-not-allowed disabled:opacity-55";
export const primaryButtonClassName = "inline-flex items-center justify-center rounded-xl bg-[#35382D] px-4 py-2.5 text-sm font-medium text-[#F8F6EF] shadow-sm transition hover:bg-[#24241F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35382D]/45 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-55";

export function formatDate(value, options = { dateStyle: "medium" }) {
  if (!value) return "Not available";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Not available"
    : new Intl.DateTimeFormat(undefined, options).format(date);
}

export function safeExternalUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : "";
  } catch {
    return "";
  }
}

export function toDateTimeInput(value) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  const localDate = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return localDate.toISOString().slice(0, 16);
}

export async function fetchAllPages(fetchPage, label) {
  const first = await fetchPage({ page: "1", limit: "50" });
  if (!first?.success || !Array.isArray(first.data)) {
    throw new Error(first?.message || `${label} could not be loaded.`);
  }

  const totalPages = Math.max(1, Number(first.pagination?.totalPages) || 1);
  const remaining = await Promise.all(
    Array.from({ length: totalPages - 1 }, (_, index) => fetchPage({
      page: String(index + 2),
      limit: "50",
    })),
  );
  const records = [...first.data];
  for (const response of remaining) {
    if (!response?.success || !Array.isArray(response.data)) {
      throw new Error(response?.message || `${label} could not be loaded.`);
    }
    records.push(...response.data);
  }
  return records;
}

export function Modal({ title, titleId, onClose, children, size = "max-w-xl" }) {
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
        aria-labelledby={titleId}
        className={`my-auto w-full ${size} rounded-3xl border border-[#DDD6C9] bg-[#F8F6EF] p-5 shadow-[0_20px_70px_rgba(20,20,16,0.25)] sm:p-7`}
      >
        <div className="flex items-start justify-between gap-4">
          <h2 id={titleId} className="text-xl font-semibold tracking-tight text-[#24241F]">{title}</h2>
          <button type="button" onClick={onClose} aria-label="Close dialog" className="rounded-lg px-2 py-1 text-xl leading-none text-[#68695D] hover:bg-[#E7DDCE]/65">
            ×
          </button>
        </div>
        {children}
      </section>
    </div>
  );
}
