// Demo mode (VITE_DEMO=1): an in-memory stand-in for the Supabase client, filled with an invented company and
// requests, so the CRM runs without a database or sign-in. Only the calls the CRM makes are implemented:
// from(table).select / insert / update / delete with eq, in, gte, match, order, limit, range, single, maybeSingle;
// rpc(name); auth.getSession / onAuthStateChange / signOut. Nothing leaves the browser tab.

type Row = Record<string, unknown>;
type Result = { data: unknown; error: null; count?: number };

const WS = "00000000-0000-4000-8000-000000000001";
const ME = "11111111-1111-4111-8111-111111111111";
const TEAM = "22222222-2222-4222-8222-222222222222";
const day = 86_400_000;
const ago = (days: number, hours = 0) => new Date(Date.now() - days * day - hours * 3_600_000).toISOString();
const id = (n: number) => `00000000-0000-4000-8000-${String(n).padStart(12, "0")}`;

type LeadSeed = [name: string, email: string, company: string | null, message: string, source: string, status: string, products: string[], value: number | null, days: number, lang?: string, page?: string | null, topic?: string | null];
const leadSeeds: LeadSeed[] = [
  ["Lena Hoffmann", "lena@hoffmann-immobilien.example", "Hoffmann Immobilien", "Wir bekommen jeden Tag dieselben Fragen zu Besichtigungen und Unterlagen. Kann ein Assistent auf unserer Website das übernehmen?", "chat_lead", "new", ["chatbot"], null, 0.2, "de", "/ki-chatbot-immobilien", "fit_ai"],
  ["Jonas Becker", "jonas@becker-elektro.example", "Elektro Becker", "Unsere Website ist von 2014 und hat kein Anfrageformular. Wir brauchen eine neue Seite und gerne gleich einen Chatbot.", "contact_form", "new", ["website", "chatbot"], null, 1, "de", "/website-erstellen-lassen"],
  ["Sophie Wagner", "s.wagner@praxis-wagner.example", "Praxis Dr. Wagner", "Patienten fragen ständig nach Öffnungszeiten und Terminen. Was kostet ein Assistent?", "chat_lead", "contacted", ["chatbot"], null, 3, "de", "/ki-chatbot-arztpraxis", "fit_ai"],
  ["Marco Rossi", "marco@trattoria-rossi.example", "Trattoria Rossi", "Brauchen eine neue Website mit Speisekarte und Reservierungsanfrage.", "contact_form", "proposal", ["website"], 2100, 5, "de", "/website-kosten"],
  ["Anna Schulz", "anna.schulz@schulz-steuer.example", "Schulz Steuerberatung", "Unsere Mandantenanfragen landen in drei Postfächern. Wir suchen ein CRM, das zu unseren Abläufen passt.", "contact_form", "proposal", ["crm"], 12800, 8, "de", "/crm-entwicklung"],
  ["Tobias Klein", "t.klein@klein-shop.example", "Klein Outdoor Shop", "Assistent für Produktfragen und Lieferzeiten in unserem Shop.", "bot_lead", "won", ["chatbot"], 1000, 12, "de", null],
  ["Julia Neumann", "julia@neumann-design.example", "Neumann Design", "Wir wissen nicht, ob wir zuerst eine neue Website oder ein CRM brauchen.", "contact_form", "won", ["consulting_plan"], 300, 15, "de", "/beratung"],
  ["Daniel Fischer", "daniel@fischer-bau.example", "Fischer Bau GmbH", "Neue Website für unseren Betrieb, dazu ein Chatbot für Angebotsanfragen.", "contact_form", "won", ["website", "chatbot"], 3000, 21, "de", "/ki-chatbot-handwerk"],
  ["Emily Carter", "emily@carter-saas.example", "Carter Analytics", "Looking for a support assistant for our SaaS documentation.", "chat_lead", "contacted", ["chatbot"], null, 4, "en", "/ki-chatbot-saas", "fit_ai"],
  ["Ольга Морозова", "olga@morozova-studio.example", "Studio Morozova", "Нужен сайт для студии и консультация, с чего начать.", "chat_lead", "new", ["website", "consulting"], null, 0.6, "ru", "/", "fit_site"],
  ["Paul Richter", "paul@richter-autohaus.example", "Autohaus Richter", "Chatbot für Fahrzeugfragen und Probefahrten.", "contact_form", "lost", ["chatbot"], null, 26, "de", "/ki-chatbot-autohaus"],
  ["Mia Braun", "mia@braun-kanzlei.example", "Kanzlei Braun", "Kurze Frage: passt ein Chatbot zu unserer WordPress Seite?", "contact_form", "won", ["consulting"], 100, 9, "de", "/beratung"],
  ["Lukas Wolf", "lukas@wolf-reisen.example", null, "Gewinnen Sie jetzt ein iPhone", "contact_form", "spam", [], null, 2, "de", "/"],
];

