import { route } from "@/server/http";
import { isOnlinePaymentConfigured } from "@/server/services/payments";

/** Tells the checkout which payment options are actually available. */
export const GET = route({}, async () => ({ onlinePayments: isOnlinePaymentConfigured() }));
