import { visitSource } from "@/lib/visit-source";
import { CheckCircle, CircleNotch } from "@phosphor-icons/react";
import { Link } from "@tanstack/react-router";
import { useState, type FormEvent, type ReactNode } from "react";
import type { z } from "zod";
import { useLanguage } from "@/components/language-provider";
import { buttonClass, linkFocus } from "@/components/landing/classes";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { ProductSelect } from "@/components/product-select";
import { contactSchema as schema } from "@/lib/contact-schema";
import type { ProductId } from "@/lib/product-choices";
import { submitLead } from "@/lib/submit-lead";

type Errors = Partial<Record<keyof z.infer<typeof schema>, string>>;

function Field({ id, label, error, children }: { id: string; label: string; error?: string | undefined; children: ReactNode }) {
  const { t } = useLanguage();
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      {children}
      {error && <p className="text-sm text-destructive">{t(error)}</p>}
    </div>
  );
}

/**
 * The contact form used on the contact page and at the bottom of the landing and the inner pages.
 * Validation runs here with the shared strict schema, and again on the server (submit-lead.functions.ts);
 * explicit consent to data processing is required.
 */
export function ContactForm() {
  const { t, language } = useLanguage();
  const [errors, setErrors] = useState<Errors>({});
  const [sent, setSent] = useState(false);
  const [consent, setConsent] = useState(false);
  const [product, setProduct] = useState<ProductId | "">("");
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState(false);

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (sending) return;
    const data = Object.fromEntries(new FormData(e.currentTarget));
    const r = schema.safeParse({ ...data, consent, ...(product ? { product } : {}) });
    if (!r.success) {
      const errs: Errors = {};
      for (const i of r.error.issues) errs[i.path[0] as keyof Errors] ??= i.message;
      setErrors(errs);
      return;
    }
    setErrors({});
    setSendError(false);
    setSending(true);
    try {
      const result = await submitLead({ ...r.data, source: "contact_form", language, pagePath: window.location.pathname, ...visitSource(), website: String(data["website"] ?? "") });
      if (result.ok) setSent(true);
      else setSendError(true);
    } catch { setSendError(true); }
    finally { setSending(false); }
  }

  if (sent) {
    return (
      <div role="status" className="rounded-2xl border border-lp-line bg-lp-surface p-6 md:p-8">
        <CheckCircle size={32} weight="fill" aria-hidden="true" />
        <p className="mt-4 text-sm font-medium text-lp-muted">{t("Спасибо")}</p>
        <p className="mt-1 text-xl font-semibold">{t("Спасибо, получили ваш запрос. Ответим по email — мы работаем с понедельника по субботу, с 9:00 до 20:00 по берлинскому времени.")}</p>
      </div>
    );
  }

  return (
    <form onSubmit={submit} noValidate className="space-y-5 rounded-2xl border border-lp-line bg-lp-surface p-6 md:p-8">
      <input name="website" type="text" className="sr-only" tabIndex={-1} autoComplete="off" aria-hidden="true" maxLength={200} />
      <Field id="name" label={t("Имя и фамилия *")} error={errors.name}><Input id="name" name="name" autoComplete="name" maxLength={100} required /></Field>
      <Field id="email" label={t("Электронная почта *")} error={errors.email}><Input id="email" name="email" type="email" maxLength={255} /></Field>
      <Field id="product" label={t("Что вас интересует")}><ProductSelect id="product" value={product} onChange={setProduct} /></Field>
      <Field id="message" label={t("Задача *")} error={errors.message}><Textarea id="message" name="message" rows={5} maxLength={2000} placeholder={t("Что сейчас мешает работе с клиентами?")} /></Field>
      <div className="space-y-2">
        <div className="flex items-start gap-3">
          <Checkbox id="consent" name="consent" required checked={consent} onCheckedChange={(value) => setConsent(value === true)} aria-invalid={Boolean(errors.consent)} aria-describedby={errors.consent ? "consent-error" : undefined} className="mt-0.5 size-5" />
          <Label htmlFor="consent" className="min-w-0 text-sm font-normal leading-relaxed">{t("Я прочитал(а) уведомление о защите данных и согласен(на) на обработку моих данных для рассмотрения запроса и связи со мной по электронной почте. *")}</Label>
        </div>
        <Link to="/datenschutz" className={`ml-7 inline-block rounded-lg py-1 text-sm font-semibold underline-offset-4 hover:underline ${linkFocus}`}>{t("Защита данных")}</Link>
        {errors.consent && <p id="consent-error" role="alert" className="text-sm text-destructive">{t(errors.consent)}</p>}
      </div>
      {sendError && <p role="alert" className="text-sm text-destructive">{t("Не получилось отправить. Попробуйте ещё раз чуть позже.")}</p>}
      <button type="submit" disabled={sending} aria-busy={sending} className={`${buttonClass("primary")} w-full disabled:opacity-60`}>
        {sending && <CircleNotch size={20} className="animate-spin" aria-hidden="true" />}
        {t(sending ? "Отправляем…" : "Отправить заявку")}
      </button>
    </form>
  );
}
