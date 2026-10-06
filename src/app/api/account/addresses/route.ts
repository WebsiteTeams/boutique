import { route } from "@/server/http";
import { listAddresses, saveAddress } from "@/server/services/account";
import { addressSchema } from "@/server/validators";

export const GET = route({ auth: "user" }, async ({ user }) => ({ addresses: await listAddresses(user.id) }));

export const POST = route({ auth: "user", body: addressSchema }, async ({ user, body }) => ({
  addresses: await saveAddress(user.id, body),
}));
