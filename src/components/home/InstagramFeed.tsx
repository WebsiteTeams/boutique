"use client";

import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { LinkButton } from "@/components/ui/Button";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { InstagramIcon } from "@/components/ui/SocialIcons";
import { P } from "@/lib/images";
import { siteConfig } from "@/lib/config";

const HANDLES = [
  "@uma.looks",
  "@uma.atelier",
  "@uma.bridal",
  "@uma.festive",
  "@uma.sarees",
  "@uma.daily",
];

export function InstagramFeed() {
  const instagram = siteConfig.social.instagram;
  // Without a configured Instagram profile there is nothing real to link to.
  if (!instagram) return null;

  return (
    <section className="mx-auto max-w-[1440px] px-5 py-20 sm:px-8 lg:px-10 lg:py-32">
      <SectionHeading
        eyebrow="@umadesigners"
        title="Follow Our Style"
        subtitle="Daily styling notes, atelier glimpses and first looks — straight from our studio."
      />
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 sm:gap-4 lg:grid-cols-6">
        {P.instagram.map((src, i) => (
          <motion.a
            key={src}
            href={instagram}
            target="_blank"
            rel="noopener noreferrer"
            initial={{ opacity: 0, scale: 0.96 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.55, delay: i * 0.06, ease: [0.22, 1, 0.36, 1] }}
            className="group relative block aspect-square overflow-hidden"
            aria-label={`View ${HANDLES[i]} on Instagram`}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={src}
              alt={HANDLES[i]}
              loading="lazy"
              className="absolute inset-0 h-full w-full object-cover transition-transform duration-700 group-hover:scale-[1.08]"
            />
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-ink/0 opacity-0 transition-all duration-400 group-hover:bg-ink/50 group-hover:opacity-100">
              <InstagramIcon size={22} className="text-ivory" />
              <span className="type-label-sm text-ivory">
                View
              </span>
            </div>
          </motion.a>
        ))}
      </div>
      <div className="mt-10 flex justify-center">
        <LinkButton href={instagram} target="_blank" rel="noopener noreferrer" variant="outline">
          Follow Us
          <ArrowRight width={16} height={16} />
        </LinkButton>
      </div>
    </section>
  );
}
