import { OPERATOR } from "@/lib/operator";
import { siteUrl } from "@/lib/site-url";

const o = OPERATOR;
export const IMPRESSUM_MARKDOWN = `# Impressum

## Angaben gemäß § 5 DDG

${o.name}
${o.brand}
${o.street}
${o.postalCode} ${o.city}
${o.country.de}

## Kontakt

E-Mail: ${o.email}
Kontaktformular: ${siteUrl}/contact

## Hinweis

Unser Angebot richtet sich ausschließlich an Unternehmer im Sinne von § 14 BGB. Wir nehmen nicht an Streitbeilegungsverfahren vor einer Verbraucherschlichtungsstelle teil und sind dazu nicht verpflichtet.

## Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV

${o.name}
${o.street}
${o.postalCode} ${o.city}`;
