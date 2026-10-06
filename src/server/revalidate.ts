import { revalidatePath } from "next/cache";

/** Refreshes every storefront page after catalog, stock or review changes. */
export function revalidateCatalog() {
  revalidatePath("/", "layout");
}
