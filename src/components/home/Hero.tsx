"use client";

import { motion, useReducedMotion } from "framer-motion";
import Image from "next/image";
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
          className="object-cover object-[62%_10%] lg:object-[90%_30%]"
        />
      </motion.div>

      {/* Legibility scrims */}
      <div className="absolute inset-0 bg-gradient-to-r from-ink/85 via-ink/25 to-transparent" />
      <div className="absolute inset-x-0 top-0 h-36 bg-gradient-to-b from-ink/60 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-ink/85 via-ink/20 to-transparent" />

      {/* Content */}
      <div className="relative z-10 mx-auto flex w-full max-w-[1440px] flex-1 items-end px-5 pb-24 sm:px-8 sm:pb-28 lg:px-10 lg:pb-32">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="max-w-2xl pb-2"
        >
          <motion.p
            variants={fadeUp}
            className="eyebrow mb-6 flex items-center gap-3 text-gold-soft"
          >
            <span className="h-px w-10 bg-gold-soft/70" />
            The New Collection
          </motion.p>

          <h1 className="type-display-xl text-ivory">
            <RevealLine>Draped in</RevealLine>
            <RevealLine>
              <em className="italic text-gold-soft">Elegance.</em>
            </RevealLine>
          </h1>

          <motion.p
            variants={fadeUp}
            className="serif-display mt-6 text-[1.5rem] italic text-ivory/90 sm:text-[1.75rem]"
          >
            Made for Every Moment.
          </motion.p>

          <motion.p
            variants={fadeUp}
            className="mt-5 max-w-md type-body text-ivory/75"
          >
            Discover timeless sarees and handcrafted pieces designed for the
            modern Indian woman.
          </motion.p>

          <motion.div variants={fadeUp} className="mt-10 flex flex-wrap items-center gap-4">
            <a
              href="/sarees"
              className="type-btn inline-flex h-14 items-center gap-3 rounded-full bg-ivory px-9 text-charcoal transition-all duration-300 hover:bg-white hover:shadow-lifted active:scale-[0.98]"
            >
              Shop Sarees
            </a>
            <a
              href="/collections"
              className="type-btn group inline-flex h-14 items-center gap-2 rounded-full border border-ivory/40 px-9 text-ivory transition-all duration-300 hover:border-ivory hover:bg-ivory/10 active:scale-[0.98]"
            >
              Explore Collection
              <ArrowRight
                width={15}
                height={15}
                className="transition-transform duration-300 group-hover:translate-x-1"
              />
            </a>
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
