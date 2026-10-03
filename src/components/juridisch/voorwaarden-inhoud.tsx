// Algemene voorwaarden: de tekst staat enkel hier. Gebruikt door de publieke
// pagina (/voorwaarden) en door het klantenportaal
// (/portail/dashboard/voorwaarden). De pagina zet zelf de kop, de
// inhoudstafel en de omhullende kolom; dit onderdeel levert de artikels.
import type { Locale } from "@/lib/i18n/config";
import type { TocItem } from "@/components/inhoud-toc";
import { identiteitsregel } from "@/lib/bedrijf";

export type VoorwaardenTekst = {
  meta: { title: string; description: string };
  eyebrow: string;
  title: string;
  updated: string;
  sections: { title: string; body: string }[];
};

export const VOORWAARDEN: Record<Locale, VoorwaardenTekst> = {
  nl: {
    meta: {
      title: "Algemene voorwaarden | Studio VM",
      description:
        "Algemene voorwaarden van Studio VM voor 3D-modellen voor machinesturing: offerte, levertermijn, revisies, betaling, aansprakelijkheid en toepasselijk recht.",
    },
    eyebrow: "Voorwaarden",
    title: "Algemene voorwaarden",
    updated: "Laatst bijgewerkt",
    sections: [
      { title: "Toepassing", body: "Deze voorwaarden gelden voor elke offerte en opdracht van Studio VM (Vincent Montreuil) voor het maken van 3D-modellen voor machinesturing, tenzij schriftelijk anders overeengekomen. Door een offerte goed te keuren aanvaardt de klant deze voorwaarden." },
      { title: "De dienst", body: "Studio VM maakt 3D-ontwerpmodellen (ontwerpoppervlak, lijnwerk, hoogtelijnen) op basis van de plannen die de klant aanlevert, en levert die digitaal in het formaat van de door de klant gekozen machinesturing(en). Studio VM verhuurt of installeert geen machinesturing, voert geen opmetingen of uitzetwerk op de werf uit en houdt geen toezicht op de uitvoering, tenzij uitdrukkelijk schriftelijk overeengekomen." },
      { title: "Offerte en prijzen", body: "Er wordt per uur gewerkt. Het uurtarief hangt af van de gekozen categorie: vroegtijdig (levering later dan 3 weken) € 45, normaal (1 à 3 weken) € 50, last-minute (binnen 5 werkdagen) € 75 per uur, telkens exclusief btw, met een minimum van 1 uur per opdracht. Elke offerte vermeldt het geschatte aantal uren. Dreigt het werk het geschatte aantal uren duidelijk te overschrijden, dan wordt de klant vooraf verwittigd. Een offerte is 30 dagen geldig. Levering in meerdere formaten (machinesturingen) gebeurt zonder meerprijs." },
      { title: "Levertermijn", body: "De levertermijn volgt uit de gekozen categorie en loopt vanaf de goedkeuring van de offerte én de ontvangst van volledige en bruikbare plannen. Ontbrekende, onduidelijke of gewijzigde plannen verschuiven de termijn. Termijnen zijn een inspanningsverbintenis; een beperkte overschrijding geeft geen recht op schadevergoeding of ontbinding." },
      { title: "Aanlevering door de klant", body: "De klant is verantwoordelijk voor de juistheid, volledigheid en actualiteit van de aangeleverde plannen en gegevens (niveaus, profielen, coördinaten, coördinatenstelsel en hoogtereferentie). Studio VM stelt op basis van het werfadres een stelsel voor; de klant bevestigt het stelsel en meldt een eventueel lokaal werfstelsel of kalibratie. Studio VM is niet verantwoordelijk voor fouten die voortkomen uit de aangeleverde gegevens." },
      { title: "Verantwoordelijkheid voor de machinesturing", body: "Studio VM levert enkel het 3D-model. De installatie, werking, instelling, kalibratie en lokalisatie van de machinesturing, het inladen van de bestanden in het systeem en de controle op de werf blijven volledig de verantwoordelijkheid van de klant. De klant controleert het model vóór de start van de werken op ten minste één gekend punt, in ligging én in hoogte." },
      { title: "Controle en aanvaarding", body: "De klant controleert het geleverde model binnen 5 werkdagen na levering en meldt eventuele opmerkingen schriftelijk via het klantenportaal of per e-mail. Zonder opmerkingen binnen die termijn, of zodra met het model wordt gewerkt, geldt het model als aanvaard." },
      { title: "Revisies", body: "Aanpassingen na een wijziging van de plannen of op vraag van de klant worden aangerekend aan het uurtarief van de gekozen categorie. Een aantoonbare fout van Studio VM ten opzichte van de aangeleverde plannen wordt kosteloos verbeterd." },
      { title: "Betaling en vrijgave", body: "Facturen zijn betaalbaar binnen 14 dagen, via Mollie of overschrijving. De modelbestanden worden in het klantenportaal vrijgegeven na betaling. Voor bedrijven in een andere EU-lidstaat met een geldig btw-nummer wordt de btw verlegd. Bij niet-betaling na herinnering kan Studio VM verdere levering opschorten; vervallen bedragen blijven verschuldigd." },
      { title: "Eigendom, vertrouwelijkheid en referenties", body: "De aangeleverde plannen blijven eigendom van de klant of de ontwerper en worden vertrouwelijk behandeld. Het geleverde model mag de klant vrij gebruiken voor het betreffende project. Studio VM mag beelden van modellen enkel anoniem tonen als referentie (zonder namen van klant, werf of locatie), tenzij de klant dit schriftelijk weigert." },
      { title: "Aansprakelijkheid", body: "De aansprakelijkheid van Studio VM is beperkt tot het gefactureerde bedrag van de betrokken opdracht en tot directe schade die rechtstreeks voortvloeit uit een bewezen fout. Studio VM is niet aansprakelijk voor indirecte schade of gevolgschade, zoals uitvoeringsfouten op de werf, herstelwerk, stilstand van machines of personeel, vertraging of winstderving, noch voor schade die het gevolg is van onjuiste aangeleverde gegevens of van het niet uitvoeren van de controle op de werf." },
      { title: "Bewaring van bestanden", body: "Plannen en modellen blijven minstens 12 maanden na levering beschikbaar in het klantenportaal. De klant bewaart zelf een kopie. Daarna kunnen ze verwijderd worden." },
      { title: "Toepasselijk recht", body: "Op elke overeenkomst is het Belgisch recht van toepassing. Bij geschillen zijn de rechtbanken van Kortrijk bevoegd." },
    ],
  },
  fr: {
    meta: {
      title: "Conditions générales | Studio VM",
      description:
        "Conditions générales de Studio VM pour les modèles 3D de guidage d'engins : devis, délais, révisions, paiement, responsabilité et droit applicable.",
    },
    eyebrow: "Conditions",
    title: "Conditions générales",
    updated: "Dernière mise à jour",
    sections: [
      { title: "Application", body: "Les présentes conditions s'appliquent à toute offre et mission de Studio VM (Vincent Montreuil) pour la réalisation de modèles 3D destinés au guidage d'engins, sauf convention écrite contraire. En approuvant un devis, le client accepte ces conditions." },
      { title: "Le service", body: "Studio VM réalise des modèles 3D de projet (surface de projet, filaire, courbes de niveau) sur base des plans fournis par le client, et les livre numériquement dans le format du ou des systèmes de guidage choisis par le client. Studio VM ne loue ni n'installe de systèmes de guidage, n'effectue pas de levés ni d'implantations sur chantier et n'assure aucune surveillance de l'exécution, sauf accord écrit exprès." },
      { title: "Devis et prix", body: "Le travail est facturé à l'heure. Le tarif horaire dépend de la catégorie choisie : anticipé (livraison au-delà de 3 semaines) 45 €, normal (1 à 3 semaines) 50 €, urgent (dans les 5 jours ouvrables) 75 € de l'heure, hors TVA, avec un minimum d'1 heure par mission. Chaque devis mentionne le nombre d'heures estimé. Si le travail risque de dépasser nettement cette estimation, le client en est averti au préalable. Un devis est valable 30 jours. La livraison dans plusieurs formats (systèmes de guidage) est sans supplément." },
      { title: "Délai de livraison", body: "Le délai découle de la catégorie choisie et court à partir de l'approbation du devis et de la réception de plans complets et exploitables. Des plans manquants, imprécis ou modifiés reportent le délai. Les délais constituent une obligation de moyens ; un léger dépassement ne donne droit ni à indemnité ni à résolution." },
      { title: "Fourniture des données par le client", body: "Le client est responsable de l'exactitude, de l'exhaustivité et de l'actualité des plans et données fournis (niveaux, profils, coordonnées, système de coordonnées et référence altimétrique). Studio VM propose un système sur base de l'adresse du chantier ; le client confirme le système et signale tout système local ou calibration propre. Studio VM n'est pas responsable des erreurs provenant des données fournies." },
      { title: "Responsabilité du système de guidage", body: "Studio VM livre uniquement le modèle 3D. L'installation, le fonctionnement, le réglage, la calibration et la localisation du système de guidage, le chargement des fichiers dans le système et le contrôle sur chantier restent entièrement sous la responsabilité du client. Le client vérifie le modèle avant le début des travaux sur au moins un point connu, en position et en altitude." },
      { title: "Contrôle et acceptation", body: "Le client contrôle le modèle livré dans les 5 jours ouvrables suivant la livraison et communique ses remarques par écrit via l'espace client ou par e-mail. Sans remarque dans ce délai, ou dès que le modèle est utilisé, il est réputé accepté." },
      { title: "Révisions", body: "Les adaptations suite à une modification des plans ou à la demande du client sont facturées au tarif horaire de la catégorie choisie. Une erreur avérée de Studio VM par rapport aux plans fournis est corrigée gratuitement." },
      { title: "Paiement et mise à disposition", body: "Les factures sont payables dans les 14 jours, via Mollie ou virement. Les fichiers du modèle sont mis à disposition dans l'espace client après paiement. Pour les entreprises d'un autre État membre de l'UE disposant d'un numéro de TVA valide, la TVA est autoliquidée. En cas de non-paiement après rappel, Studio VM peut suspendre les livraisons ; les montants échus restent dus." },
      { title: "Propriété, confidentialité et références", body: "Les plans fournis restent la propriété du client ou de l'auteur de projet et sont traités de manière confidentielle. Le client peut utiliser librement le modèle livré pour le projet concerné. Studio VM ne peut montrer des images de modèles qu'à titre de référence anonyme (sans nom de client, de chantier ou de lieu), sauf refus écrit du client." },
      { title: "Responsabilité", body: "La responsabilité de Studio VM est limitée au montant facturé de la mission concernée et aux dommages directs résultant directement d'une faute prouvée. Studio VM n'est pas responsable des dommages indirects ou consécutifs, tels que des erreurs d'exécution sur chantier, des travaux de réparation, l'immobilisation de machines ou de personnel, des retards ou un manque à gagner, ni des dommages résultant de données fournies erronées ou de l'absence de contrôle sur chantier." },
      { title: "Conservation des fichiers", body: "Les plans et modèles restent disponibles dans l'espace client pendant au moins 12 mois après livraison. Le client en conserve lui-même une copie. Ils peuvent ensuite être supprimés." },
      { title: "Droit applicable", body: "Toute convention est régie par le droit belge. En cas de litige, les tribunaux de Courtrai sont compétents." },
    ],
  },
  en: {
    meta: {
      title: "Terms and conditions | Studio VM",
      description:
        "Studio VM terms and conditions for machine control 3D models: quotes, delivery times, revisions, payment, liability and applicable law.",
    },
    eyebrow: "Terms",
    title: "Terms and conditions",
    updated: "Last updated",
    sections: [
      { title: "Application", body: "These terms apply to every quote and assignment by Studio VM (Vincent Montreuil) for creating 3D models for machine control, unless agreed otherwise in writing. By approving a quote, the client accepts these terms." },
      { title: "The service", body: "Studio VM creates 3D design models (design surface, linework, contour lines) based on the plans supplied by the client, and delivers them digitally in the format of the machine control system(s) chosen by the client. Studio VM does not rent or install machine control systems, does not carry out surveys or setting-out on site and does not supervise the works, unless expressly agreed in writing." },
      { title: "Quote and prices", body: "Work is charged per hour. The hourly rate depends on the chosen category: early (delivery after more than 3 weeks) €45, standard (1 to 3 weeks) €50, last-minute (within 5 working days) €75 per hour, excluding VAT, with a minimum of 1 hour per assignment. Each quote states the estimated number of hours. If the work is likely to clearly exceed that estimate, the client is informed in advance. A quote is valid for 30 days. Delivery in several formats (machine control systems) is at no extra cost." },
      { title: "Delivery time", body: "The delivery time follows from the chosen category and starts from approval of the quote and receipt of complete and usable plans. Missing, unclear or changed plans postpone the deadline. Deadlines are a best-efforts obligation; a limited overrun does not entitle the client to compensation or termination." },
      { title: "Data supplied by the client", body: "The client is responsible for the accuracy, completeness and currency of the plans and data supplied (levels, profiles, coordinates, coordinate system and height datum). Studio VM proposes a system based on the site address; the client confirms the system and reports any local site grid or own calibration. Studio VM is not responsible for errors arising from the data supplied." },
      { title: "Responsibility for the machine control system", body: "Studio VM only delivers the 3D model. The installation, operation, setup, calibration and localisation of the machine control system, loading the files into the system and the checks on site remain entirely the client's responsibility. Before starting the works, the client checks the model on at least one known point, in position and height." },
      { title: "Checking and acceptance", body: "The client checks the delivered model within 5 working days of delivery and reports any comments in writing via the client portal or by email. Without comments within that period, or as soon as the model is used, it is deemed accepted." },
      { title: "Revisions", body: "Changes following a change in the plans or at the client's request are charged at the hourly rate of the chosen category. A demonstrable error by Studio VM relative to the plans supplied is corrected free of charge." },
      { title: "Payment and release", body: "Invoices are payable within 14 days, via Mollie or bank transfer. The model files are released in the client portal after payment. For businesses in another EU member state with a valid VAT number, VAT is reverse-charged. In case of non-payment after a reminder, Studio VM may suspend further deliveries; amounts due remain payable." },
      { title: "Ownership, confidentiality and references", body: "The plans supplied remain the property of the client or the designer and are treated confidentially. The client may freely use the delivered model for the project concerned. Studio VM may only show images of models as an anonymous reference (without the name of the client, site or location), unless the client refuses in writing." },
      { title: "Liability", body: "Studio VM's liability is limited to the invoiced amount of the assignment concerned and to direct damage resulting directly from a proven error. Studio VM is not liable for indirect or consequential damage, such as execution errors on site, remedial work, idle machines or staff, delays or loss of profit, nor for damage resulting from incorrect data supplied or from failure to carry out checks on site." },
      { title: "Retention of files", body: "Plans and models remain available in the client portal for at least 12 months after delivery. The client keeps a copy themselves. They may be deleted afterwards." },
      { title: "Applicable law", body: "Every agreement is governed by Belgian law. Disputes fall under the jurisdiction of the courts of Kortrijk." },
    ],
  },
  de: {
    meta: {
      title: "Allgemeine Geschäftsbedingungen | Studio VM",
      description:
        "Die AGB von Studio VM für 3D-Modelle für Maschinensteuerung: Angebot, Lieferfrist, Revisionen, Zahlung, Haftung und anwendbares Recht.",
    },
    eyebrow: "AGB",
    title: "Allgemeine Geschäftsbedingungen",
    updated: "Zuletzt aktualisiert",
    sections: [
      { title: "Geltungsbereich", body: "Diese Bedingungen gelten für jedes Angebot und jeden Auftrag von Studio VM (Vincent Montreuil) zur Erstellung von 3D-Modellen für Maschinensteuerungen, sofern nicht schriftlich etwas anderes vereinbart wurde. Mit der Annahme eines Angebots akzeptiert der Kunde diese Bedingungen." },
      { title: "Die Leistung", body: "Studio VM erstellt 3D-Planungsmodelle (Planungsoberfläche, Linienwerk, Höhenlinien) auf Grundlage der vom Kunden gelieferten Pläne und liefert diese digital im Format der vom Kunden gewählten Maschinensteuerung(en). Studio VM vermietet oder installiert keine Maschinensteuerungen, führt keine Vermessungen oder Absteckungen auf der Baustelle durch und übernimmt keine Bauüberwachung, sofern dies nicht ausdrücklich schriftlich vereinbart wurde." },
      { title: "Angebot und Preise", body: "Es wird nach Stunden abgerechnet. Der Stundensatz hängt von der gewählten Kategorie ab: frühzeitig (Lieferung nach mehr als 3 Wochen) 45 €, normal (1 bis 3 Wochen) 50 €, Last-Minute (innerhalb von 5 Werktagen) 75 € pro Stunde, jeweils zuzüglich MwSt., mit einem Minimum von 1 Stunde pro Auftrag. Jedes Angebot nennt die geschätzte Stundenzahl. Droht die Arbeit die geschätzte Stundenzahl deutlich zu überschreiten, wird der Kunde vorab informiert. Ein Angebot ist 30 Tage gültig. Die Lieferung in mehreren Formaten (Maschinensteuerungen) erfolgt ohne Aufpreis." },
      { title: "Lieferfrist", body: "Die Lieferfrist ergibt sich aus der gewählten Kategorie und beginnt mit der Annahme des Angebots und dem Eingang vollständiger und verwendbarer Pläne. Fehlende, unklare oder geänderte Pläne verschieben die Frist. Fristen stellen eine Bemühungspflicht dar; eine geringfügige Überschreitung berechtigt weder zu Schadensersatz noch zur Auflösung des Vertrags." },
      { title: "Vom Kunden gelieferte Daten", body: "Der Kunde ist für die Richtigkeit, Vollständigkeit und Aktualität der gelieferten Pläne und Daten verantwortlich (Höhen, Profile, Koordinaten, Koordinatensystem und Höhenbezug). Studio VM schlägt auf Grundlage der Baustellenadresse ein System vor; der Kunde bestätigt das System und meldet ein etwaiges lokales Baustellensystem oder eine eigene Kalibrierung. Studio VM ist nicht verantwortlich für Fehler, die auf die gelieferten Daten zurückgehen." },
      { title: "Verantwortung für die Maschinensteuerung", body: "Studio VM liefert ausschließlich das 3D-Modell. Installation, Betrieb, Einstellung, Kalibrierung und Lokalisierung der Maschinensteuerung, das Einspielen der Dateien in das System sowie die Kontrolle auf der Baustelle liegen vollständig in der Verantwortung des Kunden. Der Kunde überprüft das Modell vor Beginn der Arbeiten an mindestens einem bekannten Punkt, in Lage und Höhe." },
      { title: "Prüfung und Abnahme", body: "Der Kunde prüft das gelieferte Modell innerhalb von 5 Werktagen nach Lieferung und teilt etwaige Anmerkungen schriftlich über das Kundenportal oder per E-Mail mit. Gehen innerhalb dieser Frist keine Anmerkungen ein oder wird mit dem Modell gearbeitet, gilt das Modell als abgenommen." },
      { title: "Überarbeitungen", body: "Anpassungen infolge einer Änderung der Pläne oder auf Wunsch des Kunden werden zum Stundensatz der gewählten Kategorie berechnet. Ein nachweisbarer Fehler von Studio VM gegenüber den gelieferten Plänen wird kostenlos behoben." },
      { title: "Zahlung und Freigabe", body: "Rechnungen sind innerhalb von 14 Tagen zahlbar, über Mollie oder per Überweisung. Die Modelldateien werden nach Zahlung im Kundenportal freigegeben. Für Unternehmen in einem anderen EU-Mitgliedstaat mit gültiger USt-IdNr. gilt das Reverse-Charge-Verfahren. Bei Nichtzahlung nach Mahnung kann Studio VM weitere Lieferungen aussetzen; fällige Beträge bleiben geschuldet." },
      { title: "Eigentum, Vertraulichkeit und Referenzen", body: "Die gelieferten Pläne bleiben Eigentum des Kunden bzw. des Planers und werden vertraulich behandelt. Der Kunde darf das gelieferte Modell für das betreffende Projekt frei verwenden. Studio VM darf Bilder von Modellen nur anonym als Referenz zeigen (ohne Namen von Kunde, Baustelle oder Ort), sofern der Kunde dem nicht schriftlich widerspricht." },
      { title: "Haftung", body: "Die Haftung von Studio VM ist auf den in Rechnung gestellten Betrag des betreffenden Auftrags und auf unmittelbare Schäden beschränkt, die direkt aus einem nachgewiesenen Fehler resultieren. Studio VM haftet nicht für indirekte Schäden oder Folgeschäden, wie Ausführungsfehler auf der Baustelle, Nachbesserungsarbeiten, Stillstand von Maschinen oder Personal, Verzögerungen oder entgangenen Gewinn, noch für Schäden, die auf unrichtige gelieferte Daten oder auf die Unterlassung der Kontrolle auf der Baustelle zurückgehen." },
      { title: "Aufbewahrung von Dateien", body: "Pläne und Modelle bleiben mindestens 12 Monate nach Lieferung im Kundenportal verfügbar. Der Kunde bewahrt selbst eine Kopie auf. Danach können sie gelöscht werden." },
      { title: "Anwendbares Recht", body: "Für jeden Vertrag gilt belgisches Recht. Für Streitigkeiten sind die Gerichte von Kortrijk zuständig." },
    ],
  },
  es: {
    meta: {
      title: "Condiciones generales | Studio VM",
      description:
        "Condiciones generales de Studio VM para modelos 3D de control de maquinaria: presupuesto, plazos, revisiones, pago, responsabilidad y ley aplicable.",
    },
    eyebrow: "Condiciones",
    title: "Condiciones generales",
    updated: "Última actualización",
    sections: [
      { title: "Ámbito de aplicación", body: "Las presentes condiciones se aplican a todo presupuesto y encargo de Studio VM (Vincent Montreuil) para la elaboración de modelos 3D destinados al control de maquinaria, salvo acuerdo escrito en contrario. Al aprobar un presupuesto, el cliente acepta estas condiciones." },
      { title: "El servicio", body: "Studio VM elabora modelos 3D de proyecto (superficie de proyecto, líneas, curvas de nivel) a partir de los planos facilitados por el cliente, y los entrega en formato digital para el sistema o sistemas de control de maquinaria elegidos por el cliente. Studio VM no alquila ni instala sistemas de control de maquinaria, no realiza levantamientos ni replanteos en obra y no supervisa la ejecución de los trabajos, salvo acuerdo expreso por escrito." },
      { title: "Presupuesto y precios", body: "El trabajo se factura por horas. La tarifa horaria depende de la categoría elegida: anticipada (entrega en más de 3 semanas) 45 €, normal (de 1 a 3 semanas) 50 €, urgente (en un plazo de 5 días hábiles) 75 € por hora, IVA no incluido, con un mínimo de 1 hora por encargo. Cada presupuesto indica el número estimado de horas. Si el trabajo amenaza con superar claramente dicha estimación, se informará al cliente con antelación. Un presupuesto tiene una validez de 30 días. La entrega en varios formatos (sistemas de control de maquinaria) no tiene coste adicional." },
      { title: "Plazo de entrega", body: "El plazo de entrega se deriva de la categoría elegida y comienza a contar desde la aprobación del presupuesto y la recepción de planos completos y utilizables. Los planos incompletos, poco claros o modificados aplazan el plazo. Los plazos constituyen una obligación de medios; un retraso limitado no da derecho a indemnización ni a resolución." },
      { title: "Datos facilitados por el cliente", body: "El cliente es responsable de la exactitud, integridad y actualidad de los planos y datos facilitados (cotas, perfiles, coordenadas, sistema de coordenadas y referencia altimétrica). Studio VM propone un sistema en función de la dirección de la obra; el cliente confirma el sistema e informa de cualquier sistema local de obra o calibración propia. Studio VM no es responsable de los errores derivados de los datos facilitados." },
      { title: "Responsabilidad sobre el sistema de control de maquinaria", body: "Studio VM entrega únicamente el modelo 3D. La instalación, el funcionamiento, la configuración, la calibración y la localización del sistema de control de maquinaria, la carga de los archivos en el sistema y el control en obra son responsabilidad exclusiva del cliente. Antes del inicio de los trabajos, el cliente comprueba el modelo en al menos un punto conocido, en posición y en altura." },
      { title: "Control y aceptación", body: "El cliente revisa el modelo entregado en un plazo de 5 días hábiles desde la entrega y comunica sus observaciones por escrito a través del portal de clientes o por correo electrónico. A falta de observaciones en dicho plazo, o en cuanto se trabaje con el modelo, este se considerará aceptado." },
      { title: "Revisiones", body: "Las modificaciones derivadas de un cambio en los planos o a petición del cliente se facturan a la tarifa horaria de la categoría elegida. Un error demostrable de Studio VM con respecto a los planos facilitados se corrige sin coste alguno." },
      { title: "Pago y puesta a disposición", body: "Las facturas deben pagarse en un plazo de 14 días, mediante Mollie o transferencia bancaria. Los archivos del modelo se ponen a disposición en el portal de clientes tras el pago. Para empresas de otro Estado miembro de la UE con un número de IVA válido, se aplica la inversión del sujeto pasivo. En caso de impago tras un recordatorio, Studio VM podrá suspender nuevas entregas; los importes vencidos siguen siendo exigibles." },
      { title: "Propiedad, confidencialidad y referencias", body: "Los planos facilitados siguen siendo propiedad del cliente o del proyectista y se tratan de forma confidencial. El cliente puede utilizar libremente el modelo entregado para el proyecto correspondiente. Studio VM solo puede mostrar imágenes de modelos como referencia anónima (sin nombre del cliente, de la obra ni de la ubicación), salvo que el cliente se oponga por escrito." },
      { title: "Responsabilidad", body: "La responsabilidad de Studio VM se limita al importe facturado del encargo en cuestión y a los daños directos que se deriven directamente de un error probado. Studio VM no es responsable de daños indirectos o consecuentes, como errores de ejecución en obra, trabajos de reparación, inactividad de maquinaria o de personal, retrasos o lucro cesante, ni de daños derivados de datos facilitados incorrectos o de la falta de control en obra." },
      { title: "Conservación de archivos", body: "Los planos y modelos permanecen disponibles en el portal de clientes durante al menos 12 meses tras la entrega. El cliente conserva una copia por su cuenta. Después, podrán ser eliminados." },
      { title: "Legislación aplicable", body: "Todo contrato se rige por el Derecho belga. En caso de litigio, serán competentes los tribunales de Kortrijk." },
    ],
  },
};

const artikelId = (i: number) => `artikel-${i + 1}`;

/** Ankers van de artikels, voor de inhoudstafel (genummerd). */
export function voorwaardenToc(locale: Locale): TocItem[] {
  return VOORWAARDEN[locale].sections.map((s, i) => ({ id: artikelId(i), label: s.title }));
}

/** De artikels en de identiteitsregel, als losse blokken in de kolom van de pagina. */
export function VoorwaardenInhoud({ locale }: { locale: Locale }) {
  const c = VOORWAARDEN[locale];
  return (
    <>
      {c.sections.map((s, i) => (
        <section key={s.title} id={artikelId(i)} className="scroll-mt-28">
          <h2 className="flex items-baseline gap-3 text-xl font-semibold tracking-tight">
            <span className="font-mono text-sm text-accent">{i + 1}.</span>
            {s.title}
          </h2>
          <p className="mt-3 leading-relaxed text-foreground/90">{s.body}</p>
        </section>
      ))}

      <p className="rounded-2xl border bg-card p-6 text-sm text-muted">
        {identiteitsregel(locale)}
      </p>
    </>
  );
}
