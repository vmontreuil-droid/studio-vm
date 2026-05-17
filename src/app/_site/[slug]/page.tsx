import type { Metadata } from "next";
import { getLiveSite } from "@/lib/publish";
import { BuilderRender } from "@/components/builder-render";

export const dynamic = "force-dynamic";

type Snap = Parameters<typeof BuilderRender>[0]["snap"] & {
  businessName?: string;
};

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const site = await getLiveSite(slug);
  if (!site.ok) {
    return { title: "Binnenkort online", robots: { index: false } };
  }
  const snap = site.snapshot as Snap;
  const name = snap?.businessName || site.title || "Website";
  return {
    title: name,
    description: `${name} — officiële website`,
    robots: { index: true, follow: true },
    openGraph: { title: name, type: "website" },
  };
}

function Placeholder({ reason }: { reason: string }) {
  const msg =
    reason === "inactive"
      ? "Deze website is tijdelijk gepauzeerd."
      : reason === "unpublished"
        ? "Deze website is nog niet gepubliceerd."
        : "Deze website bestaat (nog) niet.";
  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem",
        textAlign: "center",
        fontFamily:
          "system-ui,-apple-system,'Segoe UI',Roboto,sans-serif",
        background: "#0b0b0c",
        color: "#e7e7e7",
      }}
    >
      <div>
        <p
          style={{
            fontSize: 13,
            letterSpacing: "0.18em",
            textTransform: "uppercase",
            opacity: 0.5,
          }}
        >
          Studio VM
        </p>
        <h1 style={{ marginTop: 12, fontSize: 24, fontWeight: 600 }}>
          {msg}
        </h1>
      </div>
    </main>
  );
}

export default async function LiveSite({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ p?: string }>;
}) {
  const { slug } = await params;
  const { p } = await searchParams;
  const site = await getLiveSite(slug);

  if (!site.ok) return <Placeholder reason={site.reason} />;

  const pageIndex = Number.parseInt(p ?? "0", 10);

  return (
    <main>
      <BuilderRender
        snap={site.snapshot as Snap}
        live
        pageIndex={Number.isFinite(pageIndex) ? pageIndex : 0}
      />
    </main>
  );
}
