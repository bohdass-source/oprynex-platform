// German Impressum and privacy policy built from the business data in src/site.config.ts.
// The modules match what the template actually does: Cloudflare hosting, the contact form stored by Oprynex in Supabase (Frankfurt)
// as the client's processor, self-hosted fonts, no cookies, no tracking, and the Oprynex chat assistant when site.chatbot is
// set. Adding a feature (maps, analytics, booking) means adding its section here first. The client confirms both texts
// before launch (legal.reviewed). An example site (example: true) is a demo published by Oprynex: both texts then name
// Oprynex as the operator and say that the business shown is made up.
import type { SiteConfig } from "@/lib/config";

const DAYS: Record<string, string> = { Mo: "Montag", Tu: "Dienstag", We: "Mittwoch", Th: "Donnerstag", Fr: "Freitag", Sa: "Samstag", Su: "Sonntag" };

export function germanDate(iso: string): string {
  const months = ["Januar", "Februar", "März", "April", "Mai", "Juni", "Juli", "August", "September", "Oktober", "November", "Dezember"];
  const [y, m, d] = iso.split("-").map(Number);
  return `${d}. ${months[(m ?? 1) - 1]} ${y}`;
}

/** "Mo-Fr 07:30-16:30" → "Montag bis Freitag, 07:30 bis 16:30 Uhr" */
export function germanHours(spec: string): string {
  const [days = "", time = ""] = spec.split(" ");
  const [from = "", to] = days.split("-");
  const [start, end] = time.split("-");
  return `${DAYS[from] ?? from}${to ? ` bis ${DAYS[to] ?? to}` : ""}, ${start} bis ${end} Uhr`;
}

/** Oprynex, who publishes example sites and runs the CRM and the chat assistant as processor (site Impressum). */
const OPRYNEX = { name: "Max Mustermann", brand: "Oprynex", street: "Musterstraße 1", postalCode: "12345", city: "Musterstadt", email: "owner@example.com" };
const DEMO_NOTE = "Diese Website ist eine Beispielseite von Oprynex. Das dargestellte Unternehmen und alle Angaben zu ihm sind erfunden; es gibt keine Praxis oder Firma, die Sie hier beauftragen können.";

function address(b: SiteConfig["business"]): string {
  return `${b.street}\n${b.postalCode} ${b.city}\nDeutschland`;
}

export function impressumMarkdown(site: SiteConfig): string {
  if (site.example) {
    return [
      "# Impressum",
      `## Angaben gemäß § 5 DDG\n\n${OPRYNEX.name}\n${OPRYNEX.brand}\n${OPRYNEX.street}\n${OPRYNEX.postalCode} ${OPRYNEX.city}\nDeutschland`,
      `## Kontakt\n\nE-Mail: ${OPRYNEX.email}`,
      `## Hinweis\n\n${DEMO_NOTE}`,
    ].join("\n\n");
  }
  const b = site.business;
  const parts = [
    "# Impressum",
    `## Angaben gemäß § 5 DDG\n\n${b.legalName}${b.legalName === b.name ? "" : `\n${b.name}`}\n${address(b)}`,
    b.legalName === b.representative ? "" : `## Vertreten durch\n\n${b.representative}`,
    `## Kontakt\n\n${b.phone ? `Telefon: ${b.phone}\n` : ""}E-Mail: ${b.email}`,
    b.register ? `## Registereintrag\n\nRegistergericht: ${b.register.court}\nRegisternummer: ${b.register.number}` : "",
    b.vatId ? `## Umsatzsteuer-ID\n\nUmsatzsteuer-Identifikationsnummer gemäß § 27a Umsatzsteuergesetz: ${b.vatId}` : "",
    b.profession
      ? `## Berufsbezeichnung und berufsrechtliche Regelungen\n\nBerufsbezeichnung: ${b.profession.title}\nVerliehen in: ${b.profession.awardedIn}\nZuständige Kammer: ${b.profession.chamber}${b.profession.rules ? `\nBerufsrechtliche Regelungen: ${b.profession.rules}` : ""}`
      : "",
    site.legal.consumerArbitration ? `## Verbraucherstreitbeilegung\n\n${site.legal.consumerArbitration}` : "",
  ];
  return parts.filter(Boolean).join("\n\n");
}

/** The chat assistant's section, written for what the Oprynex engine does: answers through Anthropic, no stored conversations. */
const CHAT_SECTION = "Chat-Assistent\n\nAuf dieser Website können Sie Fragen an einen KI-Assistenten stellen. Er ist ein Computerprogramm, keine Person, und antwortet nur auf Grundlage von Informationen, die wir freigegeben haben. Der Assistent wird von Oprynex (Max Mustermann, Musterstraße 1, 12345 Musterstadt) als Auftragsverarbeiter für uns betrieben.\n\nVerarbeitet werden die Nachrichten, die Sie in das Chatfenster schreiben, und die bisherigen Nachrichten derselben Unterhaltung. Um eine Antwort zu erzeugen, werden sie an den KI-Anbieter Anthropic PBC (USA) übermittelt. Die Unterhaltung wird weder auf dieser Website noch von Oprynex gespeichert; sie besteht nur, solange das Chatfenster geöffnet ist. Zum Schutz vor Missbrauch wird Ihre IP-Adresse in gehashter, nicht im Klartext lesbarer Form verwendet, um die Anzahl der Fragen zu begrenzen. Bitte geben Sie im Chat keine sensiblen Daten ein, etwa zu Gesundheit oder Bankverbindung.\n\nWenn Sie über das Chatfenster bewusst eine Anfrage senden, gilt dafür derselbe Ablauf wie beim Kontaktformular.\n\nRechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse, Fragen zu unserem Angebot schnell zu beantworten) und für gesendete Anfragen Art. 6 Abs. 1 lit. b und lit. a DSGVO. Die Übermittlung in die USA stützt sich auf den Angemessenheitsbeschluss zum EU-US Data Privacy Framework (Art. 45 DSGVO), soweit der Anbieter zertifiziert ist, und im Übrigen auf Standardvertragsklauseln (Art. 46 Abs. 2 lit. c DSGVO).";

