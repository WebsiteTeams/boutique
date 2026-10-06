import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { absoluteUrl, categoryHref, siteConfig } from "@/lib/config";
import { FREE_DELIVERY_THRESHOLD } from "@/lib/pricing";
import { pageMetadata } from "@/lib/seo";
import { formatINR } from "@/lib/utils";
import { getCurrentUser } from "@/server/auth/session";
import { listApprovedReviews, reviewEligibility } from "@/server/services/boutique";
import { getCompleteTheLook, getProductBySlug, getSimilarProducts } from "@/server/services/products";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductInfo } from "@/components/product/ProductInfo";
import { ProductReviews } from "@/components/product/ProductReviews";
import { RecentlyViewed } from "@/components/product/ProductShelf";
import { Accordion, AccordionItem } from "@/components/ui/Accordion";
import { ProductCarousel } from "@/components/product/ProductCarousel";
import { SectionHeading } from "@/components/ui/SectionHeading";

export const dynamic = "force-dynamic";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();
  return pageMetadata({
    title: product.name,
    description: product.shortDescription ?? product.description.slice(0, 160),
    path: `/product/${product.slug}`,
    image: product.images[0],
  });
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [look, similar, reviews, user] = await Promise.all([
    getCompleteTheLook(product.id, 6),
    getSimilarProducts(product.id, 6),
    listApprovedReviews(product.id),
    getCurrentUser(),
  ]);
  const eligibility = user ? await reviewEligibility(user.id, product.id) : null;

  // Structured data for rich results. `<` is escaped so content can never break out of the script tag.
  const jsonLd = JSON.stringify({
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images.map((i) => absoluteUrl(i)),
    sku: product.sku,
    category: product.subcategory || product.category,
    material: product.fabric,
    color: product.color,
    brand: { "@type": "Brand", name: siteConfig.name },
    offers: {
      "@type": "Offer",
      url: absoluteUrl(`/product/${product.slug}`),
      priceCurrency: "INR",
      price: product.price,
      availability: product.inStock ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
    },
    ...(product.reviewCount > 0
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: product.rating,
            reviewCount: product.reviewCount,
          },
        }
      : {}),
  }).replace(/</g, "\\u003c");

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: jsonLd }} />

      {/* Breadcrumb */}
      <div className="mx-auto max-w-[1440px] px-5 pt-28 sm:px-8 lg:px-10 lg:pt-36">
        <nav className="flex items-center gap-1.5 text-xs text-mist" aria-label="Breadcrumb">
          <Link href="/" className="transition-colors hover:text-charcoal">Home</Link>
          <ChevronRight width={12} height={12} aria-hidden />
          <Link href={categoryHref(product.category)} className="capitalize transition-colors hover:text-charcoal">
            {product.category === "blouses" ? "Custom Blouse" : product.category}
          </Link>
          <ChevronRight width={12} height={12} aria-hidden />
          <span className="truncate text-charcoal" aria-current="page">{product.name}</span>
        </nav>
      </div>

      {/* Product */}
      <section className="mx-auto grid max-w-[1440px] gap-10 px-5 py-8 sm:px-8 lg:grid-cols-2 lg:gap-16 lg:px-10 lg:py-12">
        <ProductGallery
          images={product.images}
          videos={product.videos}
          name={product.name}
          className="lg:sticky lg:top-28 lg:self-start"
        />
        <ProductInfo product={product} />
      </section>

      {/* Accordions */}
      <section className="mx-auto max-w-3xl px-5 pb-8 sm:px-8 lg:px-10">
        <Accordion>
          <AccordionItem title="Description" defaultOpen>
            <p className="text-mist">{product.description}</p>
          </AccordionItem>
          {product.details.length > 0 && (
            <AccordionItem title="Details & Specifications">
              <ul className="space-y-1.5">
                {product.details.map((d) => (
                  <li key={d} className="flex gap-2 text-mist">
                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-gold" />
                    {d}
                  </li>
                ))}
              </ul>
            </AccordionItem>
          )}
          <AccordionItem title="Fabric">
            <p className="text-mist">{product.fabric} — selected for drape, comfort and longevity.</p>
          </AccordionItem>
          {product.care.length > 0 && (
            <AccordionItem title="Care Instructions">
              <ul className="space-y-1.5">
                {product.care.map((c) => (
                  <li key={c} className="flex gap-2 text-mist">
                    <span className="mt-2 h-1 w-1 shrink-0 rounded-full bg-gold" />
                    {c}
                  </li>
                ))}
              </ul>
            </AccordionItem>
          )}
          <AccordionItem title="Delivery Information">
            <p className="text-mist">
              {product.estimatedDelivery}.{" "}
              {product.deliveryType === "made_to_order"
                ? "This piece is made to order, so it is crafted after you place your order."
                : "Dispatched from our boutique once your order is confirmed."}{" "}
              Free standard delivery on orders above {formatINR(FREE_DELIVERY_THRESHOLD)}.{" "}
              <Link href="/shipping" className="text-gold-deep underline underline-offset-4">
                Shipping details
              </Link>
            </p>
          </AccordionItem>
          <AccordionItem title="Returns">
            <p className="text-mist">
              {product.deliveryType === "made_to_order"
                ? "Customised and made-to-order pieces are non-returnable. Fit alterations are supported — contact us within 7 days of delivery."
                : "Unworn items in original condition may be returned within 7 days of delivery."}{" "}
              <Link href="/returns" className="text-gold-deep underline underline-offset-4">
                Returns policy
              </Link>
            </p>
          </AccordionItem>
        </Accordion>
      </section>

      <ProductReviews
        slug={product.slug}
        rating={product.rating}
        reviewCount={product.reviewCount}
        reviews={reviews}
        eligibility={eligibility}
      />

      {look.length > 0 && (
        <section className="border-t border-clay/50 py-16 lg:py-20">
          <div className="mx-auto max-w-[1440px]">
            <div className="px-5 sm:px-8 lg:px-10">
              <SectionHeading
                eyebrow="Style With"
                title="Complete The Look"
                subtitle="Pieces from the rest of the collection that pair with this one."
              />
            </div>
            <ProductCarousel products={look} />
          </div>
        </section>
      )}

      {similar.length > 0 && (
        <section className="border-t border-clay/50 py-16 lg:py-20">
          <div className="mx-auto max-w-[1440px]">
            <div className="px-5 sm:px-8 lg:px-10">
              <SectionHeading eyebrow="More Like This" title="You May Also Like" />
            </div>
            <ProductCarousel products={similar} />
          </div>
        </section>
      )}

      <RecentlyViewed excludeId={product.id} />

      {/* Space for the sticky mobile purchase bar */}
      <div className="h-20 lg:hidden" aria-hidden />
    </>
  );
}
