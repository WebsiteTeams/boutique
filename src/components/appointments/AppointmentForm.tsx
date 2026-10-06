"use client";

import { CalendarCheck, Loader2 } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import type { Appointment } from "@/types";
import { api, errorFields, errorMessage } from "@/lib/api";
import { APPOINTMENT_PURPOSES, APPOINTMENT_SLOTS } from "@/lib/status";
import { useApi } from "@/lib/use-api";
import { cn, formatDate } from "@/lib/utils";
import { useAuth, useToast } from "@/context/store";
import { Button, LinkButton } from "@/components/ui/Button";
import { Field, Select, TextArea, TextInput } from "@/components/ui/fields";

const isoDate = (offsetDays: number) => {
  const d = new Date(Date.now() + offsetDays * 86_400_000);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60_000).toISOString().slice(0, 10);
};

const slotLabel = (slot: string) => {
  const [h, m] = slot.split(":").map(Number);
  return `${((h + 11) % 12) + 1}:${String(m).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`;
};

export function AppointmentForm() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [form, setForm] = useState({
    purpose: APPOINTMENT_PURPOSES[0] as string,
    date: "",
    time: "",
    name: "",
    phone: "",
    email: "",
    notes: "",
  });
  const [prefilledFor, setPrefilledFor] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [confirmed, setConfirmed] = useState<Appointment | null>(null);
  const { data: availability } = useApi<{ booked: string[] }>(
    form.date ? `/api/appointments?date=${form.date}` : null
  );
  const booked = availability?.booked ?? [];

  if (user && prefilledFor !== user.id) {
    setPrefilledFor(user.id);
    setForm((f) => ({ ...f, name: f.name || user.name, phone: f.phone || user.phone, email: f.email || user.email }));
  }

  const set =
    (key: keyof typeof form) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.time) {
      setErrors({ time: "Choose a time slot" });
      return;
    }
    setSubmitting(true);
    setErrors({});
    try {
      const res = await api<{ appointment: Appointment }>("/api/appointments", { body: form });
      setConfirmed(res.appointment);
    } catch (error) {
      setErrors(errorFields(error));
      showToast("Couldn't book the appointment", errorMessage(error), "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (confirmed) {
    return (
      <div className="rounded-2xl border border-gold/40 bg-cream/60 p-8 text-center" role="status">
        <span className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-gold text-white">
          <CalendarCheck width={26} height={26} />
        </span>
        <h2 className="type-heading-lg mt-5 text-charcoal">Request received</h2>
        <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-mist">
          Your {confirmed.purpose} appointment is requested for{" "}
          <span className="font-medium text-charcoal">
            {formatDate(confirmed.date)} at {slotLabel(confirmed.time)}
          </span>
          . Our team will confirm the slot with you shortly.
        </p>
        <p className="mt-4 text-sm text-mist">
          Appointment ID <span className="font-medium text-charcoal">{confirmed.id}</span>
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-3">
          {user ? (
            <LinkButton href="/account?tab=appointments">View My Appointments</LinkButton>
          ) : (
            <LinkButton href="/register?next=/account?tab=appointments" variant="outline">
              Create an Account
            </LinkButton>
          )}
          <Button variant="ghost" onClick={() => setConfirmed(null)}>
            Book Another
          </Button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="rounded-2xl border border-clay/60 bg-white/60 p-6 sm:p-8">
      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Purpose of Visit" required error={errors.purpose} className="sm:col-span-2">
          <Select value={form.purpose} onChange={set("purpose")}>
            {APPOINTMENT_PURPOSES.map((p) => (
              <option key={p}>{p}</option>
            ))}
          </Select>
        </Field>

        <Field label="Preferred Date" required error={errors.date}>
          <TextInput
            type="date"
            min={isoDate(0)}
            max={isoDate(90)}
            value={form.date}
            error={!!errors.date}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value, time: "" }))}
            required
          />
        </Field>

        <div className="sm:col-span-2">
          <span className="mb-1.5 block text-[0.68rem] font-medium uppercase tracking-[0.18em] text-charcoal/70" id="slot-label">
            Preferred Time <span className="text-gold-deep">*</span>
          </span>
          {form.date ? (
            <div className="flex flex-wrap gap-2" role="radiogroup" aria-labelledby="slot-label">
              {APPOINTMENT_SLOTS.map((slot) => {
                const taken = booked.includes(slot);
                return (
                  <button
                    key={slot}
                    type="button"
                    role="radio"
                    aria-checked={form.time === slot}
                    disabled={taken}
                    onClick={() => setForm((f) => ({ ...f, time: slot }))}
                    className={cn(
                      "h-11 rounded-full border px-4 text-sm transition-all disabled:cursor-not-allowed disabled:line-through disabled:opacity-45",
                      form.time === slot
                        ? "border-charcoal bg-charcoal text-ivory"
                        : "border-clay text-charcoal hover:border-charcoal"
                    )}
                  >
                    {slotLabel(slot)}
                  </button>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-mist">Choose a date to see available time slots.</p>
          )}
          {errors.time && <p className="mt-1 text-xs text-red-600">{errors.time}</p>}
        </div>

        <Field label="Your Name" required error={errors.name}>
          <TextInput value={form.name} onChange={set("name")} autoComplete="name" error={!!errors.name} required />
        </Field>
        <Field label="Phone" required error={errors.phone}>
          <TextInput
            type="tel"
            inputMode="numeric"
            maxLength={10}
            placeholder="10-digit mobile number"
            autoComplete="tel-national"
            value={form.phone}
            error={!!errors.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value.replace(/\D/g, "") }))}
            required
          />
        </Field>
        <Field label="Email" required error={errors.email} className="sm:col-span-2">
          <TextInput type="email" value={form.email} onChange={set("email")} autoComplete="email" error={!!errors.email} required />
        </Field>
        <Field label="Notes" hint="Occasion, wedding date, pieces you would like to see" className="sm:col-span-2">
          <TextArea value={form.notes} onChange={set("notes")} maxLength={1000} rows={4} />
        </Field>
      </div>

      <Button type="submit" size="lg" className="mt-7" disabled={submitting}>
        {submitting ? (
          <>
            <Loader2 width={16} height={16} className="animate-spin" />
            Booking…
          </>
        ) : (
          "Request Appointment"
        )}
      </Button>
      {!user && (
        <p className="mt-4 text-xs text-mist">
          <Link href="/login?next=/appointments" className="font-medium text-gold-deep underline underline-offset-4">
            Sign in
          </Link>{" "}
          first to see this appointment in your account.
        </p>
      )}
    </form>
  );
}
