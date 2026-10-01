// Uitlegtekeningen voor de kennisbank. Inline SVG in de huisstijl: lijnen in
// currentColor, accent in var(--accent), vlakken in var(--card) — dus scherp en
// correct in licht én donker. Teksten per taal.
import Image from "next/image";
import type { Locale } from "@/lib/i18n/config";

type L = Record<Locale, string>;
const tx = (l: Locale, t: L) => t[l];

const ACC = "var(--accent)";
const MUT = "var(--muted-foreground, #a8a29e)";

function Kader({ children, onderschrift }: { children: React.ReactNode; onderschrift: string }) {
  return (
    <figure className="my-10">
      <div className="overflow-hidden rounded-3xl border bg-card p-4 text-foreground sm:p-6">{children}</div>
      <figcaption className="mt-3 text-center text-sm text-muted">{onderschrift}</figcaption>
    </figure>
  );
}

function Render({ licht, donker, onderschrift }: { licht: string; donker: string; onderschrift: string }) {
  return (
    <figure className="my-10">
      <div className="relative aspect-[16/10] overflow-hidden rounded-3xl border bg-card">
        <Image src={licht} alt={onderschrift} fill sizes="(max-width: 768px) 100vw, 768px" className="alleen-licht object-cover" />
        <Image src={donker} alt="" fill sizes="(max-width: 768px) 100vw, 768px" className="alleen-donker object-cover" />
      </div>
      <figcaption className="mt-3 text-center text-sm text-muted">{onderschrift}</figcaption>
    </figure>
  );
}

const lbl = { fontSize: 13, fontFamily: "var(--font-sans), sans-serif", fill: "currentColor" } as const;
const klein = { ...lbl, fontSize: 11, fill: MUT } as const;

/* ── 1. Van punten naar oppervlak ─────────────────────────────────────── */
const PT: [number, number][] = [[20, 30], [70, 15], [120, 35], [35, 80], [85, 65], [130, 90], [15, 125], [70, 120], [125, 135]];
const TRI: [number, number, number][] = [[0, 1, 4], [0, 4, 3], [1, 2, 4], [2, 5, 4], [3, 4, 7], [3, 7, 6], [4, 5, 7], [5, 8, 7]];
function PuntenNaarOppervlak({ l }: { l: Locale }) {
  const kop = [tx(l, { nl: "1 · Punten", fr: "1 · Points", en: "1 · Points", de: "1 · Punkte", es: "1 · Puntos" }), tx(l, { nl: "2 · Driehoeken", fr: "2 · Triangles", en: "2 · Triangles", de: "2 · Dreiecke", es: "2 · Triángulos" }), tx(l, { nl: "3 · Oppervlak", fr: "3 · Surface", en: "3 · Surface", de: "3 · Oberfläche", es: "3 · Superficie" })];
  const hoogteKleur = ["#2563eb", "#0ea5e9", "#22c55e", "#84cc16", "#eab308", "#f97316", "#ef4444", "#f59e0b"];
  return (
    <svg viewBox="0 0 540 190" className="w-full" role="img" aria-label={kop.join(", ")}>
      {[0, 1, 2].map((p) => (
        <g key={p} transform={`translate(${20 + p * 180},25)`}>
          <text x="0" y="-8" style={lbl} fontWeight={600}>{kop[p]}</text>
          {p >= 1 &&
            TRI.map((t, i) => (
              <polygon
                key={i}
                points={t.map((k) => PT[k].join(",")).join(" ")}
                fill={p === 2 ? hoogteKleur[i] : "none"}
                fillOpacity={p === 2 ? 0.75 : 0}
                stroke={p === 2 ? "white" : ACC}
                strokeOpacity={p === 2 ? 0.6 : 1}
                strokeWidth={1.2}
              />
            ))}
          {PT.map(([x, y], i) => (
            <circle key={i} cx={x} cy={y} r={p === 2 ? 1.8 : 3.5} fill={p === 0 ? ACC : "currentColor"} />
          ))}
        </g>
      ))}
      <path d="M163 95 h18 m-6 -5 l6 5 l-6 5 M343 95 h18 m-6 -5 l6 5 l-6 5" stroke={MUT} strokeWidth={1.5} fill="none" />
    </svg>
  );
}

