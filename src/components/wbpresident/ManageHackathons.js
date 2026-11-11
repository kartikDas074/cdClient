"use client";

import Image from "next/image";
import { useEffect, useMemo, useRef, useState } from "react";
import {
  createWebHackathon,
  deleteWebHackathon,
  getAllWebHackathons,
  getWebHackathonById,
  updateWebHackathon,
} from "@/lib/api";
import {
  fetchAllPages,
  formatDate,
  inputClassName,
  Modal,
  primaryButtonClassName,
  safeExternalUrl,
  secondaryButtonClassName,
  toDateTimeInput,
} from "./management-ui";

const blankHackathon = () => ({
  title: "",
  shortDescription: "",
  fullDescription: "",
  bannerImage: "",
  theme: "",
  contactEmail: "",
  registration: {
    link: "",
    deadline: "",
    fee: "0",
    eligibility: "",
    minTeamSize: "1",
    maxTeamSize: "4",
    maxParticipants: "",
    status: "upcoming",
  },
  timeline: {
    startDate: "",
    endDate: "",
    ideaSubmissionDeadline: "",
    finalSubmissionDeadline: "",
    judgingDate: "",
    resultDate: "",
  },
  mode: "online",
  venue: "",
  prizes: [],
  judgingCriteria: [],
  rules: [],
});

function getId(item) {
  return String(item?._id || item?.id || "");
}

function toForm(item) {
  const form = blankHackathon();
  return {
    ...form,
    title: item.title || "",
    shortDescription: item.shortDescription || "",
    fullDescription: item.fullDescription || "",
    bannerImage: item.bannerImage || "",
    theme: item.theme || "",
    contactEmail: item.contactEmail || "",
    registration: {
      ...form.registration,
      ...(item.registration || {}),
      deadline: toDateTimeInput(item.registration?.deadline),
      fee: String(item.registration?.fee ?? 0),
      minTeamSize: String(item.registration?.minTeamSize ?? 1),
      maxTeamSize: String(item.registration?.maxTeamSize ?? 4),
      maxParticipants: item.registration?.maxParticipants == null ? "" : String(item.registration.maxParticipants),
      status: item.registration?.status || "upcoming",
    },
    timeline: {
      ...form.timeline,
      ...(item.timeline || {}),
      startDate: toDateTimeInput(item.timeline?.startDate),
      endDate: toDateTimeInput(item.timeline?.endDate),
      ideaSubmissionDeadline: toDateTimeInput(item.timeline?.ideaSubmissionDeadline),
      finalSubmissionDeadline: toDateTimeInput(item.timeline?.finalSubmissionDeadline),
      judgingDate: toDateTimeInput(item.timeline?.judgingDate),
      resultDate: toDateTimeInput(item.timeline?.resultDate),
    },
    mode: item.mode || "online",
    venue: item.venue || "",
    prizes: Array.isArray(item.prizes) ? item.prizes.map((prize) => ({
      position: prize.position || "",
      title: prize.title || "",
      description: prize.description || "",
    })) : [],
    judgingCriteria: Array.isArray(item.judgingCriteria) ? item.judgingCriteria.map((criterion) => ({
      name: criterion.name || "",
      weight: String(criterion.weight ?? ""),
    })) : [],
    rules: Array.isArray(item.rules) ? [...item.rules] : [],
  };
}

function validate(form) {
  const errors = {};
  if (!form.title.trim()) errors.title = "Hackathon title is required.";
  if (!form.shortDescription.trim()) errors.shortDescription = "Short description is required.";
  if (!form.fullDescription.trim()) errors.fullDescription = "Full description is required.";
  if (!form.theme.trim()) errors.theme = "Theme is required.";
  if (!form.registration.link.trim() || !safeExternalUrl(form.registration.link.trim())) errors.registrationLink = "Enter a valid HTTP or HTTPS registration URL.";
  if (!form.registration.deadline || Number.isNaN(new Date(form.registration.deadline).getTime())) errors.registrationDeadline = "A valid registration deadline is required.";
  if (!form.timeline.startDate || Number.isNaN(new Date(form.timeline.startDate).getTime())) errors.startDate = "A valid start date is required.";
  if (!form.timeline.endDate || Number.isNaN(new Date(form.timeline.endDate).getTime())) errors.endDate = "A valid end date is required.";
  if (form.timeline.startDate && form.timeline.endDate && new Date(form.timeline.endDate) < new Date(form.timeline.startDate)) errors.endDate = "End date cannot be before start date.";
  if (form.contactEmail.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.contactEmail.trim())) errors.contactEmail = "Enter a valid email address.";
  const minTeam = Number(form.registration.minTeamSize);
  const maxTeam = Number(form.registration.maxTeamSize);
  if (!Number.isInteger(minTeam) || minTeam < 1) errors.minTeamSize = "Minimum team size must be at least 1.";
  if (!Number.isInteger(maxTeam) || maxTeam < minTeam) errors.maxTeamSize = "Maximum team size must be at least the minimum.";
  const fee = Number(form.registration.fee);
  if (!Number.isFinite(fee) || fee < 0) errors.fee = "Fee must be zero or a positive amount.";
  if (form.registration.maxParticipants && (!Number.isInteger(Number(form.registration.maxParticipants)) || Number(form.registration.maxParticipants) < 1)) errors.maxParticipants = "Maximum participants must be a positive whole number.";
  if (form.bannerImage.trim() && !safeExternalUrl(form.bannerImage.trim())) errors.bannerImage = "Banner image must be a valid HTTP or HTTPS URL.";
  const validPrizes = form.prizes.filter((prize) => prize.position.trim() || prize.title.trim() || prize.description.trim());
  if (validPrizes.some((prize) => !prize.position.trim() || !prize.title.trim())) errors.prizes = "Each prize needs a position and title.";
  const criteria = form.judgingCriteria.filter((item) => item.name.trim() || item.weight !== "");
  if (criteria.some((item) => !item.name.trim() || !Number.isFinite(Number(item.weight)) || Number(item.weight) < 0)) errors.criteria = "Each judging criterion needs a name and a non-negative weight.";
  const weightTotal = criteria.reduce((sum, item) => sum + Number(item.weight || 0), 0);
  if (criteria.length && Math.abs(weightTotal - 100) > 0.001) errors.criteria = `Judging criteria weights must total 100% (currently ${weightTotal}%).`;
  if (form.rules.some((rule) => !rule.trim())) errors.rules = "Rules cannot be blank.";
  return errors;
}

