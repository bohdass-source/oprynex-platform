import { visitSource } from "@/lib/visit-source";
import { ProductSelect } from "@/components/product-select";
import type { ProductId } from "@/lib/product-choices";
import { useLanguage, translate, type Language } from "@/components/language-provider";
import emblem from "@/assets/oprynex-emblem.png.asset.json";
import { Link, useRouterState } from "@tanstack/react-router";
import { MessageCircle, Send, X, LoaderCircle, Mic, MicOff, Square, Globe, Check } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { suggestEmail } from "@/lib/email-typos";
import { chatCopy as c, chatScenarios, chatTopicLine, matchChatNode, suggestionButton, trackChat, type ChatButton } from "@/lib/chat-scenarios";
import { leadSchema } from "@/lib/lead-schema";
import { submitLead } from "@/lib/submit-lead";
import { detectChatLanguage } from "@/lib/chat-language";
import { SPEECH_LOCALE, VISITOR_LANGUAGE_NATIVE, VISITOR_LANGUAGES, uiLanguageFor, type VisitorLanguage } from "@/lib/visitor-languages";
import { askChat } from "@/lib/ask-chat";
import { setAgentOpen } from "@/lib/agent-state";

export const OPEN_AGENT_EVENT = "oprynex:open-agent";
export function openAgent() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(OPEN_AGENT_EVENT));
}
export function AskAgentButton({ className = "" }: { className?: string }) {
  const { language } = useLanguage();
  return <Button type="button" onClick={openAgent} variant="ghost" className={`agent-shell agent-shell--pill h-auto p-0 ${className}`}>
    <span className="flex items-center gap-3 rounded-full bg-card px-5 py-3"><span className="agent-dot flex h-8 w-8 items-center justify-center rounded-full bg-gold-gradient text-primary-foreground"><MessageCircle className="h-4 w-4" /></span><span className="text-gold-gradient font-medium">{c.ask[language]}</span></span>
  </Button>;
}
type Entry = { from: "agent"; node: string } | { from: "ai"; text: string; buttons: ChatButton[] } | { from: "note" } | { from: "guest"; text?: string; choice?: ChatButton } | { from: "success" };
type Recognition = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null;
  onend: (() => void) | null;
  onerror: ((event?: { error?: string }) => void) | null;
  start: () => void;
  stop: () => void;
  abort: () => void;
};
type RecognitionConstructor = new () => Recognition;
function recognitionConstructor(): RecognitionConstructor | undefined {
  const browser = window as unknown as { SpeechRecognition?: RecognitionConstructor; webkitSpeechRecognition?: RecognitionConstructor };
  return browser.SpeechRecognition ?? browser.webkitSpeechRecognition;
}
// Site paths the assistant names ("/preise") become links, so visitors do not have to look for the page.
const PAGE_LINK = /(\/(?:preise|contact|services|ki-chatbot-website|website-erstellen-lassen|crm-entwicklung|beratung|assistants|industries|faq|impressum|datenschutz))(?![\w/-])/g;
export function withPageLinks(text: string): ReactNode[] {
  return text.split(PAGE_LINK).map((part,i)=>i % 2 === 1 ? <Link key={i} to={part} className="font-semibold text-gold underline underline-offset-2">{part}</Link> : part);
}

