import { route } from "@/server/http";
import { listAddresses, listDesigns, listMeasurements } from "@/server/services/account";
import { listAppointmentsForUser, listReviewsForUser } from "@/server/services/boutique";
import { getLoyaltySummary } from "@/server/services/loyalty";
import { listOrdersForUser } from "@/server/services/orders";

/** Everything the account page needs, in one request. */
export const GET = route({ auth: "user" }, async ({ user }) => {
  const [orders, addresses, measurements, designs, appointments, reviews, loyalty] = await Promise.all([
    listOrdersForUser(user.id),
    listAddresses(user.id),
    listMeasurements(user.id),
    listDesigns(user.id),
    listAppointmentsForUser(user.id),
    listReviewsForUser(user.id),
    getLoyaltySummary(user.id),
  ]);
  return { orders, addresses, measurements, designs, appointments, reviews, loyalty };
});