function HackathonForm({ form, setForm, onSubmit, onCancel, errors, requestError, isSaving }) {
  const setRoot = (name, value) => setForm((current) => ({ ...current, [name]: value }));
  const setNested = (group, name, value) => setForm((current) => ({ ...current, [group]: { ...current[group], [name]: value } }));
  const updateRows = (key, index, field, value) => setForm((current) => ({
    ...current,
    [key]: current[key].map((row, rowIndex) => rowIndex === index
      ? (typeof row === "string" ? value : { ...row, [field]: value })
      : row),
  }));
  const addRow = (key, row) => setForm((current) => ({ ...current, [key]: [...current[key], row] }));
  const removeRow = (key, index) => setForm((current) => ({ ...current, [key]: current[key].filter((_, rowIndex) => rowIndex !== index) }));

  const field = (name, label, value, onChange, options = {}) => (
    <div key={name}>
      <label htmlFor={`hackathon-${name}`} className="mb-1.5 block text-sm font-medium text-[#35382D]">{label}{options.required && <> <span aria-hidden="true">*</span></>}</label>
      {options.textarea ? (
        <textarea id={`hackathon-${name}`} value={value} onChange={(event) => onChange(event.target.value)} disabled={isSaving} rows={options.rows || 3} maxLength={options.maxLength || 4000} placeholder={options.placeholder || ""} aria-invalid={Boolean(options.error)} className={`${inputClassName} resize-y ${options.error ? "border-red-300" : ""}`} />
      ) : (
        <input id={`hackathon-${name}`} type={options.type || "text"} value={value} onChange={(event) => onChange(event.target.value)} disabled={isSaving} min={options.min} max={options.max} step={options.step} placeholder={options.placeholder || ""} aria-invalid={Boolean(options.error)} className={`${inputClassName} ${options.error ? "border-red-300" : ""}`} />
      )}
      {options.error && <p className="mt-1.5 text-xs text-red-700">{options.error}</p>}
    </div>
  );
  const section = (title, content) => (
    <section className="space-y-4 border-t border-[#E8E3D9] pt-5">
      <h3 className="text-sm font-semibold uppercase tracking-wide text-[#55574A]">{title}</h3>
      {content}
    </section>
  );

  return (
    <form onSubmit={onSubmit} noValidate className="mt-5 max-h-[75vh] space-y-5 overflow-y-auto pr-1">
      {requestError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{requestError}</p>}
      {section("General Information", <>
        {field("title", "Title", form.title, (value) => setRoot("title", value), { required: true, error: errors.title, placeholder: "e.g. CodingHub Web Hackathon" })}
        <div className="grid gap-4 sm:grid-cols-2">
          {field("theme", "Theme", form.theme, (value) => setRoot("theme", value), { required: true, error: errors.theme, placeholder: "e.g. Build for a better future" })}
          {field("contactEmail", "Contact email", form.contactEmail, (value) => setRoot("contactEmail", value), { type: "email", error: errors.contactEmail, placeholder: "team@example.com" })}
        </div>
        {field("shortDescription", "Short description", form.shortDescription, (value) => setRoot("shortDescription", value), { required: true, error: errors.shortDescription, textarea: true, rows: 2, maxLength: 300, placeholder: "A brief introduction for the listing." })}
        {field("fullDescription", "Full description", form.fullDescription, (value) => setRoot("fullDescription", value), { required: true, error: errors.fullDescription, textarea: true, rows: 4, placeholder: "Describe the event, goals, and what participants can expect." })}
        {field("bannerImage", "Banner image URL (optional)", form.bannerImage, (value) => setRoot("bannerImage", value), { error: errors.bannerImage, placeholder: "https://example.com/banner.jpg" })}
      </>)}

      {section("Registration", <>
        {field("registration-link", "Registration URL", form.registration.link, (value) => setNested("registration", "link", value), { required: true, error: errors.registrationLink, type: "url", placeholder: "https://example.com/register" })}
        {field("registration-deadline", "Registration deadline", form.registration.deadline, (value) => setNested("registration", "deadline", value), { required: true, error: errors.registrationDeadline, type: "datetime-local" })}
        <div className="grid gap-4 sm:grid-cols-2">
          {field("registration-fee", "Fee", form.registration.fee, (value) => setNested("registration", "fee", value), { type: "number", min: "0", step: "0.01", error: errors.fee })}
          <div>
            <label htmlFor="hackathon-registration-status" className="mb-1.5 block text-sm font-medium text-[#35382D]">Registration status</label>
            <select id="hackathon-registration-status" value={form.registration.status} onChange={(event) => setNested("registration", "status", event.target.value)} disabled={isSaving} className={inputClassName}>
              <option value="upcoming">Upcoming</option><option value="open">Open</option><option value="closed">Closed</option>
            </select>
          </div>
        </div>
        {field("eligibility", "Eligibility", form.registration.eligibility, (value) => setNested("registration", "eligibility", value), { placeholder: "e.g. University students" })}
        <div className="grid gap-4 sm:grid-cols-3">
          {field("min-team", "Minimum team size", form.registration.minTeamSize, (value) => setNested("registration", "minTeamSize", value), { type: "number", min: "1", error: errors.minTeamSize })}
          {field("max-team", "Maximum team size", form.registration.maxTeamSize, (value) => setNested("registration", "maxTeamSize", value), { type: "number", min: "1", error: errors.maxTeamSize })}
          {field("max-participants", "Maximum participants", form.registration.maxParticipants, (value) => setNested("registration", "maxParticipants", value), { type: "number", min: "1", error: errors.maxParticipants, placeholder: "No limit" })}
        </div>
      </>)}

      {section("Timeline", <>
        <div className="grid gap-4 sm:grid-cols-2">
          {field("start-date", "Event start", form.timeline.startDate, (value) => setNested("timeline", "startDate", value), { required: true, type: "datetime-local", error: errors.startDate })}
          {field("end-date", "Event end", form.timeline.endDate, (value) => setNested("timeline", "endDate", value), { required: true, type: "datetime-local", error: errors.endDate })}
          {field("idea-deadline", "Idea submission deadline", form.timeline.ideaSubmissionDeadline, (value) => setNested("timeline", "ideaSubmissionDeadline", value), { type: "datetime-local" })}
          {field("final-deadline", "Final submission deadline", form.timeline.finalSubmissionDeadline, (value) => setNested("timeline", "finalSubmissionDeadline", value), { type: "datetime-local" })}
          {field("judging-date", "Judging date", form.timeline.judgingDate, (value) => setNested("timeline", "judgingDate", value), { type: "datetime-local" })}
          {field("result-date", "Result date", form.timeline.resultDate, (value) => setNested("timeline", "resultDate", value), { type: "datetime-local" })}
        </div>
      </>)}

      {section("Event Details", <>
        <div className="grid gap-4 sm:grid-cols-2">
          <div><label htmlFor="hackathon-mode" className="mb-1.5 block text-sm font-medium text-[#35382D]">Mode</label><select id="hackathon-mode" value={form.mode} onChange={(event) => setRoot("mode", event.target.value)} disabled={isSaving} className={inputClassName}><option value="online">Online</option><option value="offline">Offline</option><option value="hybrid">Hybrid</option></select></div>
          {field("venue", "Venue", form.venue, (value) => setRoot("venue", value), { placeholder: "Venue for offline or hybrid events" })}
        </div>
      </>)}

      {section("Prizes", <>
        {errors.prizes && <p role="alert" className="text-xs text-red-700">{errors.prizes}</p>}
        {form.prizes.map((prize, index) => <div key={`prize-${index}`} className="rounded-2xl border border-[#DDD6C9] bg-white/50 p-3">
          <div className="grid gap-3 sm:grid-cols-2">
            {field(`prize-position-${index}`, "Position", prize.position, (value) => updateRows("prizes", index, "position", value), { placeholder: "1st place" })}
            {field(`prize-title-${index}`, "Prize", prize.title, (value) => updateRows("prizes", index, "title", value), { placeholder: "Cash prize" })}
          </div>
          <div className="mt-3">{field(`prize-description-${index}`, "Description (optional)", prize.description, (value) => updateRows("prizes", index, "description", value), { placeholder: "Additional prize details" })}</div>
          <button type="button" disabled={isSaving} onClick={() => removeRow("prizes", index)} className="mt-2 text-xs font-medium text-[#8A433B] underline underline-offset-4">Remove prize</button>
        </div>)}
        <button type="button" disabled={isSaving} onClick={() => addRow("prizes", { position: "", title: "", description: "" })} className={secondaryButtonClassName}>+ Add prize</button>
      </>)}

      {section("Judging Criteria", <>
        {errors.criteria && <p role="alert" className="text-xs text-red-700">{errors.criteria}</p>}
        {form.judgingCriteria.map((criterion, index) => <div key={`criteria-${index}`} className="flex flex-col gap-2 sm:flex-row sm:items-end">
          <div className="flex-1">{field(`criterion-name-${index}`, "Criterion", criterion.name, (value) => updateRows("judgingCriteria", index, "name", value), { placeholder: "Innovation" })}</div>
          <div className="sm:w-32">{field(`criterion-weight-${index}`, "Weight (%)", criterion.weight, (value) => updateRows("judgingCriteria", index, "weight", value), { type: "number", min: "0", max: "100", step: "0.1" })}</div>
          <button type="button" disabled={isSaving} onClick={() => removeRow("judgingCriteria", index)} className="mb-1 text-xs font-medium text-[#8A433B] underline underline-offset-4">Remove</button>
        </div>)}
        <button type="button" disabled={isSaving} onClick={() => addRow("judgingCriteria", { name: "", weight: "" })} className={secondaryButtonClassName}>+ Add criterion</button>
      </>)}

      {section("Rules", <>
        {errors.rules && <p role="alert" className="text-xs text-red-700">{errors.rules}</p>}
        {form.rules.map((rule, index) => <div key={`rule-${index}`} className="flex items-center gap-2">
          <div className="flex-1">{field(`rule-${index}`, `Rule ${index + 1}`, rule, (value) => updateRows("rules", index, "", value), { placeholder: "Enter a participant rule" })}</div>
          <button type="button" disabled={isSaving} onClick={() => removeRow("rules", index)} className="mt-6 text-xs font-medium text-[#8A433B] underline underline-offset-4">Remove</button>
        </div>)}
        <button type="button" disabled={isSaving} onClick={() => addRow("rules", "")} className={secondaryButtonClassName}>+ Add rule</button>
      </>)}

      <div className="sticky bottom-0 flex flex-col-reverse gap-2 border-t border-[#E8E3D9] bg-[#F8F6EF] py-4 sm:flex-row sm:justify-end">
        <button type="button" onClick={onCancel} disabled={isSaving} className={secondaryButtonClassName}>Cancel</button>
        <button type="submit" disabled={isSaving} className={primaryButtonClassName}>{isSaving ? "Saving..." : "Save hackathon"}</button>
      </div>
    </form>
  );
}