/* ── 2. Bestaand terrein vs ontwerp (uitgraven / ophogen) ─────────────── */
function DoorsnedeOntwerp({ l }: { l: Locale }) {
  return (
    <svg viewBox="0 0 540 200" className="w-full" role="img" aria-label="doorsnede">
      <defs>
        <pattern id="arcering" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
          <line x1="0" y1="0" x2="0" y2="8" stroke={ACC} strokeWidth="2" strokeOpacity="0.35" />
        </pattern>
      </defs>
      {/* uitgraving: bestaand boven ontwerp */}
      <path d="M40 70 C110 50 170 60 220 85 L220 110 L40 110 Z" fill="url(#arcering)" />
      {/* ophoging: ontwerp boven bestaand */}
      <path d="M300 110 L500 110 L500 95 C440 130 370 140 300 125 Z" fill={ACC} fillOpacity={0.18} />
      <path d="M40 70 C110 50 170 60 220 85 C260 105 280 130 330 132 C390 135 450 120 500 95" fill="none" stroke={MUT} strokeWidth={2.5} strokeDasharray="6 5" />
      <path d="M40 110 L500 110" fill="none" stroke="currentColor" strokeWidth={3} />
      <text x="70" y="98" style={lbl} fontWeight={600}>{tx(l, { nl: "Uitgraven", fr: "Déblai", en: "Cut", de: "Abtrag", es: "Desmonte" })}</text>
      <text x="380" y="128" style={lbl} fontWeight={600}>{tx(l, { nl: "Ophogen", fr: "Remblai", en: "Fill", de: "Auftrag", es: "Terraplén" })}</text>
      <g transform="translate(40,160)">
        <line x1="0" y1="0" x2="28" y2="0" stroke={MUT} strokeWidth={2.5} strokeDasharray="6 5" />
        <text x="36" y="4" style={klein}>{tx(l, { nl: "Bestaand terrein (opmeting)", fr: "Terrain existant (levé)", en: "Existing ground (survey)", de: "Bestehendes Gelände (Aufmaß)", es: "Terreno existente (levantamiento)" })}</text>
        <line x1="250" y1="0" x2="278" y2="0" stroke="currentColor" strokeWidth={3} />
        <text x="286" y="4" style={klein}>{tx(l, { nl: "Ontwerp = waar de machine op stuurt", fr: "Projet = ce que la machine suit", en: "Design = what the machine follows", de: "Entwurf = woran die Maschine steuert", es: "Proyecto = lo que sigue la máquina" })}</text>
      </g>
    </svg>
  );
}

