import type { Metadata } from "next";
import { absoluteUrl, siteConfig } from "@/lib/config";

/** Per-page metadata with canonical URL, Open Graph and Twitter cards. */
export function pageMetadata(input: {
  title: string;
  description: string;
  path: string;
  image?: string;
  noIndex?: boolean;
}): Metadata {
  const image = absoluteUrl(input.image ?? siteConfig.ogImage);
  return {
    title: input.title,
    description: input.description,
    alternates: { canonical: input.path },
    robots: input.noIndex ? { index: false, follow: false } : undefined,
    openGraph: {
      title: `${input.title} | ${siteConfig.name}`,
      description: input.description,
      url: absoluteUrl(input.path),
      siteName: siteConfig.name,
      images: [{ url: image, alt: input.title }],
      locale: "en_IN",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title: `${input.title} | ${siteConfig.name}`,
      description: input.description,
      images: [image],
    },
  };
}
