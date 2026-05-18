// Automatische "Omschrijving voor de klant" op elke offerte —
// op maat van het gekozen pakket + abonnement, in de taal van de
// klant. Wordt enkel gebruikt als de admin het veld leeg laat.

type Loc = "nl" | "fr" | "en";

export function offerIntroText(
  locale: string,
  baseName: string | null,
  subName: string | null,
  lockin: boolean,
): string {
  const loc: Loc =
    locale === "fr" ? "fr" : locale === "en" ? "en" : "nl";
  const b = baseName?.trim() || null;

  if (loc === "fr") {
    const p: string[] = ["Bonjour,"];
    p.push(
      "Merci pour votre intérêt — ravi de pouvoir construire votre présence en ligne ensemble.",
    );
    p.push(
      b
        ? `Voici notre proposition sur base du forfait ${b} : un site sur mesure, rapide et adapté au mobile, avec votre propre espace de gestion pour modifier textes et images vous-même. Textes soignés, base multilingue, bannière cookies & RGPD et suivi des contacts sont inclus — prêt à faire bonne impression.`
        : "Voici notre proposition : un site sur mesure, rapide et adapté au mobile, avec votre propre espace de gestion.",
    );
    if (subName)
      p.push(
        `Pour garder votre site au top sans souci, l'abonnement ${subName} est inclus : hébergement, sécurité, sauvegardes, mises à jour et support — un interlocuteur fixe.`,
      );
    if (lockin)
      p.push(
        "Si vous décidez avant la date d'échéance de ce devis, le prix et le périmètre sont fixés et vous bénéficiez d'un avantage supplémentaire (voir les conditions ci-dessous). Sans pression — prenez votre temps ; accepter ou refuser se fait en un clic dans votre portail.",
      );
    else
      p.push(
        "Sans pression — prenez votre temps ; accepter ou refuser se fait en un clic dans votre portail.",
      );
    p.push(
      "Une question ou une adaptation souhaitée ? Faites-moi signe, j'y réfléchis volontiers avec vous.",
    );
    p.push("Bien à vous,\nVincent Montreuil — Studio VM");
    return p.join("\n\n");
  }

  if (loc === "en") {
    const p: string[] = ["Hello,"];
    p.push(
      "Thanks for your interest — happy to build your online presence together.",
    );
    p.push(
      b
        ? `Here is our proposal based on the ${b} package: a bespoke, fast and mobile-friendly website with your own admin so you can edit texts and images yourself. Polished copy, multilingual setup, cookie & GDPR banner and contact follow-up are included — ready to look professional.`
        : "Here is our proposal: a bespoke, fast and mobile-friendly website with your own admin.",
    );
    if (subName)
      p.push(
        `To keep your site running worry-free, the ${subName} subscription is included: hosting, security, backups, updates and support — one fixed point of contact.`,
      );
    if (lockin)
      p.push(
        "If you decide before this quote's expiry date, the price and scope are locked in and you get an extra benefit (see the terms below). No pressure — take your time; accepting or declining is one click in your portal.",
      );
    else
      p.push(
        "No pressure — take your time; accepting or declining is one click in your portal.",
      );
    p.push(
      "Any questions or tweaks? Just let me know, I'm glad to think along.",
    );
    p.push("Kind regards,\nVincent Montreuil — Studio VM");
    return p.join("\n\n");
  }

  const p: string[] = ["Beste,"];
  p.push(
    "Bedankt voor je interesse — fijn dat we je online aanwezigheid samen mogen aanpakken.",
  );
  p.push(
    b
      ? `Hierbij ons voorstel op basis van het ${b}-pakket: een volledig op maat ontworpen, snelle en mobielvriendelijke website met een eigen beheeromgeving, zodat je zelf teksten en beelden kunt aanpassen. Verzorgde teksten, meertalige opzet, cookiebanner & GDPR en een nette contactopvolging zitten mee inbegrepen — alles klaar om professioneel voor de dag te komen.`
      : "Hierbij ons voorstel: een volledig op maat ontworpen, snelle en mobielvriendelijke website met een eigen beheeromgeving.",
  );
  if (subName)
    p.push(
      `Om je site daarna zorgeloos draaiend te houden, zit het ${subName}-abonnement erbij: hosting, beveiliging, back-ups, updates en support. Eén vast aanspreekpunt.`,
    );
  if (lockin)
    p.push(
      "Beslis je vóór de vervaldatum van deze offerte, dan liggen prijs en scope meteen vast en geniet je van een extra voordeel (zie de voorwaarden onderaan). Geen druk — bekijk het rustig; aanvaarden of afwijzen kan met één klik in je portaal.",
    );
  else
    p.push(
      "Geen druk — bekijk het rustig; aanvaarden of afwijzen kan met één klik in je portaal.",
    );
  p.push(
    "Heb je nog vragen of wil je iets aangepast zien? Laat gerust iets weten, ik denk graag met je mee.",
  );
  p.push("Met vriendelijke groeten,\nVincent Montreuil — Studio VM");
  return p.join("\n\n");
}
