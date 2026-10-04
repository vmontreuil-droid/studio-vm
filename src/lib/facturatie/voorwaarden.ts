import type { Locale } from "@/lib/i18n/config";

// Voorwaarden op de factuur — één bron voor het factuurdocument, het portaal
// en het beheer. Een korte samenvatting van de algemene voorwaarden
// (/voorwaarden), zonder er iets aan toe te voegen of ervan af te wijken.
// Enkel de gevolgen van laattijdige betaling komen uit de wet zelf
// (Wet van 2 augustus 2002, betalingsachterstand bij handelstransacties):
// die gelden tussen bedrijven van rechtswege.

export type VoorwaardenSoort = "uurwerk" | "website";
export type Voorwaarde = { kop: string; tekst: string };
export type FactuurVoorwaarden = { titel: string; punten: Voorwaarde[]; volledig: string };

const TITEL: Record<Locale, string> = {
  nl: "Voorwaarden",
  fr: "Conditions",
  en: "Terms",
  de: "Bedingungen",
  es: "Condiciones",
};

function volledig(taal: Locale): string {
  const url = `studio-vm.be/${taal}/voorwaarden`;
  return {
    nl: `Volledige algemene voorwaarden: ${url}`,
    fr: `Conditions générales complètes : ${url}`,
    en: `Full terms and conditions: ${url}`,
    de: `Vollständige AGB: ${url}`,
    es: `Condiciones generales completas: ${url}`,
  }[taal];
}

const LAAT: Record<Locale, Voorwaarde> = {
  nl: {
    kop: "Laattijdige betaling",
    tekst: "Van rechtswege en zonder ingebrekestelling: verwijlinterest aan de wettelijke rentevoet en een forfaitaire vergoeding van € 40 (wet van 2 augustus 2002). Na herinnering kan verdere levering worden opgeschort.",
  },
  fr: {
    kop: "Retard de paiement",
    tekst: "De plein droit et sans mise en demeure : intérêts de retard au taux légal et indemnité forfaitaire de 40 € (loi du 2 août 2002). Après rappel, la suite des livraisons peut être suspendue.",
  },
  en: {
    kop: "Late payment",
    tekst: "By operation of law and without notice: late-payment interest at the statutory rate and a fixed compensation of € 40 (Belgian Act of 2 August 2002). After a reminder, further deliveries may be suspended.",
  },
  de: {
    kop: "Zahlungsverzug",
    tekst: "Von Rechts wegen und ohne Inverzugsetzung: Verzugszinsen zum gesetzlichen Zinssatz und eine Pauschalentschädigung von 40 € (belgisches Gesetz vom 2. August 2002). Nach Mahnung können weitere Lieferungen ausgesetzt werden.",
  },
  es: {
    kop: "Pago tardío",
    tekst: "De pleno derecho y sin requerimiento: intereses de demora al tipo legal y una indemnización fija de 40 € (ley belga de 2 de agosto de 2002). Tras un recordatorio, las entregas posteriores pueden suspenderse.",
  },
};

const RECHT: Record<Locale, Voorwaarde> = {
  nl: { kop: "Recht", tekst: "Belgisch recht; bij geschillen zijn de rechtbanken van Kortrijk bevoegd." },
  fr: { kop: "Droit applicable", tekst: "Droit belge ; en cas de litige, les tribunaux de Courtrai sont compétents." },
  en: { kop: "Governing law", tekst: "Belgian law; the courts of Kortrijk have jurisdiction in any dispute." },
  de: { kop: "Recht", tekst: "Belgisches Recht; bei Streitigkeiten sind die Gerichte von Kortrijk zuständig." },
  es: { kop: "Ley aplicable", tekst: "Ley belga; en caso de litigio, son competentes los tribunales de Kortrijk." },
};

