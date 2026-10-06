import Link from "next/link";
import { GENERAL_STYLIST_MESSAGE, whatsappLink } from "@/lib/config";
import { cn } from "@/lib/utils";
import { WhatsAppIcon } from "@/components/ui/SocialIcons";

interface StylistButtonProps {
  /** Prefilled WhatsApp message. Defaults to a general styling enquiry. */
  message?: string;
  label?: string;
  variant?: "outline" | "solid" | "light";
  size?: "md" | "lg";
  className?: string;
}

const variants = {
  outline: "border border-charcoal/30 text-charcoal hover:border-charcoal hover:bg-charcoal hover:text-ivory",
  solid: "bg-charcoal text-ivory hover:bg-ink",
  light: "bg-ivory text-charcoal hover:bg-white",
};

const sizes = {
  md: "h-12 px-7 text-[0.72rem]",
  lg: "h-14 px-9 text-[0.74rem]",
};

/**
 * "Chat with a Stylist" — opens WhatsApp with a prefilled message when
 * NEXT_PUBLIC_WHATSAPP_NUMBER is configured, otherwise routes to the contact page.
 */
export function StylistButton({
  message = GENERAL_STYLIST_MESSAGE,
  label = "Chat with a Stylist",
  variant = "outline",
  size = "md",
  className,
}: StylistButtonProps) {
  const href = whatsappLink(message);
  const classes = cn(
    "inline-flex items-center justify-center gap-2.5 whitespace-nowrap rounded-full font-semibold uppercase tracking-[0.16em] transition-all duration-300 ease-out active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2",
    variants[variant],
    sizes[size],
    className
  );
  const content = (
    <>
      <WhatsAppIcon size={17} />
      {label}
    </>
  );

  if (!href) {
    return (
      <Link href="/contact" className={classes}>
        {content}
      </Link>
    );
  }
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className={classes}>
      {content}
      <span className="sr-only"> (opens WhatsApp)</span>
    </a>
  );
}
