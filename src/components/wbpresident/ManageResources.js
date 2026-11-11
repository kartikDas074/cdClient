"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  createWebResource,
  deleteWebResource,
  getAllWebResources,
  getWebResourceById,
  updateWebResource,
} from "@/lib/api";
import {
  fetchAllPages,
  formatDate,
  inputClassName,
  Modal,
  primaryButtonClassName,
  safeExternalUrl,
  secondaryButtonClassName,
} from "./management-ui";

const emptyForm = { title: "", description: "", link: "", category: "" };

function getId(resource) {
  return String(resource?._id || resource?.id || "");
}

function validate(form) {
  const errors = {};
  if (!form.title.trim()) errors.title = "Resource title is required.";
  if (!form.description.trim()) errors.description = "Description is required.";
  if (!form.category.trim()) errors.category = "Category is required.";
  if (!form.link.trim()) errors.link = "Resource link is required.";
  else if (!safeExternalUrl(form.link.trim())) errors.link = "Enter a valid HTTP or HTTPS URL.";
  return errors;
}

function ResourceForm({ form, setForm, onSubmit, onCancel, errors, requestError, isSaving }) {
  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };
  return (
    <form onSubmit={onSubmit} noValidate className="mt-5 space-y-4">
      {requestError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{requestError}</p>}
      {[
        { name: "title", label: "Resource title", placeholder: "Enter resource title", type: "text" },
        { name: "category", label: "Category", placeholder: "e.g. Frontend, Design, Accessibility", type: "text" },
        { name: "link", label: "Resource URL", placeholder: "https://example.com", type: "url" },
      ].map((field) => (
        <div key={field.name}>
          <label htmlFor={`web-resource-${field.name}`} className="mb-1.5 block text-sm font-medium text-[#35382D]">{field.label} <span aria-hidden="true">*</span></label>
          <input
            id={`web-resource-${field.name}`}
            name={field.name}
            type={field.type}
            value={form[field.name]}
            onChange={updateField}
            disabled={isSaving}
            placeholder={field.placeholder}
            maxLength={field.name === "link" ? 2048 : 160}
            aria-invalid={Boolean(errors[field.name])}
            aria-describedby={errors[field.name] ? `web-resource-${field.name}-error` : undefined}
            className={`${inputClassName} ${errors[field.name] ? "border-red-300 focus:border-red-500 focus:ring-red-100" : ""}`}
          />
          {errors[field.name] && <p id={`web-resource-${field.name}-error`} className="mt-1.5 text-xs text-red-700">{errors[field.name]}</p>}
        </div>
      ))}
      <div>
        <label htmlFor="web-resource-description" className="mb-1.5 block text-sm font-medium text-[#35382D]">Description <span aria-hidden="true">*</span></label>
        <textarea
          id="web-resource-description"
          name="description"
          value={form.description}
          onChange={updateField}
          disabled={isSaving}
          placeholder="Describe this learning resource."
          rows={4}
          maxLength={3000}
          aria-invalid={Boolean(errors.description)}
          aria-describedby={errors.description ? "web-resource-description-error" : undefined}
          className={`${inputClassName} resize-y ${errors.description ? "border-red-300 focus:border-red-500 focus:ring-red-100" : ""}`}
        />
        {errors.description && <p id="web-resource-description-error" className="mt-1.5 text-xs text-red-700">{errors.description}</p>}
      </div>
      <div className="flex flex-col-reverse gap-2 border-t border-[#E8E3D9] pt-4 sm:flex-row sm:justify-end">
        <button type="button" onClick={onCancel} disabled={isSaving} className={secondaryButtonClassName}>Cancel</button>
        <button type="submit" disabled={isSaving} className={primaryButtonClassName}>
          {isSaving ? <><span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />Saving...</> : "Save resource"}
        </button>
      </div>
    </form>
  );
}

