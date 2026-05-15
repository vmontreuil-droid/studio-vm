"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ShoppingBag,
  Plus,
  Minus,
  X,
  Check,
  ArrowRight,
  CreditCard,
} from "lucide-react";
import {
  isValidLocale,
  localePath,
  DEFAULT_LOCALE,
  type Locale,
} from "@/lib/i18n/config";

type Product = {
  slug: string;
  name: string;
  tagline: string;
  price: number;
  accent: string;
  category: string;
  description: Record<Locale, string>;
};

const products: Product[] = [
  { slug: "restaurant-starter", name: "Restaurant Starter", tagline: "Template", price: 149, accent: "#7c3a2e", category: "Template", description: { nl: "Klaar-voor-launch template voor restaurants: menu, reservaties, openingsuren, foto-galerij.", fr: "Template prêt à lancer pour restaurants : carte, réservations, heures d'ouverture, galerie photo.", en: "Launch-ready template for restaurants: menu, reservations, opening hours, photo gallery." } },
  { slug: "portfolio-pro", name: "Portfolio Pro", tagline: "Template", price: 149, accent: "#3a4a5c", category: "Template", description: { nl: "Voor fotografen, designers, architecten. Lichtbox-galerij, projectpagina's, contactformulier.", fr: "Pour photographes, designers, architectes. Galerie lightbox, pages projets, formulaire de contact.", en: "For photographers, designers, architects. Lightbox gallery, project pages, contact form." } },
  { slug: "webshop-lite", name: "Webshop Lite", tagline: "Template", price: 299, accent: "#1f4e3d", category: "Template", description: { nl: "Mini-webshop tot 25 producten. Mollie integratie, kortingscodes, klantportaal.", fr: "Mini-boutique jusqu'à 25 produits. Intégration Mollie, codes promo, espace client.", en: "Mini webshop up to 25 products. Mollie integration, discount codes, customer portal." } },
  { slug: "coming-soon", name: "Coming Soon Page", tagline: "Template", price: 49, accent: "#a8763e", category: "Template", description: { nl: "Single-page voor nieuwe zaken: countdown, e-mail capture, social links.", fr: "Single-page pour nouvelles activités : compte à rebours, capture e-mail, liens sociaux.", en: "Single-page for new businesses: countdown, email capture, social links." } },
  { slug: "next-supabase-handbook", name: "Next.js + Supabase Handbook", tagline: "E-book (PDF)", price: 29, accent: "#5b3a52", category: "E-book", description: { nl: "120 pagina's over hoe ik echte projecten bouw met Next.js 16, Supabase en Vercel.", fr: "120 pages sur la façon dont je construis de vrais projets avec Next.js 16, Supabase et Vercel.", en: "120 pages on how I build real projects with Next.js 16, Supabase and Vercel." } },
  { slug: "1-uur-consult", name: "1u technisch consult", tagline: "Service", price: 95, accent: "#2d3142", category: "Service", description: { nl: "Een uur Zoom om je project, stack of bug door te nemen. Krijg een schriftelijk verslag.", fr: "Une heure de Zoom pour passer en revue votre projet, stack ou bug. Avec compte-rendu écrit.", en: "One hour of Zoom to go over your project, stack or bug. With a written report." } },
];

type CartItem = { slug: string; qty: number };
const CART_KEY = "studio-vm-cart";

const t: Record<
  Locale,
  {
    eyebrow: string;
    title: string;
    intro: string;
    cart: string;
    add: string;
    empty: string;
    keepShopping: string;
    total: string;
    checkout: string;
    checkoutNote: string;
    successTitle: string;
    successBody: string;
    close: string;
    demoEyebrow: string;
    demoTitle: string;
    demoBody: string;
    demoCta: string;
  }
