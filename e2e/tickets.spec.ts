import { randomUUID } from "node:crypto";
import { test, expect } from "@playwright/test";
import {
  BIJLAGE_MAX_BYTES,
  afgeleid,
  bijlageFout,
  esc,
  klantStatus,
  magHeropenen,
  soortVan,
  tekstNaarHtml,
  ticketRef,
  toonOnderwerp,
  type BerichtKern,
  type TicketKern,
} from "@/lib/tickets";
import {
  AFSPRAAK_T,
  BESTANDEN_T,
  FOUT_TEKST,
  KLANT_STATUS_LABEL,
  REVISIE_AKKOORD,
  SOORT_LABEL,
  SOORT_UITLEG,
  STUDIO_MAIL,
  TICKET_MAIL,
  revisieTariefZin,
} from "@/lib/tickets-teksten";
import { CATEGORIE_LABEL } from "@/lib/projecten";
import { urenTekst } from "@/lib/projecten-teksten";
import { UURTARIEF_CENT, euro } from "@/lib/tarieven";

// Tickets (Support): pure logica, de teksten in de vijf talen en een rooktest
// van de nieuwe routes zonder aanmelding. De routetests draaien tegen
// BASE_URL (bv. een productiebuild op een eigen poort), anders tegen de
// lokale server op :3100 — zoals smoke.spec.ts.
const BASE = process.env.BASE_URL || "http://localhost:3100";
const LOCALES = ["nl", "fr", "en", "de", "es"] as const;
type Taal = (typeof LOCALES)[number];

test.use({ baseURL: BASE });

const UUR = 3_600_000;
const DAG = 24 * UUR;
const MB = 1024 * 1024;

/** Woorden die nergens in klant- of studioteksten mogen staan. */
const VERBODEN = /mv3d|convertor|linkedin/i;

// ── tickets — logica ────────────────────────────────────────────────────