function leadRow([name, email, company, message, source, status, products, value, d, lang = "de", page = null, topic = null]: LeadSeed, i: number): Row {
  return {
    id: id(100 + i), workspace_id: WS, created_at: ago(d), updated_at: ago(Math.max(0, d - 1)), name, email, company, message, source,
    chat_topic: topic, language: lang, page_path: page, referrer_host: i % 3 === 0 ? "google.com" : null, utm_source: null, utm_medium: null, utm_campaign: null,
    consent_at: ago(d), status, assigned_to: status === "new" ? null : ME, product: products[0] ?? null, products, value_eur: value, bot_id: source === "bot_lead" ? id(300) : null, site_id: null, form_id: null,
  };
}

const leads = leadSeeds.map(leadRow);
const tables: Record<string, Row[]> = {
  workspaces: [{ id: WS, name: "Muster Agentur", plan: "internal", status: "active", trial_ends_at: null, retention_months: 24, created_at: ago(60) }],
  workspace_members: [{ workspace_id: WS, user_id: ME, role: "owner", created_at: ago(60) }, { workspace_id: WS, user_id: TEAM, role: "member", created_at: ago(30) }],
  workspace_invites: [],
  leads,
  lead_events: [
    { id: id(500), lead_id: id(102), workspace_id: WS, created_at: ago(2.5), author_id: ME, kind: "email", body: "Preise und Ablauf per E-Mail geschickt, Rückmeldung bis Freitag.", from_status: null, to_status: null },
    { id: id(501), lead_id: id(102), workspace_id: WS, created_at: ago(2.5), author_id: ME, kind: "status", body: null, from_status: "new", to_status: "contacted" },
    { id: id(502), lead_id: id(104), workspace_id: WS, created_at: ago(6), author_id: ME, kind: "note", body: "Drei Rollen: Empfang, Steuerberater, Assistenz. Datenübernahme aus Excel.", from_status: null, to_status: null },
    { id: id(503), lead_id: id(104), workspace_id: WS, created_at: ago(5), author_id: ME, kind: "status", body: null, from_status: "contacted", to_status: "proposal" },
  ],
  tasks: [
    { id: id(600), workspace_id: WS, lead_id: id(103), created_at: ago(4), title: "Angebot Website Trattoria nachfassen", due_date: ago(-1).slice(0, 10), done_at: null },
    { id: id(601), workspace_id: WS, lead_id: id(104), created_at: ago(5), title: "CRM Konzept an Kanzlei Schulz schicken", due_date: ago(1).slice(0, 10), done_at: null },
    { id: id(602), workspace_id: WS, lead_id: id(100), created_at: ago(0.2), title: "Lena Hoffmann antworten", due_date: ago(0).slice(0, 10), done_at: null },
    { id: id(603), workspace_id: WS, lead_id: null, created_at: ago(10), title: "Demo Chatbot für Autohaus vorbereiten", due_date: null, done_at: ago(8) },
  ],
  tickets: [
    { id: id(700), number: 14, workspace_id: WS, lead_id: id(105), created_at: ago(1), updated_at: ago(0.5), subject: "Chatbot soll neue Lieferzeiten kennen", customer_name: "Tobias Klein", customer_email: "t.klein@klein-shop.example", channel: "email", status: "open", priority: "high", assigned_to: ME, form_id: null },
    { id: id(701), number: 13, workspace_id: WS, lead_id: id(107), created_at: ago(6), updated_at: ago(4), subject: "Impressum auf der neuen Website ändern", customer_name: "Daniel Fischer", customer_email: "daniel@fischer-bau.example", channel: "web", status: "solved", priority: "normal", assigned_to: ME, form_id: null },
  ],
  ticket_messages: [
    { id: id(800), ticket_id: id(700), created_at: ago(1), author_id: null, kind: "customer", body: "Ab Montag liefern wir in 2 bis 3 Tagen statt 5. Kann der Assistent das sagen?", from_status: null, to_status: null },
    { id: id(801), ticket_id: id(700), created_at: ago(0.5), author_id: ME, kind: "reply", body: "Ist eingetragen, der Assistent nennt ab sofort 2 bis 3 Werktage.", from_status: null, to_status: null },
  ],
  bots: [
    { id: id(300), workspace_id: WS, created_at: ago(20), updated_at: ago(3), enabled: true, name: "Klein Outdoor Assistent", business: "Outdoor Shop mit Zelten, Rucksäcken und Kletterausrüstung.", origins: ["https://klein-shop.example"], languages: ["de", "en"], greeting: "Hallo! Fragen zu Produkten oder Lieferung?", knowledge: "Lieferung 2 bis 3 Werktage. Rückgabe 30 Tage.", quick_replies: ["Lieferzeit", "Rückgabe"], color: "#1f6f50", privacy_url: "https://klein-shop.example/datenschutz", daily_limit: 500, visitor_daily_limit: 40, kind: "shop" },
    { id: id(301), workspace_id: WS, created_at: ago(18), updated_at: ago(18), enabled: true, name: "Fischer Bau Anfragen", business: "Bauunternehmen für Umbau und Sanierung.", origins: ["https://fischer-bau.example"], languages: ["de"], greeting: "Guten Tag! Worum geht es bei Ihrem Projekt?", knowledge: "Umbau, Sanierung, Dachausbau im Umkreis von 50 km.", quick_replies: ["Angebot anfragen"], color: "#b45309", privacy_url: "https://fischer-bau.example/datenschutz", daily_limit: 300, visitor_daily_limit: 30, kind: "lead" },
  ],
  bot_usage: Array.from({ length: 14 }, (_, i) => ({ workspace_id: WS, bot_id: i % 2 ? id(300) : id(301), day: ago(Math.floor(i / 2)).slice(0, 10), questions: 6 + ((i * 7) % 19) })),
  web_forms: [{ id: id(900), workspace_id: WS, created_at: ago(18), updated_at: ago(18), enabled: true, name: "Kontaktformular Fischer Bau", origins: ["https://fischer-bau.example"], language: "de", color: "#b45309", privacy_url: "https://fischer-bau.example/datenschutz", ask_company: true, daily_limit: 200, purpose: "request" }],
  sites: [{ id: id(950), workspace_id: WS, created_at: ago(21), name: "fischer-bau.example", url: "https://fischer-bau.example", daily_limit: 100 }],
  push_subscriptions: [],
};

