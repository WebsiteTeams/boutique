"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import type { CartItem, CustomizationSummary, SessionUser, ToastMessage } from "@/types";
import { api, errorMessage } from "@/lib/api";
import {
  CUSTOM_BLOUSE_IMAGE,
  CUSTOM_BLOUSE_NAME,
  CUSTOM_BLOUSE_PRODUCT_ID,
  CUSTOM_BLOUSE_SLUG,
} from "@/lib/blouse";
import { createPersistentStore, useHydrated, usePersistentStore } from "@/lib/persistent-store";
import { calculateTotals, type CouponRule, type OrderTotals } from "@/lib/pricing";

/* ---------------- Toast ---------------- */

interface ToastContextValue {
  toasts: ToastMessage[];
  showToast: (title: string, description?: string, variant?: ToastMessage["variant"]) => void;
  dismiss: (id: number) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback(
    (title: string, description?: string, variant: ToastMessage["variant"] = "success") => {
      const id = Date.now() + Math.random();
      setToasts((prev) => [...prev, { id, title, description, variant }]);
      setTimeout(() => dismiss(id), variant === "error" ? 4200 : 2600);
    },
    [dismiss]
  );

  const value = useMemo(
    () => ({ toasts, showToast, dismiss }),
    [toasts, showToast, dismiss]
  );

  return <ToastContext.Provider value={value}>{children}</ToastContext.Provider>;
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error("useToast must be used within ToastProvider");
  return ctx;
}

/* ---------------- Persistent stores ---------------- */

interface CartState {
  items: CartItem[];
  coupon: CouponRule | null;
}

const MAX_QUANTITY = 20;
const EMPTY_CART: CartState = { items: [], coupon: null };

const isRecord = (v: unknown): v is Record<string, unknown> => typeof v === "object" && v !== null;

/** Drops anything in storage that does not look like a valid cart line. */
function parseCartItem(raw: unknown): CartItem | null {
  if (!isRecord(raw)) return null;
  const { key, productId, name, price, quantity } = raw;
  if (typeof key !== "string" || typeof productId !== "string" || typeof name !== "string") return null;
  if (typeof price !== "number" || !Number.isFinite(price) || price < 0) return null;
  if (typeof quantity !== "number" || !Number.isInteger(quantity) || quantity < 1) return null;
  const image = typeof raw.image === "string" && !raw.image.startsWith("data:") ? raw.image : CUSTOM_BLOUSE_IMAGE;
  const customization = isRecord(raw.customization) && isRecord(raw.customization.options)
    ? (raw.customization as unknown as CustomizationSummary)
    : null;
  // A bespoke line without its configuration cannot be ordered — discard it.
  if (key.startsWith("custom-blouse-") && !customization) return null;
  return {
    key,
    productId,
    slug: typeof raw.slug === "string" ? raw.slug : undefined,
    name,
    image,
    price,
    mrp: typeof raw.mrp === "number" ? raw.mrp : undefined,
    size: typeof raw.size === "string" ? raw.size : "Free Size",
    color: typeof raw.color === "string" ? raw.color : "",
    fabric: typeof raw.fabric === "string" ? raw.fabric : undefined,
    quantity: Math.min(quantity, MAX_QUANTITY),
    customizable: raw.customizable === true,
    customization,
  };
}

function parseCoupon(raw: unknown): CouponRule | null {
  if (!isRecord(raw) || typeof raw.code !== "string") return null;
  if ((raw.type !== "percent" && raw.type !== "flat") || typeof raw.value !== "number") return null;
  return {
    code: raw.code,
    description: typeof raw.description === "string" ? raw.description : null,
    type: raw.type,
    value: raw.value,
    minSubtotal: typeof raw.minSubtotal === "number" ? raw.minSubtotal : 0,
    maxDiscount: typeof raw.maxDiscount === "number" ? raw.maxDiscount : null,
  };
}