test.describe("tickets — logica", () => {
  const T0 = "2026-10-01T08:00:00.000Z";
  const M1 = "2026-10-01T09:00:00.000Z";
  const M2 = "2026-10-01T10:00:00.000Z";
  const M3 = "2026-10-01T11:00:00.000Z";

  // Rij zoals ze vóór migratie 0049 bestaat (enkel de oude kolommen).
  const oud: TicketKern = {
    id: "t1",
    client_email: "test-nacht@studio-vm.be",
    subject: "TEST vraag",
    status: "open",
    created_at: T0,
    updated_at: T0,
  };
  const vanKlant: BerichtKern = { ticket_id: "t1", sender: "klant", created_at: M1, body: "Vraag\nregel twee" };
  const vanStudio: BerichtKern = { ticket_id: "t1", sender: "studio", created_at: M2, body: "  Antwoord   van\nde studio " };
  // Recenter, maar van een ander ticket: mag niet meetellen.
  const anderTicket: BerichtKern = { ticket_id: "t2", sender: "klant", created_at: M3, body: "ander ticket" };

  // Dezelfde rij na migratie 0049: Studio VM antwoordde als laatste.
  const nieuw: TicketKern = {
    ...oud,
    nummer: 1001,
    soort: "vraag",
    wacht_op: "klant",
    laatste_afzender: "studio",
    laatste_bericht_op: M2,
    laatste_fragment: "Antwoord van de studio",
    klant_gelezen_op: null,
    studio_gelezen_op: M1,
  };
  // En de omgekeerde: de klant antwoordde als laatste.
  const nieuwKlant: TicketKern = {
    ...nieuw,
    wacht_op: "studio",
    laatste_afzender: "klant",
    laatste_bericht_op: M3,
    laatste_fragment: "Nog een vraag",
    klant_gelezen_op: M2,
    studio_gelezen_op: M2,
  };

  test("afgeleid() zonder 0049-kolommen: studio antwoordde als laatste", () => {
    // Berichten bewust in de verkeerde volgorde: het recentste telt.
    expect(afgeleid(oud, [vanStudio, anderTicket, vanKlant])).toEqual({
      wachtOp: "klant",
      laatsteOp: M2,
      laatsteAfzender: "studio",
      fragment: "Antwoord van de studio",
      klantOngelezen: false,
      studioOngelezen: false,
      gesloten: false,
    });
  });

  test("afgeleid() zonder 0049-kolommen: klant schreef als laatste", () => {
    expect(afgeleid(oud, [vanKlant, anderTicket])).toEqual({
      wachtOp: "studio",
      laatsteOp: M1,
      laatsteAfzender: "klant",
      fragment: "Vraag regel twee",
      klantOngelezen: false,
      studioOngelezen: false,
      gesloten: false,
    });
  });

  test("afgeleid() zonder 0049-kolommen en zonder berichten: wacht op de studio", () => {
    const a = afgeleid(oud, []);
    expect(a.wachtOp).toBe("studio");
    expect(a.laatsteAfzender).toBeNull();
    expect(a.laatsteOp).toBe(T0);
    expect(a.fragment).toBe("");
    expect(afgeleid(oud).wachtOp).toBe("studio");
    expect(afgeleid({ ...oud, status: "in_behandeling" }).gesloten).toBe(false);
    expect(afgeleid({ ...oud, status: "gesloten" }, [vanKlant]).gesloten).toBe(true);
  });

  test("afgeleid() met 0049-kolommen: studio antwoordde als laatste", () => {
    expect(afgeleid(nieuw)).toEqual({
      wachtOp: "klant",
      laatsteOp: M2,
      laatsteAfzender: "studio",
      fragment: "Antwoord van de studio",
      klantOngelezen: true,
      studioOngelezen: false,
      gesloten: false,
    });
    // Gelezen op (of na) het laatste bericht → niet meer ongelezen.
    expect(afgeleid({ ...nieuw, klant_gelezen_op: M2 }).klantOngelezen).toBe(false);
    expect(afgeleid({ ...nieuw, klant_gelezen_op: M3 }).klantOngelezen).toBe(false);
    expect(afgeleid({ ...nieuw, klant_gelezen_op: M1 }).klantOngelezen).toBe(true);
  });

  test("afgeleid() met 0049-kolommen: klant schreef als laatste", () => {
    expect(afgeleid(nieuwKlant)).toEqual({
      wachtOp: "studio",
      laatsteOp: M3,
      laatsteAfzender: "klant",
      fragment: "Nog een vraag",
      klantOngelezen: false,
      studioOngelezen: true,
      gesloten: false,
    });
    expect(afgeleid({ ...nieuwKlant, studio_gelezen_op: M3 }).studioOngelezen).toBe(false);
  });

  test("afgeleid() met 0049-kolommen: de kolommen winnen van de berichten", () => {
    // Het recentste bericht is van de klant, maar wacht_op/laatste_* zeggen iets anders.
    const a = afgeleid(nieuw, [vanKlant, vanStudio, { ticket_id: "t1", sender: "klant", created_at: M3, body: "x" }]);
    expect(a.wachtOp).toBe("klant");
    expect(a.laatsteAfzender).toBe("studio");
    expect(a.laatsteOp).toBe(M2);
    expect(a.fragment).toBe("Antwoord van de studio");
    // Gegenereerde booleans (klant_ongelezen/studio_ongelezen) gaan voor.
    expect(afgeleid({ ...nieuw, klant_ongelezen: false }).klantOngelezen).toBe(false);
    expect(afgeleid({ ...nieuwKlant, studio_ongelezen: false }).studioOngelezen).toBe(false);
    expect(afgeleid({ ...nieuw, studio_ongelezen: true }).studioOngelezen).toBe(true);
    // Zonder laatste_afzender: de afzender van het laatste bericht.
    expect(afgeleid({ ...nieuw, laatste_afzender: null }, [vanKlant, vanStudio]).laatsteAfzender).toBe("studio");
    expect(afgeleid({ ...nieuw, status: "gesloten" }).gesloten).toBe(true);
  });

  test("klantStatus()", () => {
    // Zonder 0049-kolommen.
    expect(klantStatus(oud, [vanKlant, vanStudio])).toBe("antwoord_ontvangen");
    expect(klantStatus(oud, [vanKlant])).toBe("wacht_op_studio");
    expect(klantStatus(oud, [])).toBe("wacht_op_studio");
    expect(klantStatus({ ...oud, status: "in_behandeling" }, [vanKlant])).toBe("wacht_op_studio");
    expect(klantStatus({ ...oud, status: "gesloten" }, [vanKlant, vanStudio])).toBe("gesloten");
    // Met 0049-kolommen.
    expect(klantStatus(nieuw)).toBe("antwoord_ontvangen");
    expect(klantStatus(nieuwKlant)).toBe("wacht_op_studio");
    expect(klantStatus({ ...nieuw, status: "gesloten" })).toBe("gesloten");
    expect(klantStatus({ ...nieuwKlant, status: "gesloten" })).toBe("gesloten");
  });

  test("magHeropenen: 29 dagen wel, 31 dagen niet", () => {
    const nu = Date.parse("2026-10-03T12:00:00.000Z");
    const geleden = (dagen: number) => new Date(nu - dagen * DAG).toISOString();

    expect(magHeropenen({ gesloten_op: geleden(29) }, nu)).toBe(true);
    expect(magHeropenen({ gesloten_op: geleden(31) }, nu)).toBe(false);
    expect(magHeropenen({ gesloten_op: geleden(29) }, new Date(nu))).toBe(true);
    // Zonder gesloten_op (vóór 0049): de laatste wijziging telt.
    expect(magHeropenen({ updated_at: geleden(29), created_at: geleden(60) }, nu)).toBe(true);
    expect(magHeropenen({ updated_at: geleden(31), created_at: geleden(60) }, nu)).toBe(false);
    // gesloten_op gaat voor op updated_at.
    expect(magHeropenen({ gesloten_op: geleden(31), updated_at: geleden(1) }, nu)).toBe(false);
    // Geen of ongeldige datum: niet heropenen.
    expect(magHeropenen({}, nu)).toBe(false);
    expect(magHeropenen({ gesloten_op: "geen datum" }, nu)).toBe(false);
  });

  test("ticketRef met en zonder nummer", () => {
    const id = "3f2a1b4c-5d6e-4f70-8a9b-0c1d2e3f4a5b";
    expect(ticketRef({ id, nummer: 1001 })).toBe("#1001");
    expect(ticketRef({ id, nummer: null })).toBe("#3f2a1b4c");
    expect(ticketRef({ id })).toBe("#3f2a1b4c");
  });

  test("esc() maakt & < > \" en ' onschadelijk", () => {
    expect(esc(`<a href="x" title='y'>Tom & Jerry</a>`)).toBe(
      "&lt;a href=&quot;x&quot; title=&#39;y&#39;&gt;Tom &amp; Jerry&lt;/a&gt;",
    );
    expect(esc("&amp;")).toBe("&amp;amp;");
    expect(esc("<script>alert(1)</script>")).not.toMatch(/[<>]/);
    expect(esc(null)).toBe("");
    expect(esc(undefined)).toBe("");
    expect(esc("Gewoon tekst")).toBe("Gewoon tekst");
  });

  test("tekstNaarHtml() zet regeleinden om in <br>", () => {
    expect(tekstNaarHtml("Regel 1\nRegel 2\r\nRegel 3\rRegel 4")).toBe("Regel 1<br>Regel 2<br>Regel 3<br>Regel 4");
    expect(tekstNaarHtml("<b>vet</b>\n'x' & \"y\"")).toBe(
      "&lt;b&gt;vet&lt;/b&gt;<br>&#39;x&#39; &amp; &quot;y&quot;",
    );
    expect(tekstNaarHtml("a\n\nb")).toBe("a<br><br>b");
    expect(tekstNaarHtml(null)).toBe("");
  });

  test("bijlageFout() weigert .exe en > 50 MB, aanvaardt .dwg/.pdf/.png", () => {
    expect(BIJLAGE_MAX_BYTES).toBe(50 * MB);
    // Type.
    expect(bijlageFout("setup.exe", 1024)).toBe("bijlage_type");
    expect(bijlageFout("SETUP.EXE", 1024)).toBe("bijlage_type");
    expect(bijlageFout("plan.dwg.exe", 1024)).toBe("bijlage_type");
    expect(bijlageFout("zonder-extensie", 1024)).toBe("bijlage_type");
    expect(bijlageFout("setup.exe", 60 * MB)).toBe("bijlage_type");
    // Grootte.
    expect(bijlageFout("plan.dwg", BIJLAGE_MAX_BYTES + 1)).toBe("bijlage_groot");
    expect(bijlageFout("plan.pdf", 60 * MB)).toBe("bijlage_groot");
    expect(bijlageFout("leeg.pdf", 0)).toBe("bijlage_ontbreekt");
    // In orde.
    expect(bijlageFout("plan.dwg", 1234)).toBeNull();
    expect(bijlageFout("Plan Rue de Test.PDF", 5 * MB)).toBeNull();
    expect(bijlageFout("schermafdruk.png", 200_000)).toBeNull();
    expect(bijlageFout("plan.dwg", BIJLAGE_MAX_BYTES)).toBeNull();
  });

  test("soortVan() en toonOnderwerp() op oude rijen (basisstand)", () => {
    expect(soortVan({ subject: "Revisie — Talud Rue de Test" })).toBe("revisie");
    expect(soortVan({ subject: "[Afspraak] Werfbezoek" })).toBe("afspraak");
    expect(soortVan({ subject: "Gewone vraag" })).toBe("vraag");
    expect(soortVan({ subject: "Revisie — x", soort: "machine" })).toBe("machine");
    expect(soortVan({ subject: "[Site] studio-vm.be traag", client_email: "info@studio-vm.be" })).toBe("intern");
    expect(toonOnderwerp({ subject: "Revisie — Talud Rue de Test" })).toBe("Talud Rue de Test");
    expect(toonOnderwerp({ subject: "[Afspraak] Werfbezoek" })).toBe("Werfbezoek");
    expect(toonOnderwerp({ subject: "Gewone vraag" })).toBe("Gewone vraag");
  });
});

