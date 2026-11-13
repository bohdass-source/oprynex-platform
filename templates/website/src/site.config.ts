// The one file to fill for a client. This copy is a fictional example business so the template runs out of the box;
// `example: true` makes the preflight refuse to deploy it. Replace every value from the client's brief.
import type { SiteConfig } from "@/lib/config";

export const site: SiteConfig = {
  example: true,
  indexable: false,
  worker: "beispiel-malerei",
  domain: null,
  languages: ["de", "pl"],
  theme: { mode: "light", accent: "#1D4ED8", font: "manrope" },

  business: {
    name: "Malerei Albers",
    legalName: "Jonas Albers",
    representative: "Jonas Albers",
    street: "Beispielweg 12",
    postalCode: "24105",
    city: "Kiel",
    country: "DE",
    email: "kontakt@malerei-albers.example",
    phone: null,
    vatId: null,
    register: null,
    profession: { chamber: "Handwerkskammer Lübeck", title: "Malermeister", awardedIn: "Deutschland", rules: "Handwerksordnung (HwO)" },
    schemaType: "HousePainter",
    areaServed: ["Kiel", "Kronshagen", "Altenholz", "Heikendorf"],
    openingHours: ["Mo-Fr 07:30-16:30"],
    logo: null,
  },

  home: {
    seo: {
      title: { de: "Malerei Albers in Kiel · Malerarbeiten innen und außen", pl: "Malerei Albers w Kilonii · prace malarskie wewnątrz i na zewnątrz" },
      description: {
        de: "Malermeister in Kiel für Wohnungen, Treppenhäuser und Fassaden. Festpreis nach Besichtigung, Termin innerhalb von drei Wochen.",
        pl: "Mistrz malarski w Kilonii: mieszkania, klatki schodowe i elewacje. Stała cena po oględzinach, termin w ciągu trzech tygodni.",
      },
    },
    badge: { de: "Malermeister in Kiel", pl: "Mistrz malarski w Kilonii" },
    title: { de: "Frisch gestrichen,\nohne Staub im Alltag", pl: "Świeżo pomalowane,\nbez kurzu na co dzień" },
    subtitle: {
      de: "Wohnungen, Treppenhäuser und Fassaden in Kiel und Umgebung. Wir decken ab, arbeiten sauber und übergeben besenrein.",
      pl: "Mieszkania, klatki schodowe i elewacje w Kilonii i okolicy. Zabezpieczamy, pracujemy czysto i oddajemy posprzątane.",
    },
    cta: { de: "Besichtigung anfragen", pl: "Umów oględziny" },
    proof: { de: "Meisterbetrieb, eingetragen bei der Handwerkskammer Lübeck", pl: "Zakład mistrzowski wpisany do Izby Rzemieślniczej w Lubece" },
    image: null,
    benefits: [
      { title: { de: "Festpreis nach Besichtigung", pl: "Stała cena po oględzinach" }, text: { de: "Sie bekommen ein schriftliches Angebot, und dabei bleibt es.", pl: "Otrzymujesz pisemną ofertę i cena się nie zmienia." } },
      { title: { de: "Termin in drei Wochen", pl: "Termin w trzy tygodnie" }, text: { de: "Zwischen Besichtigung und Arbeitsbeginn liegen meist weniger als drei Wochen.", pl: "Między oględzinami a rozpoczęciem prac mijają zwykle mniej niż trzy tygodnie." } },
      { title: { de: "Sauber übergeben", pl: "Czyste przekazanie" }, text: { de: "Möbel und Böden werden abgedeckt, am Ende räumen wir auf.", pl: "Meble i podłogi zabezpieczamy, na koniec sprzątamy." } },
    ],
    steps: [
      { title: { de: "Anfrage", pl: "Zapytanie" }, text: { de: "Sie beschreiben kurz Räume und Wunschtermin.", pl: "Opisujesz krótko pomieszczenia i termin." } },
      { title: { de: "Besichtigung", pl: "Oględziny" }, text: { de: "Wir messen vor Ort und senden Ihnen das Angebot.", pl: "Mierzymy na miejscu i wysyłamy ofertę." } },
      { title: { de: "Ausführung", pl: "Realizacja" }, text: { de: "Wir streichen zum vereinbarten Termin und übergeben gemeinsam.", pl: "Malujemy w ustalonym terminie i wspólnie odbieramy pracę." } },
    ],
    tagline: { de: "Sie sagen, welche Farbe.\nWir kümmern uns um den Rest.", pl: "Ty wybierasz kolor.\nResztą zajmujemy się my." },
    faq: [
      { q: { de: "Was kostet ein Zimmer?", pl: "Ile kosztuje pokój?" }, a: { de: "Das hängt von Fläche und Untergrund ab. Nach der Besichtigung bekommen Sie einen Festpreis.", pl: "To zależy od powierzchni i podłoża. Po oględzinach otrzymasz stałą cenę." } },
      { q: { de: "Muss ich die Möbel ausräumen?", pl: "Czy muszę wynieść meble?" }, a: { de: "Nein. Wir rücken sie in die Raummitte und decken sie ab.", pl: "Nie. Przesuwamy je na środek i zabezpieczamy." } },
      { q: { de: "Arbeiten Sie auch in Mietwohnungen?", pl: "Czy pracujecie też w mieszkaniach na wynajem?" }, a: { de: "Ja, auch bei Auszug und Renovierung für die Wohnungsübergabe.", pl: "Tak, również przy wyprowadzce i odnowieniu przed oddaniem mieszkania." } },
    ],
  },

  services: {
    seo: {
      title: { de: "Leistungen · Malerei Albers Kiel", pl: "Usługi · Malerei Albers Kilonia" },
      description: { de: "Innenanstrich, Treppenhäuser, Fassaden und Tapezierarbeiten in Kiel.", pl: "Malowanie wnętrz, klatek schodowych, elewacji i tapetowanie w Kilonii." },
    },
    title: { de: "Leistungen", pl: "Usługi" },
    intro: { de: "Alles rund um Wand, Decke und Fassade, aus einer Hand.", pl: "Wszystko wokół ścian, sufitów i elewacji z jednej ręki." },
    items: [
      { title: { de: "Innenanstrich", pl: "Malowanie wnętrz" }, text: { de: "Wände und Decken in Wohnungen und Büros.", pl: "Ściany i sufity w mieszkaniach i biurach." }, price: null },
      { title: { de: "Treppenhäuser", pl: "Klatki schodowe" }, text: { de: "Für Hausverwaltungen, auch abschnittsweise bei laufendem Betrieb.", pl: "Dla zarządców nieruchomości, także etapami w trakcie użytkowania." }, price: null },
      { title: { de: "Fassaden", pl: "Elewacje" }, text: { de: "Reinigen, ausbessern und streichen, mit Gerüst.", pl: "Czyszczenie, naprawa i malowanie z rusztowaniem." }, price: null },
      { title: { de: "Tapezieren", pl: "Tapetowanie" }, text: { de: "Raufaser, Vlies und Mustertapeten.", pl: "Tapety z włókna, flizelinowe i wzorzyste." }, price: null },
    ],
    priceNote: null,
  },

  about: {
    seo: {
      title: { de: "Über uns · Malerei Albers Kiel", pl: "O nas · Malerei Albers Kilonia" },
      description: { de: "Malermeister Jonas Albers und sein Team in Kiel.", pl: "Mistrz malarski Jonas Albers i jego zespół w Kilonii." },
    },
    title: { de: "Über uns", pl: "O nas" },
    body: {
      de: "Malerei Albers ist ein kleiner Meisterbetrieb in Kiel.\n\nWir arbeiten für Privatkunden und Hausverwaltungen in Kiel und den Gemeinden rundherum.",
      pl: "Malerei Albers to niewielki zakład mistrzowski w Kilonii.\n\nPracujemy dla klientów prywatnych i zarządców nieruchomości w Kilonii i okolicznych gminach.",
    },
    facts: [
      { label: { de: "Einsatzgebiet", pl: "Obszar" }, value: { de: "Kiel und Umgebung", pl: "Kilonia i okolice" } },
      { label: { de: "Sprachen", pl: "Języki" }, value: { de: "Deutsch, Polnisch", pl: "niemiecki, polski" } },
    ],
    image: null,
  },

  contact: {
    seo: {
      title: { de: "Kontakt · Malerei Albers Kiel", pl: "Kontakt · Malerei Albers Kilonia" },
      description: { de: "Besichtigung anfragen: Formular, Telefon oder E-Mail.", pl: "Umów oględziny: formularz, telefon lub e-mail." },
    },
    title: { de: "Besichtigung anfragen", pl: "Umów oględziny" },
    intro: { de: "Beschreiben Sie kurz Räume und Wunschtermin. Wir antworten innerhalb von zwei Werktagen.", pl: "Opisz krótko pomieszczenia i termin. Odpowiadamy w ciągu dwóch dni roboczych." },
  },

  chatbot: null,

  legal: {
    updated: "2026-11-01",
    reviewed: false,
    consumerArbitration: null,
    authority: { name: "Unabhängiges Landeszentrum für Datenschutz Schleswig-Holstein", url: "https://www.datenschutzzentrum.de" },
  },
};
