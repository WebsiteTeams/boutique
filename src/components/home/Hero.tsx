"use client";

import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import { ArrowRight } from "lucide-react";
import { useRef } from "react";
import { LinkButton } from "@/components/ui/Button";
import { P } from "@/lib/images";
import { cn } from "@/lib/utils";

const ease = [0.22, 1, 0.36, 1] as const;

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.35 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: { opacity: 1, y: 0, transition: { duration: 0.85, ease } },
};

const lineReveal = {
  hidden: { y: "112%" },
  show: { y: "0%", transition: { duration: 0.95, ease } },
};

function RevealLine({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <span className={cn("block overflow-hidden", className)}>
      <motion.span variants={lineReveal} className="block will-change-transform">
        {children}
      </motion.span>
    </span>
  );
}

export function Hero() {
  const ref = useRef<HTMLElement>(null);
  const prefersReduced = useReducedMotion();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const imgScale = useTransform(scrollYProgress, [0, 1], [1, prefersReduced ? 1 : 1.07]);
  const imgY = useTransform(scrollYProgress, [0, 1], ["0%", prefersReduced ? "0%" : "7%"]);
  const contentY = useTransform(scrollYProgress, [0, 1], [0, prefersReduced ? 0 : -48]);
  const contentOpacity = useTransform(scrollYProgress, [0, 0.55], [1, 0]);

  return (
    <section
      ref={ref}
      className="relative flex min-h-[92svh] flex-col overflow-hidden bg-charcoal lg:min-h-[100svh]"
    >
      {/* Hero campaign image with scroll parallax */}
      <motion.div
        style={{ y: imgY, scale: imgScale }}
        className="absolute inset-x-0 -top-[7%] -bottom-[7%]"
      >
        <motion.div
          initial={{ opacity: 0, scale: prefersReduced ? 1 : 1.05 }}
          animate={{ opacity: 1, scale: prefersReduced ? 1 : 1 }}
          transition={{ duration: 1.4, ease }}
          className="relative h-full w-full"
        >
          <Image
            src={P.hero}
            fill
            priority
            sizes="100vw"
            alt="Woman wearing a handwoven white and gold silk saree"
            className="object-cover object-[62%_8%] lg:object-[7%_35%]"
          />
        </motion.div>
      </motion.div>

      {/* Legibility scrims */}
      <div className="absolute inset-0 bg-gradient-to-r from-ink/60 via-ink/20 to-transparent lg:via-ink/10" />
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-ink/45 to-transparent lg:h-44" />
      <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-ink/80 via-ink/30 to-transparent lg:hidden" />

      {/* Desktop editorial content */}
      <motion.div
        style={{ y: contentY, opacity: contentOpacity }}
        className="absolute inset-0 z-10 hidden items-center lg:flex"
      >
        <div className="mx-auto w-full max-w-[1440px] pl-[8%] pr-20 xl:pl-[10%]">
          <motion.div variants={container} initial="hidden" animate="show" className="max-w-2xl">
            <motion.p
              variants={fadeUp}
              className="eyebrow flex items-center gap-4 text-gold-soft"
            >
              <span className="h-px w-10 bg-gold-soft/80" />
              The New Collection
            </motion.p>

            <h1 className="serif-display mt-8 text-[4.5rem] leading-[0.98] text-ivory lg:text-[5.25rem] xl:text-[6rem] 2xl:text-[6.25rem]">
              <RevealLine>Draped in</RevealLine>
              <RevealLine>
                <em className="italic text-gold-soft">Elegance.</em>
              </RevealLine>
            </h1>

            <motion.p
              variants={fadeUp}
              className="serif-display mt-7 text-[1.4rem] italic text-ivory/90 xl:text-[1.6rem]"
            >
              Made for Every Moment.
            </motion.p>

            <motion.p
              variants={fadeUp}
              className="mt-6 max-w-md text-[0.95rem] leading-[1.8] text-ivory/75"
            >
              Handwoven silks and made-to-measure blouses, curated for the modern
              Indian woman.
            </motion.p>

            <motion.div variants={fadeUp} className="mt-10 flex items-center gap-4">
              <LinkButton
                href="/sarees"
                size="lg"
                className="bg-charcoal text-ivory shadow-lifted hover:bg-ink"
              >
                Shop Sarees
              </LinkButton>
              <LinkButton
                href="/collections"
                size="lg"
                variant="dark-ghost"
                className="border-ivory/40 text-ivory hover:border-ivory hover:bg-ivory/10"
              >
                Explore Collection
                <ArrowRight width={15} height={15} />
              </LinkButton>
            </motion.div>
          </motion.div>
        </div>
      </motion.div>

      {/* Mobile image-first composition */}
      <motion.div
        style={{ y: contentY, opacity: contentOpacity }}
        className="relative z-10 mt-auto px-5 pb-28 pt-20 sm:px-8 sm:pb-32 lg:hidden"
      >
        <motion.div variants={container} initial="hidden" animate="show" className="max-w-xl">
          <motion.p
            variants={fadeUp}
            className="eyebrow flex items-center gap-3 text-gold-soft"
          >
            <span className="h-px w-8 bg-gold-soft/70" />
            The New Collection
          </motion.p>

          <h1 className="serif-display mt-5 text-[3.1rem] leading-[1] text-ivory sm:text-[3.6rem]">
            <RevealLine>Draped in</RevealLine>
            <RevealLine>
              <em className="italic text-gold-soft">Elegance.</em>
            </RevealLine>
          </h1>

          <motion.p
            variants={fadeUp}
            className="serif-display mt-4 text-[1.2rem] italic text-ivory/90 sm:text-[1.35rem]"
          >
            Made for Every Moment.
          </motion.p>

          <motion.p
            variants={fadeUp}
            className="mt-4 max-w-sm text-sm leading-relaxed text-ivory/80 sm:text-[0.95rem]"
          >
            Handwoven silks and made-to-measure blouses, curated for the modern
            Indian woman.
          </motion.p>

          <motion.div variants={fadeUp} className="mt-7">
            <LinkButton
              href="/sarees"
              size="lg"
              fullWidth
              className="bg-charcoal text-ivory shadow-lifted hover:bg-ink sm:max-w-xs"
            >
              Shop Sarees
            </LinkButton>
          </motion.div>
        </motion.div>
      </motion.div>

      {/* Floating collection badge */}
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.5, duration: 0.8, ease }}
        className="absolute right-[6%] top-[21%] z-10 hidden lg:block"
      >
        <div className="flex h-32 w-32 flex-col items-center justify-center rounded-full border border-ivory/30 bg-ink/15 text-center backdrop-blur-sm xl:h-36 xl:w-36">
          <span className="text-[0.48rem] font-medium uppercase tracking-[0.3em] text-gold-soft xl:text-[0.52rem]">
            Handcrafted
          </span>
          <span className="serif-display mt-1.5 text-[1.05rem] leading-tight text-ivory xl:text-[1.2rem]">
            with
            <br />
            intention
          </span>
        </div>
      </motion.div>

     

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6, duration: 1 }}
        className="absolute bottom-9 left-10 z-10 hidden text-[0.58rem] font-medium uppercase tracking-[0.3em] text-ivory/55 lg:block xl:left-14"
      >
        Sarees · Blouses · Chudithars
      </motion.p>

      {/* Scroll cue — desktop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.6, duration: 1 }}
        className="absolute bottom-9 right-10 z-10 hidden flex-col items-center gap-3 lg:flex xl:right-14"
      >
        <span className="text-[0.6rem] font-medium uppercase tracking-[0.3em] text-ivory/70">
          Scroll to Explore
        </span>
        <span className="relative h-12 w-px overflow-hidden bg-ivory/25">
          <motion.span
            className="absolute left-0 top-0 h-5 w-px bg-gold-soft"
            animate={{ y: [-20, 52] }}
            transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}
          />
        </span>
      </motion.div>
    </section>
  );
}