export function AgentWidget() {
  const { language: siteLanguage } = useLanguage();
  const [language, setChatLanguage] = useState<Language>(siteLanguage);
  // Language the visitor actually writes in (any of 20), reported by the AI; stored with the lead.
  const [visitorLanguage, setVisitorLanguage] = useState<VisitorLanguage | null>(null);
  // Language picked in the chat menu (null = follow the site and the visitor's messages).
  const [chosen, setChosen] = useState<VisitorLanguage | null>(null);
  const [languageMenu, setLanguageMenu] = useState(false);
  const questionRef = useRef("");
  const t = (text: string) => translate(text, language);
  useEffect(() => { setChatLanguage(siteLanguage); }, [siteLanguage]);
  const [open,setOpen] = useState(false);
  // On phones the home hero has its own "ask the assistant" button, so the floating launcher waits until the visitor scrolls past it.
  const pathname = useRouterState({ select: state => state.location.pathname });
  const [heroCovered, setHeroCovered] = useState(false);
  useEffect(() => {
    if (pathname !== "/" || typeof window.matchMedia !== "function") { setHeroCovered(false); return; }
    const phone = window.matchMedia("(max-width: 639px)");
    const update = () => setHeroCovered(phone.matches && window.scrollY < window.innerHeight * 0.8);
    update();
    window.addEventListener("scroll", update, { passive: true });
    phone.addEventListener?.("change", update);
    return () => { window.removeEventListener("scroll", update); phone.removeEventListener?.("change", update); };
  }, [pathname]);
  const [thread,setThread] = useState<Entry[]>([]);
  const [question,setQuestionState] = useState("");
  const setQuestion = (value: string) => { questionRef.current = value; setQuestionState(value); };
  const [topic,setTopic] = useState("menu");
  const [lastQuestion,setLastQuestion] = useState("");
  // The visitor's recent real questions (15+ characters) go into the request form, newest last, so the team sees the
  // current context and the visitor can still edit it; short reactions ("too long", "thanks") are left out.
  const recentQuestions = useRef<string[]>([]);
  const [leadNumber,setLeadNumber] = useState("");
  const [active,setActive] = useState("menu");
  const [message,setMessage] = useState("");
  const [messageEdited,setMessageEdited] = useState(false);
  const [name,setName] = useState("");
  const [email,setEmail] = useState("");
  const [product,setProduct] = useState<ProductId | "">("");
  const [consent,setConsent] = useState(false);
  const [errors,setErrors] = useState<Partial<Record<"name" | "email" | "company" | "message" | "consent",string>>>({});
  const [sendError,setSendError] = useState(false);
  const [sending,setSending] = useState(false);
  const [thinking,setThinking] = useState(false);
  const history = useRef<{ role: "user" | "assistant"; content: string }[]>([]);
  const launcher = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const scroll = useRef<HTMLDivElement>(null);
  const latestAgent = useRef<HTMLDivElement>(null);
  const openRef = useRef(false);
  const recognition = useRef<Recognition | null>(null);
  const [voiceSupported, setVoiceSupported] = useState(false);
  const [voiceConsent, setVoiceConsent] = useState(false);
  const [voiceNotice, setVoiceNotice] = useState(false);
  const [listening, setListening] = useState(false);
  // Voice state shown to the visitor: asking the browser for the microphone, or why voice stopped.
  type VoiceIssue = "requesting" | "blocked" | "noSpeech" | "noMic" | "network";
  const [voiceIssue, setVoiceIssue] = useState<VoiceIssue | null>(null);
  // Declined in our consent notice or blocked by the browser: the microphone stays off for this visit.
  const [voiceOff, setVoiceOff] = useState(false);
  useEffect(() => {
    setVoiceSupported(Boolean(recognitionConstructor()));
    return () => {
      const rec = recognition.current;
      recognition.current = null;
      if (rec) { rec.onresult = null; rec.onend = null; rec.onerror = null; rec.abort(); }
    };
  }, []);
  function stopVoice() {
    const rec = recognition.current;
    recognition.current = null;
    if (rec) { rec.onresult = null; rec.onend = null; rec.onerror = null; try { rec.stop(); } catch { /* Already stopped. */ } rec.abort(); }
    setListening(false);
  }
  useEffect(() => {
    if (!open) { stopVoice(); setVoiceNotice(false); }
  }, [open]);
  function startVoice() {
    const Rec = recognitionConstructor();
    if (!Rec) return;
    stopVoice();
    const rec = new Rec();
    rec.lang = SPEECH_LOCALE[chosen ?? language];
    rec.interimResults = true;
    // Keep listening through pauses until the visitor clicks the microphone again.
    rec.continuous = true;
    const base = question.trim() ? `${question.trim()} ` : "";
    rec.onresult = event => {
      if (recognition.current !== rec || !openRef.current) return;
      let text = "";
      for (let i = 0; i < event.results.length; i++) text += event.results[i]?.[0]?.transcript ?? "";
      setQuestion((base + text).slice(0, 300));
    };
    const reset = () => { if (recognition.current === rec) { recognition.current = null; setListening(false); } };
    // The browser ended the recording by itself (long pause, lost audio): send what was heard, or say nothing was heard.
    rec.onend = () => {
      if (recognition.current !== rec) return;
      reset();
      const spoken = questionRef.current.trim();
      if (spoken) void send(spoken); else setVoiceIssue("noSpeech");
    };
    rec.onerror = event => {
      if (recognition.current !== rec) return;
      const error = event?.error;
      if (error === "not-allowed" || error === "service-not-allowed") { setVoiceIssue("blocked"); setVoiceOff(true); }
      else if (error === "no-speech") setVoiceIssue("noSpeech");
      else if (error === "audio-capture") setVoiceIssue("noMic");
      else if (error === "network") setVoiceIssue("network");
      reset();
    };
    recognition.current = rec;
    setVoiceIssue(null);
    setListening(true);
    try { rec.start(); } catch { reset(); }
  }
  // Ask the browser for the microphone first and start listening only once access is granted,
  // so the browser prompt never races the speech recogniser.
  async function allowVoice() {
    setVoiceNotice(false);
    setVoiceConsent(true);
    const media = typeof navigator !== "undefined" ? navigator.mediaDevices : undefined;
    if (media?.getUserMedia) {
      setVoiceIssue("requesting");
      try {
        const stream = await media.getUserMedia({ audio: true });
        stream.getTracks().forEach(track => track.stop());
      } catch (error) {
        const name = (error as { name?: string })?.name;
        if (name === "NotFoundError" || name === "OverconstrainedError") setVoiceIssue("noMic");
        else { setVoiceIssue("blocked"); setVoiceOff(true); }
        return;
      }
    }
    if (!openRef.current) { setVoiceIssue(null); return; }
    startVoice();
  }
  function declineVoice() { setVoiceNotice(false); setVoiceOff(true); setVoiceIssue(null); }
  // Second click on the microphone stops listening and sends what was recognised.
  function toggleVoice() {
    if (voiceOff) return;
    if (listening) { stopVoice(); const spoken = questionRef.current.trim(); if (spoken) void send(spoken); return; }
    if (!voiceConsent) { setVoiceNotice(true); return; }
    setVoiceIssue(null);
    startVoice();
  }
  function show() {
    if (openRef.current) return;
    openRef.current = true;
    setOpen(true);
    setThread(old=>old.length ? old : [{ from:"agent",node:"menu" }]);
    trackChat("chat_open");
  }
  function close() { openRef.current = false; setOpen(false); launcher.current?.focus(); }
  useEffect(()=> {
    const handler = () => show();
    window.addEventListener(OPEN_AGENT_EVENT,handler);
    return ()=>window.removeEventListener(OPEN_AGENT_EVENT,handler);
  },[]);
  useEffect(()=> {
    setAgentOpen(open);
    return ()=>setAgentOpen(false);
  },[open]);
  useEffect(()=> {
    if (!open) return;
    panel.current?.focus();
    const escape = (event: KeyboardEvent) => { if (event.key === "Escape") { event.preventDefault(); openRef.current = false; setOpen(false); launcher.current?.focus(); } };
    document.addEventListener("keydown", escape);
    const mobile = window.matchMedia("(max-width: 639px)").matches;
    const oldOverflow = document.body.style.overflow;
    const oldGutter = document.documentElement.style.scrollbarGutter;
    if (mobile) { document.documentElement.style.scrollbarGutter = "stable"; document.body.style.overflow = "hidden"; }
    return ()=> { document.removeEventListener("keydown", escape); if (mobile) { document.body.style.overflow = oldOverflow; document.documentElement.style.scrollbarGutter = oldGutter; } };
  },[open]);
  const form = active === "lead" || active === "human";
  useEffect(()=> {
    const box = scroll.current;
    if (!box || !open) return;
    const reduce = typeof window.matchMedia === "function" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const behavior: ScrollBehavior = reduce ? "auto" : "smooth";
    const to = (top: number) => { if (typeof box.scrollTo === "function") box.scrollTo({ top, behavior }); else box.scrollTop = top; };
    const last = thread[thread.length - 1];
    const entry = latestAgent.current;
    if ((last?.from === "agent" || last?.from === "ai") && entry && !form) {
      const rect = entry.getBoundingClientRect();
      if (rect.height <= box.clientHeight) to(box.scrollHeight);
      else to(Math.max(0, box.scrollTop + rect.top - box.getBoundingClientRect().top - 8));
    } else to(box.scrollHeight);
  },[thread,open,sendError,form,thinking]);
  function go(node: string, choice?: ChatButton, typed?: string, answerLanguage = language, bubble = true) {
    stopVoice(); setVoiceNotice(false);
    const next = chatScenarios[node];
    if (!next) return;
    if (next.form) {
      const asked = recentQuestions.current.join("\n") || lastQuestion;
      setMessage(typed ?? (asked && (topic === "unmatched" || node === "human") ? asked : chatTopicLine(topic,answerLanguage)));
      setMessageEdited(Boolean(typed || asked && node === "human"));
      setErrors({}); setSendError(false); setConsent(false);
    } else { setTopic(node); if (node !== "unmatched") setLastQuestion(""); }
    setActive(node);
    setThread(old=>[...old,...(choice ? [{ from:"guest" as const,choice }] : typed && bubble ? [{ from:"guest" as const,text:typed }] : []),{ from:"agent",node }]);
    if (node === "unmatched") trackChat("chat_unmatched"); else trackChat("chat_topic",node);
  }
  function chooseLanguage(code: VisitorLanguage) {
    stopVoice(); setChosen(code); setChatLanguage(uiLanguageFor(code)); setLanguageMenu(false);
  }
  async function ask(e: FormEvent) {
    e.preventDefault();
    await send(question);
  }
  async function send(raw: string) {
    if (thinking) return;
    stopVoice(); setVoiceNotice(false);
    const text = raw.trim().slice(0,300);
    if (!text) return;
    const detected = chosen ? uiLanguageFor(chosen) : detectChatLanguage(text, language);
    setChatLanguage(detected);
    setLastQuestion(text);
    if (text.length >= 15) recentQuestions.current = [...recentQuestions.current, text].slice(-3);
    setQuestion("");
    setThread(old=>[...old,{ from:"guest",text }]);
    const messages = [...history.current,{ role:"user" as const,content:text }].slice(-12).map(m=>({ ...m,content:m.content.slice(0,600) }));
    setThinking(true);
    let result: Awaited<ReturnType<typeof askChat>>;
    try { result = (await askChat({ messages,language:detected,...(chosen ? { reply:chosen } : {}) })) ?? { ok:false,reason:"error" }; } catch { result = { ok:false,reason:"error" }; }
    setThinking(false);
    if (!openRef.current) return;
    if (result.ok) {
      history.current = [...messages,{ role:"assistant" as const,content:result.answer.slice(0,600) }].slice(-12);
      setVisitorLanguage(result.language);
      // The model knows the reply language better than the word list, so the buttons follow it.
      if (!chosen && result.language) setChatLanguage(uiLanguageFor(result.language));
      const buttons = result.suggestions.map(suggestionButton).filter((b): b is ChatButton => Boolean(b));
      const human = suggestionButton("human");
      if (result.handoff && human && !buttons.some(b=>b.id === "human")) buttons.push(human);
      setActive("ai");
      setThread(old=>[...old,{ from:"ai",text:result.answer,buttons }]);
      trackChat("chat_topic","ai");
      return;
    }
    if (result.reason === "capacity" || result.reason === "limited") setThread(old=>[...old,{ from:"note" }]);
    const node = matchChatNode(text);
    go(node,undefined,text,detected,false);
    setLastQuestion(text);
  }
  async function save(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (sending) return;
    const fields = new FormData(e.currentTarget);
    const parsed = leadSchema.safeParse({ name,email,...(product ? {product} : {}),message:messageEdited ? message : chatTopicLine(topic,language), consent,source:active === "lead" ? "chat_lead" : "chat_handoff",chatTopic:topic,language:chosen ?? visitorLanguage ?? language,pagePath:window.location.pathname,...visitSource(),website:String(fields.get("website") ?? "") });
    if (!parsed.success) { const next: Partial<Record<"name" | "email" | "company" | "message" | "consent",string>> = {}; for (const issue of parsed.error.issues) { const key = issue.path[0]; if (key === "name" || key === "email" || key === "company" || key === "message" || key === "consent") next[key] ??= issue.message; } setErrors(next); return; }
    setErrors({}); setSendError(false); setSending(true);
    try {
      const result = await submitLead(parsed.data);
      if (result.ok) { setLeadNumber(result.id ? result.id.slice(0,8).toUpperCase() : ""); setThread(old=>[...old,{from:"success"}]); setActive("success"); panel.current?.focus(); trackChat(active === "lead" ? "chat_lead_submitted" : "chat_handoff_submitted"); }
      else setSendError(true);
    } catch { setSendError(true); } finally { setSending(false); }
  }
  const value = messageEdited ? message : chatTopicLine(topic,language);
  const control = "min-h-10 h-auto whitespace-normal break-words text-left justify-start border-gold/40 text-gold focus-visible:ring-2 focus-visible:ring-ring";
  return <div className={`pointer-events-none fixed z-50 ${open ? "inset-0 sm:inset-auto sm:bottom-4 sm:right-4 sm:w-[calc(100%-2rem)] sm:max-w-xl" : "bottom-4 right-4"}`}>
    {open && <div ref={panel} role="dialog" aria-label={c.title[language]} tabIndex={-1} onKeyDown={e=>{ if(e.key === "Escape") { e.preventDefault();close(); } }} className="agent-shell pointer-events-auto h-dvh outline-none sm:h-auto">
      <div className="agent-inner flex h-full max-h-dvh flex-col overflow-hidden bg-card sm:max-h-[min(85dvh,52rem)]">
        <div className="agent-header relative shrink-0 px-4 py-3 text-primary-foreground">
          <div className="flex items-center gap-3">
          <img src={emblem.url} alt="" width={36} height={36} className="h-9 w-9 shrink-0 rounded-full" />
          <p className="min-w-0 flex-1 font-display text-xl leading-tight">{c.title[language]}</p>
          <Button type="button" variant="ghost" size="icon" className="h-10 w-10 shrink-0 text-primary-foreground" aria-label={c.close[language]} onClick={close}><X className="h-5 w-5" /></Button>
          </div>
          <div className="relative mt-2">
            <div role="group" aria-label={c.chatLanguage[language]} className="flex w-fit gap-1 rounded-full border border-primary-foreground/40 p-1">
              {(["de", "en"] as const).map(code => { const on = (chosen ?? language) === code; return <Button key={code} type="button" size="sm" variant="ghost" aria-pressed={on} onClick={() => chooseLanguage(code)} className={`h-10 min-w-10 rounded-full px-3 text-xs focus-visible:ring-2 ${on ? "bg-card text-gold" : "text-primary-foreground"}`}>{code.toUpperCase()}</Button>; })}
              {(() => { const current = chosen ?? language; const other = current !== "de" && current !== "en"; return <Button type="button" size="sm" variant="ghost" aria-expanded={languageMenu} aria-haspopup="listbox" aria-label={c.moreLanguages[language]} onClick={() => setLanguageMenu(v => !v)} className={`h-10 min-w-10 gap-1 rounded-full px-3 text-xs focus-visible:ring-2 ${other || languageMenu ? "bg-card text-gold" : "text-primary-foreground"}`}><Globe className="h-4 w-4" />{other && current.toUpperCase()}</Button>; })()}
            </div>
            {languageMenu && <ul role="listbox" aria-label={c.chatLanguage[language]} className="absolute left-0 top-full z-10 mt-2 grid max-h-[50dvh] w-[min(20rem,calc(100vw-3rem))] grid-cols-2 gap-1 overflow-y-auto rounded-2xl border border-gold/30 bg-card p-2 text-card-foreground shadow-gold">
              {VISITOR_LANGUAGES.map(code => { const on = (chosen ?? language) === code; return <li key={code}><button type="button" role="option" aria-selected={on} lang={code} onClick={() => chooseLanguage(code)} className={`flex min-h-10 w-full items-center justify-between gap-2 rounded-xl px-3 text-left text-sm focus-visible:outline-2 focus-visible:outline-gold ${on ? "bg-accent text-gold" : "hover:bg-accent/60"}`}><span>{VISITOR_LANGUAGE_NATIVE[code]}</span>{on ? <Check className="h-4 w-4" /> : <span className="text-xs text-muted-foreground">{code.toUpperCase()}</span>}</button></li>; })}
            </ul>}
          </div>
        </div>
        <p className="shrink-0 border-b px-4 py-3 text-xs leading-relaxed text-muted-foreground">{c.disclosure[language]} <Link to="/datenschutz" className="text-gold underline underline-offset-2">{c.privacyShort[language]}</Link></p>
        <div ref={scroll} className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
          <div aria-live="polite" aria-relevant="additions text" className="space-y-3">
            {thread.map((entry,i)=>entry.from === "guest" ? <p key={i} className="agent-bubble ml-auto max-w-[85%] break-words rounded-2xl rounded-tr-sm border border-gold/40 px-4 py-3 text-sm">{entry.choice?.label[language] ?? entry.text}</p> : entry.from === "success" ? <p key={i} className="agent-bubble whitespace-pre-line rounded-2xl bg-accent px-4 py-3 text-sm text-accent-foreground">{c.success[language]}{leadNumber && `\n${c.requestNumber[language]}: ${leadNumber}`}</p> : entry.from === "note" ? <p key={i} className="agent-bubble rounded-2xl bg-accent px-4 py-3 text-xs text-accent-foreground">{c.busy[language]}</p> : entry.from === "ai" ? <div key={i} ref={i === thread.length-1 ? latestAgent : undefined} data-testid={i === thread.length-1 ? "latest-agent-entry" : undefined} className="space-y-2">
              <p data-testid="ai-answer" className="agent-bubble whitespace-pre-line break-words rounded-2xl rounded-tl-sm bg-accent px-4 py-3 text-sm leading-relaxed text-accent-foreground">{withPageLinks(entry.text)}</p>
              {i === thread.length-1 && entry.buttons.length > 0 && <div className="grid gap-2">{entry.buttons.map(b=><Button key={b.id} type="button" variant="outline" className={control} disabled={sending} onClick={()=>go(b.target ?? b.id,b)}>{b.label[language]}</Button>)}</div>}
            </div> : <div key={i} ref={i === thread.length-1 ? latestAgent : undefined} data-testid={i === thread.length-1 ? "latest-agent-entry" : undefined} className="space-y-2">
              <p className="agent-bubble whitespace-pre-line rounded-2xl rounded-tl-sm bg-accent px-4 py-3 text-sm leading-relaxed text-accent-foreground">{chatScenarios[entry.node]?.text[language]}</p>
              {i === thread.length-1 && <div className="grid gap-2">{chatScenarios[entry.node]?.buttons.map(b=>b.to ? <Button key={b.id} asChild variant="outline" className={control}><Link to={b.to} onClick={()=>setThread(old=>[...old,{from:"guest",choice:b}])}>{b.label[language]}</Link></Button> : <Button key={b.id} type="button" variant="outline" className={control} disabled={sending} onClick={()=>go(b.target ?? b.id,b)}>{b.label[language]}</Button>)}</div>}
            </div>)}
            {thinking && <p role="status" className="agent-bubble w-fit rounded-2xl rounded-tl-sm bg-accent px-4 py-3 text-sm text-accent-foreground"><span className="motion-safe:animate-pulse">{c.typing[language]}</span></p>}
          </div>
          {form && <form onSubmit={save} noValidate className="mt-4 space-y-3">
            <input name="website" className="sr-only" tabIndex={-1} autoComplete="off" aria-hidden="true" maxLength={200} />
            {([{id:"name",label:c.name,value:name,set:setName,max:100},{id:"email",label:c.email,value:email,set:setEmail,max:255}] as const).map(f=><div key={f.id} className="space-y-1"><Label htmlFor={`chat-${f.id}`}>{f.label[language]}</Label><Input id={`chat-${f.id}`} name={f.id} value={f.value} onChange={e=>f.set(e.target.value)} maxLength={f.max} type={f.id === "email" ? "email" : "text"} autoComplete={f.id} required aria-invalid={Boolean(errors[f.id])} />{errors[f.id] && <p role="alert" className="text-sm text-destructive">{t(errors[f.id] ?? "")}</p>}{f.id === "email" && suggestEmail(email) && <p className="text-sm">{c.didYouMean[language]} <button type="button" className="font-semibold text-gold underline" onClick={()=>setEmail(suggestEmail(email) ?? email)}>{suggestEmail(email)}</button>?</p>}</div>)}
            <div className="space-y-1"><Label htmlFor="chat-product">{c.product[language]}</Label><ProductSelect id="chat-product" value={product} onChange={setProduct} /></div>
            <Label htmlFor="chat-message">{c.message[language]}</Label><Textarea id="chat-message" name="message" rows={3} value={value} onChange={e=>{setMessage(e.target.value);setMessageEdited(true);}} maxLength={2000} required aria-invalid={Boolean(errors["message"])} />
            {errors["message"] && <p role="alert" className="text-sm text-destructive">{t(errors["message"])}</p>}
            <div className="flex items-start gap-3"><Checkbox id="chat-consent" checked={consent} onCheckedChange={v=>setConsent(v === true)} required aria-invalid={Boolean(errors["consent"])} className="mt-1" /><Label htmlFor="chat-consent" className="min-w-0 text-xs leading-relaxed font-normal">{c.consent[language]}</Label></div>
            <Button asChild variant="link" className="min-h-10 text-gold"><Link to="/datenschutz">{c.privacy[language]}</Link></Button>
            {errors["consent"] && <p role="alert" className="text-sm text-destructive">{t(errors["consent"])}</p>}
            {sendError && <div role="alert" className="text-sm text-destructive"><p>{c.error[language]}</p><Button asChild variant="link" className="min-h-10 text-gold"><Link to="/contact">{c.contact[language]}</Link></Button></div>}
            <Button type="submit" disabled={sending} aria-busy={sending} className="min-h-10 w-full bg-gold-gradient text-primary-foreground">{sending && <LoaderCircle className="h-4 w-4 motion-safe:animate-spin" />}{(sending ? c.loading : c.send)[language]}</Button>
          </form>}
        </div>
        {voiceNotice && <div className="shrink-0 border-t px-4 py-3" role="status"><p className="text-xs leading-relaxed text-muted-foreground">{c.voiceNotice[language]}</p><div className="mt-2 flex gap-2"><Button type="button" variant="outline" className={control} onClick={() => { void allowVoice(); }}>{c.voiceContinue[language]}</Button><Button type="button" variant="outline" className={control} onClick={declineVoice}>{c.voiceCancel[language]}</Button></div></div>}
        {(listening || voiceIssue) && <p role="status" aria-live="polite" data-testid="voice-status" className={`shrink-0 border-t px-4 py-2 text-xs leading-relaxed ${listening ? "text-gold" : voiceIssue === "requesting" ? "text-muted-foreground" : "text-destructive"}`}>{listening ? <span className="inline-flex items-center gap-2"><span aria-hidden="true" className="h-2 w-2 rounded-full bg-destructive motion-safe:animate-pulse" />{c.voiceListening[language]}</span> : voiceIssue === "requesting" ? c.voiceRequesting[language] : voiceIssue === "blocked" ? c.voiceBlocked[language] : voiceIssue === "noSpeech" ? c.voiceNoSpeech[language] : voiceIssue === "noMic" ? c.voiceNoMic[language] : c.voiceNetwork[language]}</p>}
        {!form && active !== "success" && <form onSubmit={ask} className="flex shrink-0 items-center gap-2 border-t px-4 py-3"><Input value={question} onChange={e=>setQuestion(e.target.value)} maxLength={300} disabled={thinking} placeholder={c.question[language]} aria-label={c.question[language]} className="min-h-10" />{voiceSupported && <Button type="button" variant="outline" size="icon" className={`h-10 w-10 shrink-0 border-gold/40 text-gold ${listening ? "bg-destructive/15 motion-safe:animate-pulse" : ""} ${voiceOff ? "cursor-not-allowed opacity-40" : ""}`} aria-pressed={listening} aria-disabled={voiceOff || undefined} disabled={voiceIssue === "requesting"} title={voiceOff ? c.voiceOff[language] : undefined} aria-label={(voiceOff ? c.voiceOff : listening ? c.stopVoice : c.voice)[language]} onClick={toggleVoice}>{listening ? <Square className="h-4 w-4" /> : voiceOff ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}</Button>}<Button type="submit" size="icon" className="h-10 w-10 shrink-0 bg-gold-gradient text-primary-foreground" disabled={thinking} aria-label={c.send[language]}><Send className="h-4 w-4" /></Button></form>}
        <div className="grid shrink-0 grid-cols-[auto_1fr] gap-2 border-t px-4 py-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]"><Button variant="outline" className={control} disabled={sending} onClick={()=>go("menu",{id:"menu",label:c.menu})}>{c.menu[language]}</Button><Button variant="outline" className={control} disabled={sending} onClick={()=>go("human",{id:"human",label:c.human})}>{c.human[language]}</Button></div>
      </div>
    </div>}
    <Button ref={launcher} onClick={show} aria-expanded={open} aria-label={c.launcher[language]} className={`agent-shell agent-shell--pill pointer-events-auto h-auto p-0 transition-opacity duration-300 ${open ? "sr-only" : heroCovered ? "pointer-events-none opacity-0" : ""}`} tabIndex={heroCovered && !open ? -1 : undefined} aria-hidden={heroCovered && !open ? true : undefined} variant="ghost"><span className="agent-inner flex min-h-12 min-w-12 items-center justify-center gap-2 bg-card p-3 sm:min-h-10 sm:justify-start sm:px-4 sm:py-2"><MessageCircle className="h-5 w-5 text-gold" /><span className="text-gold-gradient max-sm:sr-only">{c.launcher[language]}</span></span></Button>
  </div>;
}