/* ── 3. Breeklijn: boordsteen met en zonder ──────────────────────────── */
function Breeklijn({ l }: { l: Locale }) {
  const paneel = (x: number, met: boolean, titel: string) => (
    <g transform={`translate(${x},20)`}>
      <text x="0" y="0" style={lbl} fontWeight={600}>{titel}</text>
      {/* juiste vorm: rijbaan → boordsteen (verticaal) → voetpad */}
      <path d="M0 110 L90 110 L90 80 L220 80" fill="none" stroke={MUT} strokeWidth={1.5} strokeDasharray="4 4" />
      {met ? (
        <path d="M0 110 L90 110 L90 80 L220 80" fill="none" stroke="currentColor" strokeWidth={3} />
      ) : (
        <path d="M0 110 L60 110 L120 80 L220 80" fill="none" stroke="currentColor" strokeWidth={3} />
      )}
      {[0, 60, 120, 220].map((px, i) => (
        <circle key={i} cx={px} cy={px <= 60 ? 110 : 80} r={3.5} fill="currentColor" />
      ))}
      {met && (
        <>
          <line x1="90" y1="70" x2="90" y2="125" stroke={ACC} strokeWidth={2.5} />
          <circle cx="90" cy="110" r={4.5} fill={ACC} />
          <circle cx="90" cy="80" r={4.5} fill={ACC} />
          <text x="98" y="128" style={{ ...klein, fill: ACC }}>{tx(l, { nl: "breeklijn", fr: "ligne de rupture", en: "breakline", de: "Bruchkante", es: "línea de ruptura" })}</text>
        </>
      )}
      {!met && <text x="40" y="70" style={{ ...klein, fill: "#ef4444" }}>{tx(l, { nl: "afgeschuinde rand ✗", fr: "bord biseauté ✗", en: "bevelled edge ✗", de: "abgeschrägte Kante ✗", es: "borde biselado ✗" })}</text>}
    </g>
  );
  return (
    <svg viewBox="0 0 540 170" className="w-full" role="img" aria-label="breeklijn">
      {paneel(20, false, tx(l, { nl: "Zonder breeklijn", fr: "Sans ligne de rupture", en: "Without breakline", de: "Ohne Bruchkante", es: "Sin línea de ruptura" }))}
      {paneel(290, true, tx(l, { nl: "Met breeklijn", fr: "Avec ligne de rupture", en: "With breakline", de: "Mit Bruchkante", es: "Con línea de ruptura" }))}
      <text x="20" y="160" style={klein}>{tx(l, { nl: "Doorsnede rijbaan → boordsteen → voetpad. Stippellijn = juiste vorm.", fr: "Coupe chaussée → bordure → trottoir. Pointillé = forme correcte.", en: "Section road → kerb → footpath. Dotted = correct shape.", de: "Schnitt Fahrbahn → Bordstein → Gehweg. Gestrichelt = richtige Form.", es: "Sección calzada → bordillo → acera. Discontinua = forma correcta." })}</text>
    </svg>
  );
}

/* ── 4. Verkeerd stelsel = verschoven model ──────────────────────────── */
function StelselVerschuiving({ l }: { l: Locale }) {
  const vorm = "M0 0 L80 -10 L95 40 L20 55 Z";
  return (
    <svg viewBox="0 0 540 200" className="w-full" role="img" aria-label="stelsel">
      <g stroke={MUT} strokeOpacity={0.35}>
        {Array.from({ length: 12 }, (_, i) => <line key={"v" + i} x1={20 + i * 45} y1="10" x2={20 + i * 45} y2="170" />)}
        {Array.from({ length: 4 }, (_, i) => <line key={"h" + i} x1="20" y1={10 + i * 53} x2="515" y2={10 + i * 53} />)}
      </g>
      {/* werf */}
      <rect x="95" y="55" width="130" height="90" rx="8" fill={ACC} fillOpacity={0.08} stroke={ACC} strokeDasharray="5 4" />
      <text x="100" y="50" style={{ ...klein, fill: ACC }}>{tx(l, { nl: "werf", fr: "chantier", en: "site", de: "Baustelle", es: "obra" })}</text>
      <path d={vorm} transform="translate(120,75)" fill="#22c55e" fillOpacity={0.6} stroke="currentColor" strokeWidth={1.5} />
      <text x="110" y="162" style={klein}>{tx(l, { nl: "juist stelsel ✓", fr: "bon système ✓", en: "right system ✓", de: "richtiges System ✓", es: "sistema correcto ✓" })}</text>
      <path d={vorm} transform="translate(360,40)" fill="#ef4444" fillOpacity={0.55} stroke="currentColor" strokeWidth={1.5} />
      <text x="350" y="125" style={klein}>{tx(l, { nl: "verkeerd stelsel ✗", fr: "mauvais système ✗", en: "wrong system ✗", de: "falsches System ✗", es: "sistema erróneo ✗" })}</text>
      <path d="M220 100 C270 80 300 70 350 70" fill="none" stroke="#ef4444" strokeWidth={2} strokeDasharray="5 4" markerEnd="url(#pijl)" />
      <defs>
        <marker id="pijl" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto">
          <path d="M0 0 L10 5 L0 10 z" fill="#ef4444" />
        </marker>
      </defs>
      <text x="232" y="122" style={{ ...klein, fill: "#ef4444" }}>{tx(l, { nl: "meters tot km naast de werf", fr: "de mètres à km à côté", en: "metres to km off site", de: "Meter bis km daneben", es: "de metros a km fuera" })}</text>
    </svg>
  );
}

