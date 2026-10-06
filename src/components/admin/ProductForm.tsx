"use client";

import { ArrowLeft, ArrowRight, ImagePlus, Loader2, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import type { CollectionItem, Product } from "@/types";
import { api, errorFields, errorMessage, uploadImage } from "@/lib/api";
import { CATEGORY_OPTIONS, OCCASIONS } from "@/lib/config";
import { useToast } from "@/context/store";
import { cn } from "@/lib/utils";
import { Button, LinkButton } from "@/components/ui/Button";
import { Field, Select, TextArea, TextInput } from "@/components/ui/fields";

const toList = (value: string, separator: RegExp) =>
  value.split(separator).map((v) => v.trim()).filter(Boolean);

function initialState(product?: Product) {
  return {
    name: product?.name ?? "",
    slug: product?.slug ?? "",
    shortDescription: product?.shortDescription ?? "",
    description: product?.description ?? "",
    price: product ? String(product.price) : "",
    mrp: product?.mrp ? String(product.mrp) : "",
    category: (product?.category ?? "sarees") as Product["category"],
    subcategory: product?.subcategory ?? "",
    fabric: product?.fabric ?? "",
    color: product?.color ?? "",
    colors: product?.colors.join(", ") ?? "",
    sizes: product?.sizes?.join(", ") ?? "",
    occasions: product?.occasions ?? [],
    pattern: product?.pattern ?? "",
    tags: product?.tags.join(", ") ?? "",
    collections: product?.collections ?? [],
    care: product?.care.join("\n") ?? "",
    details: product?.details.join("\n") ?? "",
    stock: product ? String(product.stock) : "0",
    sku: product?.sku ?? "",
    isNew: product?.isNew ?? false,
    isBestseller: product?.isBestSeller ?? false,
    isFeatured: product?.isFeatured ?? false,
    isCustomizable: product?.customizable ?? false,
    isActive: true,
    deliveryType: (product?.deliveryType ?? "ready") as Product["deliveryType"],
    estimatedDelivery: product?.estimatedDelivery ?? "Ships in 2–4 working days",
    images: product?.images ?? [],
    videos: product?.videos.join("\n") ?? "",
  };
}

type FormState = ReturnType<typeof initialState>;

const FLAGS: { key: "isNew" | "isBestseller" | "isFeatured" | "isCustomizable" | "isActive"; label: string; hint: string }[] = [
  { key: "isActive", label: "Visible on storefront", hint: "Untick to hide without deleting" },
  { key: "isNew", label: "New arrival", hint: "Shown in New Arrivals" },
  { key: "isBestseller", label: "Bestseller", hint: "Shown in Best Sellers" },
  { key: "isFeatured", label: "Designer pick", hint: "Shown in Designer Picks" },
  { key: "isCustomizable", label: "Customizable", hint: "Offers a matching custom blouse" },
];

export function ProductForm({
  product,
  isActive = true,
  collections,
}: {
  product?: Product;
  isActive?: boolean;
  collections: CollectionItem[];
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState<FormState>(() => ({ ...initialState(product), isActive }));
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const set =
    (key: keyof FormState) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const toggleIn = (key: "occasions" | "collections", value: string) =>
    setForm((f) => ({
      ...f,
      [key]: f[key].includes(value) ? f[key].filter((v) => v !== value) : [...f[key], value],
    }));

  const upload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files).slice(0, 12 - form.images.length)) {
        urls.push(await uploadImage(file, "products"));
      }
      setForm((f) => ({ ...f, images: [...f.images, ...urls] }));
    } catch (error) {
      showToast("Upload failed", errorMessage(error), "error");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const moveImage = (index: number, direction: -1 | 1) =>
    setForm((f) => {
      const images = [...f.images];
      const target = index + direction;
      if (target < 0 || target >= images.length) return f;
      [images[index], images[target]] = [images[target], images[index]];
      return { ...f, images };
    });

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    const payload = {
      name: form.name,
      slug: form.slug,
      shortDescription: form.shortDescription,
      description: form.description,
      price: Number(form.price),
      mrp: form.mrp ? Number(form.mrp) : null,
      images: form.images,
      videos: toList(form.videos, /\n/),
      category: form.category,
      subcategory: form.subcategory,
      fabric: form.fabric,
      color: form.color,
      colors: toList(form.colors, /,/),
      sizes: toList(form.sizes, /,/),
      occasions: form.occasions,
      pattern: form.pattern,
      tags: toList(form.tags, /,/).map((t) => t.toLowerCase()),
      collections: form.collections,
      care: toList(form.care, /\n/),
      details: toList(form.details, /\n/),
      stock: Number(form.stock),
      sku: form.sku,
      isNew: form.isNew,
      isBestseller: form.isBestseller,
      isFeatured: form.isFeatured,
      isCustomizable: form.isCustomizable,
      isActive: form.isActive,
      deliveryType: form.deliveryType,
      estimatedDelivery: form.estimatedDelivery,
    };
    try {
      await api(product ? `/api/admin/products/${product.id}` : "/api/admin/products", {
        method: product ? "PUT" : "POST",
        body: payload,
      });
      showToast(product ? "Product updated" : "Product created", form.name);
      router.push("/admin/products");
      router.refresh();
    } catch (error) {
      setErrors(errorFields(error));
      showToast("Couldn't save product", errorMessage(error), "error");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } finally {
      setSaving(false);
    }
  };

  const section = "rounded-2xl border border-clay/60 bg-white/60 p-6";
  const heading = "mb-5 text-base font-medium text-charcoal";
  const errorCount = Object.keys(errors).length;

  return (
    <form onSubmit={submit} noValidate className="space-y-6">
      {errorCount > 0 && (
        <p role="alert" className="rounded-xl bg-red-50 px-4 py-3 text-sm text-red-700">
          Please fix {errorCount} highlighted field{errorCount === 1 ? "" : "s"} below.
        </p>
      )}

      <section className={section}>
        <h3 className={heading}>Basics</h3>
        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Product Name" required error={errors.name} className="sm:col-span-2">
            <TextInput value={form.name} onChange={set("name")} error={!!errors.name} />
          </Field>
          <Field label="URL Slug" error={errors.slug} hint="Leave blank to generate from the name">
            <TextInput value={form.slug} onChange={set("slug")} placeholder="banarasi-silk-saree" error={!!errors.slug} />
          </Field>
          <Field label="SKU" error={errors.sku}>
            <TextInput value={form.sku} onChange={set("sku")} placeholder="UMA-SAR-017" />
          </Field>
          <Field label="Short Description" error={errors.shortDescription} className="sm:col-span-2" hint="One line used in search results and previews">
            <TextInput value={form.shortDescription} onChange={set("shortDescription")} maxLength={300} />
          </Field>
          <Field label="Description" required error={errors.description} className="sm:col-span-2">
            <TextArea value={form.description} onChange={set("description")} rows={5} error={!!errors.description} />
          </Field>
        </div>
      </section>

      <section className={section}>
        <h3 className={heading}>Images &amp; Video</h3>
        <input
          ref={fileRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          multiple
          className="hidden"
          onChange={(e) => upload(e.target.files)}
        />
        <ul className="flex flex-wrap gap-3">
          {form.images.map((src, i) => (
            <li key={src} className="relative w-28">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={src} alt={`Product image ${i + 1}`} className="aspect-[4/5] w-full rounded-lg bg-cream object-cover" />
              {i === 0 && (
                <span className="absolute left-1.5 top-1.5 rounded-full bg-charcoal px-2 py-0.5 text-[0.55rem] font-medium uppercase tracking-wide text-ivory">
                  Cover
                </span>
              )}
              <button
                type="button"
                onClick={() => setForm((f) => ({ ...f, images: f.images.filter((img) => img !== src) }))}
                aria-label={`Remove image ${i + 1}`}
                className="absolute -right-2 -top-2 flex h-6 w-6 items-center justify-center rounded-full bg-charcoal text-ivory"
              >
                <X width={12} height={12} />
              </button>
              <div className="mt-1.5 flex justify-center gap-1">
                <button type="button" onClick={() => moveImage(i, -1)} disabled={i === 0} aria-label={`Move image ${i + 1} earlier`} className="rounded-full border border-clay p-1 text-charcoal disabled:opacity-30">
                  <ArrowLeft width={12} height={12} />
                </button>
                <button type="button" onClick={() => moveImage(i, 1)} disabled={i === form.images.length - 1} aria-label={`Move image ${i + 1} later`} className="rounded-full border border-clay p-1 text-charcoal disabled:opacity-30">
                  <ArrowRight width={12} height={12} />
                </button>
              </div>
            </li>
          ))}
          {form.images.length < 12 && (
            <li>
              <button
                type="button"
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className={cn(
                  "flex aspect-[4/5] w-28 flex-col items-center justify-center gap-1.5 rounded-lg border border-dashed border-clay text-xs text-mist transition-colors hover:border-gold",
                  uploading && "opacity-60"
                )}
              >
                {uploading ? <Loader2 width={18} height={18} className="animate-spin" /> : <ImagePlus width={18} height={18} />}
                {uploading ? "Uploading…" : "Add images"}
              </button>
            </li>
          )}
        </ul>
        {errors.images && <p className="mt-2 text-xs text-red-600">{errors.images}</p>}
        <p className="mt-3 text-xs text-mist">JPG, PNG or WebP up to 5 MB each. The first image is the cover.</p>
        <Field label="Video URLs" hint="Optional — one direct .mp4 / .webm URL per line" className="mt-5" error={errors.videos}>
          <TextArea value={form.videos} onChange={set("videos")} rows={2} className="min-h-0" />
        </Field>
      </section>

      <section className={section}>
        <h3 className={heading}>Pricing &amp; Inventory</h3>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Price (₹)" required error={errors.price}>
            <TextInput type="number" min={1} inputMode="numeric" value={form.price} onChange={set("price")} error={!!errors.price} />
          </Field>
          <Field label="MRP (₹)" error={errors.mrp} hint="Shows the discount when above the price">
            <TextInput type="number" min={1} inputMode="numeric" value={form.mrp} onChange={set("mrp")} error={!!errors.mrp} />
          </Field>
          <Field label="Stock" required error={errors.stock} hint="Ignored for made-to-order pieces">
            <TextInput type="number" min={0} inputMode="numeric" value={form.stock} onChange={set("stock")} error={!!errors.stock} />
          </Field>
          <Field label="Delivery Type">
            <Select value={form.deliveryType} onChange={set("deliveryType")}>
              <option value="ready">Ready to ship</option>
              <option value="made_to_order">Made to order</option>
            </Select>
          </Field>
          <Field label="Delivery Estimate" required error={errors.estimatedDelivery} className="sm:col-span-2 lg:col-span-4" hint="Shown on the product page, e.g. “Ships in 2–4 working days”">
            <TextInput value={form.estimatedDelivery} onChange={set("estimatedDelivery")} error={!!errors.estimatedDelivery} />
          </Field>
        </div>
      </section>

      <section className={section}>
        <h3 className={heading}>Attributes</h3>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          <Field label="Category" required>
            <Select value={form.category} onChange={set("category")}>
              {CATEGORY_OPTIONS.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Subcategory" hint="e.g. Silk Sarees">
            <TextInput value={form.subcategory} onChange={set("subcategory")} />
          </Field>
          <Field label="Fabric">
            <TextInput value={form.fabric} onChange={set("fabric")} />
          </Field>
          <Field label="Primary Colour">
            <TextInput value={form.color} onChange={set("color")} />
          </Field>
          <Field label="Colour Options" hint="Comma separated, if sold in several colours">
            <TextInput value={form.colors} onChange={set("colors")} placeholder="Ivory, Rose Gold" />
          </Field>
          <Field label="Sizes" hint="Comma separated — leave blank for free size">
            <TextInput value={form.sizes} onChange={set("sizes")} placeholder="S, M, L, XL" />
          </Field>
          <Field label="Pattern">
            <TextInput value={form.pattern} onChange={set("pattern")} />
          </Field>
          <Field label="Tags" hint="Comma separated" className="sm:col-span-2">
            <TextInput value={form.tags} onChange={set("tags")} placeholder="silk, wedding, zari" />
          </Field>
        </div>

        <fieldset className="mt-6">
          <legend className="mb-2.5 text-[0.68rem] font-medium uppercase tracking-[0.18em] text-charcoal/70">Occasions</legend>
          <div className="flex flex-wrap gap-2">
            {OCCASIONS.map((o) => (
              <label key={o} className={cn("cursor-pointer rounded-full border px-3.5 py-1.5 text-xs transition-colors", form.occasions.includes(o) ? "border-charcoal bg-charcoal text-ivory" : "border-clay text-mist hover:border-charcoal")}>
                <input type="checkbox" className="sr-only" checked={form.occasions.includes(o)} onChange={() => toggleIn("occasions", o)} />
                {o}
              </label>
            ))}
          </div>
        </fieldset>

        <fieldset className="mt-6">
          <legend className="mb-2.5 text-[0.68rem] font-medium uppercase tracking-[0.18em] text-charcoal/70">Collections</legend>
          <div className="flex flex-wrap gap-2">
            {collections.map((c) => (
              <label key={c.id} className={cn("cursor-pointer rounded-full border px-3.5 py-1.5 text-xs transition-colors", form.collections.includes(c.id) ? "border-charcoal bg-charcoal text-ivory" : "border-clay text-mist hover:border-charcoal")}>
                <input type="checkbox" className="sr-only" checked={form.collections.includes(c.id)} onChange={() => toggleIn("collections", c.id)} />
                {c.name}
              </label>
            ))}
          </div>
        </fieldset>

        <div className="mt-6 grid gap-5 sm:grid-cols-2">
          <Field label="Details & Specifications" hint="One per line">
            <TextArea value={form.details} onChange={set("details")} rows={4} />
          </Field>
          <Field label="Care Instructions" hint="One per line">
            <TextArea value={form.care} onChange={set("care")} rows={4} />
          </Field>
        </div>
      </section>

      <section className={section}>
        <h3 className={heading}>Merchandising</h3>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {FLAGS.map((flag) => (
            <label key={flag.key} className="flex cursor-pointer items-start gap-3 rounded-xl border border-clay/60 p-4">
              <input
                type="checkbox"
                checked={form[flag.key]}
                onChange={(e) => setForm((f) => ({ ...f, [flag.key]: e.target.checked }))}
                className="mt-0.5 h-4 w-4 accent-[#1c1a17]"
              />
              <span>
                <span className="block text-sm font-medium text-charcoal">{flag.label}</span>
                <span className="block text-xs text-mist">{flag.hint}</span>
              </span>
            </label>
          ))}
        </div>
      </section>

      <div className="flex flex-wrap gap-3">
        <Button type="submit" disabled={saving || uploading}>
          {saving ? "Saving…" : product ? "Save Changes" : "Create Product"}
        </Button>
        <LinkButton href="/admin/products" variant="ghost">
          Cancel
        </LinkButton>
      </div>
    </form>
  );
}