function Actions({ item, onView, onEdit, onDelete, disabled }) {
  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" onClick={() => onView(item)} disabled={disabled} className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#35382D] underline decoration-[#B6B19F] underline-offset-4 hover:bg-[#E7DDCE]/55 disabled:opacity-50">View</button>
      <button type="button" onClick={() => onEdit(item)} disabled={disabled} className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#35382D] underline decoration-[#B6B19F] underline-offset-4 hover:bg-[#E7DDCE]/55 disabled:opacity-50">Edit</button>
      <button type="button" onClick={() => onDelete(item)} disabled={disabled} className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#8A433B] underline decoration-[#D7B3AA] underline-offset-4 hover:bg-[#F4E8E4] disabled:opacity-50">Delete</button>
    </div>
  );
}

export default function ManageWebResources() {
  const [resources, setResources] = useState([]);
  const [recentCutoff, setRecentCutoff] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("");
  const [listVersion, setListVersion] = useState(0);
  const [editor, setEditor] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [errors, setErrors] = useState({});
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
      fetchAllPages(getAllWebResources, "Resources")
        .then((items) => {
          if (active) {
            setResources(items);
            setRecentCutoff(Date.now() - 30 * 24 * 60 * 60 * 1000);
          }
        })
        .catch((error) => {
          if (active) setLoadError(error?.message || "Unable to load resources. Please try again.");
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

  const categories = useMemo(() => [...new Set(resources.map((item) => item.category?.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b)), [resources]);
  const recentCount = useMemo(() => resources.filter((item) => {
    const created = new Date(item.createdAt).getTime();
    return recentCutoff > 0 && Number.isFinite(created) && created >= recentCutoff;
  }).length, [resources, recentCutoff]);
  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return resources.filter((item) => {
      const matchesSearch = !query || item.title?.toLowerCase().includes(query) || item.description?.toLowerCase().includes(query);
      return matchesSearch && (!categoryFilter || item.category === categoryFilter);
    });
  }, [resources, search, categoryFilter]);

  const openCreate = () => {
    setEditor({ mode: "create", item: null });
    setForm(emptyForm);
    setErrors({});
    setRequestError("");
  };
  const openEdit = (item) => {
    setEditor({ mode: "edit", item });
    setForm({ title: item.title || "", description: item.description || "", link: item.link || "", category: item.category || "" });
    setErrors({});
    setRequestError("");
  };
  const openDetails = async (item) => {
    const requestId = detailsRequest.current + 1;
    detailsRequest.current = requestId;
    setDetails(item);
    setDetailsLoading(true);
    setDetailsError("");
    try {
      const response = await getWebResourceById(getId(item));
      if (!response?.success || !response.data) throw new Error(response?.message || "Resource details could not be loaded.");
      if (detailsRequest.current === requestId) setDetails(response.data);
    } catch (error) {
      if (detailsRequest.current === requestId) setDetailsError(error?.message || "Unable to load resource details.");
    } finally {
      if (detailsRequest.current === requestId) setDetailsLoading(false);
    }
  };
  const closeDetails = () => {
    detailsRequest.current += 1;
    setDetails(null);
    setDetailsError("");
    setDetailsLoading(false);
  };

  const save = async (event) => {
    event.preventDefault();
    if (mutationLock.current) return;
    const validationErrors = validate(form);
    setErrors(validationErrors);
    setRequestError("");
    if (Object.keys(validationErrors).length) return;
    mutationLock.current = true;
    setIsSaving(true);
    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      link: safeExternalUrl(form.link.trim()),
      category: form.category.trim(),
    };
    try {
      const response = editor.mode === "edit"
        ? await updateWebResource(getId(editor.item), payload)
        : await createWebResource(payload);
      if (!response?.success) throw new Error(response?.message || "Unable to save this resource.");
      setEditor(null);
      setToastIsError(false);
      setToast(response.message || (editor.mode === "edit" ? "Resource updated." : "Resource added."));
      setListVersion((value) => value + 1);
    } catch (error) {
      setRequestError(error?.message || "Unable to save this resource. Please try again.");
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
      const response = await deleteWebResource(getId(deleteTarget));
      if (!response?.success) throw new Error(response?.message || "Unable to delete this resource.");
      setDeleteTarget(null);
      setToastIsError(false);
      setToast(response.message || "Resource deleted.");
      setListVersion((value) => value + 1);
    } catch (error) {
      setToastIsError(true);
      setToast(error?.message || "Unable to delete this resource.");
    } finally {
      mutationLock.current = false;
      setIsDeleting(false);
    }
  };
  const addButton = (className = primaryButtonClassName, disabled = false) => (
    <button type="button" onClick={openCreate} disabled={disabled} className={className}><span className="mr-2 text-lg leading-none" aria-hidden="true">+</span>Add Resource</button>
  );

  return (
    <main className="flex-1 bg-[#F8F6EF] px-4 py-9 sm:px-6 sm:py-12 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#747566]">Web Development Club · President</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.045em] text-[#24241F] sm:text-4xl">Manage Resources</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#68695D]">Organize and share valuable learning materials with club members.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            {[["Total resources", resources.length], ["Categories", categories.length], ["Recently added", recentCount]].map(([label, value]) => (
              <div key={label} className="rounded-2xl border border-[#DDD6C9] bg-white/70 px-4 py-3 shadow-sm">
                <p className="text-[11px] font-medium uppercase tracking-wide text-[#747566]">{label}</p>
                <p className="mt-1 text-2xl font-semibold tracking-tight text-[#24241F]">{value}</p>
                {label === "Recently added" && <p className="text-[10px] text-[#747566]">Last 30 days</p>}
              </div>
            ))}
            {addButton(primaryButtonClassName, isSaving || isDeleting)}
          </div>
        </header>

        {toast && <p role={toastIsError ? "alert" : "status"} aria-live="polite" className={`mt-5 rounded-xl border px-4 py-3 text-sm ${toastIsError ? "border-red-200 bg-red-50 text-red-800" : "border-green-200 bg-green-50 text-green-800"}`}>{toast}</p>}

        <section className="mt-7 rounded-3xl border border-[#DDD6C9] bg-white/60 p-4 shadow-[0_8px_24px_rgba(36,36,31,0.025)] sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="w-full sm:max-w-lg">
              <label htmlFor="web-resource-search" className="mb-1.5 block text-xs font-medium text-[#55574A]">Search resources</label>
              <input id="web-resource-search" type="search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search title or description..." className={inputClassName} />
            </div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
              <div>
                <label htmlFor="web-resource-category" className="mb-1.5 block text-xs font-medium text-[#55574A]">Category</label>
                <select id="web-resource-category" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} className={inputClassName}>
                  <option value="">All categories</option>
                  {categories.map((category) => <option key={category} value={category}>{category}</option>)}
                </select>
              </div>
              {(search || categoryFilter) && <button type="button" onClick={() => { setSearch(""); setCategoryFilter(""); }} className={secondaryButtonClassName}>Clear filters</button>}
            </div>
          </div>
        </section>

        {loadError ? (
          <section className="mt-6 rounded-3xl border border-red-200 bg-red-50 p-6">
            <p role="alert" className="text-sm text-red-800">{loadError}</p>
            <button type="button" onClick={() => { setLoadError(""); setListVersion((value) => value + 1); }} className="mt-3 rounded-lg px-2 py-1 text-sm font-semibold text-red-900 underline underline-offset-4">Retry</button>
          </section>
        ) : isLoading ? (
          <div className="mt-6 space-y-3" role="status" aria-label="Loading resources">{[0, 1, 2].map((item) => <div key={item} className="h-24 animate-pulse rounded-2xl border border-[#DDD6C9] bg-white/70" />)}</div>
        ) : resources.length === 0 ? (
          <section className="mt-6 rounded-3xl border border-dashed border-[#CFC8B9] bg-white/45 px-6 py-14 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E7DDCE]/75 text-[#55574A]" aria-hidden="true"><span className="text-2xl">↗</span></div>
            <h2 className="mt-4 text-lg font-semibold text-[#35382D]">No resources have been added yet.</h2>
            <p className="mt-2 text-sm text-[#68695D]">Share a helpful web-development learning resource with your members.</p>
            <div className="mt-5">{addButton()}</div>
          </section>
        ) : filtered.length === 0 ? (
          <section className="mt-6 rounded-3xl border border-dashed border-[#CFC8B9] bg-white/45 px-6 py-12 text-center">
            <h2 className="text-lg font-semibold text-[#35382D]">No matching resources</h2>
            <p className="mt-2 text-sm text-[#68695D]">Try different search terms or category.</p>
            <button type="button" onClick={() => { setSearch(""); setCategoryFilter(""); }} className={`${secondaryButtonClassName} mt-4`}>Clear filters</button>
          </section>
        ) : (
          <section className="mt-6">
            <div className="hidden overflow-hidden rounded-3xl border border-[#DDD6C9] bg-white/70 shadow-[0_8px_24px_rgba(36,36,31,0.025)] md:block">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] text-left">
                  <thead className="border-b border-[#E8E3D9] bg-[#F3F0E8] text-xs font-semibold uppercase tracking-wide text-[#747566]"><tr>
                    <th scope="col" className="px-5 py-4">Resource title</th><th scope="col" className="px-5 py-4">Description</th><th scope="col" className="px-5 py-4">Category</th><th scope="col" className="px-5 py-4">Resource link</th><th scope="col" className="whitespace-nowrap px-5 py-4">Created</th><th scope="col" className="px-5 py-4">Actions</th>
                  </tr></thead>
                  <tbody className="divide-y divide-[#E8E3D9]">{filtered.map((item) => (
                    <tr key={getId(item)} className="align-top">
                      <td className="max-w-52 px-5 py-4 text-sm font-semibold text-[#24241F]">{item.title || "Untitled resource"}</td>
                      <td className="max-w-60 px-5 py-4"><p className="line-clamp-2 text-xs leading-5 text-[#55574A]">{item.description || "No description provided."}</p>{item.description?.length > 100 && <button type="button" onClick={() => openDetails(item)} className="mt-1 text-xs font-medium text-[#35382D] underline underline-offset-4">View full description</button>}</td>
                      <td className="px-5 py-4"><span className="rounded-full bg-[#EEECE7] px-2.5 py-1 text-xs font-medium text-[#6C6A5F]">{item.category || "Uncategorized"}</span></td>
                      <td className="max-w-44 px-5 py-4 text-xs">{safeExternalUrl(item.link) ? <a href={safeExternalUrl(item.link)} target="_blank" rel="noopener noreferrer" className="break-all font-medium text-[#455C64] underline underline-offset-4">Visit resource</a> : <span className="text-[#747566]">Invalid link</span>}</td>
                      <td className="whitespace-nowrap px-5 py-4 text-xs text-[#55574A]">{formatDate(item.createdAt)}</td>
                      <td className="px-5 py-4"><Actions item={item} onView={openDetails} onEdit={openEdit} onDelete={setDeleteTarget} disabled={isSaving || isDeleting} /></td>
                    </tr>
                  ))}</tbody>
                </table>
              </div>
            </div>
            <div className="grid gap-3 md:hidden">{filtered.map((item) => (
              <article key={getId(item)} className="rounded-2xl border border-[#DDD6C9] bg-white/70 p-4 shadow-[0_6px_18px_rgba(36,36,31,0.025)]">
                <div className="flex flex-wrap items-start justify-between gap-2"><h2 className="break-words text-base font-semibold text-[#24241F]">{item.title || "Untitled resource"}</h2><span className="rounded-full bg-[#EEECE7] px-2.5 py-1 text-xs font-medium text-[#6C6A5F]">{item.category || "Uncategorized"}</span></div>
                <p className="mt-2 line-clamp-3 whitespace-pre-line break-words text-sm leading-6 text-[#55574A]">{item.description || "No description provided."}</p>
                {item.description?.length > 100 && <button type="button" onClick={() => openDetails(item)} className="mt-1 text-xs font-medium text-[#35382D] underline underline-offset-4">View full description</button>}
                <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#68695D]"><span>Created {formatDate(item.createdAt)}</span></div>
                {safeExternalUrl(item.link) && <a href={safeExternalUrl(item.link)} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex text-xs font-medium text-[#455C64] underline underline-offset-4">Visit resource</a>}
                <div className="mt-3 border-t border-[#E8E3D9] pt-2"><Actions item={item} onView={openDetails} onEdit={openEdit} onDelete={setDeleteTarget} disabled={isSaving || isDeleting} /></div>
              </article>
            ))}</div>
          </section>
        )}
      </div>

      {editor && <Modal title={editor.mode === "edit" ? "Edit resource" : "Add resource"} titleId="web-resource-editor" onClose={() => { if (!isSaving) setEditor(null); }}>
        <ResourceForm form={form} setForm={setForm} onSubmit={save} onCancel={() => setEditor(null)} errors={errors} requestError={requestError} isSaving={isSaving} />
      </Modal>}
      {details && <Modal title="Resource details" titleId="web-resource-details" onClose={closeDetails}>
        {detailsLoading && <p role="status" className="mt-4 text-sm text-[#68695D]">Loading resource details...</p>}
        {detailsError && <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{detailsError}</p>}
        <div className="mt-5"><h3 className="break-words text-lg font-semibold text-[#24241F]">{details.title || "Untitled resource"}</h3>
          <p className="mt-2 text-xs text-[#747566]">Category: {details.category || "Uncategorized"}</p>
          <p className="mt-3 whitespace-pre-line break-words text-sm leading-6 text-[#55574A]">{details.description || "No description provided."}</p>
          <dl className="mt-5 grid gap-3 border-t border-[#E8E3D9] pt-4 text-sm sm:grid-cols-2"><div><dt className="text-xs text-[#747566]">Created</dt><dd className="mt-1 font-medium text-[#35382D]">{formatDate(details.createdAt)}</dd></div><div><dt className="text-xs text-[#747566]">Last updated</dt><dd className="mt-1 font-medium text-[#35382D]">{formatDate(details.updatedAt)}</dd></div></dl>
          {safeExternalUrl(details.link) && <a href={safeExternalUrl(details.link)} target="_blank" rel="noopener noreferrer" className={`${primaryButtonClassName} mt-5 w-full sm:w-auto`}>Visit resource</a>}
        </div>
      </Modal>}
      {deleteTarget && <Modal title="Delete resource?" titleId="web-resource-delete" onClose={() => { if (!isDeleting) setDeleteTarget(null); }} size="max-w-md">
        <p className="mt-3 break-words text-sm font-semibold text-[#24241F]">{deleteTarget.title || "Untitled resource"}</p>
        <p className="mt-2 text-sm leading-6 text-[#68695D]">This permanently deletes the resource. This action cannot be undone.</p>
        {toast && toastIsError && <p role="alert" className="mt-3 text-sm text-red-800">{toast}</p>}
        <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end"><button type="button" onClick={() => setDeleteTarget(null)} disabled={isDeleting} className={secondaryButtonClassName}>Cancel</button><button type="button" onClick={remove} disabled={isDeleting} className="rounded-xl bg-[#8A433B] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#71372F] disabled:cursor-not-allowed disabled:opacity-50">{isDeleting ? "Deleting..." : "Delete resource"}</button></div>
      </Modal>}
    </main>
  );
}
