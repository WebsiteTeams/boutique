"use client";

import { cn } from "@/lib/utils";

const baseField =
  "w-full rounded-lg border border-clay bg-white/60 px-3.5 py-2.5 text-sm text-charcoal transition-colors placeholder:text-taupe focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold-soft/40";

interface FieldProps {
  label?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  className?: string;
  children?: React.ReactNode;
}

export function Field({ label, error, hint, required, className, children }: FieldProps) {
  return (
    <label className={cn("block", className)}>
      {label && (
        <span className="mb-1.5 block text-[0.68rem] font-medium uppercase tracking-[0.18em] text-charcoal/70">
          {label}
          {required && <span className="text-gold-deep"> *</span>}
        </span>
      )}
      {children}
      {error ? (
        <span className="mt-1 block text-xs text-red-600">{error}</span>
      ) : hint ? (
        <span className="mt-1 block text-xs text-taupe">{hint}</span>
      ) : null}
    </label>
  );
}

interface TextInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

export function TextInput({ className, error, ...rest }: TextInputProps) {
  return (
    <input
      className={cn(
        baseField,
        error && "border-red-400 focus:border-red-400 focus:ring-red-200",
        className
      )}
      {...rest}
    />
  );
}

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  error?: boolean;
}

export function TextArea({ className, error, ...rest }: TextAreaProps) {
  return (
    <textarea
      className={cn(baseField, "min-h-28 resize-y", error && "border-red-400", className)}
      {...rest}
    />
  );
}

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  error?: boolean;
}

export function Select({ className, error, children, ...rest }: SelectProps) {
  return (
    <select className={cn(baseField, "appearance-none pr-8", error && "border-red-400", className)} {...rest}>
      {children}
    </select>
  );
}
