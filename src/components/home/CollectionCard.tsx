"use client";

import { motion } from "framer-motion";
import type { CollectionItem } from "@/types";
import { EditorialCard } from "@/components/ui/EditorialCard";

interface CollectionCardProps {
  collection: CollectionItem;
  className?: string;
  aspect?: string;
  revealDelay?: number;
}

export function CollectionCard({
  collection,
  className,
  aspect = "aspect-[4/5]",
  revealDelay = 0,
}: CollectionCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.5, delay: revealDelay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      <EditorialCard
        href={`/collections/${collection.id}`}
        image={collection.image}
        alt=""
        eyebrow={collection.tagline}
        title={collection.name}
        caption={collection.description}
        cta="Shop this edit"
        aspect={aspect}
        className="h-full"
      />
    </motion.div>
  );
}