> = {
  nl: {
    eyebrow: "Templates shop",
    title: "Templates en e-books om snel te starten.",
    intro: "Direct downloadbare Next.js templates en gidsen — bouw zelf, of laat me 't voor je inrichten.",
    cart: "Winkelmand",
    add: "In mand",
    empty: "Je mand is nog leeg.",
    keepShopping: "Verder winkelen",
    total: "Totaal",
    checkout: "Naar checkout (demo)",
    checkoutNote: "Demo — geen echte betaling. Een echte build gebruikt Mollie of Stripe.",
    successTitle: "Bedankt voor je test!",
    successBody: "Dit is een demo-checkout. In een echte build krijg je hier je downloads + factuur per e-mail.",
    close: "Sluiten",
    demoEyebrow: "Voor jouw klanten",
    demoTitle: "Een echte webshop voor jouw zaak?",
    demoBody: "Deze shop is een demo. Voor jouw merk bouw ik een volledige Mollie- of Stripe-shop met voorraadbeheer, klantportaal en facturen.",
    demoCta: "Bekijk webshop pricing",
  },
  fr: {
    eyebrow: "Boutique templates",
    title: "Templates et e-books pour démarrer vite.",
    intro: "Templates et guides Next.js directement téléchargeables — construisez vous-même, ou laissez-moi le faire.",
    cart: "Panier",
    add: "Ajouter",
    empty: "Votre panier est vide.",
    keepShopping: "Continuer mes achats",
    total: "Total",
    checkout: "Vers le checkout (démo)",
    checkoutNote: "Démo — pas de vrai paiement. Un vrai projet utilise Mollie ou Stripe.",
    successTitle: "Merci pour votre test !",
    successBody: "Ceci est un checkout démo. Dans un vrai projet, vous recevez ici vos téléchargements + facture par e-mail.",
    close: "Fermer",
    demoEyebrow: "Pour vos clients",
    demoTitle: "Une vraie boutique pour votre activité ?",
    demoBody: "Cette boutique est une démo. Pour votre marque je construis une boutique Mollie ou Stripe complète avec gestion de stock, espace client et factures.",
    demoCta: "Voir les tarifs boutique",
  },
  en: {
    eyebrow: "Templates shop",
    title: "Templates and e-books to start fast.",
    intro: "Directly downloadable Next.js templates and guides — build it yourself, or let me set it up for you.",
    cart: "Cart",
    add: "Add",
    empty: "Your cart is empty.",
    keepShopping: "Keep shopping",
    total: "Total",
    checkout: "To checkout (demo)",
    checkoutNote: "Demo — no real payment. A real build uses Mollie or Stripe.",
    successTitle: "Thanks for testing!",
    successBody: "This is a demo checkout. In a real build you'd get your downloads + invoice by email here.",
    close: "Close",
    demoEyebrow: "For your clients",
    demoTitle: "A real webshop for your business?",
    demoBody: "This shop is a demo. For your brand I build a full Mollie or Stripe shop with stock management, customer portal and invoices.",
    demoCta: "See webshop pricing",
  },
};

