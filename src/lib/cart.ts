import type { CartItem, Product } from "@/types";

export const FREE_SIZE = "Free Size";

/** Builds the cart line for a catalog product — the one place cart keys are defined. */
export function toCartItem(
  product: Product,
  options: { size?: string | null; color?: string | null; quantity?: number } = {}
): CartItem {
  const size = options.size ?? product.sizes?.[0] ?? FREE_SIZE;
  const color = options.color ?? product.color;
  // A non-default colour is a distinct line; the default keeps the short key.
  const key = color === product.color ? `${product.id}-${size}` : `${product.id}-${size}-${color}`;
  return {
    key,
    productId: product.id,
    slug: product.slug,
    name: product.name,
    image: product.images[0],
    price: product.price,
    mrp: product.mrp,
    size,
    color,
    fabric: product.fabric,
    quantity: options.quantity ?? 1,
    customizable: product.customizable,
  };
}

export const cartItemHref = (item: CartItem) =>
  item.customization ? "/custom-blouse" : item.slug ? `/product/${item.slug}` : "/collections";
