"use client";

import { motion } from "framer-motion";
import { ArrowRight, Ruler, Scissors, Sparkles } from "lucide-react";
import { LinkButton } from "@/components/ui/Button";
import { customizationGroups } from "@/lib/data";
import { P } from "@/lib/images";

const ease = [0.22, 1, 0.36, 1] as const;

const necklines = customizationGroups.find((g) => g.id === "neck")?.options.slice(0, 4) ?? [];

const FEATURES = [
  { icon: Ruler, label: "Your choice of neck, sleeve, back and finish" },
  { icon: Scissors, label: "Master-tailored to your measurements" },
  { icon: Sparkles, label: "Thread, zardozi, sequin & stone work" },
];

export function CustomBlouseFeature() {
  return (
    <section className="bg-cream">
      <div className="mx-auto grid max-w-[1440px] lg:grid-cols-[55fr_45fr]">
        {/* Image */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 1 }}
          className="relative min-h-[420px] overflow-hidden sm:min-h-[540px] lg:min-h-[720px]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={P.customBlouseFeature}
            alt="Custom blouse in progress"
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-transparent to-cream/40 lg:bg-gradient-to-r lg:from-transparent lg:via-cream/10 lg:to-cream" />

          {/* Design-sheet card */}
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.4, ease }}
            className="absolute bottom-5 left-5 right-5 rounded-2xl border border-white/60 bg-ivory/85 p-4 shadow-soft backdrop-blur-md sm:right-auto sm:w-[340px] lg:bottom-10 lg:left-10"
          >
            <p className="eyebrow mb-3 text-gold-deep">Start with a neckline</p>
            <ul className="grid grid-cols-4 gap-2">
              {necklines.map((n) => (
                <li key={n.id} className="text-center">
                  <span className="mb-1 block aspect-square rounded-lg bg-cream">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={n.image} alt="" loading="lazy" className="h-full w-full object-contain p-1" />
                  </span>
                  <span className="text-[0.62rem] leading-tight text-charcoal/75">{n.name}</span>
                </li>
              ))}
            </ul>
          </motion.div>
        </motion.div>

        {/* Content */}
        <div className="flex items-center px-5 py-16 sm:px-10 lg:px-14 lg:py-24">
          <motion.div
            initial={{ opacity: 0, y: 32 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.8, ease }}
          >
            <p className="eyebrow mb-6 flex items-center gap-3 text-gold-deep">
              <span className="h-px w-10 bg-gold" />
              Bespoke Atelier
            </p>
            <h2 className="type-display-lg text-charcoal text-balance">
              Your Blouse.
              <br />
              <em className="text-gold-deep">Your Design.</em>
            </h2>
            <p className="mt-6 max-w-md type-body text-charcoal/70">
              Create a blouse that reflects your style, measurements and personality
              — then share your details and our master tailors bring it to life in
              twelve days.
            </p>

            <ul className="mt-8 space-y-3">
              {FEATURES.map((f, i) => (
                <motion.li
                  key={f.label}
                  initial={{ opacity: 0, x: -16 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: 0.15 + i * 0.1, ease }}
                  className="flex items-center gap-3 text-sm text-charcoal/75"
                >
                  <span className="flex h-9 w-9 items-center justify-center rounded-full border border-gold/50 bg-ivory text-gold-deep">
                    <f.icon width={16} height={16} />
                  </span>
                  {f.label}
                </motion.li>
              ))}
            </ul>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: 0.5, ease }}
              className="mt-10"
            >
              <LinkButton href="/custom-blouse" variant="gold" size="lg">
                Start Customizing
                <ArrowRight width={16} height={16} />
              </LinkButton>
            </motion.div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
