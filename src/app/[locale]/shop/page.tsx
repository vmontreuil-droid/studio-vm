"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShoppingBag,
  Plus,
  Minus,
  X,
  Check,
  ArrowRight,
  CreditCard,
} from "lucide-react";

type Product = {
  slug: string;
  name: string;
  tagline: string;
  description: string;
  price: number;
  accent: string;
  category: string;
};

const products: Product[] = [
  {
    slug: "restaurant-starter",
    name: "Restaurant Starter",
    tagline: "Template",
    description:
      "Klaar-voor-launch template voor restaurants: menu, reservaties, openingsuren, foto-galerij.",
    price: 149,
    accent: "#7c3a2e",
    category: "Template",
  },
  {
    slug: "portfolio-pro",
    name: "Portfolio Pro",
    tagline: "Template",
    description:
      "Voor fotografen, designers, architecten. Lichtbox-galerij, projectpagina's, contactformulier.",
    price: 149,
    accent: "#3a4a5c",
    category: "Template",
  },
  {
    slug: "webshop-lite",
    name: "Webshop Lite",
    tagline: "Template",
    description:
      "Mini-webshop tot 25 producten. Mollie integratie, kortingscodes, klantportaal.",
    price: 299,
    accent: "#1f4e3d",
    category: "Template",
  },
  {
    slug: "coming-soon",
    name: "Coming Soon Page",
    tagline: "Template",
    description:
      "Single-page voor nieuwe zaken: countdown, e-mail capture, social links.",
    price: 49,
    accent: "#a8763e",
    category: "Template",
  },
  {
    slug: "next-supabase-handbook",
    name: "Next.js + Supabase Handbook",
    tagline: "E-book (PDF)",
    description:
      "120 pagina's over hoe ik echte projecten bouw met Next.js 16, Supabase en Vercel.",
    price: 29,
    accent: "#5b3a52",
    category: "E-book",
  },
  {
    slug: "1-uur-consult",
    name: "1u technisch consult",
    tagline: "Service",
    description:
      "Een uur Zoom om je project, stack of bug door te nemen. Krijg een schriftelijk verslag.",
    price: 95,
    accent: "#2d3142",
    category: "Service",
  },
];

type CartItem = { slug: string; qty: number };

const CART_KEY = "studio-vm-cart";

export default function ShopPage() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [checkoutDone, setCheckoutDone] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_KEY);
      if (stored) setCart(JSON.parse(stored));
    } catch {}
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(CART_KEY, JSON.stringify(cart));
    } catch {}
  }, [cart, hydrated]);

  const addToCart = (slug: string) => {
    setCart((c) => {
      const existing = c.find((i) => i.slug === slug);
      if (existing) {
        return c.map((i) => (i.slug === slug ? { ...i, qty: i.qty + 1 } : i));
      }
      return [...c, { slug, qty: 1 }];
    });
    setCartOpen(true);
  };

  const updateQty = (slug: string, delta: number) => {
    setCart((c) =>
      c
        .map((i) => (i.slug === slug ? { ...i, qty: Math.max(0, i.qty + delta) } : i))
        .filter((i) => i.qty > 0),
    );
  };

  const removeFromCart = (slug: string) => {
    setCart((c) => c.filter((i) => i.slug !== slug));
  };

  const clearCart = () => {
    setCart([]);
    setCheckoutDone(true);
    setCartOpen(false);
  };

  const itemCount = cart.reduce((sum, i) => sum + i.qty, 0);
  const total = cart.reduce((sum, i) => {
    const product = products.find((p) => p.slug === i.slug);
    return sum + (product?.price ?? 0) * i.qty;
  }, 0);

  return (
    <main>
      <Hero itemCount={itemCount} onCartClick={() => setCartOpen(true)} />
      <ProductGrid onAdd={addToCart} />
      <DemoNote />
      {cartOpen && (
        <CartDrawer
          cart={cart}
          total={total}
          onClose={() => setCartOpen(false)}
          onUpdateQty={updateQty}
          onRemove={removeFromCart}
          onCheckout={clearCart}
        />
      )}
      {checkoutDone && (
        <SuccessModal onClose={() => setCheckoutDone(false)} />
      )}
    </main>
  );
}

