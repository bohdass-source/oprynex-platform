import { OPERATOR } from "@/lib/operator";

const o = OPERATOR;
export const AVV_MARKDOWN = `# Auftragsverarbeitungsvertrag

Vereinbarung nach Art. 28 DSGVO · Stand: 7. November 2026

## 1. Parteien und Geltung

Dieser Vertrag gilt zwischen dem Kunden als Verantwortlichem und ${o.name}, ${o.brand}, ${o.street}, ${o.postalCode} ${o.city} (nachfolgend „Auftragsverarbeiter“). Er wird Bestandteil jedes Vertrags, bei dem der Auftragsverarbeiter personenbezogene Daten im Auftrag des Kunden verarbeitet, insbesondere bei KI-Chatbots und Website-Formularen. Für die Laufzeit gilt der jeweilige Hauptvertrag. Dieser Vertrag kann elektronisch geschlossen werden (Art. 28 Abs. 9 DSGVO). Ansprechpartner für den Datenschutz ist ${o.email}.

## 2. Gegenstand der Verarbeitung

Gegenstand ist die Bereitstellung und der Betrieb der gebuchten Dienste.

Arten der Daten:
- Kontaktdaten wie Name, E-Mail-Adresse und Firma,
- Inhalte von Anfragen, Tickets, Notizen und Chat-Nachrichten,
- Nutzerkonten und Rollen der Mitarbeiter des Kunden,
- technische Daten wie Zeitpunkte und gehashte IP-Adressen.

Betroffene Personen:
- Kunden, Interessenten und Website-Besucher des Kunden,
- Mitarbeiter des Kunden.

Besondere Kategorien personenbezogener Daten (Art. 9 DSGVO) sollen nur verarbeitet werden, wenn der Kunde dies vorab in Textform mit dem Auftragsverarbeiter vereinbart hat.

## 3. Weisungen

Der Auftragsverarbeiter verarbeitet die Daten nur auf dokumentierte Weisung des Kunden, es sei denn, er ist gesetzlich zu einer Verarbeitung verpflichtet. Der Hauptvertrag und die Einstellungen in den Diensten gelten als Weisung. Weitere Weisungen erteilt der Kunde in Textform. Hält der Auftragsverarbeiter eine Weisung für rechtswidrig, teilt er dies dem Kunden unverzüglich mit.

## 4. Pflichten des Auftragsverarbeiters

Der Auftragsverarbeiter:
- verpflichtet die eingesetzten Personen zur Vertraulichkeit,
- trifft die Maßnahmen nach Art. 32 DSGVO, die in Anlage 1 beschrieben sind,
- unterstützt den Kunden angemessen bei Anfragen betroffener Personen und bei den Pflichten nach Art. 32 bis 36 DSGVO,
- meldet dem Kunden Verletzungen des Schutzes personenbezogener Daten unverzüglich,
- führt ein Verzeichnis der Verarbeitungstätigkeiten nach Art. 30 Abs. 2 DSGVO,
- stellt die zum Nachweis dieser Pflichten erforderlichen Informationen bereit.

## 5. Pflichten des Kunden

Der Kunde ist für die Rechtmäßigkeit der Verarbeitung und für die Information der betroffenen Personen verantwortlich. Dazu gehört auch ein Hinweis auf den Einsatz der Dienste in seiner Datenschutzerklärung.

## 6. Unterauftragsverarbeiter

Der Kunde genehmigt die in Anlage 2 genannten Unterauftragsverarbeiter. Der Auftragsverarbeiter informiert den Kunden mindestens 30 Tage vorab in Textform über geplante Änderungen. Der Kunde kann aus wichtigem datenschutzrechtlichem Grund widersprechen. Kommt keine Lösung zustande, kann er den betroffenen Dienst außerordentlich kündigen. Der Auftragsverarbeiter verpflichtet Unterauftragsverarbeiter vertraglich auf dieselben Datenschutzpflichten.

## 7. Übermittlung in Drittländer

Übermittlungen in Länder außerhalb des EWR erfolgen nur auf einer Grundlage nach Art. 44 bis 49 DSGVO, insbesondere einem Angemessenheitsbeschluss oder Standardvertragsklauseln.

## 8. Kontrollen

Der Kunde kann die Einhaltung dieses Vertrags durch Auskünfte und vorhandene Nachweise prüfen. Vor-Ort-Prüfungen sind nach rechtzeitiger Ankündigung zu den üblichen Geschäftszeiten möglich, soweit die Auskünfte nicht ausreichen, und dürfen den Betrieb nicht unverhältnismäßig stören.

## 9. Löschung und Rückgabe

Nach Vertragsende kann der Kunde seine Daten 30 Tage lang exportieren. Danach löscht der Auftragsverarbeiter sie, soweit keine gesetzliche Pflicht zur Aufbewahrung besteht.

## 10. Haftung und Schlussbestimmungen

Für die Haftung gilt Art. 82 DSGVO und ergänzend der Hauptvertrag. Bei Widersprüchen hat dieser Vertrag in Fragen des Datenschutzes Vorrang vor dem Hauptvertrag. Es gilt deutsches Recht.

## Anlage 1: Technische und organisatorische Maßnahmen

- Verschlüsselte Übertragung über HTTPS,
- Trennung der Daten verschiedener Kunden durch Zeilenschutz in der Datenbank (Row Level Security),
- Rollen und Berechtigungen für Nutzer des Kunden,
- Anmeldung mit persönlichem Konto,
- Zugriff auf Betriebssysteme nur für den Auftragsverarbeiter über persönliche Konten,
- Speicherung von IP-Adressen nur als Hash mit automatischer Löschung,
- Begrenzung von Anfragen zum Schutz vor Missbrauch,
- einstellbare Aufbewahrungsfrist, Exportfunktion und Löschfunktion,
- automatische Überwachung der Dienste auf Ausfälle.

## Anlage 2: Unterauftragsverarbeiter

- Cloudflare, Inc. (USA): Hosting und Auslieferung der Dienste,
- Supabase Inc. (USA): Datenbank und Anmeldung, Serverstandort Frankfurt am Main (EU),
- Anthropic, PBC (USA): Erzeugung von Antworten der KI-Chatbots.`;
