import { CheckCircle } from "@phosphor-icons/react";
import { useState, type FormEvent, type ReactNode } from "react";
import { PageLink } from "@/components/shell";
import type { Lang } from "@/lib/config";
import { leadSchema } from "@/lib/lead";
import { submitLead } from "@/lib/lead.functions";
import { pathFor, site, ui } from "@/lib/site";
import type { UiKey } from "@/lib/ui-text";

type Field = "name" | "email" | "message" | "consent";

function Row({ id, label, error, children }: { id: string; label: string; error: string | undefined; children: ReactNode }) {
  return (
    <div className="space-y-2">
      <label htmlFor={id} className="block text-sm font-semibold">{label}</label>
      {children}
      {error && <p id={`${id}-error`} className="text-sm text-danger">{error}</p>}
    </div>
  );
}

/** Contact form: checked in the browser with the shared schema, again on the server, then saved in the client's CRM. */
export function ContactForm({ lang }: { lang: Lang }) {
  const [errors, setErrors] = useState<Partial<Record<Field, string>>>({});
  const [state, setState] = useState<"idle" | "sending" | "sent" | "failed" | "limited">("idle");

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (state === "sending") return;
    const form = new FormData(event.currentTarget);
    const value = (key: string) => String(form.get(key) ?? "");
    const parsed = leadSchema.safeParse({
      name: value("name"), email: value("email"), company: value("company") || undefined, message: value("message"),
      consent: form.get("consent") === "on", language: lang, pagePath: window.location.pathname, website: value("website"),
    });
    if (!parsed.success) {
      const next: Partial<Record<Field, string>> = {};
      for (const issue of parsed.error.issues) next[issue.path[0] as Field] ??= ui(lang, issue.message as UiKey);
      setErrors(next);
      return;
    }
    setErrors({});
    setState("sending");
    const result = await submitLead(parsed.data);
    setState(result.ok ? "sent" : result.status === 429 ? "limited" : "failed");
  }

  if (state === "sent") {
    return (
      <div role="status" className="card p-8">
        <CheckCircle size={32} weight="fill" className="text-ok" aria-hidden="true" />
        <p className="mt-4 text-xl font-semibold">{ui(lang, "sentTitle")}</p>
        <p className="mt-1 text-muted">{ui(lang, "sentText")}</p>
      </div>
    );
  }

  const describe = (id: Field) => (errors[id] ? `${id}-error` : undefined);
  return (
    <form onSubmit={submit} noValidate className="card space-y-4 p-6 sm:p-8">
      <input name="website" type="text" className="sr-only" tabIndex={-1} autoComplete="off" aria-hidden="true" />
      <Row id="name" label={ui(lang, "name")} error={errors.name}>
        <input id="name" name="name" className="field" autoComplete="name" maxLength={100} required aria-invalid={Boolean(errors.name)} aria-describedby={describe("name")} />
      </Row>
      <Row id="email" label={ui(lang, "email")} error={errors.email}>
        <input id="email" name="email" type="email" className="field" autoComplete="email" maxLength={255} required aria-invalid={Boolean(errors.email)} aria-describedby={describe("email")} />
      </Row>
      <Row id="company" label={ui(lang, "company")} error={undefined}>
        <input id="company" name="company" className="field" autoComplete="organization" maxLength={150} />
      </Row>
      <Row id="message" label={ui(lang, "message")} error={errors.message}>
        <textarea id="message" name="message" className="field" rows={5} maxLength={2000} required placeholder={ui(lang, "messageHint")} aria-invalid={Boolean(errors.message)} aria-describedby={describe("message")} />
      </Row>
      <div className="space-y-2">
        <div className="flex items-start gap-3">
          <input id="consent" name="consent" type="checkbox" className="mt-1 h-4 w-4 shrink-0 accent-[var(--accent)]" required aria-invalid={Boolean(errors.consent)} aria-describedby={describe("consent")} />
          <label htmlFor="consent" className="text-sm text-muted">{ui(lang, "consent")}</label>
        </div>
        <PageLink path={pathFor("datenschutz", lang)} className="ml-8 inline-block rounded-lg text-sm font-semibold underline underline-offset-4">{ui(lang, "privacyLink")}</PageLink>
        {errors.consent && <p id="consent-error" className="text-sm text-danger">{errors.consent}</p>}
      </div>
      {(state === "failed" || state === "limited") && (
        <p role="alert" className="text-sm text-danger">
          {ui(lang, state === "limited" ? "errLimit" : "errSend")} <a href={`mailto:${site.business.email}`} className="font-semibold underline">{site.business.email}</a>.
        </p>
      )}
      <button type="submit" className="btn-primary w-full" disabled={state === "sending"} aria-busy={state === "sending"}>
        {ui(lang, state === "sending" ? "sending" : "send")}
      </button>
    </form>
  );
}
