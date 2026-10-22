"use client";

import { ImagePlus, Loader2, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { useMemo, useRef, useState } from "react";
import type { CatalogDesign } from "@/lib/blouse-pricing";
import { api, errorFields, errorMessage, uploadImage } from "@/lib/api";
import { useToast } from "@/context/store";
import { cn, formatINR } from "@/lib/utils";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Field, TextArea, TextInput } from "@/components/ui/fields";

type DesignForm = {
  name: string;
  slug: string;
  description: string;
  category: string;
  image: string;
  gallery: string[];
  price: string;
  isActive: boolean;
  sortOrder: string;
};

const EMPTY: DesignForm = {
  name: "",
  slug: "",
  description: "",
  category: "",
  image: "",
  gallery: [],
  price: "0",
  isActive: true,
  sortOrder: "0",
};

const slugify = (v: string) =>
  v
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);

function validate(f: DesignForm): Record<string, string> {
  const e: Record<string, string> = {};
  if (f.name.trim().length < 2) e.name = "Give the design a name";
  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(f.slug)) e.slug = "Use lowercase letters, numbers and hyphens";
  if (!f.image) e.image = "Upload a main image";
  if (!/^\d+$/.test(f.price.trim())) e.price = f.price.trim().startsWith("-") ? "Prices can't be negative" : "Use whole rupees, e.g. 499";
  else if (Number(f.price) > 1_000_000) e.price = "That price is too high";
  if (!/^\d+$/.test(f.sortOrder.trim()) || Number(f.sortOrder) > 9999) e.sortOrder = "Use a number from 0 to 9999";
  return e;
}