export default function ShopPage() {
  const params = useParams();
  const raw = Array.isArray(params.locale) ? params.locale[0] : params.locale;
  const locale: Locale = isValidLocale(raw) ? raw : DEFAULT_LOCALE;
  const c = t[locale];

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
    setCart((cc) => {
      const existing = cc.find((i) => i.slug === slug);
      if (existing)
        return cc.map((i) => (i.slug === slug ? { ...i, qty: i.qty + 1 } : i));
      return [...cc, { slug, qty: 1 }];
    });
    setCartOpen(true);
  };
  const updateQty = (slug: string, delta: number) =>
    setCart((cc) =>
      cc
        .map((i) =>
          i.slug === slug ? { ...i, qty: Math.max(0, i.qty + delta) } : i,
        )
        .filter((i) => i.qty > 0),
    );
  const removeFromCart = (slug: string) =>
    setCart((cc) => cc.filter((i) => i.slug !== slug));
  const clearCart = () => {
    setCart([]);
    setCheckoutDone(true);
    setCartOpen(false);
  };

  const itemCount = cart.reduce((s, i) => s + i.qty, 0);
  const total = cart.reduce((s, i) => {
    const p = products.find((x) => x.slug === i.slug);
    return s + (p?.price ?? 0) * i.qty;
  }, 0);

  return (
    <main>
      <section className="border-b">
        <div className="mx-auto flex max-w-7xl items-end justify-between gap-6 px-6 py-16 sm:py-24">
          <div className="flex-1">
            <p className="mb-3 font-mono text-xs uppercase tracking-widest text-accent">
              {c.eyebrow}
            </p>
            <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
              {c.title}
            </h1>
            <p className="mt-4 max-w-xl text-muted">{c.intro}</p>
          </div>
          <button
            type="button"
            onClick={() => setCartOpen(true)}
            className="relative inline-flex items-center gap-2 rounded-full border bg-card px-4 py-2.5 text-sm font-medium transition-colors hover:bg-card-hover"
          >
            <ShoppingBag className="h-4 w-4" strokeWidth={2} />
            {c.cart}
            {itemCount > 0 && (
              <span className="ml-1 rounded-full bg-accent px-2 py-0.5 font-mono text-[10px] font-semibold text-white">
                {itemCount}
              </span>
            )}
          </button>
        </div>
      </section>

      <section className="border-b">
        <div className="mx-auto max-w-7xl px-6 py-16">
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {products.map((p) => (
              <article
                key={p.slug}
                className="flex flex-col overflow-hidden rounded-2xl border bg-card"
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
                  <h3 className="mt-1 text-lg font-semibold tracking-tight">
                    {p.name}
                  </h3>
                  <p className="mt-2 flex-1 text-sm text-muted">
                    {p.description[locale]}
                  </p>
                  <div className="mt-6 flex items-center justify-between">
                    <span className="text-2xl font-semibold tracking-tight">
                      € {p.price}
                    </span>
                    <button
                      type="button"
                      onClick={() => addToCart(p.slug)}
                      className="inline-flex items-center gap-1.5 rounded-full bg-foreground px-3 py-2 font-mono text-xs font-medium text-background transition-opacity hover:opacity-90"
                    >
                      <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
                      {c.add}
                    </button>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section className="border-b bg-card">
        <div className="mx-auto max-w-3xl px-6 py-16 text-center">
          <p className="font-mono text-xs uppercase tracking-widest text-accent">
            {c.demoEyebrow}
          </p>
          <h2 className="mt-3 text-balance text-2xl font-semibold tracking-tight sm:text-3xl">
            {c.demoTitle}
          </h2>
          <p className="mt-4 text-muted">{c.demoBody}</p>
          <Link
            href={localePath(locale, "/pricing#webshop")}
            className="mt-6 inline-flex items-center gap-2 rounded-full bg-foreground px-6 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90"
          >
            {c.demoCta}
            <ArrowRight className="h-4 w-4" strokeWidth={2} />
          </Link>
        </div>
      </section>

      {cartOpen && (
        <div className="fixed inset-0 z-[60] flex">
          <div
            aria-hidden
            className="flex-1 bg-black/40 backdrop-blur-sm"
            onClick={() => setCartOpen(false)}
          />
          <aside className="flex w-full max-w-md flex-col bg-background shadow-2xl">
            <div className="flex items-center justify-between border-b p-6">
              <h2 className="text-lg font-semibold tracking-tight">{c.cart}</h2>
              <button
                type="button"
                onClick={() => setCartOpen(false)}
                aria-label={c.close}
                className="rounded-full p-1 text-muted transition-colors hover:bg-card-hover"
              >
                <X className="h-5 w-5" strokeWidth={2} />
              </button>
            </div>
            {cart.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center p-8 text-center text-muted">
                <ShoppingBag className="h-12 w-12" strokeWidth={1} />
                <p className="mt-4 text-sm">{c.empty}</p>
                <button
                  type="button"
                  onClick={() => setCartOpen(false)}
                  className="mt-6 inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm transition-colors hover:bg-card-hover"
                >
                  {c.keepShopping}
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
                                onClick={() => updateQty(item.slug, -1)}
                                className="rounded-full border p-1 text-muted hover:text-foreground"
                                aria-label="-"
                              >
                                <Minus className="h-3 w-3" strokeWidth={2.5} />
                              </button>
                              <span className="w-5 text-center font-mono text-xs">
                                {item.qty}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateQty(item.slug, 1)}
                                className="rounded-full border p-1 text-muted hover:text-foreground"
                                aria-label="+"
                              >
                                <Plus className="h-3 w-3" strokeWidth={2.5} />
                              </button>
                              <button
                                type="button"
                                onClick={() => removeFromCart(item.slug)}
                                className="ml-2 text-muted hover:text-foreground"
                                aria-label="x"
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
                    <span>{c.total}</span>
                    <span>€ {total}</span>
                  </div>
                  <button
                    type="button"
                    onClick={clearCart}
                    className="inline-flex w-full items-center justify-center gap-2 rounded-full bg-foreground px-4 py-3 text-sm font-medium text-background transition-opacity hover:opacity-90"
                  >
                    <CreditCard className="h-4 w-4" strokeWidth={2} />
                    {c.checkout}
                  </button>
                  <p className="mt-3 text-center font-mono text-[10px] text-muted">
                    {c.checkoutNote}
                  </p>
                </div>
              </>
            )}
          </aside>
        </div>
      )}

      {checkoutDone && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/50 p-6 backdrop-blur-sm">
          <div className="max-w-sm rounded-2xl border bg-background p-8 text-center shadow-2xl">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
              <Check className="h-6 w-6 text-accent" strokeWidth={2.5} />
            </div>
            <h2 className="mt-4 text-xl font-semibold tracking-tight">
              {c.successTitle}
            </h2>
            <p className="mt-3 text-sm text-muted">{c.successBody}</p>
            <button
              type="button"
              onClick={() => setCheckoutDone(false)}
              className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-full bg-foreground px-4 py-2.5 text-sm font-medium text-background"
            >
              {c.close}
            </button>
          </div>
        </div>
      )}
    </main>
  );
}
