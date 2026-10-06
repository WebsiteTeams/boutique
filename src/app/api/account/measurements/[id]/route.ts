import { route } from "@/server/http";
import { deleteMeasurement, saveMeasurement } from "@/server/services/account";
import { measurementProfileSchema } from "@/server/validators";

export const PUT = route({ auth: "user", body: measurementProfileSchema }, async ({ user, body, params }) => ({
  measurements: await saveMeasurement(user.id, body, params.id),
}));

export const DELETE = route({ auth: "user" }, async ({ user, params }) => ({
  measurements: await deleteMeasurement(user.id, params.id),
}));
