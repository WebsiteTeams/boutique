import { route } from "@/server/http";
import { listMeasurements, saveMeasurement } from "@/server/services/account";
import { measurementProfileSchema } from "@/server/validators";

export const GET = route({ auth: "user" }, async ({ user }) => ({
  measurements: await listMeasurements(user.id),
}));

export const POST = route({ auth: "user", body: measurementProfileSchema }, async ({ user, body }) => ({
  measurements: await saveMeasurement(user.id, body),
}));
