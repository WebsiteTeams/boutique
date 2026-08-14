"use client";

import { useState } from "react";
import { Clock, Mail, MapPin, MessageCircle, Phone, Send } from "lucide-react";
import { InfoPage } from "@/components/ui/InfoPage";
import { Button } from "@/components/ui/Button";
import { Field, TextArea, TextInput } from "@/components/ui/fields";
import { useToast } from "@/context/store";

export default function ContactPage() {
  const { showToast } = useToast();
  const [form, setForm] = useState({ name: "", email: "", topic: "General", message: "" });
  const [sent, setSent] = useState(false);

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setSent(true);
    showToast("Message sent", "We'll reply within 24 hours");
  };

  return (
    <InfoPage
      eyebrow="Get in Touch"
      title="We'd Love to Hear From You"
      intro="Styling advice, order help or bespoke enquiries — our atelier team replies within 24 hours."
    >
      <div className="grid gap-10 md:grid-cols-[1fr_1.4fr]">
        <div className="space-y-5">
          {[
            { icon: MapPin, label: "Visit the Boutique", value: "#12, Boutique Lane, T Nagar, Chennai 600017", sub: "10:00 AM – 8:30 PM, all days" },
            { icon: Phone, label: "Call or WhatsApp", value: "+91 98765 43210", sub: "Mon–Sat, 10 AM – 7 PM" },
            { icon: Mail, label: "Email", value: "hello@umadesigners.in", sub: "orders@umadesigners.in for orders" },
            { icon: Clock, label: "Bespoke Consultations", value: "By appointment", sub: "Slots every Sat & Sun" },
          ].map((c) => (
            <div key={c.label} className="flex gap-4">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-cream text-gold-deep">
                <c.icon width={18} height={18} />
              </span>
              <div>
                <p className="text-sm font-medium text-charcoal">{c.label}</p>
                <p className="mt-0.5 text-sm text-mist">{c.value}</p>
                <p className="text-xs text-taupe">{c.sub}</p>
              </div>
            </div>
          ))}

          <a
            href="https://wa.me/919876543210"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 rounded-full bg-[#25D366] px-5 py-3 text-sm font-medium text-white transition-opacity hover:opacity-90"
          >
            <MessageCircle width={17} height={17} />
            Chat on WhatsApp
          </a>
        </div>

        <form onSubmit={submit} className="rounded-2xl border border-clay/60 bg-white/60 p-6 sm:p-7">
          <h2 className="type-heading-md mb-5 text-charcoal">Send a Message</h2>
          <div className="space-y-5">
            <Field label="Your Name" required>
              <TextInput value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="Full name" required />
            </Field>
            <Field label="Email" required>
              <TextInput type="email" value={form.email} onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))} placeholder="you@example.com" required />
            </Field>
            <Field label="Topic">
              <select
                value={form.topic}
                onChange={(e) => setForm((f) => ({ ...f, topic: e.target.value }))}
                className="h-11 w-full rounded-full border border-clay bg-white px-4 text-sm text-charcoal focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold-soft/40"
              >
                {["General", "Order Support", "Bespoke Blouse", "Bulk / Trousseau", "Returns & Exchange"].map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </Field>
            <Field label="Message" required>
              <TextArea rows={5} value={form.message} onChange={(e) => setForm((f) => ({ ...f, message: e.target.value }))} placeholder="Tell us how we can help…" required />
            </Field>
            <Button type="submit" fullWidth disabled={sent}>
              {sent ? "Message Sent ✓" : (
                <>
                  Send Message
                  <Send width={15} height={15} />
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </InfoPage>
  );
}
