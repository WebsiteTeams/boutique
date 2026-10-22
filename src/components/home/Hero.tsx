"use client";

import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { P } from "@/lib/images";
import { cn } from "@/lib/utils";

const ease = [0.22, 1, 0.36, 1] as const;

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.45 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 26 },
  show: { opacity: 1, y: 0, transition: { duration: 0.85, ease } },
};

const lineReveal = {
  hidden: { y: "115%" },
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
    <span className={cn("block overflow-visible pb-0.5", className)}>
      <motion.span variants={lineReveal} className="block will-change-transform">
        {children}
      </motion.span>
    </span>
  );
}

export function Hero() {
  const prefersReduced = useReducedMotion();

  return (
    <section className="relative flex min-h-[100svh] flex-col overflow-hidden bg-ink lg:min-h-[100svh]">
      {/* Campaign image */}
      <motion.div
        initial={prefersReduced ? { opacity: 1 } : { opacity: 0, scale: 1.06 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 1.4, ease }}
        className="absolute inset-0"
      >
        <Image
          src={P.hero}
          fill
          priority
          sizes="100vw"
          alt="Woman wearing a handwoven white and gold silk saree"
          className="object-cover object-[90%_center] md:object-[72%_28%] lg:object-[20%_35%]"
        />
      </motion.div>

      {/* Legibility scrims */}
      <div className="absolute inset-0 hidden bg-gradient-to-r from-ink/85 via-ink/25 to-transparent sm:block" />
      <div className="absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-ink/60 to-transparent" />
      {/* Phones: copy sits in the lower third, so the scrim is taller and deeper there. */}
      <div className="absolute inset-x-0 bottom-0 h-[62%] bg-gradient-to-t from-ink via-ink/75 to-transparent sm:h-64 sm:from-ink/85 sm:via-ink/20" />

      {/* Content */}
      <div className="relative z-10 mx-auto flex w-full max-w-[1440px] flex-1 items-end px-5 pb-10 pt-28 sm:px-8 sm:pb-24 sm:pt-32 lg:px-10 lg:pb-32">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="max-w-2xl pb-2"
        >
          <motion.p
            variants={fadeUp}
            className="eyebrow mb-4 flex items-center gap-3 text-gold-soft sm:mb-6"
          >
            <span className="h-px w-10 bg-gold-soft/70" />
            The New Collection
          </motion.p>

          <h1 className="serif-display text-[2.4rem] leading-[1.02] text-ivory min-[380px]:text-[2.6rem] sm:text-[3.4rem] md:text-[4.25rem] lg:text-[5rem] xl:text-[5.75rem]">
            <RevealLine>Draped in</RevealLine>
            <RevealLine>
              <em className="italic text-gold-soft">Elegance.</em>
            </RevealLine>
          </h1>

          <motion.p
            variants={fadeUp}
            className="serif-display mt-3 text-[1.15rem] italic text-ivory/90 sm:mt-6 sm:text-[1.5rem] md:text-[1.75rem]"
          >
            Made for Every Moment.
          </motion.p>

          <motion.p
            variants={fadeUp}
            className="mt-4 hidden max-w-md type-body text-ivory/80 sm:mt-5 sm:block"
          >
            Discover timeless sarees and handcrafted pieces designed for the
            modern Indian woman.
          </motion.p>

          <motion.div variants={fadeUp} className="mt-7 grid grid-cols-2 gap-3 sm:mt-10 sm:flex sm:items-center sm:gap-4">
            <Link
              href="/sarees"
              className="type-btn inline-flex h-12 w-full items-center justify-center gap-3 rounded-full bg-ivory px-4 text-charcoal transition-all duration-300 hover:bg-white hover:shadow-lifted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-soft active:scale-[0.98] sm:h-14 sm:w-auto sm:px-9"
            >
              Shop Sarees
            </Link>
            <Link
              href="/collections"
              className="type-btn group inline-flex h-12 w-full items-center justify-center gap-2 rounded-full border border-ivory/50 px-4 text-ivory transition-all duration-300 hover:border-ivory hover:bg-ivory/10 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-gold-soft active:scale-[0.98] sm:h-14 sm:w-auto sm:px-9"
            >
              <span className="sm:hidden">Collections</span>
              <span className="hidden sm:inline">Explore Collection</span>
              <ArrowRight
                aria-hidden
                width={15}
                height={15}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </Link>
          </motion.div>
        </motion.div>
      </div>

      {/* Floating editorial detail */}
      <motion.div
        initial={prefersReduced ? { opacity: 1 } : { opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 1.5, duration: 0.8, ease }}
        className="absolute right-[5%] top-[22%] z-10 hidden lg:block"
      >
        <div className="flex h-32 w-32 flex-col items-center justify-center rounded-full border border-ivory/30 bg-ink/20 text-center backdrop-blur-md xl:h-36 xl:w-36">
          <span className="type-label-sm text-gold-soft">
            Handcrafted
          </span>
          <span className="serif-display mt-1.5 text-[1.05rem] leading-tight text-ivory xl:text-[1.2rem]">
            with
            <br />
            intention
          </span>
        </div>
      </motion.div>

      {/* Bottom editorial meta */}
      <motion.p
        initial={prefersReduced ? { opacity: 1 } : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.7, duration: 1 }}
        className="absolute bottom-9 left-10 z-10 hidden type-label-sm text-ivory/60 lg:block xl:left-14"
      >
        Sarees · Blouses · Chudithars
      </motion.p>

      {/* Scroll cue */}
      <motion.div
        initial={prefersReduced ? { opacity: 1 } : { opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.7, duration: 1 }}
        className="absolute bottom-9 right-10 z-10 hidden flex-col items-center gap-3 lg:flex xl:right-14"
      >
        <span className="type-label-sm text-ivory/70">
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