// 3D-modellen en revisies (uurwerk): samenvatting van /voorwaarden.
const UURWERK: Record<Locale, Voorwaarde[]> = {
  nl: [
    { kop: "Tarief", tekst: "Uurtarief excl. btw volgens de categorie (vroegtijdig € 45, normaal € 50, last-minute € 75), op de werkelijk gepresteerde uren, minimum 1 uur. Meerdere formaten zonder meerprijs." },
    { kop: "Betaling", tekst: "Vóór de vervaldag op deze factuur, online via het klantenportaal of per overschrijving met de gestructureerde mededeling. De modelbestanden worden vrijgegeven na betaling." },
    { kop: "Controle", tekst: "Controleer het model binnen 5 werkdagen na levering. Zonder schriftelijke opmerking binnen die termijn, of zodra ermee gewerkt wordt, geldt het als aanvaard." },
    { kop: "Revisies", tekst: "Aanpassingen na een planwijziging aan het uurtarief; een aantoonbare fout van Studio VM wordt kosteloos verbeterd." },
    { kop: "Aansprakelijkheid", tekst: "Beperkt tot het gefactureerde bedrag van de opdracht en tot directe schade; geen gevolgschade zoals herstelwerk, stilstand, vertraging of winstderving." },
  ],
  fr: [
    { kop: "Tarif", tekst: "Tarif horaire HTVA selon la catégorie (anticipé 45 €, normal 50 €, dernière minute 75 €), sur les heures réellement prestées, minimum 1 heure. Plusieurs formats sans supplément." },
    { kop: "Paiement", tekst: "Avant l'échéance indiquée sur cette facture, en ligne via l'espace client ou par virement avec la communication structurée. Les fichiers du modèle sont débloqués après paiement." },
    { kop: "Contrôle", tekst: "Contrôlez le modèle dans les 5 jours ouvrables suivant la livraison. Sans remarque écrite dans ce délai, ou dès qu'il est utilisé, il est réputé accepté." },
    { kop: "Révisions", tekst: "Les adaptations suite à une modification des plans sont facturées au tarif horaire ; une erreur avérée de Studio VM est corrigée gratuitement." },
    { kop: "Responsabilité", tekst: "Limitée au montant facturé de la mission et au dommage direct ; aucun dommage indirect tel que travaux de réparation, immobilisation, retard ou manque à gagner." },
  ],
  en: [
    { kop: "Rate", tekst: "Hourly rate excl. VAT by category (early € 45, normal € 50, last-minute € 75), on the hours actually worked, 1 hour minimum. Multiple formats at no extra cost." },
    { kop: "Payment", tekst: "Before the due date on this invoice, online via the client portal or by bank transfer with the structured reference. The model files are released after payment." },
    { kop: "Review", tekst: "Check the model within 5 working days of delivery. Without written remarks within that period, or as soon as it is used, it is deemed accepted." },
    { kop: "Revisions", tekst: "Changes after a plan modification are charged at the hourly rate; a demonstrable error by Studio VM is corrected free of charge." },
    { kop: "Liability", tekst: "Limited to the invoiced amount of the assignment and to direct damage; no consequential damage such as repair work, downtime, delay or loss of profit." },
  ],
  de: [
    { kop: "Tarif", tekst: "Stundensatz zzgl. MwSt. je Kategorie (frühzeitig 45 €, normal 50 €, Last-minute 75 €), nach tatsächlich geleisteten Stunden, mindestens 1 Stunde. Mehrere Formate ohne Aufpreis." },
    { kop: "Zahlung", tekst: "Vor dem Fälligkeitsdatum auf dieser Rechnung, online über das Kundenportal oder per Überweisung mit der strukturierten Mitteilung. Die Modelldateien werden nach Zahlung freigegeben." },
    { kop: "Prüfung", tekst: "Prüfen Sie das Modell innerhalb von 5 Werktagen nach Lieferung. Ohne schriftliche Anmerkung innerhalb dieser Frist, oder sobald damit gearbeitet wird, gilt es als abgenommen." },
    { kop: "Revisionen", tekst: "Anpassungen nach einer Planänderung werden zum Stundensatz berechnet; ein nachweisbarer Fehler von Studio VM wird kostenlos behoben." },
    { kop: "Haftung", tekst: "Beschränkt auf den in Rechnung gestellten Betrag des Auftrags und auf direkte Schäden; keine Folgeschäden wie Nacharbeiten, Stillstand, Verzug oder entgangener Gewinn." },
  ],
  es: [
    { kop: "Tarifa", tekst: "Tarifa por hora sin IVA según la categoría (anticipado 45 €, normal 50 €, última hora 75 €), por las horas realmente trabajadas, mínimo 1 hora. Varios formatos sin coste adicional." },
    { kop: "Pago", tekst: "Antes de la fecha de vencimiento de esta factura, en línea a través del portal de cliente o por transferencia con la comunicación estructurada. Los archivos del modelo se liberan tras el pago." },
    { kop: "Revisión", tekst: "Compruebe el modelo en los 5 días hábiles siguientes a la entrega. Sin observaciones por escrito en ese plazo, o en cuanto se utilice, se considera aceptado." },
    { kop: "Revisiones", tekst: "Los cambios tras una modificación de los planos se facturan a la tarifa por hora; un error demostrable de Studio VM se corrige gratuitamente." },
    { kop: "Responsabilidad", tekst: "Limitada al importe facturado del encargo y a los daños directos; ningún daño indirecto como reparaciones, inactividad, retrasos o lucro cesante." },
  ],
};

