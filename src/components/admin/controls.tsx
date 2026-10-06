"use client";

import { Trash2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api, errorMessage } from "@/lib/api";
import { useToast } from "@/context/store";
import { cn } from "@/lib/utils";

const selectClass =
  "h-9 rounded-full border border-clay bg-white/70 px-3 pr-7 text-xs font-medium text-charcoal focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold-soft/40 disabled:opacity-60";

/** Dropdown that PATCHes `{ [field]: value }` to an admin endpoint and refreshes the page data. */
export function StatusSelect({
  endpoint,
  field = "status",
  value,
  options,
  label,
  className,
}: {
  endpoint: string;
  field?: string;
  value: string;
  options: readonly string[];
  label: string;
  className?: string;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [pending, setPending] = useState(false);

  const change = async (next: string) => {
    if (next === value) return;
    setPending(true);
    try {
      await api(endpoint, { method: "PATCH", body: { [field]: next } });
      showToast("Updated", `${label}: ${next}`);
      router.refresh();
    } catch (error) {
      showToast("Update failed", errorMessage(error), "error");
    } finally {
      setPending(false);
    }
  };

  return (
    <select
      aria-label={label}
      value={value}
      disabled={pending}
      onChange={(e) => change(e.target.value)}
      className={cn(selectClass, className)}
    >
      {!options.includes(value) && <option value={value}>{value}</option>}
      {options.map((o) => (
        <option key={o} value={o}>
          {o}
        </option>
      ))}
    </select>
  );
}

/** Generic admin mutation button (PATCH/POST/DELETE) with optional confirmation. */
export function ActionButton({
  endpoint,
  method = "PATCH",
  body,
  confirm,
  children,
  success,
  variant = "outline",
  ariaLabel,
}: {
  endpoint: string;
  method?: "PATCH" | "POST" | "DELETE" | "PUT";
  body?: unknown;
  confirm?: string;
  children: React.ReactNode;
  success?: string;
  variant?: "outline" | "danger" | "solid";
  ariaLabel?: string;
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [pending, setPending] = useState(false);

  const run = async () => {
    if (confirm && !window.confirm(confirm)) return;
    setPending(true);
    try {
      await api(endpoint, { method, body });
      if (success) showToast(success);
      router.refresh();
    } catch (error) {
      showToast("Action failed", errorMessage(error), "error");
    } finally {
      setPending(false);
    }
  };

  return (
    <button
      onClick={run}
      disabled={pending}
      aria-label={ariaLabel}
      className={cn(
        "inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 text-xs font-medium transition-colors disabled:opacity-50",
        variant === "outline" && "border border-clay text-charcoal hover:border-charcoal",
        variant === "solid" && "bg-charcoal text-ivory hover:bg-ink",
        variant === "danger" && "border border-clay text-taupe hover:border-red-300 hover:text-red-700"
      )}
    >
      {variant === "danger" && <Trash2 width={13} height={13} />}
      {children}
    </button>
  );
}

/** Small inline form that PATCHes a single text value (notes, stock…). */
export function InlineField({
  endpoint,
  field,
  initial = "",
  placeholder,
  label,
  type = "text",
  buttonLabel = "Save",
  clearOnSave,
  transform,
}: {
  endpoint: string;
  field: string;
  initial?: string;
  placeholder?: string;
  label: string;
  type?: "text" | "number" | "date";
  buttonLabel?: string;
  clearOnSave?: boolean;
  transform?: "number";
}) {
  const router = useRouter();
  const { showToast } = useToast();
  const [value, setValue] = useState(initial);
  const [pending, setPending] = useState(false);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim() === "") return;
    setPending(true);
    try {
      await api(endpoint, {
        method: "PATCH",
        body: { [field]: transform === "number" ? Number(value) : value },
      });
      showToast("Saved", label);
      if (clearOnSave) setValue("");
      router.refresh();
    } catch (error) {
      showToast("Couldn't save", errorMessage(error), "error");
    } finally {
      setPending(false);
    }
  };

  return (
    <form onSubmit={save} className="flex items-center gap-2">
      <input
        type={type}
        value={value}
        min={type === "number" ? 0 : undefined}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        aria-label={label}
        className={cn(
          "h-9 min-w-0 rounded-full border border-clay bg-white/70 px-3.5 text-xs text-charcoal placeholder:text-taupe focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold-soft/40",
          type === "number" ? "w-20" : "flex-1"
        )}
      />
      <button
        type="submit"
        disabled={pending || value.trim() === "" || value === initial}
        className="h-9 shrink-0 rounded-full bg-charcoal px-4 text-xs font-medium text-ivory transition-colors hover:bg-ink disabled:opacity-40"
      >
        {buttonLabel}
      </button>
    </form>
  );
}
