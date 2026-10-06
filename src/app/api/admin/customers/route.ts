import { route } from "@/server/http";
import { listCustomers } from "@/server/services/account";

export const GET = route({ auth: "admin" }, async () => ({ customers: await listCustomers() }));
