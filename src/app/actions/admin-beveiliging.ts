"use server";

import { after } from "next/server";
import { revalidatePath } from "next/cache";
import QRCode from "qrcode";
import { adminConfigured } from "@/lib/supabase/config";
import { requireAdmin } from "@/lib/admin-auth";
import {
  bevestigTweestaps,
  controleerCode,
  geefVrij,
  mailTweestaps,
  startTweestaps,
  vernieuwHerstelcodes,
  zetTweestapsUit,
} from "@/lib/admin-beveiliging";

type Fout = { ok: false; fout: string };

const GEEN_TOEGANG: Fout = { ok: false, fout: "Je sessie is verlopen. Meld je opnieuw aan." };
const CODE_FOUT: Fout = {
  ok: false,
  fout: "Die code klopt niet. Kijk of de klok van je telefoon automatisch ingesteld staat en probeer de volgende code.",
};

async function magHet(): Promise<boolean> {
  return adminConfigured && (await requireAdmin());
}

/** Stap 1: nieuw geheim + QR-code om te scannen. Nog niet actief. */
export async function beginTweestaps(): Promise<{ ok: true; geheim: string; qr: string } | Fout> {
  if (!(await magHet())) return GEEN_TOEGANG;
  try {
    const { geheim, uri } = await startTweestaps();
    const qr = await QRCode.toString(uri, {
      type: "svg",
      margin: 1,
      errorCorrectionLevel: "M",
      color: { dark: "#1c1917", light: "#ffffff" },
    });
    return { ok: true, geheim, qr };
  } catch {
    return { ok: false, fout: "Kon geen nieuwe sleutel bewaren. Probeer opnieuw." };
  }
}

/** Stap 2: eerste code uit de app → tweestaps staat aan; herstelcodes één keer tonen. */
export async function rondTweestapsAf(code: string): Promise<{ ok: true; codes: string[] } | Fout> {
  if (!(await magHet())) return GEEN_TOEGANG;
  const codes = await bevestigTweestaps(code).catch(() => null);
  if (!codes) return CODE_FOUT;
  after(() => mailTweestaps(true));
  return { ok: true, codes };
}

export async function schakelTweestapsUit(code: string): Promise<{ ok: true } | Fout> {
  if (!(await magHet())) return GEEN_TOEGANG;
  const r = await controleerCode(code).catch(() => ({ ok: false as const }));
  if (!r.ok) return CODE_FOUT;
  await zetTweestapsUit();
  after(() => mailTweestaps(false));
  revalidatePath("/admin/beveiliging");
  return { ok: true };
}

export async function maakNieuweHerstelcodes(code: string): Promise<{ ok: true; codes: string[] } | Fout> {
  if (!(await magHet())) return GEEN_TOEGANG;
  const r = await controleerCode(code).catch(() => ({ ok: false as const }));
  if (!r.ok) return CODE_FOUT;
  return { ok: true, codes: await vernieuwHerstelcodes() };
}

export async function geefAdresVrij(formData: FormData): Promise<void> {
  if (!(await magHet())) return;
  await geefVrij(String(formData.get("sleutel") ?? ""));
  revalidatePath("/admin/beveiliging");
}