// ── tickets — vertalingen ───────────────────────────────────────────────

/** Controleert een Record<taal, string>: precies de vijf talen, niets leeg, niets verboden. */
function controleerTalen(waarde: Record<string, unknown>, pad: string) {
  expect(Object.keys(waarde).sort(), `${pad}: talen`).toEqual([...LOCALES].sort());
  for (const l of LOCALES) {
    const s = waarde[l];
    expect(typeof s, `${pad}.${l} is tekst`).toBe("string");
    expect((s as string).trim(), `${pad}.${l} is leeg`).not.toBe("");
    expect(s as string, `${pad}.${l}`).not.toMatch(VERBODEN);
  }
}

/** Alle strings van een vertaalde tabel, in nl/fr/en/de/es. */
function controleerTabel(tabel: Record<string, Record<string, unknown>>, naam: string) {
  const sleutels = Object.keys(tabel);
  expect(sleutels.length, `${naam} heeft items`).toBeGreaterThan(0);
  for (const k of sleutels) controleerTalen(tabel[k], `${naam}.${k}`);
}

/** Uitvoer van een tekstfunctie: niet leeg, niets verboden, bevat de meegegeven teksten. */
function controleerUitvoer(uit: unknown, args: unknown[], pad: string) {
  expect(typeof uit, `${pad} geeft tekst`).toBe("string");
  const s = uit as string;
  expect(s.trim(), `${pad} is leeg`).not.toBe("");
  expect(s, pad).not.toMatch(VERBODEN);
  for (const a of args.flat()) {
    if (typeof a === "string") expect(s, `${pad} bevat "${a}"`).toContain(a);
  }
}