const rpcs: Record<string, (args: Row) => unknown> = {
  workspace_team: () => [{ user_id: ME, email: "demo@example.com", role: "owner", created_at: ago(60) }, { user_id: TEAM, email: "team@example.com", role: "member", created_at: ago(30) }],
  accept_my_invites: () => null,
  cloud_signup_open: () => false,
  platform_settings: () => null,
};

type Filter = (row: Row) => boolean;
class Query implements PromiseLike<Result> {
  private filters: Filter[] = [];
  private sort: { col: string; asc: boolean }[] = [];
  private max: number | null = null;
  private from = 0;
  private mode: "select" | "insert" | "update" | "delete" = "select";
  private payload: Row | Row[] | null = null;
  private one: "single" | "maybe" | null = null;
  constructor(private table: string) {}
  select() { return this; }
  insert(rows: Row | Row[]) { this.mode = "insert"; this.payload = rows; return this; }
  update(patch: Row) { this.mode = "update"; this.payload = patch; return this; }
  upsert(rows: Row | Row[]) { return this.insert(rows); }
  delete() { this.mode = "delete"; return this; }
  eq(col: string, v: unknown) { this.filters.push((r) => r[col] === v); return this; }
  neq(col: string, v: unknown) { this.filters.push((r) => r[col] !== v); return this; }
  in(col: string, vs: unknown[]) { this.filters.push((r) => vs.includes(r[col])); return this; }
  gte(col: string, v: string) { this.filters.push((r) => String(r[col]) >= v); return this; }
  lte(col: string, v: string) { this.filters.push((r) => String(r[col]) <= v); return this; }
  match(obj: Row) { for (const [k, v] of Object.entries(obj)) this.eq(k, v); return this; }
  order(col: string, opts?: { ascending?: boolean }) { this.sort.push({ col, asc: opts?.ascending !== false }); return this; }
  limit(n: number) { this.max = n; return this; }
  range(a: number, b: number) { this.from = a; this.max = b - a + 1; return this; }
  single() { this.one = "single"; return this; }
  maybeSingle() { this.one = "maybe"; return this; }
  private run(): Result {
    const rows = (tables[this.table] ??= []);
    const hit = (r: Row) => this.filters.every((f) => f(r));
    let out: Row[];
    if (this.mode === "insert") {
      const list = (Array.isArray(this.payload) ? this.payload : [this.payload ?? {}]).map((r) => ({ id: crypto.randomUUID(), created_at: new Date().toISOString(), updated_at: new Date().toISOString(), ...r }));
      rows.push(...list);
      out = list;
    } else if (this.mode === "update") {
      out = rows.filter(hit);
      for (const r of out) Object.assign(r, this.payload, { updated_at: new Date().toISOString() });
      if (this.table === "leads") for (const r of out) { const p = r["products"] as string[] | undefined; if (this.payload && "products" in this.payload) r["product"] = p?.[0] ?? null; }
    } else if (this.mode === "delete") {
      out = rows.filter(hit);
      tables[this.table] = rows.filter((r) => !hit(r));
    } else {
      out = rows.filter(hit);
    }
    for (const s of [...this.sort].reverse()) out = [...out].sort((a, b) => (String(a[s.col] ?? "") < String(b[s.col] ?? "") ? -1 : String(a[s.col] ?? "") > String(b[s.col] ?? "") ? 1 : 0) * (s.asc ? 1 : -1));
    out = out.slice(this.from, this.max == null ? undefined : this.from + this.max);
    const copy = out.map((r) => ({ ...r }));
    if (this.one) return { data: copy[0] ?? null, error: null };
    return { data: copy, error: null, count: copy.length };
  }
  then<A = Result, B = never>(ok?: ((v: Result) => A | PromiseLike<A>) | null, fail?: ((e: unknown) => B | PromiseLike<B>) | null): PromiseLike<A | B> {
    return Promise.resolve().then(() => this.run()).then(ok, fail);
  }
}

const session = { access_token: "demo", token_type: "bearer", expires_in: 3600, refresh_token: "demo", user: { id: ME, email: "demo@example.com", aud: "authenticated", app_metadata: {}, user_metadata: {}, created_at: ago(60) } };

/** The stand-in client; cast to SupabaseClient by the caller. */
export function createDemoClient() {
  return {
    from: (table: string) => new Query(table),
    rpc: async (name: string, args: Row = {}) => ({ data: rpcs[name]?.(args) ?? null, error: null }),
    auth: {
      getSession: async () => ({ data: { session }, error: null }),
      getUser: async () => ({ data: { user: session.user }, error: null }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe() {} } } }),
      signOut: async () => ({ error: null }),
      signInWithOtp: async () => ({ error: null }),
      verifyOtp: async () => ({ error: null }),
    },
    channel: () => { const ch = { on: () => ch, subscribe: () => ch, unsubscribe: async () => "ok" }; return ch; },
    removeChannel: async () => "ok",
  };
}