function parseCart(raw: unknown): CartState {
  if (!isRecord(raw) || !Array.isArray(raw.items)) return EMPTY_CART;
  const items = raw.items.map(parseCartItem).filter((i): i is CartItem => i !== null);
  return { items, coupon: parseCoupon(raw.coupon) };
}

const parseIdList = (max: number) => (raw: unknown): string[] =>
  Array.isArray(raw)
    ? Array.from(new Set(raw.filter((v): v is string => typeof v === "string" && v.length < 80))).slice(0, max)
    : [];

const EMPTY_IDS: string[] = [];
const cartStore = createPersistentStore<CartState>("uma:cart:v1", EMPTY_CART, parseCart);
const wishlistStore = createPersistentStore<string[]>("uma:wishlist:v1", EMPTY_IDS, parseIdList(200));
const recentStore = createPersistentStore<string[]>("uma:recent:v1", EMPTY_IDS, parseIdList(12));

/* ---------------- Auth ---------------- */

interface AuthContextValue {
  user: SessionUser | null;
  /** True once the session check has completed. */
  ready: boolean;
  login: (email: string, password: string) => Promise<SessionUser>;
  register: (input: { name: string; email: string; phone: string; password: string }) => Promise<SessionUser>;
  logout: () => Promise<void>;
  setUser: (user: SessionUser | null) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    api<{ user: SessionUser | null }>("/api/auth/me")
      .then((res) => {
        if (!cancelled) setUser(res.user);
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setReady(true);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api<{ user: SessionUser }>("/api/auth/login", { body: { email, password } });
    setUser(res.user);
    return res.user;
  }, []);

  const register = useCallback<AuthContextValue["register"]>(async (input) => {
    const res = await api<{ user: SessionUser }>("/api/auth/register", { body: input });
    setUser(res.user);
    return res.user;
  }, []);

  const logout = useCallback(async () => {
    await api("/api/auth/logout", { method: "POST" });
    setUser(null);
    // Account data must not linger on a shared device after sign-out.
    cartStore.set(EMPTY_CART);
    wishlistStore.set(EMPTY_IDS);
  }, []);

