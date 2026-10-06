import { route } from "@/server/http";
import { deleteAddress, saveAddress } from "@/server/services/account";
import { addressSchema } from "@/server/validators";

export const PUT = route({ auth: "user", body: addressSchema }, async ({ user, body, params }) => ({
  addresses: await saveAddress(user.id, body, params.id),
}));

export const DELETE = route({ auth: "user" }, async ({ user, params }) => ({
  addresses: await deleteAddress(user.id, params.id),
}));
