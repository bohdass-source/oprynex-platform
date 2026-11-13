import { QueryClientProvider, type QueryClient } from "@tanstack/react-query";
import { HeadContent, Outlet, Scripts, createRootRouteWithContext } from "@tanstack/react-router";
import { useState, type FormEvent, type ReactNode } from "react";
import appCss from "../styles.css?url";
import { AppShell, LanguageSwitch } from "@/components/app-shell";
import { AuthProvider, useAuth, useAuthActions } from "@/lib/auth";
import { CLOUD_PLANS, PLANS, type CloudPlan } from "@/lib/crm";
import { useCreateWorkspace } from "@/lib/queries";
import { I18nProvider, useI18n } from "@/lib/i18n";
import { supabase } from "@/lib/supabase";

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "Oprynex CRM" },
      { name: "robots", content: "noindex, nofollow" },
      { name: "theme-color", content: "#0b0b0d" },
      { name: "apple-mobile-web-app-capable", content: "yes" },
      { name: "apple-mobile-web-app-title", content: "Oprynex" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.png", type: "image/png" },
      { rel: "manifest", href: "/manifest.webmanifest" },
      { rel: "apple-touch-icon", href: "/apple-touch-icon.png" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="de">
      <head><HeadContent /></head>
      <body>{children}<Scripts /></body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <I18nProvider>
        <AuthProvider>
          <Gate />
        </AuthProvider>
      </I18nProvider>
    </QueryClientProvider>
  );
}

/** Every page needs a signed-in workspace member; the session exists only in the browser, so the server renders the loading state. */
function Gate() {
  const auth = useAuth();
  const { t } = useI18n();
  if (auth.kind === "loading") return <p className="p-8 text-sm text-muted" role="status">{t("loading")}</p>;
  if (auth.kind === "signedOut") return <LoginScreen />;
  if (auth.kind === "noAccess") return auth.signupOpen ? <CreateWorkspace email={auth.session.user.email ?? ""} /> : <NoAccess email={auth.session.user.email ?? ""} />;
  return (
    <AppShell workspace={auth.workspace} workspaces={auth.workspaces} email={auth.session.user.email ?? ""}>
      <Outlet />
    </AppShell>
  );
}

function Centered({ children, wide = false }: { children: ReactNode; wide?: boolean }) {
  return (
    <div className="flex min-h-dvh items-center justify-center px-4 py-8">
      <div className={`card w-full p-6 ${wide ? "max-w-2xl" : "max-w-sm"}`}>
        <div className="mb-5 flex items-center justify-between">
          <span className="flex items-center gap-2 font-bold"><img src="/emblem.jpg" alt="" className="h-7 w-7 rounded-md" />Oprynex CRM</span>
          <LanguageSwitch />
        </div>
        {children}
      </div>
    </div>
  );
}

export function LoginScreen() {
  const { t } = useI18n();
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [code, setCode] = useState("");
  const [checking, setChecking] = useState(false);
  const [codeError, setCodeError] = useState(false);
  /** The code from the email, for a phone where the link would open in Safari instead of the installed CRM. */
  async function verify(event: FormEvent) {
    event.preventDefault();
    setChecking(true);
    setCodeError(false);
    const { error } = await supabase().auth.verifyOtp({ email: email.trim().toLowerCase(), token: code.trim(), type: "email" });
    setChecking(false);
    if (error) setCodeError(true);
  }
  async function submit(event: FormEvent) {
    event.preventDefault();
    setState("sending");
    const { error } = await supabase().auth.signInWithOtp({ email: email.trim().toLowerCase(), options: { emailRedirectTo: `${window.location.origin}/dashboard` } });
    setState(error ? "error" : "sent");
  }
  return (
    <Centered>
      <h1 className="text-xl font-bold">{t("loginTitle")}</h1>
      <p className="mt-1 text-sm text-muted">{t("loginText")}</p>
      <form className="mt-5 space-y-3" onSubmit={submit}>
        <label className="block text-sm font-semibold" htmlFor="email">{t("email")}</label>
        <input id="email" type="email" required autoComplete="email" className="field" value={email} onChange={(e) => setEmail(e.target.value)} />
        <button type="submit" className="btn-primary w-full" disabled={state === "sending"}>{t("sendLink")}</button>
      </form>
      {state === "sent" && <p className="mt-4 text-sm text-ok" role="status">{t("linkSent")}</p>}
      {state === "sent" && (
        <form className="mt-4 space-y-3" onSubmit={verify}>
          <label className="block text-sm font-semibold" htmlFor="login-code">{t("loginCode")}</label>
          <input id="login-code" inputMode="numeric" autoComplete="one-time-code" pattern="[0-9]{6,10}" maxLength={10} required className="field" value={code} onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))} aria-invalid={codeError} />
          <button type="submit" className="btn-primary w-full" disabled={checking || code.length < 6}>{t("loginWithCode")}</button>
          {codeError && <p className="text-sm text-danger" role="alert">{t("loginCodeError")}</p>}
        </form>
      )}
      {state === "error" && <p className="mt-4 text-sm text-danger" role="alert">{t("loginError")}</p>}
    </Centered>
  );
}

