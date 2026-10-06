/**
 * Single source of truth for boutique contact details, social links and the
 * public site URL. Values come from NEXT_PUBLIC_* environment variables so
 * they are never hardcoded across components. See `.env.example`.
 */

const digits = (value: string) => value.replace(/\D/g, "");

const whatsappNumber = digits(process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "");
const phone = process.env.NEXT_PUBLIC_SUPPORT_PHONE ?? "";

export const siteConfig = {
  name: "UMA Designers",
  shortName: "UMA",
  description:
    "UMA is a premium boutique for timeless sarees, ready-made chudithars and made-to-measure custom blouses. Thoughtfully curated ethnic fashion for the modern woman.",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, ""),
  ogImage: "/images/brand-story.png",
  email: process.env.NEXT_PUBLIC_SUPPORT_EMAIL ?? "hello@umadesigners.in",
  ordersEmail: process.env.NEXT_PUBLIC_ORDERS_EMAIL ?? "orders@umadesigners.in",
  phone,
  phoneHref: phone ? `tel:+${digits(phone)}` : "",
  /** Digits only, with country code — e.g. 919876543210. Empty when not configured. */
  whatsappNumber,
  address: process.env.NEXT_PUBLIC_BOUTIQUE_ADDRESS ?? "#12, Boutique Lane, T Nagar, Chennai 600017",
  hours: "10:00 AM – 8:30 PM, all days",
  social: {
    instagram: process.env.NEXT_PUBLIC_INSTAGRAM_URL ?? "",
    facebook: process.env.NEXT_PUBLIC_FACEBOOK_URL ?? "",
    youtube: process.env.NEXT_PUBLIC_YOUTUBE_URL ?? "",
  },
} as const;

export const absoluteUrl = (path = "/") =>
  `${siteConfig.url}${path.startsWith("/") ? path : `/${path}`}`;

/** Builds a wa.me deep link with a prefilled message, or null when no number is configured. */
export function whatsappLink(message: string): string | null {
  if (!siteConfig.whatsappNumber) return null;
  return `https://wa.me/${siteConfig.whatsappNumber}?text=${encodeURIComponent(message)}`;
}

export function productStylistMessage(product: { name: string; slug: string; price: number }) {
  return [
    "Hi UMA Designers,",
    "I'm interested in:",
    product.name,
    "",
    "Product:",
    absoluteUrl(`/product/${product.slug}`),
    "",
    "Price:",
    `₹${product.price.toLocaleString("en-IN")}`,
  ].join("\n");
}

export const GENERAL_STYLIST_MESSAGE =
  "Hi UMA Designers, I need help choosing an outfit. Could a stylist assist me?";

export const OCCASIONS = [
  "Bridal",
  "Wedding Guest",
  "Reception",
  "Engagement",
  "Festive",
  "Party",
  "Office",
  "Casual",
] as const;

export const CATEGORY_OPTIONS = [
  { id: "sarees", label: "Sarees", href: "/sarees" },
  { id: "chudithars", label: "Chudithars", href: "/chudithars" },
  { id: "blouses", label: "Blouses", href: "/custom-blouse" },
] as const;

/** Where a product category lives in the storefront (blouses have no listing page). */
export const categoryHref = (category: string) =>
  CATEGORY_OPTIONS.find((c) => c.id === category)?.href ?? "/collections";