/* ── 5. Hoogte: ellipsoïde, geoïde, maaiveld ─────────────────────────── */
function Hoogtereferentie({ l }: { l: Locale }) {
  const legende = [
    { kleur: "#22c55e", streep: undefined, tekst: { nl: "Maaiveld — punt op de werf", fr: "Terrain — point sur chantier", en: "Ground — point on site", de: "Gelände — Punkt auf der Baustelle", es: "Terreno — punto en obra" } },
    { kleur: ACC, streep: "7 5", tekst: { nl: "Geoïde ≈ gemiddeld zeeniveau (TAW, NAP, NGF…)", fr: "Géoïde ≈ niveau moyen des mers (DNG, NAP, NGF…)", en: "Geoid ≈ mean sea level (TAW, NAP, ODN…)", de: "Geoid ≈ mittlerer Meeresspiegel (DHHN, NAP, NGF…)", es: "Geoide ≈ nivel medio del mar (NAP, NGF, Alicante…)" } },
    { kleur: MUT, streep: undefined, tekst: { nl: "Ellipsoïde — hier meet GNSS (h)", fr: "Ellipsoïde — le GNSS mesure ici (h)", en: "Ellipsoid — GNSS measures here (h)", de: "Ellipsoid — hier misst GNSS (h)", es: "Elipsoide — aquí mide el GNSS (h)" } },
  ];
  return (
    <svg viewBox="0 0 540 250" className="w-full" role="img" aria-label="hoogte">
      <path d="M20 40 C120 20 200 60 300 35 C380 15 450 50 520 30" fill="none" stroke="#22c55e" strokeWidth={3} />
      <path d="M20 105 C140 90 260 120 380 98 C450 86 490 100 520 95" fill="none" stroke={ACC} strokeWidth={2.5} strokeDasharray="7 5" />
      <path d="M20 145 C160 140 380 140 520 145" fill="none" stroke={MUT} strokeWidth={2} />
      {/* H: maaiveld → geoïde, N: geoïde → ellipsoïde, h: maaiveld → ellipsoïde */}
      <circle cx="300" cy="35" r={5} fill="currentColor" />
      <line x1="300" y1="35" x2="300" y2="142" stroke="currentColor" strokeWidth={1} strokeDasharray="2 3" />
      <text x="308" y="72" style={lbl} fontWeight={600}>H</text>
      <text x="308" y="128" style={lbl} fontWeight={600}>N</text>
      <line x1="270" y1="35" x2="270" y2="142" stroke={MUT} strokeWidth={1.2} />
      <text x="252" y="92" style={lbl} fontWeight={600}>h</text>
      <text x="430" y="128" style={{ ...lbl, fontSize: 12 }}>H = h − N</text>
      {legende.map((g, i) => (
        <g key={i} transform={`translate(20,${180 + i * 22})`}>
          <line x1="0" y1="0" x2="30" y2="0" stroke={g.kleur} strokeWidth={2.5} strokeDasharray={g.streep} />
          <text x="40" y="4" style={klein}>{tx(l, g.tekst)}</text>
        </g>
      ))}
    </svg>
  );
}