/** Self sign-up: a signed-in person without a workspace names the company and picks a plan; the trial starts at once. */
export function CreateWorkspace({ email }: { email: string }) {
  const { t, lang } = useI18n();
  const { reload } = useAuthActions();
  const create = useCreateWorkspace();
  const [name, setName] = useState("");
  const [plan, setPlan] = useState<CloudPlan>("team");
  const [touched, setTouched] = useState(false);
  const nameOk = name.trim().length >= 2 && name.trim().length <= 100;
  const euro = new Intl.NumberFormat(lang === "en" ? "en-IE" : lang === "ru" ? "ru-RU" : "de-DE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 });
  function submit(event: FormEvent) {
    event.preventDefault();
    setTouched(true);
    if (!nameOk) return;
    create.mutate({ name: name.trim(), plan }, { onSuccess: () => void reload() });
  }
  const failure = (create.error as { message?: string } | null)?.message?.includes("already_created") ? t("alreadyCreated") : t("signupFailed");
  return (
    <Centered wide>
      <h1 className="text-xl font-bold">{t("signupTitle")}</h1>
      <p className="mt-1 text-sm text-muted">{t("signupText")}</p>
      <form className="mt-5 space-y-5" onSubmit={submit} noValidate>
        <div>
          <label className="block text-sm font-semibold" htmlFor="company">{t("companyName")}</label>
          <input id="company" className="field mt-1" maxLength={100} autoComplete="organization" value={name} onChange={(e) => setName(e.target.value)} aria-invalid={touched && !nameOk} />
        </div>
        <fieldset>
          <legend className="text-sm font-semibold">{t("choosePlan")}</legend>
          <div className="mt-2 grid gap-3 sm:grid-cols-3">
            {PLANS.map((p) => (
              <label key={p} className={`card cursor-pointer p-4 transition-colors ${plan === p ? "ring-2 ring-gold" : "hover:bg-surface-2"}`}>
                <input type="radio" name="plan" value={p} checked={plan === p} onChange={() => setPlan(p)} className="sr-only" />
                <span className="block font-bold capitalize">{p}</span>
                <span className="mt-1 block text-lg font-bold">{euro.format(CLOUD_PLANS[p].price)} <span className="text-xs font-normal text-muted">{t("perMonthNet")}</span></span>
                <span className="mt-2 block text-xs text-muted">{t("usersUpTo").replace("{n}", String(CLOUD_PLANS[p].users))}</span>
                {CLOUD_PLANS[p].roles && <span className="block text-xs text-muted">{t("planRoles")}</span>}
                {CLOUD_PLANS[p].integrations && <span className="block text-xs text-muted">{t("planIntegrations")}</span>}
              </label>
            ))}
          </div>
        </fieldset>
        <button type="submit" className="btn-primary w-full" disabled={create.isPending}>{t("startTrial")}</button>
      </form>
      {create.isError && <p className="mt-3 text-sm text-danger" role="alert">{failure}</p>}
      <p className="mt-4 text-xs text-muted">{email}</p>
      <button type="button" className="btn-ghost mt-3 w-full" onClick={() => void supabase().auth.signOut()}>{t("signOut")}</button>
    </Centered>
  );
}

function NoAccess({ email }: { email: string }) {
  const { t } = useI18n();
  return (
    <Centered>
      <h1 className="text-xl font-bold">{t("noAccessTitle")}</h1>
      <p className="mt-2 text-sm text-muted">{t("noAccessText")}</p>
      <p className="mt-2 text-sm text-muted">{t("signupClosedText")}</p>
      <p className="mt-2 text-sm">{email}</p>
      <button type="button" className="btn-ghost mt-5 w-full" onClick={() => void supabase().auth.signOut()}>{t("signOut")}</button>
    </Centered>
  );
}