function Hero({ itemCount, onCartClick }: { itemCount: number; onCartClick: () => void }) {
  return (
    <section className="border-b">
      <div className="mx-auto flex max-w-6xl items-end justify-between gap-6 px-6 py-16 sm:py-24">
        <div className="flex-1">
          <p className="mb-3 font-mono text-xs uppercase tracking-widest text-accent">
            Templates shop
          </p>
          <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
            Templates en e-books om snel te starten.
          </h1>
          <p className="mt-4 max-w-xl text-muted">
            Direct downloadbare Next.js templates en gidsen — bouw zelf, of laat me 't
            voor je inrichten.
          </p>
        </div>
        <button
          type="button"
          onClick={onCartClick}
          className="relative inline-flex items-center gap-2 rounded-full border bg-card px-4 py-2.5 text-sm font-medium transition-colors hover:bg-card-hover"
        >
          <ShoppingBag className="h-4 w-4" strokeWidth={2} />
          Winkelmand
          {itemCount > 0 && (
            <span className="ml-1 rounded-full bg-accent px-2 py-0.5 font-mono text-[10px] font-semibold text-white">
              {itemCount}
            </span>
          )}
        </button>
      </div>
    </section>
  );
}

function ProductGrid({ onAdd }: { onAdd: (slug: string) => void }) {
  return (
    <section className="border-b">
      <div className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((p) => (
            <article
              key={p.slug}
              className="flex flex-col rounded-2xl border bg-card overflow-hidden"
            >
              <div
                aria-hidden
                className="flex h-40 items-center justify-center"
                style={{
                  background: `linear-gradient(135deg, ${p.accent}, ${p.accent}cc)`,
                }}
              >
                <span className="font-mono text-xs uppercase tracking-widest text-white/80">
                  {p.category}
                </span>
              </div>
              <div className="flex flex-1 flex-col p-6">
                <p className="font-mono text-xs uppercase tracking-widest text-muted">
                  {p.tagline}
                </p>
                <h3 className="mt-1 text-lg font-semibold tracking-tight">{p.name}</h3>
                <p className="mt-2 flex-1 text-sm text-muted">{p.description}</p>
                <div className="mt-6 flex items-center justify-between">
                  <span className="text-2xl font-semibold tracking-tight">
                    € {p.price}
                  </span>
                  <button
                    type="button"
                    onClick={() => onAdd(p.slug)}
                    className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-3 py-2 font-mono text-xs font-medium text-background transition-opacity hover:opacity-90"
                  >
                    <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
                    In mand
                  </button>
                </div>
              </div>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}

function CartDrawer({
  cart,
  total,
  onClose,
  onUpdateQty,
  onRemove,
  onCheckout,
}: {
  cart: CartItem[];
  total: number;
  onClose: () => void;
  onUpdateQty: (slug: string, delta: number) => void;
  onRemove: (slug: string) => void;
  onCheckout: () => void;
}) {
  return (
    <div className="fixed inset-0 z-[60] flex">
      <div
        aria-hidden
        className="flex-1 bg-black/40 backdrop-blur-sm"
        onClick={onClose}
      />
      <aside className="flex w-full max-w-md flex-col bg-background shadow-2xl">
        <div className="flex items-center justify-between border-b p-6">
          <h2 className="text-lg font-semibold tracking-tight">Winkelmand</h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Sluiten"
            className="rounded-full p-1 text-muted transition-colors hover:bg-card-hover"
          >
            <X className="h-5 w-5" strokeWidth={2} />
          </button>
        </div>

        {cart.length === 0 ? (
          <div className="flex flex-1 flex-col items-center justify-center p-8 text-center text-muted">
            <ShoppingBag className="h-12 w-12" strokeWidth={1} />
            <p className="mt-4 text-sm">Je mand is nog leeg.</p>
            <button
              type="button"
              onClick={onClose}
              className="mt-6 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors hover:bg-card-hover"
            >
              Verder winkelen
            </button>
          </div>
        ) : (
          <>
            <ul className="flex-1 divide-y overflow-y-auto">
              {cart.map((item) => {
                const product = products.find((p) => p.slug === item.slug);
                if (!product) return null;
                return (
                  <li key={item.slug} className="p-6">
                    <div className="flex justify-between gap-4">
                      <div className="flex-1">
                        <p className="font-mono text-[10px] uppercase tracking-widest text-muted">
                          {product.tagline}
                        </p>
                        <h3 className="mt-1 font-semibold tracking-tight">
                          {product.name}
                        </h3>
                        <p className="mt-1 font-mono text-xs text-muted">
                          € {product.price} × {item.qty}
                        </p>
                      </div>
                      <div className="flex flex-col items-end gap-2">
                        <span className="font-semibold">
                          € {product.price * item.qty}
                        </span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => onUpdateQty(item.slug, -1)}
                            className="rounded-full border p-1 text-muted hover:text-foreground"
                            aria-label="Verminder"
                          >
                            <Minus className="h-3 w-3" strokeWidth={2.5} />
                          </button>
                          <span className="w-5 text-center font-mono text-xs">
                            {item.qty}
                          </span>
                          <button
                            type="button"
                            onClick={() => onUpdateQty(item.slug, 1)}
                            className="rounded-full border p-1 text-muted hover:text-foreground"
                            aria-label="Voeg toe"
                          >
                            <Plus className="h-3 w-3" strokeWidth={2.5} />
                          </button>
                          <button
                            type="button"
                            onClick={() => onRemove(item.slug)}
                            className="ml-2 text-muted hover:text-foreground"
                            aria-label="Verwijder"
                          >
                            <X className="h-4 w-4" strokeWidth={2} />
                          </button>
                        </div>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
            <div className="border-t p-6">
              <div className="mb-4 flex items-center justify-between text-base font-semibold">
                <span>Totaal</span>
                <span>€ {total}</span>
              </div>
              <button
                type="button"
                onClick={onCheckout}
                className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-foreground px-4 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90"
              >
                <CreditCard className="h-4 w-4" strokeWidth={2} />
                Naar checkout (demo)
              </button>
              <p className="mt-3 text-center font-mono text-[10px] text-muted">
                Demo — geen echte betaling. Een echte build gebruikt Mollie of Stripe.
              </p>
            </div>
          </>
        )}
      </aside>
    </div>
  );
}

function SuccessModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-6 backdrop-blur-sm">
      <div className="max-w-sm rounded-2xl border bg-background p-8 text-center shadow-2xl">
        <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
          <Check className="h-6 w-6 text-accent" strokeWidth={2.5} />
        </div>
        <h2 className="mt-4 text-xl font-semibold tracking-tight">Bedankt voor je test!</h2>
        <p className="mt-3 text-sm text-muted">
          Dit is een demo-checkout. In een echte build krijg je hier je downloads + factuur
          per e-mail.
        </p>
        <button
          type="button"
          onClick={onClose}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-foreground px-4 py-2.5 text-sm font-medium text-background"
        >
          Sluiten
        </button>
      </div>
    </div>
  );
}

function DemoNote() {
  return (
    <section className="border-b bg-card">
      <div className="mx-auto max-w-3xl px-6 py-16 text-center">
        <p className="font-mono text-xs uppercase tracking-widest text-accent">
          Voor jouw klanten
        </p>
        <h2 className="mt-3 text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
          Een echte webshop voor jouw zaak?
        </h2>
        <p className="mt-4 text-muted">
          Deze shop is een demo. Voor jouw merk bouw ik een volledige Mollie- of
          Stripe-shop met voorraadbeheer, klantportaal en facturen.
        </p>
        <Link
          href="/pricing#webshop"
          className="mt-6 inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90"
        >
          Bekijk webshop pricing
          <ArrowRight className="h-4 w-4" strokeWidth={2} />
        </Link>
      </div>
    </section>
  );
}