/* ── 6. Van plannen naar alle systemen ───────────────────────────────── */
function Stroom({ l }: { l: Locale }) {
  const box = (x: number, y: number, w: number, kop: string, sub: string, accent = false) => (
    <g transform={`translate(${x},${y})`}>
      <rect width={w} height="62" rx="14" fill={accent ? ACC : "var(--background)"} fillOpacity={accent ? 0.12 : 1} stroke={accent ? ACC : MUT} />
      <text x="14" y="26" style={lbl} fontWeight={600}>{kop}</text>
      <text x="14" y="45" style={klein}>{sub}</text>
    </g>
  );
  const sys = ["Trimble", "Topcon", "Leica", "Unicontrol", "CHCNAV"];
  return (
    <svg viewBox="0 0 540 230" className="w-full" role="img" aria-label="stroom">
      {box(10, 84, 130, tx(l, { nl: "Uw plannen", fr: "Vos plans", en: "Your plans", de: "Ihre Pläne", es: "Sus planos" }), "PDF · DWG · DXF · LandXML")}
      {box(190, 84, 140, tx(l, { nl: "3D-model", fr: "Modèle 3D", en: "3D model", de: "3D-Modell", es: "Modelo 3D" }), tx(l, { nl: "TIN + lijnwerk + stelsel", fr: "TIN + filaire + système", en: "TIN + linework + system", de: "TIN + Linien + System", es: "TIN + líneas + sistema" }), true)}
      <path d="M142 115 h44 m-7 -5 l7 5 l-7 5" stroke={MUT} strokeWidth={1.6} fill="none" />
      {sys.map((s, i) => {
        const y = 12 + i * 42;
        return (
          <g key={s}>
            <path d={`M332 115 C370 115 370 ${y + 17} 405 ${y + 17}`} stroke={MUT} strokeWidth={1.3} fill="none" />
            <rect x="408" y={y} width="122" height="34" rx="17" fill="var(--background)" stroke="currentColor" strokeOpacity={0.4} />
            <text x="469" y={y + 21} textAnchor="middle" style={lbl}>{s}</text>
          </g>
        );
      })}
    </svg>
  );
}

/* ── 7. Wat aanleveren ───────────────────────────────────────────────── */
function Aanleveren({ l }: { l: Locale }) {
  const docs = [
    { t: { nl: "Inplantingsplan", fr: "Plan d'implantation", en: "Layout plan", de: "Lageplan", es: "Plano de planta" }, s: "DWG / DXF", must: true },
    { t: { nl: "Lengteprofiel", fr: "Profil en long", en: "Long section", de: "Längsprofil", es: "Perfil longitudinal" }, s: "PDF / DWG", must: true },
    { t: { nl: "Dwarsprofielen", fr: "Profils en travers", en: "Cross sections", de: "Querprofile", es: "Perfiles transv." }, s: "PDF / DWG", must: true },
    { t: { nl: "Bestaande opmeting", fr: "Levé existant", en: "Existing survey", de: "Bestandsaufmaß", es: "Levantamiento" }, s: "DXF / LandXML", must: false },
    { t: { nl: "Stelsel + hoogte", fr: "Système + altitude", en: "System + height", de: "System + Höhe", es: "Sistema + cota" }, s: "Lambert / RD / UTM…", must: false },
  ];
  return (
    <svg viewBox="0 0 540 160" className="w-full" role="img" aria-label="aanleveren">
      {docs.map((d, i) => {
        const x = 10 + i * 106;
        return (
          <g key={i} transform={`translate(${x},10)`}>
            <path d="M0 0 h68 l18 18 v92 h-86 z" fill="var(--background)" stroke={d.must ? ACC : MUT} strokeWidth={1.6} />
            <path d="M68 0 v18 h18" fill="none" stroke={d.must ? ACC : MUT} strokeWidth={1.6} />
            {[34, 46, 58, 70].map((y) => <line key={y} x1="12" y1={y} x2={y === 70 ? 50 : 72} y2={y} stroke={MUT} strokeOpacity={0.5} strokeWidth={3} strokeLinecap="round" />)}
            <text x="43" y="128" textAnchor="middle" style={{ ...lbl, fontSize: 11.5 }} fontWeight={600}>{tx(l, d.t)}</text>
            <text x="43" y="144" textAnchor="middle" style={klein}>{d.s}</text>
          </g>
        );
      })}
    </svg>
  );
}

