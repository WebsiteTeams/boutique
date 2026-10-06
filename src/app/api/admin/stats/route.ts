import { route } from "@/server/http";
import { getDashboardStats } from "@/server/services/admin";

export const GET = route({ auth: "admin" }, async () => ({ stats: await getDashboardStats() }));
