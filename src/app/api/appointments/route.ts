import { route } from "@/server/http";
import { RATE_LIMITS } from "@/server/middleware/rate-limit";
import { bookedSlots, createAppointment, listAppointmentsForUser } from "@/server/services/boutique";
import { appointmentSchema } from "@/server/validators";

/** `?date=YYYY-MM-DD` returns the slots already taken that day; otherwise the caller's appointments. */
export const GET = route({}, async ({ user, query }) => {
  const date = query.get("date");
  if (date && /^\d{4}-\d{2}-\d{2}$/.test(date)) return { booked: await bookedSlots(date) };
  return { appointments: user ? await listAppointmentsForUser(user.id) : [] };
});

export const POST = route(
  { body: appointmentSchema, rateLimit: RATE_LIMITS.appointment },
  async ({ user, body }) => ({ appointment: await createAppointment(body, user) })
);