export function datenschutzMarkdown(site: SiteConfig): string {
  const b = site.business;
  const controller = site.example
    ? `${OPRYNEX.name}\n${OPRYNEX.brand}\n${OPRYNEX.street}\n${OPRYNEX.postalCode} ${OPRYNEX.city}\nDeutschland\nE-Mail: ${OPRYNEX.email}\n\n${DEMO_NOTE} Anfragen über diese Seite erreichen Oprynex.`
    : `${b.legalName}\n${address(b)}\nE-Mail: ${b.email}${b.phone ? `\nTelefon: ${b.phone}` : ""}`;
  const sections = [
    `Verantwortlicher\n\n${controller}`,
    "Überblick\n\nWir verarbeiten personenbezogene Daten nur, soweit dies für den Betrieb dieser Website und die Bearbeitung Ihrer Anfragen erforderlich ist. Wir verkaufen keine Daten, setzen keine Cookies und keine Analyse- oder Werbedienste ein.",
    "Hosting und technische Bereitstellung\n\nDiese Website wird über Cloudflare Workers des Anbieters Cloudflare, Inc. bereitgestellt. Beim Aufruf der Website verarbeitet der Anbieter technisch notwendige Daten wie IP-Adresse, Datum und Uhrzeit des Zugriffs, aufgerufene Seite sowie Browser- und Geräteinformationen. Dies ist erforderlich, um die Website sicher und stabil auszuliefern.\n\nRechtsgrundlage: Art. 6 Abs. 1 lit. f DSGVO (berechtigtes Interesse an einem sicheren und funktionsfähigen Webangebot).",
    "Kontaktformular\n\nWenn Sie uns über das Kontaktformular eine Anfrage senden, verarbeiten wir:\n- Name, E-Mail-Adresse und optional Firma,\n- den Text Ihrer Anfrage,\n- die Sprache und die Seite, von der aus Sie die Anfrage gesendet haben, sowie Datum und Uhrzeit Ihrer Einwilligung.\n\nZweck: Bearbeitung Ihrer Anfrage und Kontaktaufnahme.\n\nSpeicherung: Die Anfragen werden in unserem Kundenverwaltungssystem gespeichert, das Oprynex (Max Mustermann, Musterstraße 1, 12345 Musterstadt) als Auftragsverarbeiter für uns betreibt. Die Datenbank des Anbieters Supabase Inc. steht in Frankfurt am Main (EU).\n\nZum Schutz vor Missbrauch wird Ihre IP-Adresse in gehashter, nicht im Klartext lesbarer Form verwendet, um die Anzahl der Anfragen pro Stunde zu begrenzen.\n\nRechtsgrundlage: Art. 6 Abs. 1 lit. b DSGVO (vorvertragliche Maßnahmen auf Ihre Anfrage) und Art. 6 Abs. 1 lit. a DSGVO (Ihre Einwilligung). Sie können Ihre Einwilligung jederzeit mit Wirkung für die Zukunft per E-Mail widerrufen.\n\nSpeicherdauer: Wir löschen Ihre Anfrage, sobald sie abschließend bearbeitet ist und keine gesetzlichen Aufbewahrungspflichten entgegenstehen.",
    ...(site.chatbot ? [CHAT_SECTION] : []),
    "Schriftarten\n\nDie Schriftarten dieser Website werden von unserem eigenen Server geladen. Es werden dabei keine Daten an Dritte übertragen.",
    "Ihre Rechte\n\nSie haben das Recht auf Auskunft (Art. 15 DSGVO), Berichtigung (Art. 16), Löschung (Art. 17), Einschränkung der Verarbeitung (Art. 18), Datenübertragbarkeit (Art. 20) und Widerspruch gegen Verarbeitungen auf Grundlage berechtigter Interessen (Art. 21). Eine erteilte Einwilligung können Sie jederzeit widerrufen. Wenden Sie sich dazu an die oben genannte E-Mail-Adresse.",
    `Sie haben außerdem das Recht, sich bei einer Datenschutz-Aufsichtsbehörde zu beschweren. Für uns zuständig ist: ${site.legal.authority.name}, ${site.legal.authority.url}`,
    `Keine automatisierte Entscheidung\n\nEs findet keine automatisierte Entscheidungsfindung einschließlich Profiling im Sinne von Art. 22 DSGVO statt.${site.chatbot ? " Der Chat-Assistent trifft keine Entscheidungen über Sie." : ""}`,
  ];
  // Sections are numbered here, so an optional one (the chat) never leaves a gap. The complaint line belongs to "Ihre Rechte".
  let n = 0;
  const body = sections.map((s) => s.startsWith("Sie haben außerdem") ? s : `## ${++n}. ${s}`);
  return ["# Datenschutzerklärung", `Stand: ${germanDate(site.legal.updated)}`, ...body].join("\n\n");
}
