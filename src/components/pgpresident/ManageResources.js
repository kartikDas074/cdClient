"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  createResource,
  deleteResource,
  getAllResources,
  getResourceById,
  updateResource,
} from "@/lib/api";

const emptyForm = { title: "", description: "", link: "" };
const inputClassName = "w-full rounded-xl border border-[#DDD6C9] bg-[#F8F6EF] px-3.5 py-3 text-sm text-[#24241F] outline-none transition placeholder:text-[#8A8B7F] focus:border-[#35382D]/60 focus:ring-2 focus:ring-[#D8CCBA]";
const secondaryButtonClassName = "inline-flex items-center justify-center rounded-xl border border-[#DDD6C9] px-4 py-2.5 text-sm font-medium text-[#35382D] transition hover:bg-[#E7DDCE]/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35382D]/35 disabled:cursor-not-allowed disabled:opacity-55";
const primaryButtonClassName = "inline-flex items-center justify-center rounded-xl bg-[#35382D] px-4 py-2.5 text-sm font-medium text-[#F8F6EF] shadow-sm transition hover:bg-[#24241F] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#35382D]/45 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-55";

function getResourceId(resource) {
  return String(resource?._id || resource?.id || "");
}

function formatDate(value) {
  if (!value) return "Not available";
  const date = new Date(value);
  return Number.isNaN(date.getTime())
    ? "Not available"
    : new Intl.DateTimeFormat(undefined, { dateStyle: "medium" }).format(date);
}

function safeExternalUrl(value) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.href : "";
  } catch {
    return "";
  }
}

function validateForm(form) {
  const errors = {};
  if (!form.title.trim()) errors.title = "Resource title is required.";
  if (!form.description.trim()) errors.description = "Description is required.";
  if (!form.link.trim()) {
    errors.link = "Resource link is required.";
  } else if (!safeExternalUrl(form.link.trim())) {
    errors.link = "Enter a valid HTTP or HTTPS URL.";
  }
  return errors;
}

function Modal({ title, titleId, onClose, children, size = "max-w-xl" }) {
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

function ResourceForm({ mode, form, setForm, onSubmit, onCancel, errors, formError, isSaving }) {
  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  return (
    <form onSubmit={onSubmit} noValidate className="mt-5 space-y-4">
      {formError && <p role="alert" className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{formError}</p>}

      <div>
        <label htmlFor="resource-title" className="mb-1.5 block text-sm font-medium text-[#35382D]">Resource title <span aria-hidden="true">*</span></label>
        <input
          id="resource-title"
          name="title"
          value={form.title}
          onChange={updateField}
          disabled={isSaving}
          placeholder="Enter resource title"
          maxLength={160}
          aria-invalid={Boolean(errors.title)}
          aria-describedby={errors.title ? "resource-title-error" : undefined}
          className={`${inputClassName} ${errors.title ? "border-red-300 focus:border-red-500 focus:ring-red-100" : ""}`}
        />
        {errors.title && <p id="resource-title-error" className="mt-1.5 text-xs text-red-700">{errors.title}</p>}
      </div>

      <div>
        <label htmlFor="resource-description" className="mb-1.5 block text-sm font-medium text-[#35382D]">Short description <span aria-hidden="true">*</span></label>
        <textarea
          id="resource-description"
          name="description"
          value={form.description}
          onChange={updateField}
          disabled={isSaving}
          placeholder="Briefly describe this resource"
          rows={4}
          maxLength={2000}
          aria-invalid={Boolean(errors.description)}
          aria-describedby={errors.description ? "resource-description-error" : undefined}
          className={`${inputClassName} resize-y ${errors.description ? "border-red-300 focus:border-red-500 focus:ring-red-100" : ""}`}
        />
        {errors.description && <p id="resource-description-error" className="mt-1.5 text-xs text-red-700">{errors.description}</p>}
      </div>

      <div>
        <label htmlFor="resource-link" className="mb-1.5 block text-sm font-medium text-[#35382D]">Resource link <span aria-hidden="true">*</span></label>
        <input
          id="resource-link"
          name="link"
          type="url"
          value={form.link}
          onChange={updateField}
          disabled={isSaving}
          placeholder="https://example.com"
          maxLength={2048}
          aria-invalid={Boolean(errors.link)}
          aria-describedby={errors.link ? "resource-link-error" : undefined}
          className={`${inputClassName} ${errors.link ? "border-red-300 focus:border-red-500 focus:ring-red-100" : ""}`}
        />
        {errors.link && <p id="resource-link-error" className="mt-1.5 text-xs text-red-700">{errors.link}</p>}
      </div>

      <div className="flex flex-col-reverse gap-2 border-t border-[#E8E3D9] pt-4 sm:flex-row sm:justify-end">
        <button type="button" onClick={onCancel} disabled={isSaving} className={secondaryButtonClassName}>Cancel</button>
        <button type="submit" disabled={isSaving} className={primaryButtonClassName}>
          {isSaving ? (
            <><span className="mr-2 inline-block h-4 w-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />Saving...</>
          ) : mode === "edit" ? "Save changes" : "Add resource"}
        </button>
      </div>
    </form>
  );
}

function ResourceActions({ resource, onView, onEdit, onDelete, disabled = false }) {
  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" onClick={() => onView(resource)} disabled={disabled} className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#35382D] underline decoration-[#B6B19F] underline-offset-4 hover:bg-[#E7DDCE]/55 disabled:opacity-50">View</button>
      <button type="button" onClick={() => onEdit(resource)} disabled={disabled} className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#35382D] underline decoration-[#B6B19F] underline-offset-4 hover:bg-[#E7DDCE]/55 disabled:opacity-50">Edit</button>
      <button type="button" onClick={() => onDelete(resource)} disabled={disabled} className="rounded-lg px-2.5 py-1.5 text-xs font-medium text-[#8A433B] underline decoration-[#D7B3AA] underline-offset-4 hover:bg-[#F4E8E4] disabled:opacity-50">Delete</button>
    </div>
  );
}

