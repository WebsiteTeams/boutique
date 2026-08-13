import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";
import { getProductBySlug, getRelatedProducts, products } from "@/lib/data";
import { ProductGallery } from "@/components/product/ProductGallery";
import { ProductInfo } from "@/components/product/ProductInfo";
import { Accordion, AccordionItem } from "@/components/ui/Accordion";
import { ProductCarousel } from "@/components/product/ProductCarousel";
import { SectionHeading } from "@/components/ui/SectionHeading";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) return { title: "Product not found" };
  return {
    title: product.name,
    description: product.description,
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) notFound();

  const related = getRelatedProducts(product, 6);
  const galleryImages = product.images.length >= 2 ? product.images : [product.images[0], product.images[1] ?? product.images[0]];

  return (
    <>
      {/* Breadcrumb */}
      <div className="mx-auto max-w-[1440px] px-5 pt-28 sm:px-8 lg:px-10 lg:pt-36">
        <nav className="flex items-center gap-1.5 text-xs text-mist" aria-label="Breadcrumb">
          <Link href="/" className="transition-colors hover:text-charcoal">Home</Link>
          <ChevronRight width={12} height={12} />
          <Link href={`/${product.category}`} className="capitalize transition-colors hover:text-charcoal">
            {product.category}
          </Link>
          <ChevronRight width={12} height={12} />
          <span className="truncate text-charcoal">{product.name}</span>
        </nav>
      </div>

      {/* Product */}
      <section className="mx-auto grid max-w-[1440px] gap-10 px-5 py-8 sm:px-8 lg:grid-cols-2 lg:gap-16 lg:px-10 lg:py-12">
        <ProductGallery images={galleryImages} name={product.name} className="lg:sticky lg:top-28 lg:self-start" />
        <ProductInfo product={product} />
      </section>

      {/* Accordions */}
      <section className="mx-auto max-w-3xl px-5 pb-8 sm:px-8 lg:px-10">
        <Accordion>
          <AccordionItem title="Description" defaultOpen>
            <p className="text-mist">{product.description}</p>
          </AccordionItem>
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
          <AccordionItem title="Fabric">
            <p className="text-mist">{product.fabric} — selected for drape, comfort and longevity.</p>
          </AccordionItem>
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
          <AccordionItem title="Delivery Information">
            <p className="text-mist">
              Ready stock ships within 2–4 working days. Handloom and made-to-order pieces are
              crafted to order and dispatch in 7–12 days. Free delivery on orders above ₹2,000.
            </p>
          </AccordionItem>
          <AccordionItem title="Returns">
            <p className="text-mist">
              Unworn items in original condition may be returned within 7 days of delivery.
              Customised and made-to-order pieces are non-returnable.
            </p>
          </AccordionItem>
        </Accordion>
      </section>

      {/* Complete the look */}
      <section className="mt-12 border-t border-clay/50 py-16 lg:py-20">
        <div className="mx-auto max-w-[1440px]">
          <div className="px-5 sm:px-8 lg:px-10">
            <SectionHeading
              eyebrow="Style With"
              title="Complete The Look"
              subtitle="A matching blouse, an accessory, a similar drape — pieces that belong together."
            />
          </div>
          <ProductCarousel products={related} />
        </div>
      </section>
    </>
  );
}