/* ── 8. Controle op een gekend punt ──────────────────────────────────── */
function Controlepunt({ l }: { l: Locale }) {
  return (
    <svg viewBox="0 0 540 200" className="w-full" role="img" aria-label="controle">
      <g transform="translate(150,100)">
        <circle r="70" fill={ACC} fillOpacity={0.06} stroke={ACC} strokeDasharray="4 4" />
        <circle r="40" fill={ACC} fillOpacity={0.1} stroke={ACC} />
        <circle r="5" fill="currentColor" />
        <line x1="-85" y1="0" x2="85" y2="0" stroke={MUT} strokeOpacity={0.5} />
        <line x1="0" y1="-85" x2="0" y2="85" stroke={MUT} strokeOpacity={0.5} />
        <circle cx="18" cy="-14" r="5" fill="#22c55e" />
        <text x="26" y="-18" style={{ ...klein, fill: "#16a34a" }}>✓</text>
      </g>
      <g transform="translate(270,40)">
        <text x="0" y="0" style={lbl} fontWeight={600}>{tx(l, { nl: "Vóór de start", fr: "Avant de commencer", en: "Before you start", de: "Vor dem Start", es: "Antes de empezar" })}</text>
        {[
          { nl: "1. Zet de bak of rover op een gekend punt", fr: "1. Placez le godet ou la canne sur un point connu", en: "1. Put the bucket or rover on a known point", de: "1. Löffel oder Rover auf einen bekannten Punkt setzen", es: "1. Coloque el cazo o el rover en un punto conocido" },
          { nl: "2. Vergelijk ligging én hoogte met het model", fr: "2. Comparez position et altitude au modèle", en: "2. Compare position and height with the model", de: "2. Lage und Höhe mit dem Modell vergleichen", es: "2. Compare posición y cota con el modelo" },
          { nl: "3. Binnen de tolerantie? Dan kan u starten", fr: "3. Dans la tolérance ? Vous pouvez démarrer", en: "3. Within tolerance? Then you can start", de: "3. Innerhalb der Toleranz? Dann kann es losgehen", es: "3. ¿Dentro de la tolerancia? Puede empezar" },
          { nl: "4. Erbuiten? Eerst stelsel/kalibratie nakijken", fr: "4. Hors tolérance ? Vérifiez système/calibration", en: "4. Outside? Check system/calibration first", de: "4. Außerhalb? Erst System/Kalibrierung prüfen", es: "4. ¿Fuera? Revise antes sistema/calibración" },
        ].map((r, i) => (
          <text key={i} x="0" y={30 + i * 26} style={{ ...lbl, fontSize: 12.5 }}>{tx(l, r)}</text>
        ))}
      </g>
    </svg>
  );
}

/* ── Per artikel: welke illustratie na welke sectie ──────────────────── */
export type Illustratie = { naSectie: number; render: (l: Locale) => React.ReactNode };

