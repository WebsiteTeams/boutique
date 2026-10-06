import { route } from "@/server/http";
import { updateAppointment } from "@/server/services/boutique";
import { appointmentUpdateSchema } from "@/server/validators";

export const PATCH = route({ auth: "admin", body: appointmentUpdateSchema }, async ({ params, body }) => ({
  appointment: await updateAppointment(params.id, body),
}));