function StatusBadge({ children, tone = "neutral" }) {
  const tones = {
    neutral: "bg-[#EEECE7] text-[#6C6A5F]",
    open: "bg-[#E8EEE4] text-[#465B3E]",
    closed: "bg-[#F4E8E4] text-[#8A433B]",
  };
  return <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${tones[tone]}`}>{children}</span>;
}

function Actions({ item, onView, onEdit, onDelete, disabled }) {
  return <div className="flex flex-wrap gap-2">
    <button type="button" onClick={() => onView(item)} disabled={disabled} className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#35382D] underline decoration-[#B6B19F] underline-offset-4 hover:bg-[#E7DDCE]/55 disabled:opacity-50">View</button>
    <button type="button" onClick={() => onEdit(item)} disabled={disabled} className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#35382D] underline decoration-[#B6B19F] underline-offset-4 hover:bg-[#E7DDCE]/55 disabled:opacity-50">Edit</button>
    <button type="button" onClick={() => onDelete(item)} disabled={disabled} className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#8A433B] underline decoration-[#D7B3AA] underline-offset-4 hover:bg-[#F4E8E4] disabled:opacity-50">Delete</button>
  </div>;
}

export default function ManageHackathons() {
  const [hackathons, setHackathons] = useState([]);
  const [recentCutoff, setRecentCutoff] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [registrationFilter, setRegistrationFilter] = useState("all");
  const [modeFilter, setModeFilter] = useState("all");
  const [listVersion, setListVersion] = useState(0);
  const [editor, setEditor] = useState(null);
  const [form, setForm] = useState(blankHackathon);
  const [formErrors, setFormErrors] = useState({});
  const [requestError, setRequestError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [details, setDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [detailsError, setDetailsError] = useState("");
  const [toast, setToast] = useState("");
  const [toastIsError, setToastIsError] = useState(false);
  const mutationLock = useRef(false);
  const detailsRequest = useRef(0);

  useEffect(() => {
    let active = true;
    const timer = window.setTimeout(() => {
      setIsLoading(true);
      setLoadError("");
      fetchAllPages(getAllWebHackathons, "Hackathons")
        .then((items) => {
          if (active) {
            setHackathons(items);
            setRecentCutoff(Date.now() - 30 * 24 * 60 * 60 * 1000);
          }
        })
        .catch((error) => {
          if (active) setLoadError(error?.message || "Unable to load hackathons. Please try again.");
        })
        .finally(() => {
          if (active) setIsLoading(false);
        });
    }, 0);
    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [listVersion]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(""), 4000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return hackathons.filter((item) => {
      const matchesSearch = !query
        || item.title?.toLowerCase().includes(query)
        || item.shortDescription?.toLowerCase().includes(query)
        || item.theme?.toLowerCase().includes(query);
      const matchesRegistration = registrationFilter === "all" || item.registration?.status === registrationFilter;
      const matchesMode = modeFilter === "all" || item.mode === modeFilter;
      return matchesSearch && matchesRegistration && matchesMode;
    });
  }, [hackathons, search, registrationFilter, modeFilter]);
  const recentCount = useMemo(() => hackathons.filter((item) => {
    const created = new Date(item.createdAt).getTime();
    return recentCutoff > 0 && Number.isFinite(created) && created >= recentCutoff;
  }).length, [hackathons, recentCutoff]);
  const now = recentCutoff + 30 * 24 * 60 * 60 * 1000;
  const upcomingCount = hackathons.filter((item) => new Date(item.timeline?.startDate).getTime() >= now).length;
  const openCount = hackathons.filter((item) => item.registration?.status === "open").length;
  const closedCount = hackathons.filter((item) => item.registration?.status === "closed").length;

  const openCreate = () => {
    setEditor({ mode: "create", item: null });
    setForm(blankHackathon());
    setFormErrors({});
    setRequestError("");
  };
  const openEdit = (item) => {
    setEditor({ mode: "edit", item });
    setForm(toForm(item));
    setFormErrors({});
    setRequestError("");
  };
  const openDetails = async (item) => {
    const requestId = detailsRequest.current + 1;
    detailsRequest.current = requestId;
    setDetails(item);
    setDetailsLoading(true);
    setDetailsError("");
    try {
      const response = await getWebHackathonById(getId(item));
      if (!response?.success || !response.data) throw new Error(response?.message || "Hackathon details could not be loaded.");
      if (detailsRequest.current === requestId) setDetails(response.data);
    } catch (error) {
      if (detailsRequest.current === requestId) setDetailsError(error?.message || "Unable to load hackathon details.");
    } finally {
      if (detailsRequest.current === requestId) setDetailsLoading(false);
    }
  };
  const closeDetails = () => {
    detailsRequest.current += 1;
    setDetails(null);
    setDetailsLoading(false);
    setDetailsError("");
  };

  const save = async (event) => {
    event.preventDefault();
    if (mutationLock.current) return;
    const errors = validate(form);
    setFormErrors(errors);
    setRequestError("");
    if (Object.keys(errors).length) return;
    mutationLock.current = true;
    setIsSaving(true);
    const payload = {
      title: form.title.trim(),
      shortDescription: form.shortDescription.trim(),
      fullDescription: form.fullDescription.trim(),
      bannerImage: form.bannerImage.trim(),
      theme: form.theme.trim(),
      contactEmail: form.contactEmail.trim(),
      registration: {
        link: safeExternalUrl(form.registration.link.trim()),
        deadline: form.registration.deadline,
        fee: Number(form.registration.fee),
        eligibility: form.registration.eligibility.trim(),
        minTeamSize: Number(form.registration.minTeamSize),
        maxTeamSize: Number(form.registration.maxTeamSize),
        maxParticipants: form.registration.maxParticipants ? Number(form.registration.maxParticipants) : null,
        status: form.registration.status,
      },
      timeline: Object.fromEntries(Object.entries(form.timeline).map(([key, value]) => [key, value || null])),
      mode: form.mode,
      venue: form.venue.trim(),
      prizes: form.prizes.filter((item) => item.position.trim() && item.title.trim()).map((item) => ({
        position: item.position.trim(), title: item.title.trim(), description: item.description.trim(),
      })),
      judgingCriteria: form.judgingCriteria.filter((item) => item.name.trim()).map((item) => ({
        name: item.name.trim(), weight: Number(item.weight),
      })),
      rules: form.rules.map((rule) => rule.trim()),
    };
    try {
      const response = editor.mode === "edit"
        ? await updateWebHackathon(getId(editor.item), payload)
        : await createWebHackathon(payload);
      if (!response?.success) throw new Error(response?.message || "Unable to save this hackathon.");
      setEditor(null);
      setToastIsError(false);
      setToast(response.message || (editor.mode === "edit" ? "Hackathon updated." : "Hackathon created."));
      setListVersion((value) => value + 1);
    } catch (error) {
      setRequestError(error?.message || "Unable to save the hackathon. Please try again.");
    } finally {
      mutationLock.current = false;
      setIsSaving(false);
    }
  };
  const remove = async () => {
    if (!deleteTarget || mutationLock.current) return;
    mutationLock.current = true;
    setIsDeleting(true);
    try {
      const response = await deleteWebHackathon(getId(deleteTarget));
      if (!response?.success) throw new Error(response?.message || "Unable to delete this hackathon.");
      setDeleteTarget(null);
      setToastIsError(false);
      setToast(response.message || "Hackathon deleted.");
      setListVersion((value) => value + 1);
    } catch (error) {
      setToastIsError(true);
      setToast(error?.message || "Unable to delete this hackathon.");
    } finally {
      mutationLock.current = false;
      setIsDeleting(false);
    }
  };

  const createButton = (className = primaryButtonClassName, disabled = false) => <button type="button" onClick={openCreate} disabled={disabled} className={className}><span className="mr-2 text-lg leading-none" aria-hidden="true">+</span>Create Hackathon</button>;
  const badges = [
    ["Total hackathons", hackathons.length],
    ["Upcoming", upcomingCount],
    ["Open registrations", openCount],
    ["Closed registrations", closedCount],
  ];

  return (
    <main className="flex-1 bg-[#F8F6EF] px-4 py-9 sm:px-6 sm:py-12 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div><p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#747566]">Web Development Club · President</p><h1 className="mt-2 text-3xl font-semibold tracking-[-0.045em] text-[#24241F] sm:text-4xl">Manage Hackathons</h1><p className="mt-2 max-w-2xl text-sm leading-6 text-[#68695D]">Create and manage hackathons for your web development club members.</p></div>
          <div className="flex flex-wrap items-center gap-3">{badges.map(([label, count]) => <div key={label} className="rounded-2xl border border-[#DDD6C9] bg-white/70 px-4 py-3 shadow-sm"><p className="text-[11px] font-medium uppercase tracking-wide text-[#747566]">{label}</p><p className="mt-1 text-2xl font-semibold tracking-tight text-[#24241F]">{count}</p></div>)}{createButton(primaryButtonClassName, isSaving || isDeleting)}</div>
        </header>
        {toast && <p role={toastIsError ? "alert" : "status"} aria-live="polite" className={`mt-5 rounded-xl border px-4 py-3 text-sm ${toastIsError ? "border-red-200 bg-red-50 text-red-800" : "border-green-200 bg-green-50 text-green-800"}`}>{toast}</p>}
        <section className="mt-7 rounded-3xl border border-[#DDD6C9] bg-white/60 p-4 shadow-[0_8px_24px_rgba(36,36,31,0.025)] sm:p-5">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[minmax(0,1fr)_auto_auto_auto] lg:items-end">
            <div><label htmlFor="hackathon-search" className="mb-1.5 block text-xs font-medium text-[#55574A]">Search hackathons</label><input id="hackathon-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Title, description, or theme..." className={inputClassName} /></div>
            <div><label htmlFor="hackathon-status-filter" className="mb-1.5 block text-xs font-medium text-[#55574A]">Registration</label><select id="hackathon-status-filter" value={registrationFilter} onChange={(event) => setRegistrationFilter(event.target.value)} className={inputClassName}><option value="all">All statuses</option><option value="upcoming">Upcoming</option><option value="open">Open</option><option value="closed">Closed</option></select></div>
            <div><label htmlFor="hackathon-mode-filter" className="mb-1.5 block text-xs font-medium text-[#55574A]">Mode</label><select id="hackathon-mode-filter" value={modeFilter} onChange={(event) => setModeFilter(event.target.value)} className={inputClassName}><option value="all">All modes</option><option value="online">Online</option><option value="offline">Offline</option><option value="hybrid">Hybrid</option></select></div>
            {(search || registrationFilter !== "all" || modeFilter !== "all") && <button type="button" onClick={() => { setSearch(""); setRegistrationFilter("all"); setModeFilter("all"); }} className={secondaryButtonClassName}>Clear filters</button>}
          </div>
        </section>
        {loadError ? <section className="mt-6 rounded-3xl border border-red-200 bg-red-50 p-6"><p role="alert" className="text-sm text-red-800">{loadError}</p><button type="button" onClick={() => { setLoadError(""); setListVersion((value) => value + 1); }} className="mt-3 rounded-lg px-2 py-1 text-sm font-semibold text-red-900 underline underline-offset-4">Retry</button></section>
          : isLoading ? <div className="mt-6 space-y-3" role="status" aria-label="Loading hackathons">{[0, 1, 2].map((i) => <div key={i} className="h-28 animate-pulse rounded-2xl border border-[#DDD6C9] bg-white/70" />)}</div>
            : hackathons.length === 0 ? <section className="mt-6 rounded-3xl border border-dashed border-[#CFC8B9] bg-white/45 px-6 py-14 text-center"><h2 className="text-lg font-semibold text-[#35382D]">No hackathons yet</h2><p className="mt-2 text-sm text-[#68695D]">Create an event for the web development community.</p><div className="mt-5">{createButton()}</div></section>
              : filtered.length === 0 ? <section className="mt-6 rounded-3xl border border-dashed border-[#CFC8B9] bg-white/45 px-6 py-12 text-center"><h2 className="text-lg font-semibold text-[#35382D]">No matching hackathons</h2><p className="mt-2 text-sm text-[#68695D]">Try different search terms or filters.</p><button type="button" onClick={() => { setSearch(""); setRegistrationFilter("all"); setModeFilter("all"); }} className={`${secondaryButtonClassName} mt-4`}>Clear filters</button></section>
                : <section className="mt-6">
                  <div className="hidden overflow-hidden rounded-3xl border border-[#DDD6C9] bg-white/70 shadow-[0_8px_24px_rgba(36,36,31,0.025)] md:block"><div className="overflow-x-auto"><table className="w-full min-w-[1050px] text-left">
                    <thead className="border-b border-[#E8E3D9] bg-[#F3F0E8] text-xs font-semibold uppercase tracking-wide text-[#747566]"><tr><th className="px-5 py-4">Hackathon</th><th className="px-5 py-4">Theme</th><th className="px-5 py-4">Mode</th><th className="px-5 py-4">Registration</th><th className="px-5 py-4">Deadline</th><th className="px-5 py-4">Event dates</th><th className="px-5 py-4">Actions</th></tr></thead>
                    <tbody className="divide-y divide-[#E8E3D9]">{filtered.map((item) => <tr key={getId(item)} className="align-top">
                      <td className="px-5 py-4"><div className="flex min-w-48 items-center gap-3">{item.bannerImage ? <div className="relative h-12 w-16 shrink-0 overflow-hidden rounded-lg bg-[#E7DDCE]"><Image src={item.bannerImage} alt="" fill sizes="64px" unoptimized className="object-cover" /></div> : <div className="flex h-12 w-16 shrink-0 items-center justify-center rounded-lg bg-[#E7DDCE]/70 text-xs text-[#747566]">No image</div>}<div><p className="font-semibold text-sm text-[#24241F]">{item.title || "Untitled hackathon"}</p><p className="mt-0.5 line-clamp-1 text-xs text-[#68695D]">{item.shortDescription}</p></div></div></td>
                      <td className="max-w-40 px-5 py-4 text-xs text-[#55574A]">{item.theme || "—"}</td><td className="px-5 py-4 text-xs capitalize text-[#55574A]">{item.mode || "—"}</td>
                      <td className="px-5 py-4"><StatusBadge tone={item.registration?.status === "open" ? "open" : item.registration?.status === "closed" ? "closed" : "neutral"}>{item.registration?.status || "upcoming"}</StatusBadge></td>
                      <td className="whitespace-nowrap px-5 py-4 text-xs text-[#55574A]">{formatDate(item.registration?.deadline)}</td>
                      <td className="whitespace-nowrap px-5 py-4 text-xs text-[#55574A]">{formatDate(item.timeline?.startDate)}<br /><span className="text-[#747566]">to {formatDate(item.timeline?.endDate)}</span></td>
                      <td className="px-5 py-4"><Actions item={item} onView={openDetails} onEdit={openEdit} onDelete={setDeleteTarget} disabled={isSaving || isDeleting} /></td>
                    </tr>)}</tbody>
                  </table></div></div>
                  <div className="grid gap-3 md:hidden">{filtered.map((item) => <article key={getId(item)} className="rounded-2xl border border-[#DDD6C9] bg-white/70 p-4 shadow-[0_6px_18px_rgba(36,36,31,0.025)]">
                    <div className="flex gap-3">{item.bannerImage ? <div className="relative h-16 w-20 shrink-0 overflow-hidden rounded-xl bg-[#E7DDCE]"><Image src={item.bannerImage} alt="" fill sizes="80px" unoptimized className="object-cover" /></div> : null}<div className="min-w-0"><h2 className="break-words text-base font-semibold text-[#24241F]">{item.title || "Untitled hackathon"}</h2><p className="mt-1 text-xs text-[#68695D]">{item.theme || "No theme"}</p></div></div>
                    <p className="mt-3 line-clamp-2 text-sm leading-5 text-[#55574A]">{item.shortDescription}</p><div className="mt-3 flex flex-wrap gap-2"><StatusBadge tone={item.registration?.status === "open" ? "open" : item.registration?.status === "closed" ? "closed" : "neutral"}>{item.registration?.status || "upcoming"}</StatusBadge><StatusBadge>{item.mode || "Mode unavailable"}</StatusBadge></div>
                    <div className="mt-3 grid grid-cols-2 gap-2 text-xs text-[#68695D]"><span>Deadline<br />{formatDate(item.registration?.deadline)}</span><span>Event<br />{formatDate(item.timeline?.startDate)} – {formatDate(item.timeline?.endDate)}</span></div>
                    <div className="mt-3 border-t border-[#E8E3D9] pt-2"><Actions item={item} onView={openDetails} onEdit={openEdit} onDelete={setDeleteTarget} disabled={isSaving || isDeleting} /></div>
                  </article>)}</div>
                </section>}
      </div>

      {editor && <Modal title={editor.mode === "edit" ? "Edit hackathon" : "Create hackathon"} titleId="web-hackathon-editor" onClose={() => { if (!isSaving) setEditor(null); }} size="max-w-3xl">
        {editor.mode === "edit" && requestError && <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{requestError}</p>}
        <HackathonForm form={form} setForm={setForm} onSubmit={save} onCancel={() => setEditor(null)} errors={formErrors} requestError={editor.mode === "create" ? requestError : ""} isSaving={isSaving} />
      </Modal>}
      {details && <Modal title="Hackathon details" titleId="web-hackathon-details" onClose={closeDetails} size="max-w-3xl">
        {detailsLoading && <p role="status" className="mt-4 text-sm text-[#68695D]">Loading hackathon details...</p>}
        {detailsError && <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{detailsError}</p>}
        <div className="mt-5 max-h-[70vh] space-y-5 overflow-y-auto pr-1">
          {safeExternalUrl(details.bannerImage) && <div className="relative aspect-[16/5] overflow-hidden rounded-2xl bg-[#E7DDCE]"><Image src={details.bannerImage} alt={`${details.title || "Hackathon"} banner`} fill sizes="(max-width: 768px) 100vw, 700px" unoptimized className="object-cover" /></div>}
          <div><h3 className="text-xl font-semibold text-[#24241F]">{details.title}</h3><p className="mt-1 font-medium text-[#55574A]">{details.theme}</p>{details.shortDescription && <p className="mt-3 text-sm font-medium leading-6 text-[#55574A]">{details.shortDescription}</p>}<p className="mt-2 whitespace-pre-line text-sm leading-6 text-[#68695D]">{details.fullDescription || "No full description provided."}</p></div>
          <div className="grid gap-3 rounded-2xl border border-[#DDD6C9] bg-white/60 p-4 text-sm sm:grid-cols-2">
            <p><span className="text-xs text-[#747566]">Mode</span><br /><span className="capitalize text-[#35382D]">{details.mode}</span></p>
            <p><span className="text-xs text-[#747566]">Venue</span><br /><span className="text-[#35382D]">{details.venue || "Not specified"}</span></p>
            <p><span className="text-xs text-[#747566]">Contact</span><br /><span className="text-[#35382D]">{details.contactEmail || "Not specified"}</span></p>
            <p><span className="text-xs text-[#747566]">Registration status</span><br /><span className="capitalize text-[#35382D]">{details.registration?.status || "upcoming"}</span></p>
            <p><span className="text-xs text-[#747566]">Registration deadline</span><br /><span className="text-[#35382D]">{formatDate(details.registration?.deadline, { dateStyle: "medium", timeStyle: "short" })}</span></p>
            <p><span className="text-xs text-[#747566]">Registration fee</span><br /><span className="text-[#35382D]">{details.registration?.fee ?? 0}</span></p>
            <p><span className="text-xs text-[#747566]">Team size</span><br /><span className="text-[#35382D]">{details.registration?.minTeamSize}–{details.registration?.maxTeamSize}</span></p>
            <p><span className="text-xs text-[#747566]">Maximum participants</span><br /><span className="text-[#35382D]">{details.registration?.maxParticipants ?? "No limit"}</span></p>
            <p><span className="text-xs text-[#747566]">Event dates</span><br /><span className="text-[#35382D]">{formatDate(details.timeline?.startDate)} – {formatDate(details.timeline?.endDate)}</span></p>
            <p><span className="text-xs text-[#747566]">Eligibility</span><br /><span className="text-[#35382D]">{details.registration?.eligibility || "Not specified"}</span></p>
            <p><span className="text-xs text-[#747566]">Idea submission deadline</span><br /><span className="text-[#35382D]">{formatDate(details.timeline?.ideaSubmissionDeadline, { dateStyle: "medium", timeStyle: "short" })}</span></p>
            <p><span className="text-xs text-[#747566]">Final submission deadline</span><br /><span className="text-[#35382D]">{formatDate(details.timeline?.finalSubmissionDeadline, { dateStyle: "medium", timeStyle: "short" })}</span></p>
            <p><span className="text-xs text-[#747566]">Judging date</span><br /><span className="text-[#35382D]">{formatDate(details.timeline?.judgingDate, { dateStyle: "medium", timeStyle: "short" })}</span></p>
            <p><span className="text-xs text-[#747566]">Result date</span><br /><span className="text-[#35382D]">{formatDate(details.timeline?.resultDate, { dateStyle: "medium", timeStyle: "short" })}</span></p>
          </div>
          {details.prizes?.length > 0 && <div><h4 className="font-semibold text-sm text-[#35382D]">Prizes</h4><ul className="mt-2 space-y-2">{details.prizes.map((prize, index) => <li key={`${prize.position}-${index}`} className="rounded-xl border border-[#DDD6C9] bg-white/50 p-3 text-sm"><strong>{prize.position}: {prize.title}</strong>{prize.description && <p className="mt-1 text-[#68695D]">{prize.description}</p>}</li>)}</ul></div>}
          {details.judgingCriteria?.length > 0 && <div><h4 className="font-semibold text-sm text-[#35382D]">Judging criteria</h4><ul className="mt-2 grid gap-2 sm:grid-cols-2">{details.judgingCriteria.map((item, index) => <li key={`${item.name}-${index}`} className="flex justify-between rounded-xl border border-[#DDD6C9] bg-white/50 p-3 text-sm"><span>{item.name}</span><strong>{item.weight}%</strong></li>)}</ul></div>}
          {details.rules?.length > 0 && <div><h4 className="font-semibold text-sm text-[#35382D]">Rules</h4><ul className="mt-2 list-inside list-disc space-y-1 text-sm leading-6 text-[#55574A]">{details.rules.map((rule, index) => <li key={`${index}-${rule}`}>{rule}</li>)}</ul></div>}
          {safeExternalUrl(details.registration?.link) && <a href={safeExternalUrl(details.registration.link)} target="_blank" rel="noopener noreferrer" className={primaryButtonClassName}>Open registration</a>}
        </div>
      </Modal>}
      {deleteTarget && <Modal title="Delete hackathon?" titleId="web-hackathon-delete" onClose={() => { if (!isDeleting) setDeleteTarget(null); }} size="max-w-md">
        <p className="mt-3 break-words text-sm font-semibold text-[#24241F]">{deleteTarget.title}</p><p className="mt-2 text-sm leading-6 text-[#68695D]">This permanently deletes the hackathon. This action cannot be undone.</p>
        {toast && toastIsError && <p role="alert" className="mt-3 text-sm text-red-800">{toast}</p>}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" onClick={() => setDeleteTarget(null)} disabled={isDeleting} className={secondaryButtonClassName}>Cancel</button><button type="button" onClick={remove} disabled={isDeleting} className="rounded-xl bg-[#8A433B] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#71372F] disabled:cursor-not-allowed disabled:opacity-50">{isDeleting ? "Deleting..." : "Delete hackathon"}</button></div>
      </Modal>}
    </main>
  );
}