export const ILLUSTRATIES: Record<string, Illustratie[]> = {
  "wat-is-een-3d-model": [
    { naSectie: 0, render: (l) => <Kader onderschrift={tx(l, { nl: "Een terreinmodel ontstaat uit punten, die met driehoeken tot een oppervlak verbonden worden.", fr: "Un modèle de terrain naît de points reliés par des triangles en une surface.", en: "A terrain model is built from points, joined by triangles into a surface.", de: "Ein Geländemodell entsteht aus Punkten, die durch Dreiecke zu einer Oberfläche verbunden werden.", es: "Un modelo de terreno se construye a partir de puntos unidos por triángulos en una superficie." })}><PuntenNaarOppervlak l={l} /></Kader> },
    { naSectie: 1, render: (l) => <Kader onderschrift={tx(l, { nl: "Het verschil tussen bestaand terrein en ontwerp bepaalt waar gegraven en opgehoogd wordt.", fr: "La différence entre terrain existant et projet détermine déblais et remblais.", en: "The difference between existing ground and design decides where to cut and fill.", de: "Der Unterschied zwischen bestehendem Gelände und Entwurf bestimmt, wo Abtrag und wo Auftrag nötig ist.", es: "La diferencia entre el terreno existente y el proyecto determina dónde hay desmonte y dónde terraplén." })}><DoorsnedeOntwerp l={l} /></Kader> },
    { naSectie: 2, render: (l) => <Render licht="/3d/driehoeksnet-licht.png" donker="/3d/driehoeksnet-donker.png" onderschrift={tx(l, { nl: "Een echt driehoeksnet (TIN) van een ontwerp.", fr: "Un vrai réseau de triangles (TIN) d'un projet.", en: "A real triangle network (TIN) of a design.", de: "Ein echtes Dreiecksnetz (TIN) eines Entwurfs.", es: "Una red de triángulos (TIN) real de un proyecto." })} /> },
  ],
  "lijnwerk-en-breeklijnen": [
    { naSectie: 0, render: (l) => <Kader onderschrift={tx(l, { nl: "Zonder breeklijn trekt het oppervlak de boordsteen schuin weg; met breeklijn blijft de rand scherp.", fr: "Sans ligne de rupture, la surface biseaute la bordure ; avec, le bord reste net.", en: "Without a breakline the surface bevels the kerb away; with one, the edge stays sharp.", de: "Ohne Bruchkante zieht die Oberfläche den Bordstein schräg weg; mit Bruchkante bleibt die Kante scharf.", es: "Sin línea de ruptura la superficie bisela el bordillo; con ella, el borde se mantiene nítido." })}><Breeklijn l={l} /></Kader> },
    { naSectie: 2, render: (l) => <Render licht="/3d/r/p-betrix-draad-licht.webp" donker="/3d/r/p-betrix-draad-donker.webp" onderschrift={tx(l, { nl: "Lijnwerk: kanten en breeklijnen zoals de machinist ze op zijn scherm ziet.", fr: "Filaire : bords et lignes de rupture tels que le conducteur les voit.", en: "Linework: edges and breaklines as the operator sees them on screen.", de: "Linien: Kanten und Bruchkanten, wie der Maschinenführer sie auf dem Bildschirm sieht.", es: "Líneas: bordes y líneas de ruptura tal como las ve el operador en pantalla." })} /> },
  ],
  coordinatenstelsels: [
    { naSectie: 0, render: (l) => <Kader onderschrift={tx(l, { nl: "Hoogte: GNSS meet ten opzichte van de ellipsoïde; plannen gebruiken een nationaal hoogtesysteem.", fr: "Altitude : le GNSS mesure par rapport à l'ellipsoïde ; les plans utilisent un système national.", en: "Height: GNSS measures against the ellipsoid; plans use a national height system.", de: "Höhe: GNSS misst gegenüber dem Ellipsoid; Pläne verwenden einen nationalen Höhenbezug.", es: "Altura: el GNSS mide respecto al elipsoide; los planos usan una referencia altimétrica nacional." })}><Hoogtereferentie l={l} /></Kader> },
    { naSectie: 3, render: (l) => <Kader onderschrift={tx(l, { nl: "Hetzelfde model in een verkeerd stelsel ligt gewoon naast de werf — zonder foutmelding.", fr: "Le même modèle dans un mauvais système tombe à côté du chantier — sans message d'erreur.", en: "The same model in the wrong system simply lands next to the site — with no error message.", de: "Dasselbe Modell im falschen Koordinatensystem liegt einfach neben der Baustelle — ohne Fehlermeldung.", es: "El mismo modelo en el sistema equivocado queda simplemente fuera de la obra — sin ningún mensaje de error." })}><StelselVerschuiving l={l} /></Kader> },
  ],
  "bestanden-per-merk": [
    { naSectie: 0, render: (l) => <Kader onderschrift={tx(l, { nl: "Eén model, geleverd in het formaat van elk systeem dat u kiest.", fr: "Un modèle, livré dans le format de chaque système choisi.", en: "One model, delivered in the format of every system you choose.", de: "Ein Modell, geliefert im Format jedes Systems, das Sie wählen.", es: "Un modelo, entregado en el formato de cada sistema que elija." })}><Stroom l={l} /></Kader> },
  ],
  "wat-aanleveren": [
    { naSectie: 0, render: (l) => <Kader onderschrift={tx(l, { nl: "Wat u best meestuurt. Oranje = belangrijkst.", fr: "Ce qu'il vaut mieux joindre. Orange = le plus important.", en: "What to send. Orange = most important.", de: "Was Sie am besten mitsenden. Orange = am wichtigsten.", es: "Qué conviene enviar. Naranja = lo más importante." })}><Aanleveren l={l} /></Kader> },
  ],
  "grondverzet-en-volumes": [
    { naSectie: 0, render: (l) => <Kader onderschrift={tx(l, { nl: "Waar het ontwerp onder het bestaande terrein ligt, wordt gegraven; waar het erboven ligt, opgehoogd.", fr: "Là où le projet est sous le terrain existant, on déblaie ; au-dessus, on remblaie.", en: "Where the design lies below existing ground you cut; where it lies above, you fill.", de: "Wo der Entwurf unter dem bestehenden Gelände liegt, wird abgetragen; wo er darüber liegt, aufgetragen.", es: "Donde el proyecto queda por debajo del terreno existente hay desmonte; donde queda por encima, terraplén." })}><DoorsnedeOntwerp l={l} /></Kader> },
  ],
  "van-pdf-naar-model": [
    { naSectie: 2, render: (l) => <Kader onderschrift={tx(l, { nl: "Wat u best meestuurt bij een PDF-plan.", fr: "Ce qu'il vaut mieux joindre à un plan PDF.", en: "What to send along with a PDF plan.", de: "Was Sie zu einem PDF-Plan am besten mitsenden.", es: "Qué conviene enviar junto con un plano en PDF." })}><Aanleveren l={l} /></Kader> },
  ],
  "controle-en-toleranties": [
    { naSectie: 1, render: (l) => <Render licht="/3d/r/p-libramont-helling-licht.webp" donker="/3d/r/p-libramont-helling-donker.webp" onderschrift={tx(l, { nl: "Een hellingskaart toont meteen of elk vlak correct afwatert.", fr: "Une carte des pentes montre aussitôt si chaque surface s'écoule correctement.", en: "A slope map shows at once whether every surface drains correctly.", de: "Eine Neigungskarte zeigt sofort, ob jede Fläche korrekt entwässert.", es: "Un mapa de pendientes muestra al instante si cada superficie desagua correctamente." })} /> },
    { naSectie: 2, render: (l) => <Kader onderschrift={tx(l, { nl: "Controle op een gekend punt vóór de start: binnen de tolerantie, of eerst nakijken.", fr: "Contrôle sur un point connu avant de commencer : dans la tolérance, ou vérifier d'abord.", en: "Check on a known point before starting: within tolerance, or check first.", de: "Kontrolle an einem bekannten Punkt vor dem Start: innerhalb der Toleranz, oder erst prüfen.", es: "Control en un punto conocido antes de empezar: dentro de la tolerancia, o revisar primero." })}><Controlepunt l={l} /></Kader> },
  ],
};

