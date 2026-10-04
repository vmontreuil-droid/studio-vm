import "server-only";
import { PDFDocument, StandardFonts, rgb, type PDFFont, type PDFPage } from "pdf-lib";

// Kleine opmaakhulp voor A4-pdf's (brief, factuur, bewijsdossier): koppen,
// alinea's met automatische regelafbreking, label/waarde-lijsten, tabellen,
// nieuwe bladzijden en paginanummers. Standaardlettertypes (Helvetica):
// licht, werkt op Vercel; tekens buiten WinAnsi worden vervangen.

const A4 = { w: 595.28, h: 841.89 };
const MARGE = 50;
const ZWART = rgb(0.11, 0.098, 0.09); // #1c1917
const GRIJS = rgb(0.34, 0.33, 0.31); // #57534e
const LIJN = rgb(0.906, 0.898, 0.894); // #e7e5e4
const AMBER = rgb(0.878, 0.51, 0.078); // #e08214

const VERVANG: Record<string, string> = {
  "→": "->", "←": "<-", "≥": ">=", "≤": "<=", "✓": "v", "✔": "v", " ": " ", " ": " ",
  " ": " ", "‑": "-", "≈": "~", "·": "·",
};

export class Pdf {
  private doc!: PDFDocument;
  private gewoon!: PDFFont;
  private vet!: PDFFont;
  private blad!: PDFPage;
  private y = 0;
  private veiligCache = new Map<string, boolean>();
  private voet = "";

  static async nieuw(titel: string, voet = ""): Promise<Pdf> {
    const p = new Pdf();
    p.doc = await PDFDocument.create();
    p.doc.setTitle(titel);
    p.doc.setCreator("Studio VM");
    p.doc.setProducer("studio-vm.be");
    p.gewoon = await p.doc.embedFont(StandardFonts.Helvetica);
    p.vet = await p.doc.embedFont(StandardFonts.HelveticaBold);
    p.voet = voet;
    p.nieuweBladzijde();
    return p;
  }

  /** Tekst ontdoen van tekens die Helvetica (WinAnsi) niet kent. */
  private veilig(tekst: string): string {
    let uit = "";
    for (const teken of String(tekst ?? "")) {
      const t = VERVANG[teken] ?? teken;
      if (t === "\n" || t === "\t") { uit += " "; continue; }
      let ok = this.veiligCache.get(t);
      if (ok === undefined) {
        try { this.gewoon.encodeText(t); ok = true; } catch { ok = false; }
        this.veiligCache.set(t, ok);
      }
      uit += ok ? t : "?";
    }
    return uit;
  }

  nieuweBladzijde(): void {
    this.blad = this.doc.addPage([A4.w, A4.h]);
    this.y = A4.h - MARGE;
  }

  private plaats(nodig: number): void {
    if (this.y - nodig < MARGE) this.nieuweBladzijde();
  }

  private breek(tekst: string, font: PDFFont, grootte: number, breedte: number): string[] {
    const regels: string[] = [];
    for (const alinea of String(tekst ?? "").split(/\n/)) {
      const woorden = this.veilig(alinea).split(/\s+/).filter(Boolean);
      let regel = "";
      for (const w of woorden) {
        const kandidaat = regel ? `${regel} ${w}` : w;
        if (font.widthOfTextAtSize(kandidaat, grootte) <= breedte) regel = kandidaat;
        else {
          if (regel) regels.push(regel);
          regel = w;
        }
      }
      regels.push(regel);
    }
    return regels;
  }

  /** Het "vm."-wordmerk met een regel bedrijfsgegevens eronder. */
  briefhoofd(regel: string): void {
    this.blad.drawText("vm", { x: MARGE, y: this.y - 30, size: 34, font: this.vet, color: ZWART });
    const b = this.vet.widthOfTextAtSize("vm", 34);
    this.blad.drawText(".", { x: MARGE + b, y: this.y - 30, size: 34, font: this.vet, color: AMBER });
    this.y -= 46;
    this.alinea(regel, { grootte: 8.5, kleur: "grijs" });
    this.lijn();
  }