  const value = useMemo(
    () => ({ user, ready, login, register, logout, setUser }),
    [user, ready, login, register, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

/* ---------------- Cart ---------------- */

interface CartContextValue {
  items: CartItem[];
  /** False until the cart has been read from storage (avoid flashing "empty"). */
  hydrated: boolean;
  isOpen: boolean;
  openCart: () => void;
  closeCart: () => void;
  addItem: (item: CartItem) => void;
  removeItem: (key: string) => void;
  updateQuantity: (key: string, quantity: number) => void;
  clearCart: () => void;
  count: number;
  subtotal: number;
  hasCustomBlouse: boolean;
  addCustomBlouse: (customization: CustomizationSummary) => void;
  coupon: CouponRule | null;
  /** Validates the code with the server and applies it. Throws with a customer-facing message. */
  applyCoupon: (code: string) => Promise<CouponRule>;
  removeCoupon: () => void;
  /** Totals from the shared pricing rules — identical in cart, checkout and on the server. */
  totalsFor: (shippingMethod?: string) => OrderTotals;
}

const CartContext = createContext<CartContextValue | null>(null);

interface ServerCart {
  items: CartItem[];
  couponCode: string | null;
}

const serialise = (state: CartState) =>
  JSON.stringify({ items: state.items, couponCode: state.coupon?.code ?? null });

export function CartProvider({ children }: { children: ReactNode }) {
  const state = usePersistentStore(cartStore);
  const hydrated = useHydrated();
  const { user, ready } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const { items, coupon } = state;

  const openCart = useCallback(() => setIsOpen(true), []);
  const closeCart = useCallback(() => setIsOpen(false), []);

  const addItem = useCallback((item: CartItem) => {
    cartStore.set((prev) => {
      const existing = prev.items.find((i) => i.key === item.key);
      const next = existing
        ? prev.items.map((i) =>
            i.key === item.key
              ? { ...i, quantity: Math.min(MAX_QUANTITY, i.quantity + item.quantity) }
              : i
          )
        : [...prev.items, { ...item, quantity: Math.min(MAX_QUANTITY, item.quantity) }];
      return { ...prev, items: next };
    });
  }, []);

  const removeItem = useCallback((key: string) => {
    cartStore.set((prev) => ({ ...prev, items: prev.items.filter((i) => i.key !== key) }));
  }, []);

  const updateQuantity = useCallback((key: string, quantity: number) => {
    cartStore.set((prev) => ({
      ...prev,
      items:
        quantity <= 0
          ? prev.items.filter((i) => i.key !== key)
          : prev.items.map((i) =>
              i.key === key ? { ...i, quantity: Math.min(MAX_QUANTITY, quantity) } : i
            ),
    }));
  }, []);

  const clearCart = useCallback(() => cartStore.set(EMPTY_CART), []);

  const addCustomBlouse = useCallback((customization: CustomizationSummary) => {
    const item: CartItem = {
      key: `custom-blouse-${Date.now()}`,
      productId: CUSTOM_BLOUSE_PRODUCT_ID,
      slug: CUSTOM_BLOUSE_SLUG,
      name: CUSTOM_BLOUSE_NAME,
      image: customization.referenceImage ?? CUSTOM_BLOUSE_IMAGE,
      price: customization.basePrice,
      size: "Custom Fit",
      color: `${customization.neck} · ${customization.back}`,
      quantity: 1,
      customizable: true,
      customization,
    };
    cartStore.set((prev) => ({ ...prev, items: [...prev.items, item] }));
  }, []);

  const { count, subtotal } = useMemo(() => {
    return items.reduce(
      (acc, item) => {
        acc.count += item.quantity;
        acc.subtotal += item.price * item.quantity;
        return acc;
      },
      { count: 0, subtotal: 0 }
    );
  }, [items]);

  const hasCustomBlouse = useMemo(() => items.some((i) => i.customization), [items]);

  const applyCoupon = useCallback(
    async (code: string) => {
      const res = await api<{ coupon: CouponRule }>("/api/coupons/validate", {
        body: { code, subtotal },
      });
      cartStore.set((prev) => ({ ...prev, coupon: res.coupon }));
      return res.coupon;
    },
    [subtotal]
  );

  const removeCoupon = useCallback(() => cartStore.set((prev) => ({ ...prev, coupon: null })), []);

  const totalsFor = useCallback(
    (shippingMethod?: string) => calculateTotals({ lines: items, coupon, shippingMethod }),
    [items, coupon]
  );

  /* ----- Account sync: merge the guest cart on sign-in, then keep the server copy current ----- */

  const mergedFor = useRef<string | null>(null);
  const lastSynced = useRef<string | null>(null);

  useEffect(() => {
    if (!ready || !hydrated) return;
    if (!user) {
      mergedFor.current = null;
      lastSynced.current = null;
      return;
    }
    if (mergedFor.current === user.id) return;
    mergedFor.current = user.id;
    const local = cartStore.get();
    api<ServerCart>("/api/cart/merge", {
      body: { items: local.items, couponCode: local.coupon?.code ?? null },
    })
      .then(async (server) => {
        let rule = cartStore.get().coupon;
        if (server.couponCode && rule?.code !== server.couponCode) {
          const merged = calculateTotals({ lines: server.items });
          rule = await api<{ coupon: CouponRule }>("/api/coupons/validate", {
            body: { code: server.couponCode, subtotal: merged.subtotal },
          })
            .then((r) => r.coupon)
            .catch(() => null);
        }
        const next = parseCart({ items: server.items, coupon: rule });
        lastSynced.current = serialise(next);
        cartStore.set(next);
      })
      .catch(() => {
        // Keep the local cart; a later change will retry the sync.
        mergedFor.current = null;
      });
  }, [user, ready, hydrated]);

  useEffect(() => {
    if (!user || mergedFor.current !== user.id || lastSynced.current === null) return;
    const snapshot = serialise(state);
    if (snapshot === lastSynced.current) return;
    const timer = setTimeout(() => {
      api<ServerCart>("/api/cart", { method: "PUT", body: JSON.parse(snapshot) })
        .then(() => {
          lastSynced.current = snapshot;
        })
        .catch(() => {});
    }, 500);
    return () => clearTimeout(timer);
  }, [state, user]);

  const value = useMemo(
    () => ({
      items,
      hydrated,
      isOpen,
      openCart,
      closeCart,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      count,
      subtotal,
      hasCustomBlouse,
      addCustomBlouse,
      coupon,
      applyCoupon,
      removeCoupon,
      totalsFor,
    }),
    [
      items,
      hydrated,
      isOpen,
      openCart,
      closeCart,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      count,
      subtotal,
      hasCustomBlouse,
      addCustomBlouse,
      coupon,
      applyCoupon,
      removeCoupon,
      totalsFor,
    ]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

/* ---------------- Wishlist ---------------- */

interface WishlistContextValue {
  wishlist: string[];
  hydrated: boolean;
  toggle: (id: string) => void;
  has: (id: string) => boolean;
  clear: () => void;
}

const WishlistContext = createContext<WishlistContextValue | null>(null);

export function WishlistProvider({ children }: { children: ReactNode }) {
  const wishlist = usePersistentStore(wishlistStore);
  const hydrated = useHydrated();
  const { user, ready } = useAuth();
  const { showToast } = useToast();
  const mergedFor = useRef<string | null>(null);

  useEffect(() => {
    if (!ready || !hydrated) return;
    if (!user) {
      mergedFor.current = null;
      return;
    }
    if (mergedFor.current === user.id) return;
    mergedFor.current = user.id;
    api<{ productIds: string[] }>("/api/wishlist/merge", { body: { productIds: wishlistStore.get() } })
      .then((res) => wishlistStore.set(res.productIds))
      .catch(() => {
        mergedFor.current = null;
      });
  }, [user, ready, hydrated]);

  const toggle = useCallback(
    (id: string) => {
      const saved = !wishlistStore.get().includes(id);
      // Update instantly; the Set-based update can never create duplicates.
      wishlistStore.set((prev) => (saved ? Array.from(new Set([...prev, id])) : prev.filter((i) => i !== id)));
      if (user) {
        api("/api/wishlist", { method: "PUT", body: { productId: id, saved } }).catch((error) => {
          wishlistStore.set((prev) => (saved ? prev.filter((i) => i !== id) : Array.from(new Set([...prev, id]))));
          showToast("Couldn't update wishlist", errorMessage(error), "error");
        });
      }
    },
    [user, showToast]
  );

  const has = useCallback((id: string) => wishlist.includes(id), [wishlist]);

  const clear = useCallback(() => {
    wishlistStore.set(EMPTY_IDS);
    if (user) api("/api/wishlist", { method: "DELETE" }).catch(() => {});
  }, [user]);

  const value = useMemo(
    () => ({ wishlist, hydrated, toggle, has, clear }),
    [wishlist, hydrated, toggle, has, clear]
  );

  return <WishlistContext.Provider value={value}>{children}</WishlistContext.Provider>;
}

export function useWishlist() {
  const ctx = useContext(WishlistContext);
  if (!ctx) throw new Error("useWishlist must be used within WishlistProvider");
  return ctx;
}

/* ---------------- Recently viewed ---------------- */

export function useRecentlyViewed() {
  return usePersistentStore(recentStore);
}

export function trackProductView(productId: string) {
  recentStore.set((prev) => [productId, ...prev.filter((id) => id !== productId)].slice(0, 12));
}
