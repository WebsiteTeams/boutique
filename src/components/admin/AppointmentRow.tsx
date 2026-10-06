"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { Appointment } from "@/types";
import { api, errorMessage } from "@/lib/api";
import { APPOINTMENT_SLOTS, APPOINTMENT_STATUSES } from "@/lib/status";
import { formatDate } from "@/lib/utils";
import { useToast } from "@/context/store";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { InlineField, StatusSelect } from "@/components/admin/controls";

const inputClass =
  "h-9 rounded-full border border-clay bg-white/70 px-3 text-xs text-charcoal focus:border-gold focus:outline-none focus:ring-2 focus:ring-gold-soft/40";

export function AppointmentRow({ appointment: a }: { appointment: Appointment }) {
  const router = useRouter();
  const { showToast } = useToast();
  const endpoint = `/api/admin/appointments/${a.id}`;
  const [date, setDate] = useState(a.date);
  const [time, setTime] = useState(a.time);
  const [pending, setPending] = useState(false);
  const changed = date !== a.date || time !== a.time;

  const reschedule = async () => {
    setPending(true);
    try {
      await api(endpoint, { method: "PATCH", body: { date, time } });
      showToast("Appointment rescheduled", `${date} at ${time}`);
      router.refresh();
    } catch (error) {
      showToast("Couldn't reschedule", errorMessage(error), "error");
    } finally {
      setPending(false);
    }
  };

  return (
    <li className="rounded-2xl border border-clay/60 bg-white/60 p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-medium text-charcoal">
            {a.purpose} · {formatDate(a.date)} at {a.time}
          </h3>
          <p className="mt-0.5 text-xs text-mist">
            {a.id} · {a.name} · {a.phone} · {a.email}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <StatusBadge status={a.status} />
          <StatusSelect endpoint={endpoint} value={a.status} options={APPOINTMENT_STATUSES} label={`Status for ${a.id}`} />
        </div>
      </div>

      {a.notes && <p className="mt-3 text-sm italic text-mist">“{a.notes}”</p>}

      <div className="mt-5 grid gap-4 border-t border-clay/50 pt-5 lg:grid-cols-2">
        <div>
          <p className="mb-2 text-[0.68rem] font-medium uppercase tracking-[0.16em] text-charcoal/70">Reschedule</p>
          <div className="flex flex-wrap items-center gap-2">
            <input type="date" value={date} onChange={(e) => setDate(e.target.value)} aria-label="New date" className={inputClass} />
            <select value={time} onChange={(e) => setTime(e.target.value)} aria-label="New time" className={inputClass}>
              {APPOINTMENT_SLOTS.map((slot) => (
                <option key={slot}>{slot}</option>
              ))}
            </select>
            <button
              onClick={reschedule}
              disabled={!changed || pending}
              className="h-9 rounded-full bg-charcoal px-4 text-xs font-medium text-ivory transition-colors hover:bg-ink disabled:opacity-40"
            >
              Move
            </button>
          </div>
        </div>
        <div>
          <p className="mb-2 text-[0.68rem] font-medium uppercase tracking-[0.16em] text-charcoal/70">Staff notes</p>
          <InlineField endpoint={endpoint} field="adminNotes" initial={a.adminNotes ?? ""} label="Staff notes" placeholder="Notes for the stylist" />
        </div>
      </div>
    </li>
  );
}