  kop(tekst: string, grootte = 15): void {
    this.plaats(grootte + 14);
    this.y -= grootte + 4;
    for (const r of this.breek(tekst, this.vet, grootte, A4.w - 2 * MARGE)) {
      this.blad.drawText(r, { x: MARGE, y: this.y, size: grootte, font: this.vet, color: ZWART });
      this.y -= grootte + 3;
    }
    this.y -= 4;
  }

  label(tekst: string): void {
    this.plaats(30);
    this.y -= 14;
    this.blad.drawText(this.veilig(tekst.toUpperCase()), { x: MARGE, y: this.y, size: 7.5, font: this.vet, color: AMBER });
    this.y -= 6;
  }

  alinea(tekst: string, o: { grootte?: number; vet?: boolean; kleur?: "grijs" | "zwart"; inspring?: number } = {}): void {
    const grootte = o.grootte ?? 10;
    const font = o.vet ? this.vet : this.gewoon;
    const x = MARGE + (o.inspring ?? 0);
    const regels = this.breek(tekst, font, grootte, A4.w - MARGE - x);
    for (const r of regels) {
      this.plaats(grootte + 4);
      this.y -= grootte + 3;
      this.blad.drawText(r, { x, y: this.y, size: grootte, font, color: o.kleur === "grijs" ? GRIJS : ZWART });
    }
    this.y -= 4;
  }

  /** Lijst van "label — waarde" in twee kolommen. */
  regels(rijen: [string, string][], o: { labelBreedte?: number; grootte?: number } = {}): void {
    const grootte = o.grootte ?? 9.5;
    const lb = o.labelBreedte ?? 150;
    for (const [label, waarde] of rijen) {
      const waardeRegels = this.breek(waarde, this.gewoon, grootte, A4.w - 2 * MARGE - lb);
      this.plaats((grootte + 3) * waardeRegels.length + 4);
      this.y -= grootte + 3;
      this.blad.drawText(this.veilig(label), { x: MARGE, y: this.y, size: grootte, font: this.gewoon, color: GRIJS });
      waardeRegels.forEach((r, i) => {
        if (i > 0) this.y -= grootte + 3;
        this.blad.drawText(r, { x: MARGE + lb, y: this.y, size: grootte, font: this.gewoon, color: ZWART });
      });
      this.y -= 2;
    }
    this.y -= 4;
  }

  /** Bedragentabel: omschrijving links, bedrag rechts; laatste rij vet. */
  bedragen(rijen: [string, string][], totaalVet = true): void {
    const grootte = 10;
    rijen.forEach(([oms, bedrag], i) => {
      const vet = totaalVet && i === rijen.length - 1;
      const font = vet ? this.vet : this.gewoon;
      if (vet) this.lijn(2);
      const omsRegels = this.breek(oms, font, grootte, A4.w - 2 * MARGE - 110);
      this.plaats((grootte + 3) * omsRegels.length + 4);
      this.y -= grootte + 3;
      const b = this.veilig(bedrag);
      this.blad.drawText(b, { x: A4.w - MARGE - font.widthOfTextAtSize(b, grootte), y: this.y, size: grootte, font, color: ZWART });
      omsRegels.forEach((r, j) => {
        if (j > 0) this.y -= grootte + 3;
        this.blad.drawText(r, { x: MARGE, y: this.y, size: grootte, font, color: ZWART });
      });
      this.y -= 3;
    });
    this.y -= 4;
  }

  lijn(ruimte = 6): void {
    this.plaats(ruimte * 2);
    this.y -= ruimte;
    this.blad.drawLine({ start: { x: MARGE, y: this.y }, end: { x: A4.w - MARGE, y: this.y }, thickness: 0.6, color: LIJN });
    this.y -= ruimte;
  }

  ruimte(pt: number): void {
    this.y -= pt;
    if (this.y < MARGE) this.nieuweBladzijde();
  }

  async bytes(): Promise<Uint8Array> {
    const bladen = this.doc.getPages();
    bladen.forEach((b, i) => {
      const tekst = this.veilig(`${this.voet}${this.voet ? " · " : ""}${i + 1}/${bladen.length}`);
      b.drawText(tekst, { x: MARGE, y: 28, size: 7.5, font: this.gewoon, color: GRIJS });
    });
    return this.doc.save();
  }
}