/** Koppenbeeld per artikel in licht én donker. */
export const KOPBEELD: Record<string, { licht: string; donker: string }> = {
  "wat-is-een-3d-model": { licht: "/3d/r/t023-licht.webp", donker: "/3d/r/t023-donker.webp" },
  "lijnwerk-en-breeklijnen": { licht: "/3d/terrein-hoogtelijnen-licht.png", donker: "/3d/terrein-hoogtelijnen-donker.png" },
  coordinatenstelsels: { licht: "/3d/weg-kruispunt-licht.png", donker: "/3d/weg-kruispunt-donker.png" },
  "bestanden-per-merk": { licht: "/3d/r/t003-licht.webp", donker: "/3d/r/t003-donker.webp" },
  "wat-aanleveren": { licht: "/3d/r/t088-licht.webp", donker: "/3d/r/t088-donker.webp" },
  "controle-en-toleranties": { licht: "/3d/r/p-riga-hoogtelijn-licht.webp", donker: "/3d/r/p-riga-hoogtelijn-donker.webp" },
  "veelgestelde-vragen": { licht: "/3d/r/t029-licht.webp", donker: "/3d/r/t029-donker.webp" },
  "van-pdf-naar-model": { licht: "/3d/r/p-libramont-hoogtelijn-licht.webp", donker: "/3d/r/p-libramont-hoogtelijn-donker.webp" },
  "grondverzet-en-volumes": { licht: "/3d/relief-bouwput-licht.png", donker: "/3d/relief-bouwput-donker.png" },
};
