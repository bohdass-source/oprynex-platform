import { QueryClient } from "@tanstack/react-query";
import { createMemoryHistory, createRootRouteWithContext, createRoute, createRouter, RouterProvider } from "@tanstack/react-router";
import { cleanup, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";
import { LanguageProvider, useLanguage } from "@/components/language-provider";
import { AgentWidget, AskAgentButton } from "@/components/agent-widget";
import { chatCopy, chatScenarios, matchChatNode, trackChat } from "@/lib/chat-scenarios";
import { saveCookieConsent } from "@/lib/cookie-consent";
import { eur, prices } from "@/lib/offers";
// Prices are formatted with no-break spaces; Testing Library compares the DOM text with plain spaces.
const spaced = (text?: string) => (text ?? "").replace(/\s+/g, " ");
const { submit } = vi.hoisted(()=>({submit:vi.fn()}));
vi.mock("@/lib/submit-lead",()=>({submitLead:submit}));
const { ask } = vi.hoisted(()=>({ask:vi.fn()}));
vi.mock("@/lib/ask-chat",()=>({askChat:ask}));
async function renderAgent(phone = false) {
 vi.stubGlobal("ResizeObserver", class { observe() {} unobserve() {} disconnect() {} });
 window.matchMedia = vi.fn().mockReturnValue({matches:phone,addEventListener(){},removeEventListener(){}});
 const root = createRootRouteWithContext<{queryClient:QueryClient}>()();
 const home = createRoute({getParentRoute:()=>root,path:"/",component:()=> <LanguageProvider><SiteLanguage/><AskAgentButton/><AgentWidget/></LanguageProvider>});
 const router = createRouter({routeTree:root.addChildren([home]),history:createMemoryHistory({initialEntries:["/"]}),context:{queryClient:new QueryClient()}});
 await router.load();render(<RouterProvider router={router}/>);
}
function SiteLanguage() { const { language, setLanguage } = useLanguage(); return <><output data-testid="site-language">{language}</output><button onClick={() => setLanguage("en")}>Site English</button></>; }
class MockRecognition {
 static instances: MockRecognition[] = [];
 lang = "";
 interimResults = false;
 onresult: ((event: {results: ArrayLike<ArrayLike<{transcript:string}>>}) => void) | null = null;
 onend: (() => void) | null = null;
 onerror: ((event?: {error?: string}) => void) | null = null;
 start = vi.fn(); stop = vi.fn(); abort = vi.fn();
 constructor() { MockRecognition.instances.push(this); }
}
function open() { fireEvent.click(screen.getByRole("button",{name:"KI-Assistent"})); }
async function question(text:string) { fireEvent.change(screen.getByLabelText("Ihre Frage"),{target:{value:text}});fireEvent.click(screen.getByRole("button",{name:"Senden"}));await waitFor(()=>expect(screen.getByRole("dialog").querySelector("form input:disabled")).toBeNull()); }
function pickLanguage(menu:string, option:string) { fireEvent.click(screen.getByRole("button",{name:menu})); fireEvent.click(screen.getByRole("option",{name:new RegExp(option)})); }
function handoff() { fireEvent.click(screen.getAllByRole("button",{name:"An einen Menschen schreiben"}).at(-1) as HTMLElement); }
function fillForm() { fireEvent.change(screen.getByLabelText("Vor- und Nachname *"),{target:{value:"Test User"}});fireEvent.change(screen.getByLabelText("E-Mail *"),{target:{value:"test@example.com"}});fireEvent.click(screen.getByRole("checkbox")); }
afterEach(()=>{cleanup();localStorage.clear();vi.resetAllMocks();vi.unstubAllGlobals();MockRecognition.instances = [];delete (window as unknown as {dataLayer?:object[]}).dataLayer;});
describe("prepared assistant",()=>{
 it("stays closed and silent until opened and shows disclosure",async()=>{await renderAgent();expect(screen.queryByRole("dialog")).toBeNull();expect(screen.queryByText(chatScenarios["menu"]?.text.de ?? "")).toBeNull();open();expect(screen.getByText(chatCopy.disclosure.de)).toBeTruthy();expect(screen.getByText(chatScenarios["menu"]?.text.de ?? "")).toBeTruthy();});
 it("on phones hides the floating launcher over the home hero until the visitor scrolls",async()=>{
   Object.defineProperty(window,"scrollY",{configurable:true,value:0});
   await renderAgent(true);
   const launcher = ()=>document.querySelector("button[aria-expanded]") as HTMLElement;
   await waitFor(()=>expect(launcher()).toHaveAttribute("aria-hidden","true"));
   expect(screen.getByRole("button",{name:"KI-Assistent fragen"})).toBeTruthy();
   Object.defineProperty(window,"scrollY",{configurable:true,value:2000});fireEvent.scroll(window);
   await waitFor(()=>expect(launcher()).not.toHaveAttribute("aria-hidden"));
   Object.defineProperty(window,"scrollY",{configurable:true,value:0});
 });
 it("opens from the hero button",async()=>{await renderAgent();fireEvent.click(screen.getByRole("button",{name:"KI-Assistent fragen"}));expect(screen.getByRole("dialog")).toBeTruthy();});
 it("menu price answer names the published net prices",async()=>{await renderAgent();open();fireEvent.click(screen.getByRole("button",{name:"Was kostet das?"}));expect(screen.getByText(spaced(chatScenarios["price"]?.text.de))).toBeTruthy();const text=screen.getByRole("dialog").textContent??"";expect(text).toContain(`KI-Chatbot ab ${eur(prices.chatbot,"de")}`);expect(text).toContain("netto zzgl. 19 % MwSt.");});
 it("preis selects price",async()=>{await renderAgent();open();await question("PREIS bitte");expect(screen.getByText(spaced(chatScenarios["price"]?.text.de))).toBeTruthy();});
 it("beschwerde selects human with question prefilled",async()=>{await renderAgent();open();await question("Eine Beschwerde");expect(screen.getByText(chatScenarios["human"]?.text.de ?? "")).toBeTruthy();expect((screen.getByLabelText("Ihre Aufgabe *") as HTMLTextAreaElement).value).toBe("Eine Beschwerde");});
 it("unmatched asks permission before handing off the original question",async()=>{await renderAgent();open();await question("xyz unknown question");expect(screen.getByText(chatScenarios["unmatched"]?.text.de ?? "")).toBeTruthy();expect(submit).not.toHaveBeenCalled();handoff();expect((screen.getByLabelText("Ihre Aufgabe *") as HTMLTextAreaElement).value).toBe("xyz unknown question");});
 it("shows success only after saved response",async()=>{let resolve:(value:{ok:true})=>void = ()=>{};submit.mockImplementation(()=>new Promise(r=>{resolve=r;}));await renderAgent();open();await question("crm");fireEvent.click(screen.getByRole("button",{name:"Aufgabe besprechen"}));fillForm();fireEvent.click(screen.getByRole("button",{name:"Senden"}));expect(screen.queryByText(chatCopy.success.de)).toBeNull();expect(screen.getByRole("button",{name:"Wird gesendet…"})).toBeDisabled();resolve({ok:true});await waitFor(()=>expect(screen.getByText(chatCopy.success.de)).toBeTruthy());expect(screen.queryByRole("checkbox")).toBeNull();expect(submit).toHaveBeenCalledWith(expect.objectContaining({source:"chat_lead",chatTopic:"fit_crm",language:"de",consent:true}));});
 it("retains form data and shows an inline error on failure",async()=>{submit.mockResolvedValue({ok:false,status:429});await renderAgent();open();await question("beschwerde");fillForm();fireEvent.click(screen.getByRole("button",{name:"Senden"}));await waitFor(()=>expect(screen.getByText(chatCopy.error.de)).toBeTruthy());expect(screen.queryByText(chatCopy.success.de)).toBeNull();expect((screen.getByLabelText("Vor- und Nachname *") as HTMLInputElement).value).toBe("Test User");expect(submit).toHaveBeenCalledWith(expect.objectContaining({source:"chat_handoff"}));});
 it("requires consent and does not send before it",async()=>{await renderAgent();open();handoff();fireEvent.change(screen.getByLabelText("Vor- und Nachname *"),{target:{value:"Test User"}});fireEvent.change(screen.getByLabelText("E-Mail *"),{target:{value:"test@example.com"}});fireEvent.click(screen.getByRole("button",{name:"Senden"}));expect(submit).not.toHaveBeenCalled();expect(screen.getAllByRole("alert").length).toBeGreaterThan(0);});
 it("prefills the form with the recent real questions, newest last, without short reactions",async()=>{await renderAgent();open();await question("xyz Was macht Oprynex eigentlich genau?");await question("xyz Anfragen gehen zwischen Mail und WhatsApp verloren");await question("xyz zu lang");await question("xyz Termin morgen um 15 Uhr möglich?");await question("xyz Und was kostet ein CRM ungefähr?");handoff();expect((screen.getByLabelText("Ihre Aufgabe *") as HTMLTextAreaElement).value).toBe("xyz Anfragen gehen zwischen Mail und WhatsApp verloren\nxyz Termin morgen um 15 Uhr möglich?\nxyz Und was kostet ein CRM ungefähr?");});
 it("turns site paths in AI answers into links",async()=>{const { withPageLinks } = await import("@/components/agent-widget");const parts=withPageLinks("Mehr auf /preise oder /contact. Nicht /preisex.");expect(parts.filter(p=>typeof p !== "string")).toHaveLength(2);});
 it("suggests the likely address for a mistyped mail provider",async()=>{await renderAgent();open();handoff();fireEvent.change(screen.getByLabelText("E-Mail *"),{target:{value:"anna@ptotonmail.com"}});fireEvent.click(screen.getByRole("button",{name:"anna@protonmail.com"}));expect((screen.getByLabelText("E-Mail *") as HTMLInputElement).value).toBe("anna@protonmail.com");expect(screen.queryByRole("button",{name:"anna@protonmail.com"})).toBeNull();});
 it("shows a short request number after a saved request",async()=>{submit.mockResolvedValue({ok:true,id:"1c662a74-e18f-46fc-ae02-c2304326b367"});await renderAgent();open();handoff();fillForm();fireEvent.change(screen.getByLabelText("Ihre Aufgabe *"),{target:{value:"Bitte um Rückruf zur Website"}});fireEvent.click(screen.getByRole("button",{name:"Senden"}));await waitFor(()=>expect(screen.getByText(/Nummer Ihrer Anfrage: 1C662A74/)).toBeTruthy());});
 it("restores focus after Escape",async()=>{await renderAgent();open();fireEvent.keyDown(screen.getByRole("dialog"),{key:"Escape"});expect(screen.queryByRole("dialog")).toBeNull();expect(screen.getByRole("button",{name:"KI-Assistent"})).toHaveFocus();});
 it("detects reply language without changing the site and sends the current chat language",async()=>{
   submit.mockResolvedValue({ok:true}); await renderAgent();open();await question("How much does a website cost?");
   expect(screen.getByText(spaced(chatScenarios["price"]?.text.en))).toBeTruthy();
   expect(screen.getByTestId("site-language")).toHaveTextContent("de");
   fireEvent.click(screen.getByRole("button",{name:"Yes, describe my task"}));
   fireEvent.change(screen.getByLabelText("First and last name *"),{target:{value:"Test User"}});
   fireEvent.change(screen.getByLabelText("Email *"),{target:{value:"test@example.com"}});
   pickLanguage("More languages","Русский");
   fireEvent.click(screen.getByRole("checkbox")); fireEvent.click(screen.getByRole("button",{name:"Отправить"}));
   await waitFor(()=>expect(submit).toHaveBeenCalledWith(expect.objectContaining({language:"ru"})));
 });
 it("manual language survives signal-free messages and follows subsequent site changes",async()=>{
   await renderAgent();open();pickLanguage("Weitere Sprachen","Русский");
   fireEvent.change(screen.getByLabelText("Ваш вопрос"),{target:{value:"CRM"}});fireEvent.click(screen.getByRole("button",{name:"Отправить"}));
   expect(await screen.findByText(chatScenarios["fit_crm"]?.text.ru ?? "")).toBeTruthy();
   fireEvent.click(screen.getByRole("button",{name:"Site English"}));
   expect(screen.getByText(chatScenarios["fit_crm"]?.text.en ?? "")).toBeTruthy();
 });
 it("shows microphone only when browser recognition is supported",async()=>{await renderAgent();open();expect(screen.queryByRole("button",{name:"Spracheingabe"})).toBeNull();});
 it("requires first-use consent, listens in the chat language and sends on the second click",async()=>{
   vi.stubGlobal("SpeechRecognition",MockRecognition);await renderAgent();open();fireEvent.click(screen.getByRole("button",{name:"EN"}));
   fireEvent.click(screen.getByRole("button",{name:"Voice input"}));expect(screen.getByText(chatCopy.voiceNotice.en)).toBeTruthy();expect(MockRecognition.instances).toHaveLength(0);
   fireEvent.click(screen.getByRole("button",{name:"Continue"}));const rec = MockRecognition.instances[0];
   expect(rec?.start).toHaveBeenCalledOnce();expect(rec?.lang).toBe("en-US");expect(rec?.interimResults).toBe(true);expect((rec as unknown as {continuous?:boolean})?.continuous).toBe(true);
   const { act } = await import("@testing-library/react");
   act(()=>rec?.onresult?.({results:[[{transcript:"How much does a website cost?"}]]}));
   // Recognised speech only fills the draft until the visitor clicks the microphone again.
   expect(screen.getByLabelText("Your question")).toHaveValue("How much does a website cost?");expect(ask).not.toHaveBeenCalled();
   expect(screen.getByRole("button",{name:"Stop and send"})).toHaveAttribute("aria-pressed","true");
   fireEvent.click(screen.getByRole("button",{name:"Stop and send"}));expect(rec?.stop).toHaveBeenCalled();expect(rec?.abort).toHaveBeenCalled();
   await waitFor(()=>expect(ask).toHaveBeenCalledWith(expect.objectContaining({messages:[{role:"user",content:"How much does a website cost?"}],reply:"en"})));
   expect(await screen.findByText(spaced(chatScenarios["price"]?.text.en))).toBeTruthy();
   fireEvent.click(screen.getByRole("button",{name:"Voice input"}));expect(screen.queryByText(chatCopy.voiceNotice.en)).toBeNull();expect(MockRecognition.instances).toHaveLength(2);
 });
 it("stopping without speech sends nothing",async()=>{
   vi.stubGlobal("SpeechRecognition",MockRecognition);await renderAgent();open();
   fireEvent.click(screen.getByRole("button",{name:"Spracheingabe"}));fireEvent.click(screen.getByRole("button",{name:"Fortfahren"}));
   fireEvent.click(screen.getByRole("button",{name:"Aufnahme beenden und senden"}));expect(ask).not.toHaveBeenCalled();
 });
 it("shows DE and EN first and all 20 languages behind the globe button",async()=>{
   vi.stubGlobal("SpeechRecognition",MockRecognition);ask.mockResolvedValue({ok:true,answer:"Cześć",suggestions:[],handoff:false,language:"pl"});
   await renderAgent();open();
   const group = screen.getByRole("group",{name:"Sprache des Chats"});
   expect(within(group).getByRole("button",{name:"DE"})).toHaveAttribute("aria-pressed","true");
   expect(within(group).getByRole("button",{name:"EN"})).toBeTruthy();expect(within(group).queryByRole("button",{name:"RU"})).toBeNull();
   fireEvent.click(screen.getByRole("button",{name:"Weitere Sprachen"}));
   expect(screen.getAllByRole("option")).toHaveLength(20);
   fireEvent.click(screen.getByRole("option",{name:/Polski/}));expect(screen.queryByRole("listbox")).toBeNull();
   expect(within(screen.getByRole("group",{name:"Chat language"})).getByRole("button",{name:"More languages"})).toHaveTextContent("PL");
   fireEvent.click(screen.getByRole("button",{name:"Voice input"}));fireEvent.click(screen.getByRole("button",{name:"Continue"}));
   expect(MockRecognition.instances[0]?.lang).toBe("pl-PL");
   fireEvent.change(screen.getByLabelText("Your question"),{target:{value:"Hello"}});fireEvent.click(screen.getByRole("button",{name:"Send"}));
   await waitFor(()=>expect(ask).toHaveBeenCalledWith(expect.objectContaining({reply:"pl",language:"en"})));
   expect(await screen.findByText("Cześć")).toBeTruthy();
 });
 it("resets errors, truncates interim results, aborts on close and unmount",async()=>{
   vi.stubGlobal("webkitSpeechRecognition",MockRecognition);await renderAgent();open();
   fireEvent.click(screen.getByRole("button",{name:"Spracheingabe"}));fireEvent.click(screen.getByRole("button",{name:"Fortfahren"}));const rec = MockRecognition.instances[0];expect(rec?.lang).toBe("de-DE");
   const { act } = await import("@testing-library/react");act(()=>rec?.onresult?.({results:[[{transcript:"x".repeat(400)}]]}));expect((screen.getByLabelText("Ihre Frage") as HTMLInputElement).value).toHaveLength(300);
   act(()=>rec?.onerror?.());expect(screen.getByRole("button",{name:"Spracheingabe"})).toHaveAttribute("aria-pressed","false");
   fireEvent.click(screen.getByRole("button",{name:"Spracheingabe"}));const second = MockRecognition.instances[1];fireEvent.keyDown(screen.getByRole("dialog"),{key:"Escape"});expect(second?.stop).toHaveBeenCalled();expect(second?.abort).toHaveBeenCalled();
   open();pickLanguage("Weitere Sprachen","Русский");fireEvent.click(screen.getByRole("button",{name:"Голосовой ввод"}));const third = MockRecognition.instances[2];expect(third?.lang).toBe("ru-RU");cleanup();expect(third?.abort).toHaveBeenCalled();
 });
 it("sends the recognised text when the browser ends the recording by itself",async()=>{
   vi.stubGlobal("SpeechRecognition",MockRecognition);await renderAgent();open();
   fireEvent.click(screen.getByRole("button",{name:"Spracheingabe"}));fireEvent.click(screen.getByRole("button",{name:"Fortfahren"}));
   const rec = MockRecognition.instances[0];const { act } = await import("@testing-library/react");
   act(()=>rec?.onresult?.({results:[[{transcript:"Was kostet eine Website?"}]]}));
   act(()=>rec?.onend?.());
   await waitFor(()=>expect(ask).toHaveBeenCalledWith(expect.objectContaining({messages:[{role:"user",content:"Was kostet eine Website?"}]})));
 });
 it("says nothing was heard when the browser ends an empty recording",async()=>{
   vi.stubGlobal("SpeechRecognition",MockRecognition);await renderAgent();open();
   fireEvent.click(screen.getByRole("button",{name:"Spracheingabe"}));fireEvent.click(screen.getByRole("button",{name:"Fortfahren"}));
   const { act } = await import("@testing-library/react");act(()=>MockRecognition.instances[0]?.onend?.());
   expect(screen.getByText(chatCopy.voiceNoSpeech.de)).toBeTruthy();expect(ask).not.toHaveBeenCalled();
 });
 it("declining the voice notice turns the microphone off for the visit",async()=>{
   vi.stubGlobal("SpeechRecognition",MockRecognition);await renderAgent();open();
   fireEvent.click(screen.getByRole("button",{name:"Spracheingabe"}));fireEvent.click(screen.getByRole("button",{name:"Ablehnen"}));
   const off = screen.getByRole("button",{name:"Spracheingabe deaktiviert"});expect(off).toHaveAttribute("aria-disabled","true");
   fireEvent.click(off);expect(screen.queryByText(chatCopy.voiceNotice.de)).toBeNull();expect(MockRecognition.instances).toHaveLength(0);
 });
 it("asks the browser for the microphone first and starts listening only after access is granted",async()=>{
   vi.stubGlobal("SpeechRecognition",MockRecognition);
   let grant:(v:unknown)=>void = ()=>{};const stopTrack = vi.fn();
   const getUserMedia = vi.fn(()=>new Promise(r=>{grant=r;}));
   Object.defineProperty(navigator,"mediaDevices",{configurable:true,value:{getUserMedia}});
   try {
     await renderAgent();open();
     fireEvent.click(screen.getByRole("button",{name:"Spracheingabe"}));fireEvent.click(screen.getByRole("button",{name:"Fortfahren"}));
     expect(getUserMedia).toHaveBeenCalledWith({audio:true});expect(MockRecognition.instances).toHaveLength(0);
     expect(screen.getByTestId("voice-status")).toHaveTextContent(chatCopy.voiceRequesting.de);
     const { act } = await import("@testing-library/react");
     await act(async()=>{grant({getTracks:()=>[{stop:stopTrack}]});});
     await waitFor(()=>expect(MockRecognition.instances).toHaveLength(1));
     expect(stopTrack).toHaveBeenCalled();expect(MockRecognition.instances[0]?.start).toHaveBeenCalled();
     expect(screen.getByTestId("voice-status")).toHaveTextContent(chatCopy.voiceListening.de);
   } finally { Reflect.deleteProperty(navigator,"mediaDevices"); }
 });
 it("explains a blocked microphone and turns voice off",async()=>{
   vi.stubGlobal("SpeechRecognition",MockRecognition);
   Object.defineProperty(navigator,"mediaDevices",{configurable:true,value:{getUserMedia:vi.fn().mockRejectedValue(Object.assign(new Error("denied"),{name:"NotAllowedError"}))}});
   try {
     await renderAgent();open();
     fireEvent.click(screen.getByRole("button",{name:"Spracheingabe"}));fireEvent.click(screen.getByRole("button",{name:"Fortfahren"}));
     expect(await screen.findByText(chatCopy.voiceBlocked.de)).toBeTruthy();
     expect(screen.getByRole("button",{name:"Spracheingabe deaktiviert"})).toHaveAttribute("aria-disabled","true");
     expect(MockRecognition.instances).toHaveLength(0);
   } finally { Reflect.deleteProperty(navigator,"mediaDevices"); }
 });
 it("shows a hint when nothing was heard and keeps the microphone usable",async()=>{
   vi.stubGlobal("SpeechRecognition",MockRecognition);await renderAgent();open();
   fireEvent.click(screen.getByRole("button",{name:"Spracheingabe"}));fireEvent.click(screen.getByRole("button",{name:"Fortfahren"}));
   const { act } = await import("@testing-library/react");act(()=>MockRecognition.instances[0]?.onerror?.({error:"no-speech"}));
   expect(screen.getByText(chatCopy.voiceNoSpeech.de)).toBeTruthy();
   fireEvent.click(screen.getByRole("button",{name:"Spracheingabe"}));expect(MockRecognition.instances).toHaveLength(2);
 });
 it("scrolls to the start of the latest agent answer when it is taller than the list",async()=>{
   const scrollSpy = vi.fn();
   const originalScrollTo = Element.prototype.scrollTo;
   const originalRect = Element.prototype.getBoundingClientRect;
   const originalClientHeight = Object.getOwnPropertyDescriptor(Element.prototype,"clientHeight");
   Element.prototype.scrollTo = scrollSpy;
   Element.prototype.getBoundingClientRect = function(this:Element) {
     const el = this as HTMLElement;
     if (el.dataset?.["testid"] === "latest-agent-entry") return { top:600,height:700,bottom:1300,left:0,right:0,width:300,x:0,y:600,toJSON:()=>({}) } as DOMRect;
     if (el.classList?.contains("overflow-y-auto")) return { top:0,height:400,bottom:400,left:0,right:0,width:400,x:0,y:0,toJSON:()=>({}) } as DOMRect;
     return originalRect.call(this);
   };
   Object.defineProperty(Element.prototype,"clientHeight",{configurable:true,get(this:Element){ return (this as HTMLElement).classList?.contains("overflow-y-auto") ? 400 : 0; }});
   try {
     await renderAgent();open();
     const entry = screen.getByTestId("latest-agent-entry");
     expect(entry.textContent).toContain(chatScenarios["menu"]?.text.de ?? "");
     await waitFor(()=>expect(scrollSpy).toHaveBeenCalled());
     expect(scrollSpy).toHaveBeenLastCalledWith(expect.objectContaining({top:592}));
   } finally {
     Element.prototype.scrollTo = originalScrollTo;
     Element.prototype.getBoundingClientRect = originalRect;
     if (originalClientHeight) Object.defineProperty(Element.prototype,"clientHeight",originalClientHeight);
   }
 });
 it("keeps scrolling to the bottom when the latest agent answer fits the list",async()=>{
   const scrollSpy = vi.fn();
   const originalScrollTo = Element.prototype.scrollTo;
   const originalRect = Element.prototype.getBoundingClientRect;
   const originalClientHeight = Object.getOwnPropertyDescriptor(Element.prototype,"clientHeight");
   Element.prototype.scrollTo = scrollSpy;
   Element.prototype.getBoundingClientRect = function(this:Element) {
     const el = this as HTMLElement;
     if (el.dataset?.["testid"] === "latest-agent-entry") return { top:100,height:120,bottom:220,left:0,right:0,width:300,x:0,y:100,toJSON:()=>({}) } as DOMRect;
     if (el.classList?.contains("overflow-y-auto")) return { top:0,height:400,bottom:400,left:0,right:0,width:400,x:0,y:0,toJSON:()=>({}) } as DOMRect;
     return originalRect.call(this);
   };
   Object.defineProperty(Element.prototype,"clientHeight",{configurable:true,get(this:Element){ return (this as HTMLElement).classList?.contains("overflow-y-auto") ? 400 : 0; }});
   try {
     await renderAgent();open();
     await waitFor(()=>expect(scrollSpy).toHaveBeenCalled());
     expect(scrollSpy).toHaveBeenLastCalledWith(expect.objectContaining({top:0}));
   } finally {
     Element.prototype.scrollTo = originalScrollTo;
     Element.prototype.getBoundingClientRect = originalRect;
     if (originalClientHeight) Object.defineProperty(Element.prototype,"clientHeight",originalClientHeight);
   }
 });
});
describe("keyword order and analytics privacy",()=>{
 it("prioritizes handoff over price",()=>{expect(matchChatNode("urgent price")).toBe("human");});
 it("uses word boundaries for very short keywords",()=>{expect(matchChatNode("plain sailing" )).toBe("unmatched");expect(matchChatNode("KI" )).toBe("fit_ai");expect(matchChatNode("ии" )).toBe("fit_ai");});
 it("never tracks absent or rejected consent",()=>{trackChat("chat_open");saveCookieConsent("rejected");trackChat("chat_unmatched");expect((window as unknown as {dataLayer?:object[]}).dataLayer).toBeUndefined();});
 it("tracks only event and node, not typed questions",()=>{saveCookieConsent("accepted");trackChat("chat_topic","price");trackChat("chat_unmatched");expect((window as unknown as {dataLayer?:object[]}).dataLayer).toEqual([{event:"chat_topic",node:"price"},{event:"chat_unmatched"}]);});
});
describe("AI answers",()=>{
 it("shows AI disclosure wording and privacy link",async()=>{await renderAgent();open();expect(screen.getByText(/Ich bin ein KI-Assistent, kein Mensch/)).toBeTruthy();expect(screen.getByRole("link",{name:"Datenschutz"})).toBeTruthy();expect(screen.getByText("Oprynex · KI-Assistent")).toBeTruthy();});
 it("renders a valid answer as a bubble with suggested buttons",async()=>{ask.mockResolvedValue({ok:true,answer:"Wir bauen CRM-Systeme.",suggestions:["fit_crm","price","bogus"],handoff:false});await renderAgent();open();await question("Was genau macht ihr für Firmen?");expect(screen.getByText("Wir bauen CRM-Systeme.")).toBeTruthy();expect(screen.getByRole("button",{name:"Was kostet das?"})).toBeTruthy();expect(ask).toHaveBeenCalledWith(expect.objectContaining({messages:[{role:"user",content:"Was genau macht ihr für Firmen?"}]}));});
 it("handoff shows talk-to-a-person and prefills the question",async()=>{ask.mockResolvedValue({ok:true,answer:"Das klärt am besten ein Mensch.",suggestions:[],handoff:true});await renderAgent();open();await question("Spezielle Vertragsfrage");const buttons=screen.getAllByRole("button",{name:"An einen Menschen schreiben"});expect(buttons.length).toBeGreaterThan(1);fireEvent.click(buttons[0] as HTMLElement);expect((screen.getByLabelText("Ihre Aufgabe *") as HTMLTextAreaElement).value).toBe("Spezielle Vertragsfrage");});
 it.each(["refusal","invalid","provider","error"])("falls back to keywords on %s",async(reason)=>{ask.mockResolvedValue({ok:false,reason});await renderAgent();open();await question("PREIS bitte");expect(screen.getByText(spaced(chatScenarios["price"]?.text.de))).toBeTruthy();expect(screen.queryByText(chatCopy.busy.de)).toBeNull();});
 it("falls back with a busy note on capacity and when the call throws",async()=>{ask.mockResolvedValueOnce({ok:false,reason:"capacity"}).mockRejectedValueOnce(new Error("x"));await renderAgent();open();await question("PREIS bitte");expect(screen.getByText(chatCopy.busy.de)).toBeTruthy();await question("crm");expect(screen.getByText(chatScenarios["fit_crm"]?.text.de ?? "")).toBeTruthy();});
 it("renders answer text literally, never as HTML",async()=>{ask.mockResolvedValue({ok:true,answer:"<b>x</b>",suggestions:[],handoff:false});await renderAgent();open();await question("test frage");expect(screen.getByTestId("ai-answer").textContent).toBe("<b>x</b>");expect(screen.getByTestId("ai-answer").querySelector("b")).toBeNull();});
 it("buttons follow the language of the AI answer, not the word list",async()=>{ask.mockResolvedValueOnce({ok:true,answer:"Hello.",suggestions:[],handoff:false,language:"en"}).mockResolvedValueOnce({ok:true,answer:"Darauf habe ich keinen Zugriff.",suggestions:["price"],handoff:false,language:"de"});await renderAgent();open();await question("hello how are you");fireEvent.change(screen.getByLabelText("Your question"),{target:{value:"Welche anderen Kunden haben heute Anfragen geschickt"}});fireEvent.click(screen.getByRole("button",{name:"Send"}));await waitFor(()=>expect(screen.getByText("Darauf habe ich keinen Zugriff.")).toBeTruthy());expect(screen.getByRole("button",{name:"Was kostet das?"})).toBeTruthy();});
 it("scenario buttons do not call the AI",async()=>{await renderAgent();open();fireEvent.click(screen.getByRole("button",{name:"Was kostet das?"}));expect(ask).not.toHaveBeenCalled();});
});