// Voorbeeldargumenten per functie in TICKET_MAIL. Een nieuwe functie zonder
// voorbeeld krijgt tekst-placeholders (en wordt dus ook gecontroleerd).
const MAIL_VOORBEELD: Record<string, unknown[]> = {
  ontvangenOnderwerp: ["#1001", "Talud Rue de Test"],
  ontvangenL1: ["Talud Rue de Test"],
  antwoordOnderwerp: ["#1001", "Talud Rue de Test"],
  antwoordL1: ["Talud Rue de Test"],
  bijlagen: [["plan-v2.dwg", "schermafdruk.png"]],
  geslotenOnderwerp: ["#1001", "Talud Rue de Test"],
  geslotenL1: ["Talud Rue de Test"],
  autoGeslotenL1: ["Talud Rue de Test"],
  revisieFactuurOnderwerp: ["FAC-2026-0042"],
  revisieFactuurL1: ["FAC-2026-0042", "Talud Rue de Test", "€ 90,75", "1,5 u"],
  revisieFactuurL2: ["17 oktober 2026"],
  revisieOmschrijving: ["Talud Rue de Test", 1.5, 5000],
};

test.describe("tickets — vertalingen", () => {
  test("SOORT_LABEL: elke soort in vijf talen", () => {
    controleerTabel(SOORT_LABEL, "SOORT_LABEL");
    expect(Object.keys(SOORT_LABEL).sort()).toEqual(["afspraak", "intern", "machine", "revisie", "vraag"]);
  });

  test("KLANT_STATUS_LABEL: elke status in vijf talen, echt vertaald", () => {
    controleerTabel(KLANT_STATUS_LABEL, "KLANT_STATUS_LABEL");
    expect(Object.keys(KLANT_STATUS_LABEL).sort()).toEqual(["antwoord_ontvangen", "gesloten", "wacht_op_studio"]);
    for (const [k, v] of Object.entries(KLANT_STATUS_LABEL)) {
      for (const l of LOCALES) if (l !== "nl") expect(v[l], `KLANT_STATUS_LABEL.${k}.${l} = nl`).not.toBe(v.nl);
    }
  });

  test("FOUT_TEKST: elke fout in vijf talen, echt vertaald", () => {
    controleerTabel(FOUT_TEKST, "FOUT_TEKST");
    for (const [k, v] of Object.entries(FOUT_TEKST)) {
      for (const l of LOCALES) if (l !== "nl") expect(v[l], `FOUT_TEKST.${k}.${l} = nl`).not.toBe(v.nl);
    }
  });

  test("SOORT_UITLEG, REVISIE_AKKOORD en AFSPRAAK_T in vijf talen", () => {
    controleerTabel(SOORT_UITLEG, "SOORT_UITLEG");
    controleerTalen(REVISIE_AKKOORD, "REVISIE_AKKOORD");
    expect(Object.keys(AFSPRAAK_T).sort()).toEqual([...LOCALES].sort());
    for (const l of LOCALES) {
      for (const [k, s] of Object.entries(AFSPRAAK_T[l])) {
        expect(s.trim(), `AFSPRAAK_T.${l}.${k}`).not.toBe("");
        expect(s, `AFSPRAAK_T.${l}.${k}`).not.toMatch(VERBODEN);
      }
    }
  });

  test("BESTANDEN_T: alle teksten en functies in vijf talen", () => {
    expect(Object.keys(BESTANDEN_T).sort()).toEqual([...LOCALES].sort());
    const sleutels = Object.keys(BESTANDEN_T.nl).sort();
    const voorbeeld: Record<string, unknown[]> = {
      teGroot: ["plan.dwg"],
      type: ["setup.exe"],
      maximum: [10],
      verwijderen: ["plan.dwg"],
      opladen: ["3,2 MB", "10,0 MB"],
      gekozen: [2],
    };
    for (const l of LOCALES) {
      expect(Object.keys(BESTANDEN_T[l]).sort(), `BESTANDEN_T.${l}: sleutels`).toEqual(sleutels);
      for (const [k, v] of Object.entries(BESTANDEN_T[l])) {
        const pad = `BESTANDEN_T.${l}.${k}`;
        if (typeof v === "function") {
          const args = voorbeeld[k] ?? Array.from({ length: v.length }, (_, i) => `X${i}`);
          controleerUitvoer((v as (...a: unknown[]) => unknown)(...args), args, pad);
          if (k === "gekozen") controleerUitvoer((v as (n: number) => string)(1), [], `${pad}(1)`);
        } else {
          controleerUitvoer(v, [], pad);
        }
      }
    }
  });

  test("revisieTariefZin: tarief en categorie in vijf talen", () => {
    for (const l of LOCALES) {
      const tarief = euro(UURTARIEF_CENT.normaal, l);
      const cat = CATEGORIE_LABEL.normaal[l];
      controleerUitvoer(revisieTariefZin(l, tarief, cat), [tarief, cat], `revisieTariefZin(${l})`);
    }
    expect(revisieTariefZin("fr", euro(5000, "fr"), CATEGORIE_LABEL.normaal.fr)).toContain(
      "/h HTVA (catégorie Normal), minimum 1 h",
    );
    expect(revisieTariefZin("nl", euro(5000, "nl"), CATEGORIE_LABEL.normaal.nl)).toContain("excl. btw");
  });

  test("TICKET_MAIL: elke tekst en elke mailfunctie in vijf talen", () => {
    expect(Object.keys(TICKET_MAIL).sort()).toEqual([...LOCALES].sort());
    const sleutels = Object.keys(TICKET_MAIL.nl).sort();
    expect(sleutels.length).toBeGreaterThan(0);
    for (const l of LOCALES) {
      const m = TICKET_MAIL[l] as unknown as Record<string, unknown>;
      expect(Object.keys(m).sort(), `TICKET_MAIL.${l}: sleutels`).toEqual(sleutels);
      for (const [k, v] of Object.entries(m)) {
        const pad = `TICKET_MAIL.${l}.${k}`;
        if (typeof v === "function") {
          const args = MAIL_VOORBEELD[k] ?? Array.from({ length: v.length }, (_, i) => `X${i}`);
          const uit = (v as (...a: unknown[]) => unknown)(...args);
          controleerUitvoer(uit, args, pad);
          if (k === "revisieOmschrijving") {
            expect(uit as string, `${pad}: tarief`).toContain(euro(5000, l));
            expect(uit as string, `${pad}: uren`).toContain(urenTekst(1.5, l as Taal));
          }
        } else {
          controleerUitvoer(v, [], pad);
        }
      }
    }
  });

  test("TICKET_MAIL: u-vorm in het Nederlands, Sie-vorm in het Duits", () => {
    const tekstVan = (l: Taal) =>
      Object.entries(TICKET_MAIL[l] as unknown as Record<string, unknown>)
        .map(([k, v]) =>
          typeof v === "function"
            ? String((v as (...a: unknown[]) => unknown)(...(MAIL_VOORBEELD[k] ?? Array.from({ length: v.length }, () => "x"))))
            : String(v),
        )
        .join("\n");
    const nl = [tekstVan("nl"), ...Object.values(FOUT_TEKST).map((v) => v.nl)].join("\n");
    const de = [tekstVan("de"), ...Object.values(FOUT_TEKST).map((v) => v.de)].join("\n");
    expect(nl).not.toMatch(/\b(je|jij|jou|jouw)\b/i);
    expect(de).not.toMatch(/\b(du|dich|dir|dein|deine|deinen|deinem|deiner)\b/i);
  });

  test("STUDIO_MAIL (Nederlands): teksten en functies", () => {
    const g = ["nieuw", "reactie", "heropend"] as const;
    const roep: [string, unknown[], string][] = [
      ["onderwerp", ["#1001", "Vraag", "Talud Rue de Test", "test-nacht@studio-vm.be"], STUDIO_MAIL.onderwerp("#1001", "Vraag", "Talud Rue de Test", "test-nacht@studio-vm.be")],
      ...g.map((x): [string, unknown[], string] => [`titel(${x})`, ["#1001"], STUDIO_MAIL.titel(x, "#1001")]),
      ...g.map((x): [string, unknown[], string] => [`l1(${x})`, ["test-nacht@studio-vm.be", "Talud"], STUDIO_MAIL.l1(x, "test-nacht@studio-vm.be", "Talud")]),
      ["soort", ["Revisie"], STUDIO_MAIL.soort("Revisie")],
      ["project", ["Talud"], STUDIO_MAIL.project("Talud")],
      ["systeem", ["Trimble"], STUDIO_MAIL.systeem("Trimble")],
      ["taal", ["Français"], STUDIO_MAIL.taal("Français")],
      ["bijlagen", [["plan.dwg", "foto.png"]], STUDIO_MAIL.bijlagen(["plan.dwg", "foto.png"])],
    ];
    for (const [k, args, uit] of roep) controleerUitvoer(uit, args, `STUDIO_MAIL.${k}`);
    for (const [k, v] of Object.entries(STUDIO_MAIL)) {
      if (typeof v === "string") controleerUitvoer(v, [], `STUDIO_MAIL.${k}`);
    }
    expect(STUDIO_MAIL.cta).toBe("Open ticket");
  });
});