export default function ManageResources() {
  const [resources, setResources] = useState([]);
  const [recentCutoff, setRecentCutoff] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [search, setSearch] = useState("");
  const [listVersion, setListVersion] = useState(0);
  const [editor, setEditor] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [formErrors, setFormErrors] = useState({});
  const [formError, setFormError] = useState("");
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
    let isCurrent = true;
    const timer = window.setTimeout(() => {
      setIsLoading(true);
      setLoadError("");
      getAllResources()
        .then((response) => {
          if (!response?.success || !Array.isArray(response.data)) {
            throw new Error(response?.message || "Resources could not be loaded.");
          }
          if (isCurrent) {
            setResources(response.data);
            setRecentCutoff(Date.now() - 30 * 24 * 60 * 60 * 1000);
          }
        })
        .catch((error) => {
          if (isCurrent) setLoadError(error?.message || "Unable to load resources. Please try again.");
        })
        .finally(() => {
          if (isCurrent) setIsLoading(false);
        });
    }, 0);

    return () => {
      isCurrent = false;
      window.clearTimeout(timer);
    };
  }, [listVersion]);

  useEffect(() => {
    if (!toast) return undefined;
    const timer = window.setTimeout(() => setToast(""), 4000);
    return () => window.clearTimeout(timer);
  }, [toast]);

  const filteredResources = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return resources;
    return resources.filter((resource) => (
      resource.title?.toLowerCase().includes(query)
      || resource.description?.toLowerCase().includes(query)
    ));
  }, [resources, search]);

  const recentCount = useMemo(() => resources.filter((resource) => {
    const createdAt = new Date(resource.createdAt).getTime();
    return recentCutoff > 0 && Number.isFinite(createdAt) && createdAt >= recentCutoff;
  }).length, [resources, recentCutoff]);

  const openCreate = () => {
    setEditor({ mode: "create", resource: null });
    setForm(emptyForm);
    setFormErrors({});
    setFormError("");
  };

  const openEdit = (resource) => {
    setEditor({ mode: "edit", resource });
    setForm({
      title: resource.title || "",
      description: resource.description || "",
      link: resource.link || "",
    });
    setFormErrors({});
    setFormError("");
  };

  const openDetails = async (resource) => {
    const requestId = detailsRequest.current + 1;
    detailsRequest.current = requestId;
    setDetails(resource);
    setDetailsLoading(true);
    setDetailsError("");
    try {
      const response = await getResourceById(getResourceId(resource));
      if (!response?.success || !response.data) {
        throw new Error(response?.message || "Resource details could not be loaded.");
      }
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
    setDetailsLoading(false);
    setDetailsError("");
  };

  const saveResource = async (event) => {
    event.preventDefault();
    if (mutationLock.current) return;

    const errors = validateForm(form);
    setFormErrors(errors);
    setFormError("");
    if (Object.keys(errors).length > 0) return;

    mutationLock.current = true;
    setIsSaving(true);
    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      link: safeExternalUrl(form.link.trim()),
    };

    try {
      const response = editor.mode === "edit"
        ? await updateResource(getResourceId(editor.resource), payload)
        : await createResource(payload);
      if (!response?.success) {
        throw new Error(response?.message || `Unable to ${editor.mode === "edit" ? "update" : "add"} the resource.`);
      }
      setEditor(null);
      setToastIsError(false);
      setToast(response.message || (editor.mode === "edit" ? "Resource updated successfully." : "Resource added successfully."));
      setListVersion((current) => current + 1);
    } catch (error) {
      setFormError(error?.message || "Unable to save the resource. Please try again.");
    } finally {
      mutationLock.current = false;
      setIsSaving(false);
    }
  };

  const confirmDelete = async () => {
    if (!deleteTarget || mutationLock.current) return;
    mutationLock.current = true;
    setIsDeleting(true);
    try {
      const response = await deleteResource(getResourceId(deleteTarget));
      if (!response?.success) {
        throw new Error(response?.message || "Unable to delete this resource.");
      }
      setDeleteTarget(null);
      setToastIsError(false);
      setToast(response.message || "Resource deleted successfully.");
      setListVersion((current) => current + 1);
    } catch (error) {
      setToastIsError(true);
      setToast(error?.message || "Unable to delete this resource.");
    } finally {
      mutationLock.current = false;
      setIsDeleting(false);
    }
  };

  const renderAddButton = (className = primaryButtonClassName, disabled = false) => (
    <button type="button" onClick={openCreate} disabled={disabled} className={className}>
      <span className="mr-2 text-lg leading-none" aria-hidden="true">+</span>
      Add Resource
    </button>
  );

  return (
    <main className="flex-1 bg-[#F8F6EF] px-4 py-9 sm:px-6 sm:py-12 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.16em] text-[#747566]">Programming Club · President</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-[-0.045em] text-[#24241F] sm:text-4xl">Manage Resources</h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#68695D]">Organize and share valuable learning materials with club members.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <div className="rounded-2xl border border-[#DDD6C9] bg-white/70 px-4 py-3 shadow-sm">
              <p className="text-[11px] font-medium uppercase tracking-wide text-[#747566]">Total resources</p>
              <p className="mt-1 text-2xl font-semibold tracking-tight text-[#24241F]">{resources.length}</p>
            </div>
            <div className="rounded-2xl border border-[#DDD6C9] bg-white/70 px-4 py-3 shadow-sm">
              <p className="text-[11px] font-medium uppercase tracking-wide text-[#747566]">Recently added</p>
              <p className="mt-1 text-2xl font-semibold tracking-tight text-[#24241F]">{recentCount}</p>
              <p className="text-[10px] text-[#747566]">Last 30 days</p>
            </div>
            {renderAddButton(primaryButtonClassName, isSaving || isDeleting)}
          </div>
        </header>

        {toast && <p role={toastIsError ? "alert" : "status"} aria-live="polite" className={`mt-5 rounded-xl border px-4 py-3 text-sm ${toastIsError ? "border-red-200 bg-red-50 text-red-800" : "border-green-200 bg-green-50 text-green-800"}`}>{toast}</p>}

        <section className="mt-7 rounded-3xl border border-[#DDD6C9] bg-white/60 p-4 shadow-[0_8px_24px_rgba(36,36,31,0.025)] sm:p-5">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div className="w-full sm:max-w-lg">
              <label htmlFor="resource-search" className="mb-1.5 block text-xs font-medium text-[#55574A]">Search resources</label>
              <input
                id="resource-search"
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search by title or description..."
                className={inputClassName}
              />
            </div>
            {search && <button type="button" onClick={() => setSearch("")} className={secondaryButtonClassName}>Clear search</button>}
          </div>
        </section>

        {loadError ? (
          <section className="mt-6 rounded-3xl border border-red-200 bg-red-50 p-6">
            <p role="alert" className="text-sm text-red-800">{loadError}</p>
            <button type="button" onClick={() => {
              setLoadError("");
              setListVersion((current) => current + 1);
            }} className="mt-3 rounded-lg px-2 py-1 text-sm font-semibold text-red-900 underline underline-offset-4">Retry</button>
          </section>
        ) : isLoading ? (
          <div className="mt-6 space-y-3" role="status" aria-label="Loading resources">
            {[0, 1, 2].map((item) => <div key={item} className="h-24 animate-pulse rounded-2xl border border-[#DDD6C9] bg-white/70" />)}
          </div>
        ) : resources.length === 0 ? (
          <section className="mt-6 rounded-3xl border border-dashed border-[#CFC8B9] bg-white/45 px-6 py-14 text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-[#E7DDCE]/75 text-[#55574A]" aria-hidden="true">
              <svg viewBox="0 0 24 24" className="h-6 w-6 fill-none stroke-current stroke-[1.6]" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 4h14v16H5zM8 8h8M8 12h8M8 16h5" />
              </svg>
            </div>
            <h2 className="mt-4 text-lg font-semibold text-[#35382D]">No resources have been added yet.</h2>
            <p className="mt-2 text-sm text-[#68695D]">Share a helpful learning resource with your club members.</p>
            <div className="mt-5">{renderAddButton()}</div>
          </section>
        ) : filteredResources.length === 0 ? (
          <section className="mt-6 rounded-3xl border border-dashed border-[#CFC8B9] bg-white/45 px-6 py-12 text-center">
            <h2 className="text-lg font-semibold text-[#35382D]">No resources found matching your search.</h2>
            <p className="mt-2 text-sm text-[#68695D]">Try a different title or description search.</p>
            <button type="button" onClick={() => setSearch("")} className={`${secondaryButtonClassName} mt-4`}>Clear search</button>
          </section>
        ) : (
          <section className="mt-6">
            <div className="hidden overflow-hidden rounded-3xl border border-[#DDD6C9] bg-white/70 shadow-[0_8px_24px_rgba(36,36,31,0.025)] md:block">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[980px] text-left">
                  <thead className="border-b border-[#E8E3D9] bg-[#F3F0E8] text-xs font-semibold uppercase tracking-wide text-[#747566]">
                    <tr>
                      <th scope="col" className="px-5 py-4">Resource title</th>
                      <th scope="col" className="px-5 py-4">Description</th>
                      <th scope="col" className="px-5 py-4">Resource link</th>
                      <th scope="col" className="whitespace-nowrap px-5 py-4">Created date</th>
                      <th scope="col" className="whitespace-nowrap px-5 py-4">Last updated</th>
                      <th scope="col" className="px-5 py-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E8E3D9]">
                    {filteredResources.map((resource) => {
                      const externalUrl = safeExternalUrl(resource.link);
                      return (
                        <tr key={getResourceId(resource)} className="align-top">
                          <td className="max-w-56 px-5 py-4 text-sm font-semibold text-[#24241F]">{resource.title || "Untitled resource"}</td>
                          <td className="max-w-64 px-5 py-4">
                            <p className="line-clamp-2 text-xs leading-5 text-[#55574A]">{resource.description || "No description provided."}</p>
                            {resource.description?.length > 100 && <button type="button" onClick={() => openDetails(resource)} className="mt-1 text-xs font-medium text-[#35382D] underline underline-offset-4">View full description</button>}
                          </td>
                          <td className="max-w-48 px-5 py-4 text-xs">
                            {externalUrl ? <a href={externalUrl} target="_blank" rel="noopener noreferrer" className="break-all font-medium text-[#455C64] underline underline-offset-4 hover:text-[#24241F]">Visit resource</a> : <span className="text-[#747566]">No valid link</span>}
                          </td>
                          <td className="whitespace-nowrap px-5 py-4 text-xs text-[#55574A]">{formatDate(resource.createdAt)}</td>
                          <td className="whitespace-nowrap px-5 py-4 text-xs text-[#55574A]">{formatDate(resource.updatedAt)}</td>
                          <td className="px-5 py-4"><ResourceActions resource={resource} onView={openDetails} onEdit={openEdit} onDelete={setDeleteTarget} disabled={isSaving || isDeleting} /></td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="grid gap-3 md:hidden">
              {filteredResources.map((resource) => {
                const externalUrl = safeExternalUrl(resource.link);
                return (
                  <article key={getResourceId(resource)} className="rounded-2xl border border-[#DDD6C9] bg-white/70 p-4 shadow-[0_6px_18px_rgba(36,36,31,0.025)]">
                    <h2 className="break-words text-base font-semibold text-[#24241F]">{resource.title || "Untitled resource"}</h2>
                    <p className="mt-2 line-clamp-3 whitespace-pre-line break-words text-sm leading-6 text-[#55574A]">{resource.description || "No description provided."}</p>
                    {resource.description?.length > 100 && <button type="button" onClick={() => openDetails(resource)} className="mt-1 text-xs font-medium text-[#35382D] underline underline-offset-4">View full description</button>}
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-[#68695D]">
                      <span>Created {formatDate(resource.createdAt)}</span>
                      <span>Updated {formatDate(resource.updatedAt)}</span>
                    </div>
                    {externalUrl && <a href={externalUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-flex text-xs font-medium text-[#455C64] underline underline-offset-4">Visit resource</a>}
                    <div className="mt-3 border-t border-[#E8E3D9] pt-2">
                      <ResourceActions resource={resource} onView={openDetails} onEdit={openEdit} onDelete={setDeleteTarget} disabled={isSaving || isDeleting} />
                    </div>
                  </article>
                );
              })}
            </div>
          </section>
        )}
      </div>

      {editor && (
        <Modal
          title={editor.mode === "edit" ? "Edit resource" : "Add resource"}
          titleId="resource-editor-title"
          onClose={() => {
            if (!isSaving) setEditor(null);
          }}
        >
          <ResourceForm
            mode={editor.mode}
            form={form}
            setForm={setForm}
            onSubmit={saveResource}
            onCancel={() => setEditor(null)}
            errors={formErrors}
            formError={formError}
            isSaving={isSaving}
          />
        </Modal>
      )}

      {details && (
        <Modal title="Resource details" titleId="resource-details-title" onClose={closeDetails}>
          {detailsLoading && <p role="status" className="mt-4 text-sm text-[#68695D]">Loading resource details...</p>}
          {detailsError && <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">{detailsError}</p>}
          <div className="mt-5">
            <h3 className="break-words text-lg font-semibold text-[#24241F]">{details.title || "Untitled resource"}</h3>
            <p className="mt-3 whitespace-pre-line break-words text-sm leading-6 text-[#55574A]">{details.description || "No description provided."}</p>
            <dl className="mt-5 grid gap-3 border-t border-[#E8E3D9] pt-4 text-sm sm:grid-cols-2">
              <div><dt className="text-xs text-[#747566]">Created</dt><dd className="mt-1 font-medium text-[#35382D]">{formatDate(details.createdAt)}</dd></div>
              <div><dt className="text-xs text-[#747566]">Last updated</dt><dd className="mt-1 font-medium text-[#35382D]">{formatDate(details.updatedAt)}</dd></div>
            </dl>
            {safeExternalUrl(details.link) && (
              <a href={safeExternalUrl(details.link)} target="_blank" rel="noopener noreferrer" className={`${primaryButtonClassName} mt-5 w-full sm:w-auto`}>
                Visit resource
              </a>
            )}
          </div>
        </Modal>
      )}

      {deleteTarget && (
        <Modal title="Delete resource?" titleId="delete-resource-title" onClose={() => {
          if (!isDeleting) setDeleteTarget(null);
        }} size="max-w-md">
          <p className="mt-3 break-words text-sm font-semibold text-[#24241F]">{deleteTarget.title || "Untitled resource"}</p>
          <p className="mt-2 text-sm leading-6 text-[#68695D]">This permanently deletes the resource. This action cannot be undone.</p>
          {toast && toastIsError && <p role="alert" className="mt-3 text-sm text-red-800">{toast}</p>}
          <div className="mt-6 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <button type="button" onClick={() => setDeleteTarget(null)} disabled={isDeleting} className={secondaryButtonClassName}>Cancel</button>
            <button type="button" onClick={confirmDelete} disabled={isDeleting} className="rounded-xl bg-[#8A433B] px-4 py-2.5 text-sm font-medium text-white transition hover:bg-[#71372F] disabled:cursor-not-allowed disabled:opacity-50">
              {isDeleting ? "Deleting..." : "Delete resource"}
            </button>
          </div>
        </Modal>
      )}
    </main>
  );
}