// Oude websitefacturen (archief): de bestaande tekst, ongewijzigd.
const WEBSITE: Record<Locale, Voorwaarde> = {
  nl: { kop: "Betaling en abonnement", tekst: "Betaling: 30% voorschot om te starten, de resterende 70% vóór de site live gaat. Alle betalingen verlopen uitsluitend via uw beveiligde klantenportaal — geen uitzonderingen. Het onderhoudsabonnement heeft een minimumlooptijd van 1 jaar en wordt, zonder schriftelijke opzegging minstens 1 maand vóór het einde van de jaarperiode, telkens stilzwijgend met één jaar verlengd. Domein & e-mail (overname/verlenging) zijn ten laste van de klant en worden, afhankelijk van het geval, op de slotfactuur verrekend." },
  fr: { kop: "Paiement et abonnement", tekst: "Paiement : acompte de 30% pour démarrer, les 70% restants avant la mise en ligne. Tous les paiements se font exclusivement via votre portail client sécurisé — sans exception. L'abonnement de maintenance a une durée minimale d'1 an et est, sauf résiliation écrite au moins 1 mois avant la fin de la période annuelle, reconduit tacitement pour un an à chaque fois. Domaine & e-mail (reprise/renouvellement) sont à charge du client et, selon le cas, décomptés sur la facture finale." },
  en: { kop: "Payment and subscription", tekst: "Payment: 30% deposit to start, the remaining 70% before the site goes live. All payments go exclusively through your secure client portal — no exceptions. The maintenance subscription has a minimum term of 1 year and, unless cancelled in writing at least 1 month before the end of the yearly term, renews tacitly for one year each time. Domain & email (transfer/renewal) are borne by the client and, depending on the case, settled on the final invoice." },
  de: { kop: "Zahlung und Abonnement", tekst: "Zahlung: 30 % Anzahlung zum Start, die restlichen 70 % bevor die Website live geht. Alle Zahlungen erfolgen ausschließlich über Ihr gesichertes Kundenportal — ohne Ausnahme. Das Wartungsabonnement hat eine Mindestlaufzeit von 1 Jahr und verlängert sich, sofern es nicht mindestens 1 Monat vor Ende des Jahreszeitraums schriftlich gekündigt wird, jeweils stillschweigend um ein Jahr. Domain & E-Mail (Übernahme/Verlängerung) gehen zu Lasten des Kunden und werden je nach Fall mit der Schlussrechnung verrechnet." },
  es: { kop: "Pago y suscripción", tekst: "Pago: anticipo del 30 % para empezar y el 70 % restante antes de que el sitio se publique. Todos los pagos se realizan exclusivamente a través de su portal de cliente seguro — sin excepciones. La suscripción de mantenimiento tiene una duración mínima de 1 año y, salvo cancelación por escrito al menos 1 mes antes del final del periodo anual, se renueva tácitamente por un año cada vez. El dominio y el correo electrónico (traslado/renovación) corren a cargo del cliente y, según el caso, se liquidan en la factura final." },
};

/** De voorwaarden voor op een factuur, in de taal van de klant. */
export function factuurVoorwaarden(taal: Locale, soort: VoorwaardenSoort): FactuurVoorwaarden {
  const eigen = soort === "uurwerk" ? UURWERK[taal] : [WEBSITE[taal]];
  return {
    titel: TITEL[taal],
    punten: [...eigen, LAAT[taal], RECHT[taal]],
    volledig: volledig(taal),
  };
}