// ── tickets — routes ────────────────────────────────────────────────────

test.describe("tickets — routes", () => {
  const uuid = randomUUID();

  const PORTAAL: { pad: string; taal: Taal; titel: string }[] = [
    { pad: "/nl/portail/dashboard/tickets", taal: "nl", titel: "Inloggen" },
    { pad: "/fr/portail/dashboard/tickets/nieuw", taal: "fr", titel: "Connexion" },
    { pad: `/de/portail/dashboard/tickets/${uuid}`, taal: "de", titel: "Anmelden" },
  ];

  for (const { pad, taal, titel } of PORTAAL) {
    test(`${pad.replace(uuid, "<uuid>")}: zonder aanmelding enkel het loginformulier`, async ({ page }) => {
      const res = await page.goto(pad);
      expect(res?.status(), `${pad} status`).toBe(200);
      await expect(page.locator("html")).toHaveAttribute("lang", taal);

      // Het loginformulier van het portaal.
      const formulier = page.locator("form").filter({ has: page.locator('input[type="email"][name="email"]') });
      await expect(formulier).toBeVisible();
      await expect(page.locator("h1")).toHaveCount(1);
      await expect(page.locator("h1")).toHaveText(titel);

      // Geen ticketinhoud: geen formulier, geen bestandskiezer, geen ticketlinks, geen status.
      await expect(page.locator("textarea")).toHaveCount(0);
      await expect(page.locator('input[type="file"]')).toHaveCount(0);
      await expect(page.locator('a[href*="/portail/dashboard/tickets"]')).toHaveCount(0);
      const tekst = await page.locator("body").innerText();
      expect(tekst).not.toContain(KLANT_STATUS_LABEL.wacht_op_studio[taal]);
      expect(tekst).not.toContain(KLANT_STATUS_LABEL.antwoord_ontvangen[taal]);
      expect(tekst).not.toContain(uuid);
      expect(tekst).not.toContain(ticketRef({ id: uuid }));
    });
  }

  for (const pad of ["/admin/tickets", `/admin/tickets/${uuid}`]) {
    test(`${pad.replace(uuid, "<uuid>")}: zonder aanmelding de admin-login`, async ({ page }) => {
      const res = await page.goto(pad);
      expect(res?.status(), `${pad} status`).toBe(200);

      // De admin-login; draait de server zonder ADMIN_PASSWORD, dan blijft de
      // admin helemaal dicht ("Nog niet geconfigureerd") — ook goed.
      const formulier = page.locator('form[action="/api/admin/login"]');
      const dicht = page.getByText("Nog niet geconfigureerd");
      await expect(formulier.or(dicht)).toBeVisible();
      if ((await formulier.count()) > 0) {
        await expect(formulier.locator('input[type="password"][name="password"]')).toBeVisible();
      } else {
        test.info().annotations.push({ type: "admin", description: "ADMIN_PASSWORD ontbreekt: admin dicht, geen loginformulier" });
      }

      await expect(page.locator("textarea")).toHaveCount(0);
      await expect(page.locator('a[href^="/admin/tickets"]')).toHaveCount(0);
      // Ook niet in de RSC-payload: de admin-pagina zelf rendert niets zonder aanmelding.
      const html = (await res?.text()) ?? "";
      expect(html).not.toContain("Aan mij");
      expect(html).not.toContain("Migratie 0049");
    });
  }

  test("GET /api/cron/tickets zonder (geldige) header geeft 401", async ({ request }) => {
    const r = await request.get("/api/cron/tickets", { failOnStatusCode: false, maxRedirects: 0 });
    expect(r.status()).toBe(401);
    const fout = await request.get("/api/cron/tickets", {
      failOnStatusCode: false,
      maxRedirects: 0,
      headers: { authorization: "Bearer geen-geheim" },
    });
    expect(fout.status()).toBe(401);
  });
});