export function BlouseDesignsManager({
  designs,
  onChange,
}: {
  designs: CatalogDesign[];
  onChange: (designs: CatalogDesign[]) => void;
}) {
  const { showToast } = useToast();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "inactive">("all");
  const [editing, setEditing] = useState<CatalogDesign | "new" | null>(null);
  const [deleting, setDeleting] = useState<CatalogDesign | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return [...designs]
      .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name))
      .filter((d) => (status === "all" ? true : status === "active" ? d.isActive : !d.isActive))
      .filter((d) => !q || `${d.name} ${d.slug} ${d.category}`.toLowerCase().includes(q));
  }, [designs, query, status]);

  const upsert = (design: CatalogDesign) => {
    const exists = designs.some((d) => d.id === design.id);
    onChange(exists ? designs.map((d) => (d.id === design.id ? design : d)) : [...designs, design]);
  };

  const toggleActive = async (d: CatalogDesign) => {
    setBusyId(d.id);
    try {
      const { id: _id, ...rest } = d;
      void _id;
      const res = await api<{ design: CatalogDesign }>(`/api/admin/blouse-designs/${d.id}`, {
        method: "PUT",
        body: { ...rest, isActive: !d.isActive },
      });
      upsert(res.design);
      showToast(res.design.isActive ? "Design activated" : "Design hidden", res.design.name);
    } catch (error) {
      showToast("Couldn't update the design", errorMessage(error), "error");
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <div className="mb-5 flex flex-wrap items-center gap-3">
        <label className="relative min-w-0 flex-1 basis-56">
          <span className="sr-only">Search designs</span>
          <Search width={15} height={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-taupe" aria-hidden />
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by name, slug or category"
            className="h-10 w-full rounded-full border border-clay bg-white/70 pl-10 pr-4 text-sm text-charcoal placeholder:text-taupe focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold-soft/40"
          />
        </label>
        <div className="flex gap-1.5" role="group" aria-label="Filter by status">
          {(["all", "active", "inactive"] as const).map((s) => (
            <button
              key={s}
              type="button"
              aria-pressed={status === s}
              onClick={() => setStatus(s)}
              className={cn(
                "min-h-9 rounded-full border px-3.5 text-xs font-medium capitalize transition-colors",
                status === s ? "border-charcoal bg-charcoal text-ivory" : "border-clay text-mist hover:border-charcoal hover:text-charcoal"
              )}
            >
              {s}
            </button>
          ))}
        </div>
        <Button type="button" size="sm" onClick={() => setEditing("new")}>
          <Plus width={14} height={14} aria-hidden />
          New design
        </Button>
      </div>

      {designs.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-clay p-10 text-center">
          <p className="font-medium text-charcoal">No designs yet</p>
          <p className="mx-auto mt-1 max-w-md text-sm text-mist">
            The builder works without designs. Add one and customers will choose it as the starting point for their blouse.
          </p>
          <Button type="button" size="sm" className="mt-5" onClick={() => setEditing("new")}>
            <Plus width={14} height={14} aria-hidden />
            Add the first design
          </Button>
        </div>
      ) : visible.length === 0 ? (
        <p className="rounded-xl bg-cream/50 p-8 text-center text-sm text-mist">No designs match your search.</p>
      ) : (
        <ul className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {visible.map((d) => (
            <li key={d.id} className="flex flex-col overflow-hidden rounded-2xl border border-clay/60 bg-white/60">
              <div className="relative aspect-[4/3] bg-cream">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={d.image} alt="" className={cn("h-full w-full object-cover", !d.isActive && "opacity-50 grayscale")} />
                <span
                  className={cn(
                    "absolute left-3 top-3 rounded-full px-2.5 py-1 text-[0.68rem] font-medium",
                    d.isActive ? "bg-green-100 text-green-900" : "bg-sand text-charcoal"
                  )}
                >
                  {d.isActive ? "Active" : "Hidden"}
                </span>
              </div>
              <div className="flex flex-1 flex-col p-4">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <h3 className="truncate font-medium text-charcoal">{d.name}</h3>
                    <p className="truncate text-xs text-mist">
                      {d.category || "No category"} · order {d.sortOrder}
                    </p>
                  </div>
                  <span className="shrink-0 text-sm font-medium tabular-nums text-charcoal">
                    {d.price > 0 ? `+${formatINR(d.price)}` : "Included"}
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEditing(d)}
                    className="inline-flex min-h-9 items-center gap-1.5 rounded-full border border-clay px-3.5 text-xs font-medium text-charcoal hover:border-charcoal"
                  >
                    <Pencil width={13} height={13} aria-hidden />
                    Edit
                  </button>
                  <button
                    type="button"
                    disabled={busyId === d.id}
                    onClick={() => toggleActive(d)}
                    className="inline-flex min-h-9 items-center rounded-full border border-clay px-3.5 text-xs font-medium text-charcoal hover:border-charcoal disabled:opacity-50"
                  >
                    {d.isActive ? "Hide" : "Activate"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setDeleting(d)}
                    className="ml-auto inline-flex min-h-9 items-center gap-1.5 rounded-full px-3 text-xs text-taupe hover:bg-red-50 hover:text-red-700"
                    aria-label={`Delete ${d.name}`}
                  >
                    <Trash2 width={13} height={13} aria-hidden />
                    Delete
                  </button>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      <DesignEditor
        key={editing === "new" ? "new" : (editing?.id ?? "closed")}
        design={editing}
        nextOrder={designs.reduce((m, d) => Math.max(m, d.sortOrder + 1), 0)}
        onClose={() => setEditing(null)}
        onSaved={(d) => {
          upsert(d);
          setEditing(null);
        }}
      />
      <DeleteDesign
        design={deleting}
        onClose={() => setDeleting(null)}
        onDeleted={(id) => {
          onChange(designs.filter((d) => d.id !== id));
          setDeleting(null);
        }}
      />
    </div>
  );
}

function DesignEditor({
  design,
  nextOrder,
  onClose,
  onSaved,
}: {
  design: CatalogDesign | "new" | null;
  nextOrder: number;
  onClose: () => void;
  onSaved: (design: CatalogDesign) => void;
}) {
  const { showToast } = useToast();
  const isNew = design === "new";
  const [form, setForm] = useState<DesignForm>(() =>
    design && design !== "new"
      ? { ...design, price: String(design.price), sortOrder: String(design.sortOrder) }
      : { ...EMPTY, sortOrder: String(nextOrder) }
  );
  const [slugTouched, setSlugTouched] = useState(!isNew);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [uploading, setUploading] = useState<"main" | "gallery" | null>(null);
  const [saving, setSaving] = useState(false);
  const mainRef = useRef<HTMLInputElement>(null);
  const galleryRef = useRef<HTMLInputElement>(null);

  const set = <K extends keyof DesignForm>(key: K, value: DesignForm[K]) => setForm((f) => ({ ...f, [key]: value }));

  const upload = async (files: FileList | null, target: "main" | "gallery") => {
    if (!files?.length) return;
    setUploading(target);
    try {
      if (target === "main") {
        set("image", await uploadImage(files[0], "products"));
      } else {
        const room = 8 - form.gallery.length;
        const urls: string[] = [];
        for (const file of Array.from(files).slice(0, room)) urls.push(await uploadImage(file, "products"));
        setForm((f) => ({ ...f, gallery: [...f.gallery, ...urls] }));
      }
    } catch (error) {
      showToast("Upload failed", errorMessage(error), "error");
    } finally {
      setUploading(null);
      if (mainRef.current) mainRef.current.value = "";
      if (galleryRef.current) galleryRef.current.value = "";
    }
  };

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (saving) return;
    const local = validate(form);
    setErrors(local);
    setFormError(null);
    if (Object.keys(local).length > 0) return;
    setSaving(true);
    const body = {
      name: form.name.trim(),
      slug: form.slug,
      description: form.description.trim(),
      category: form.category.trim(),
      image: form.image,
      gallery: form.gallery,
      price: Number(form.price),
      isActive: form.isActive,
      sortOrder: Number(form.sortOrder),
    };
    try {
      const res = await api<{ design: CatalogDesign }>(
        isNew ? "/api/admin/blouse-designs" : `/api/admin/blouse-designs/${(design as CatalogDesign).id}`,
        { method: isNew ? "POST" : "PUT", body }
      );
      showToast(isNew ? "Design added" : "Design saved", res.design.name);
      onSaved(res.design);
    } catch (error) {
      setErrors(errorFields(error));
      setFormError(errorMessage(error));
    } finally {
      setSaving(false);
    }
  };

  const price = /^\d+$/.test(form.price) ? Number(form.price) : null;

  return (
    <Modal open={design !== null} onClose={onClose} title={isNew ? "New blouse design" : "Edit design"} className="max-w-3xl">
      <form onSubmit={submit} noValidate className="grid gap-6 md:grid-cols-[minmax(0,1fr)_220px]">
        <div className="min-w-0 space-y-4">
          {formError && (
            <p role="alert" className="rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
              {formError}
            </p>
          )}
          <Field label="Design name" required error={errors.name}>
            <TextInput
              value={form.name}
              maxLength={80}
              error={!!errors.name}
              onChange={(e) => {
                const name = e.target.value;
                setForm((f) => ({ ...f, name, slug: slugTouched ? f.slug : slugify(name) }));
              }}
            />
          </Field>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field label="Slug" required error={errors.slug} hint="Unique, used in links">
              <TextInput
                value={form.slug}
                error={!!errors.slug}
                onChange={(e) => {
                  setSlugTouched(true);
                  set("slug", slugify(e.target.value));
                }}
              />
            </Field>
            <Field label="Category" error={errors.category} hint="e.g. Bridal, Everyday">
              <TextInput value={form.category} maxLength={60} onChange={(e) => set("category", e.target.value)} />
            </Field>
          </div>
          <Field label="Description" error={errors.description}>
            <TextArea rows={3} maxLength={600} value={form.description} onChange={(e) => set("description", e.target.value)} />
          </Field>
          <div className="grid gap-4 sm:grid-cols-3">
            <Field label="Design price (₹)" required error={errors.price} hint="Added to the base price; 0 = included">
              <TextInput inputMode="numeric" value={form.price} error={!!errors.price} onChange={(e) => set("price", e.target.value)} />
            </Field>
            <Field label="Display order" required error={errors.sortOrder} hint="Lower shows first">
              <TextInput inputMode="numeric" value={form.sortOrder} error={!!errors.sortOrder} onChange={(e) => set("sortOrder", e.target.value)} />
            </Field>
            <label className="flex min-h-10 items-center gap-2.5 self-center text-sm text-charcoal sm:mt-5">
              <input type="checkbox" checked={form.isActive} onChange={(e) => set("isActive", e.target.checked)} className="h-4 w-4 accent-charcoal" />
              Show in builder
            </label>
          </div>

          <div>
            <span className="mb-1.5 block text-[0.68rem] font-medium uppercase tracking-[0.18em] text-charcoal/70">
              Main image <span className="text-gold-deep">*</span>
            </span>
            <input ref={mainRef} type="file" accept="image/jpeg,image/png,image/webp" className="sr-only" id="design-main" onChange={(e) => upload(e.target.files, "main")} />
            <label
              htmlFor="design-main"
              className={cn(
                "inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-full border px-4 text-sm text-charcoal hover:border-charcoal",
                errors.image ? "border-red-400" : "border-clay"
              )}
            >
              {uploading === "main" ? <Loader2 width={15} height={15} className="animate-spin" aria-hidden /> : <ImagePlus width={15} height={15} aria-hidden />}
              {form.image ? "Replace image" : "Upload image"}
            </label>
            <span className="ml-3 text-xs text-taupe">JPG, PNG or WebP, up to 5 MB</span>
            {errors.image && <span className="mt-1 block text-xs text-red-600">{errors.image}</span>}
          </div>

          <div>
            <span className="mb-1.5 block text-[0.68rem] font-medium uppercase tracking-[0.18em] text-charcoal/70">
              Gallery ({form.gallery.length}/8)
            </span>
            <div className="flex flex-wrap gap-2">
              {form.gallery.map((url) => (
                <span key={url} className="relative h-16 w-16 overflow-hidden rounded-lg bg-cream">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt="" className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => set("gallery", form.gallery.filter((g) => g !== url))}
                    className="absolute right-0.5 top-0.5 flex h-6 w-6 items-center justify-center rounded-full bg-ink/70 text-ivory"
                    aria-label="Remove gallery image"
                  >
                    <X width={12} height={12} />
                  </button>
                </span>
              ))}
              {form.gallery.length < 8 && (
                <>
                  <input ref={galleryRef} type="file" multiple accept="image/jpeg,image/png,image/webp" className="sr-only" id="design-gallery" onChange={(e) => upload(e.target.files, "gallery")} />
                  <label
                    htmlFor="design-gallery"
                    className="flex h-16 w-16 cursor-pointer items-center justify-center rounded-lg border border-dashed border-clay text-taupe hover:border-charcoal hover:text-charcoal"
                    aria-label="Add gallery images"
                  >
                    {uploading === "gallery" ? <Loader2 width={16} height={16} className="animate-spin" /> : <Plus width={16} height={16} />}
                  </label>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Customer preview */}
        <div>
          <span className="mb-1.5 block text-[0.68rem] font-medium uppercase tracking-[0.18em] text-charcoal/70">Customer preview</span>
          <div className={cn("overflow-hidden rounded-xl border border-gold bg-cream shadow-soft", !form.isActive && "opacity-60")}>
            <div className="aspect-[4/3] bg-sand">
              {form.image ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={form.image} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="flex h-full items-center justify-center text-xs text-taupe">No image yet</span>
              )}
            </div>
            <div className="p-3">
              <p className="text-sm font-medium text-charcoal">{form.name || "Design name"}</p>
              {form.description && <p className="mt-0.5 line-clamp-2 text-xs text-mist">{form.description}</p>}
              <p className={cn("mt-1.5 text-xs", price && price > 0 ? "text-gold-deep" : "text-taupe")}>
                {price && price > 0 ? `+${formatINR(price)}` : "Included"}
              </p>
            </div>
          </div>
          {!form.isActive && <p className="mt-2 text-xs text-mist">Hidden: customers won&apos;t see this design.</p>}
          <div className="mt-6 flex flex-col gap-2">
            <Button type="submit" disabled={saving || uploading !== null}>
              {saving ? (
                <>
                  <Loader2 width={15} height={15} className="animate-spin" aria-hidden />
                  Saving…
                </>
              ) : isNew ? (
                "Add design"
              ) : (
                "Save changes"
              )}
            </Button>
            <Button type="button" variant="outline" onClick={onClose} disabled={saving}>
              Cancel
            </Button>
          </div>
        </div>
      </form>
    </Modal>
  );
}

function DeleteDesign({
  design,
  onClose,
  onDeleted,
}: {
  design: CatalogDesign | null;
  onClose: () => void;
  onDeleted: (id: string) => void;
}) {
  const { showToast } = useToast();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remove = async () => {
    if (!design) return;
    setPending(true);
    setError(null);
    try {
      await api(`/api/admin/blouse-designs/${design.id}`, { method: "DELETE" });
      showToast("Design deleted", design.name);
      onDeleted(design.id);
    } catch (err) {
      setError(errorMessage(err));
    } finally {
      setPending(false);
    }
  };

  return (
    <Modal
      open={design !== null}
      onClose={() => {
        setError(null);
        onClose();
      }}
      title="Delete design?"
    >
      <p className="text-sm text-mist">
        <span className="font-medium text-charcoal">{design?.name}</span> will be removed from the builder permanently.
        Designs that appear on past orders can&apos;t be deleted; hide them instead.
      </p>
      {error && (
        <p role="alert" className="mt-4 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </p>
      )}
      <div className="mt-6 flex justify-end gap-2">
        <Button type="button" variant="outline" onClick={onClose} disabled={pending}>
          Keep it
        </Button>
        <button
          type="button"
          onClick={remove}
          disabled={pending}
          className="inline-flex h-12 items-center gap-2 rounded-full bg-red-700 px-6 text-[0.72rem] font-semibold uppercase tracking-[0.16em] text-white hover:bg-red-800 disabled:opacity-50"
        >
          {pending ? <Loader2 width={15} height={15} className="animate-spin" aria-hidden /> : <Trash2 width={15} height={15} aria-hidden />}
          Delete
        </button>
      </div>
    </Modal>
  );
}
