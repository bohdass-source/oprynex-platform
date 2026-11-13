// The shape of src/site.config.ts. Everything a client site shows comes from that one file;
// components never hold client copy. The schema runs in the tests and in the preflight before every deploy.
import { z } from "zod";

/** Languages the template has interface texts and URL slugs for (src/lib/ui-text.ts). */
export const LANGUAGES = ["de", "en", "pl", "ru", "uk", "tr"] as const;
export type Lang = (typeof LANGUAGES)[number];

/** Copy in every language the site uses, e.g. { de: "…", pl: "…" }. The tests require all of the site's languages. */
const text = z.record(z.string(), z.string().min(1));
export type Text = Record<string, string>;

const item = z.object({ title: text, text: text });
const image = z.object({ src: z.string().startsWith("/"), alt: text });
const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/);

export const siteSchema = z.object({
  /** true while the file still holds the template's example business; the preflight refuses to deploy it. */
  example: z.boolean(),
  /** false until the client approved the site and the legal texts; the site then answers noindex and robots.txt blocks crawlers. */
  indexable: z.boolean(),
  /** Cloudflare Worker name; the trial address is https://<worker>.oprynex.workers.dev */
  worker: z.string().regex(/^[a-z][a-z0-9-]{2,40}$/),
  /** The client's own domain once it is connected, without a trailing slash. */
  domain: z.string().regex(/^https:\/\/[a-z0-9.-]+$/).nullable(),
  languages: z.array(z.enum(LANGUAGES)).min(1),
  theme: z.object({
    mode: z.enum(["light", "dark"]),
    /** Buttons, links and the active navigation item. */
    accent: hex,
    font: z.enum(["manrope", "geist"]),
  }),
  business: z.object({
    name: z.string().min(1).max(100),
    /** Full legal name including the legal form, e.g. "Albers Malerei GmbH" or "Jonas Albers". */
    legalName: z.string().min(1),
    /** Person(s) authorised to represent the business (Inhaber, Geschäftsführer). */
    representative: z.string().min(1),
    street: z.string().min(1),
    postalCode: z.string().regex(/^\d{5}$/),
    city: z.string().min(1),
    country: z.literal("DE"),
    email: z.string().email(),
    phone: z.string().regex(/^\+[0-9 ]{6,20}$/).nullable(),
    vatId: z.string().regex(/^DE\d{9}$/).nullable(),
    register: z.object({ court: z.string(), number: z.string() }).nullable(),
    /** Regulated trades: chamber, job title and the state that awarded it (Impressum § 5 Abs. 1 Nr. 5, 6 DDG). */
    profession: z.object({ chamber: z.string(), title: z.string(), awardedIn: z.string(), rules: z.string().nullable() }).nullable(),
    /** schema.org type for search engines, e.g. HousePainter, AutoRepair, Electrician, Dentist, LocalBusiness. */
    schemaType: z.string().regex(/^[A-Z][A-Za-z]+$/),
    areaServed: z.array(z.string()).min(1),
    /** schema.org openingHours, e.g. "Mo-Fr 07:30-17:00". */
    openingHours: z.array(z.string().regex(/^(Mo|Tu|We|Th|Fr|Sa|Su)(-(Mo|Tu|We|Th|Fr|Sa|Su))? \d{2}:\d{2}-\d{2}:\d{2}$/)),
    logo: image.nullable(),
  }),
  home: z.object({
    seo: z.object({ title: text, description: text }),
    badge: text.nullable(),
    title: text,
    subtitle: text,
    cta: text,
    /** One true, checkable fact next to the call to action (e.g. "Meisterbetrieb seit 2009"). Never invented proof. */
    proof: text.nullable(),
    image: image.nullable(),
    benefits: z.array(item).min(3).max(5),
    steps: z.array(item).length(3),
    /** At least two lines; words light up one after another while scrolling. */
    tagline: text,
    faq: z.array(z.object({ q: text, a: text })).max(12),
  }),
  services: z.object({
    seo: z.object({ title: text, description: text }),
    title: text,
    intro: text,
    items: z.array(z.object({ title: text, text: text, price: text.nullable() })).min(1),
    /** Shown under the list when prices are given, e.g. "Alle Preise zzgl. 19 % MwSt." */
    priceNote: text.nullable(),
  }),
  about: z.object({
    seo: z.object({ title: text, description: text }),
    title: text,
    /** Paragraphs separated by a blank line. */
    body: text,
    facts: z.array(z.object({ label: text, value: text })).max(4),
    image: image.nullable(),
  }),
  contact: z.object({
    seo: z.object({ title: text, description: text }),
    title: text,
    intro: text,
  }),
  /** An Oprynex website assistant (bot id from the CRM's Bots page); the privacy policy then gets its chat section. */
  chatbot: z.object({ botId: z.string().uuid() }).nullable(),
  legal: z.object({
    /** Date shown on the privacy policy, YYYY-MM-DD. */
    updated: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
    /** Set by the owner after the client confirmed Impressum and Datenschutz. The preflight requires it for indexable sites. */
    reviewed: z.boolean(),
    /** The client's own statement on consumer arbitration (§ 36 VSBG, required from 11 employees or with AGB); null leaves the section out. */
    consumerArbitration: z.string().nullable(),
    /** Data protection authority of the client's state, named in the privacy policy. */
    authority: z.object({ name: z.string(), url: z.string().url() }),
  }),
});

export type SiteConfig = z.infer<typeof siteSchema>;
