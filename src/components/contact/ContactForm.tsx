"use client";

import { CheckCircle2, Send } from "lucide-react";
import { useState } from "react";
import { api, errorFields, errorMessage } from "@/lib/api";
import { CONTACT_TOPICS } from "@/lib/status";
import { useAuth, useToast } from "@/context/store";
import { Button } from "@/components/ui/Button";
import { Field, Select, TextArea, TextInput } from "@/components/ui/fields";

const EMPTY = { name: "", email: "", phone: "", topic: CONTACT_TOPICS[0] as string, message: "" };

export function ContactForm() {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [form, setForm] = useState(EMPTY);
  const [prefilledFor, setPrefilledFor] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);
  const [sent, setSent] = useState(false);

  if (user && prefilledFor !== user.id) {
    setPrefilledFor(user.id);
    setForm((f) => ({ ...f, name: f.name || user.name, email: f.email || user.email, phone: f.phone || user.phone }));
  }

  const set =
    (key: keyof typeof EMPTY) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrors({});
    try {
      await api("/api/contact", { body: form });
      setSent(true);
      setForm((f) => ({ ...f, message: "" }));
    } catch (error) {
      setErrors(errorFields(error));
      showToast("Message not sent", errorMessage(error), "error");
    } finally {
      setSubmitting(false);
    }
  };

  if (sent) {
    return (
      <div className="rounded-2xl border border-gold/40 bg-cream/60 p-8 text-center" role="status">
        <CheckCircle2 width={34} height={34} className="mx-auto text-gold-deep" />
        <h2 className="type-heading-md mt-4 text-charcoal">Message received</h2>
        <p className="mt-2 text-sm leading-relaxed text-mist">
          Thank you for writing to us. Our atelier team will reply within 24 hours.
        </p>
        <Button variant="outline" size="sm" className="mt-5" onClick={() => setSent(false)}>
          Send Another Message
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="rounded-2xl border border-clay/60 bg-white/60 p-6 sm:p-7">
      <h2 className="type-heading-md mb-5 text-charcoal">Send a Message</h2>
      <div className="space-y-5">
        <Field label="Your Name" required error={errors.name}>
          <TextInput value={form.name} onChange={set("name")} placeholder="Full name" autoComplete="name" error={!!errors.name} required />
        </Field>
        <Field label="Email" required error={errors.email}>
          <TextInput type="email" value={form.email} onChange={set("email")} placeholder="you@example.com" autoComplete="email" error={!!errors.email} required />
        </Field>
        <Field label="Phone" error={errors.phone} hint="Optional">
          <TextInput
            type="tel"
            inputMode="numeric"
            maxLength={10}
            value={form.phone}
            autoComplete="tel-national"
            placeholder="10-digit mobile number"
            error={!!errors.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value.replace(/\D/g, "") }))}
          />
        </Field>
        <Field label="Topic">
          <Select value={form.topic} onChange={set("topic")}>
            {CONTACT_TOPICS.map((t) => (
              <option key={t}>{t}</option>
            ))}
          </Select>
        </Field>
        <Field label="Message" required error={errors.message}>
          <TextArea rows={5} value={form.message} onChange={set("message")} placeholder="Tell us how we can help…" maxLength={3000} error={!!errors.message} required />
        </Field>
        <Button type="submit" fullWidth disabled={submitting}>
          {submitting ? (
            "Sending…"
          ) : (
            <>
              Send Message
              <Send width={15} height={15} />
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
