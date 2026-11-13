// Oprynex chat widget for client websites. Embedded with
//   <script src="https://bot.oprynex.workers.dev/widget.js" data-bot="BOT-ID" async></script>
// Plain JavaScript in a closed Shadow DOM, so the client's styles and the widget never touch each other.
// The conversation lives only in this page's memory; nothing is stored in the browser. All text from the visitor
// and the AI is set with textContent, never as HTML.
(function () {
  "use strict";
  var script = document.currentScript || document.querySelector("script[data-bot]");
  if (!script || window.__oprynexBot) return;
  window.__oprynexBot = true;
  var botId = script.getAttribute("data-bot") || "";
  if (!/^[0-9a-f-]{36}$/.test(botId)) return;
  var api = new URL(script.src).origin + "/v1/bots/" + botId;

  var T = {
    de: { open: "Chat öffnen", close: "Chat schließen", ai: "KI-Assistent, keine Person. Bitte keine sensiblen Daten eingeben.", placeholder: "Ihre Frage…", send: "Senden", request: "Anfrage senden", typing: "Schreibt…",
      unavailable: "Ich kann gerade nicht antworten. Hinterlassen Sie gern eine Anfrage, das Team meldet sich.", limited: "Gerade kommen zu viele Fragen. Bitte versuchen Sie es später oder senden Sie eine Anfrage.",
      name: "Name", email: "E-Mail", message: "Ihr Anliegen", consent: "Ich bin einverstanden, dass meine Angaben zur Bearbeitung der Anfrage gespeichert werden.", privacy: "Datenschutz",
      submit: "Anfrage absenden", back: "Zurück zum Chat", sent: "Danke. Ihre Anfrage ist angekommen, das Team meldet sich.", failed: "Senden fehlgeschlagen. Bitte prüfen Sie die Angaben und versuchen Sie es erneut.", tooShort: "Bitte beschreiben Sie Ihr Anliegen in mindestens 10 Zeichen.",
      company: "Firma (optional)", appointment: "Termin anfragen", day: "Wunschtag", time: "Uhrzeit, ungefähr", reason: "Worum geht es?", slot: "Wunschtermin", slotSent: "Danke. Ihre Terminanfrage ist angekommen. Das Team bestätigt den Termin.",
      support: "Support-Anfrage senden", subject: "Betreff", ticketSent: "Danke. Ihre Support-Anfrage ist angekommen, das Team meldet sich per E-Mail.", ticketNumber: "Ticketnummer", needDay: "Bitte wählen Sie einen Wunschtag ab heute." },
    en: { open: "Open chat", close: "Close chat", ai: "AI assistant, not a person. Please do not enter sensitive data.", placeholder: "Your question…", send: "Send", request: "Send a request", typing: "Typing…",
      unavailable: "I cannot answer right now. Feel free to leave a request and the team will get back to you.", limited: "Too many questions right now. Please try later or send a request.",
      name: "Name", email: "Email", message: "Your request", consent: "I agree that my details are stored to handle my request.", privacy: "Privacy policy",
      submit: "Send request", back: "Back to chat", sent: "Thank you. Your request has arrived and the team will get back to you.", failed: "Sending failed. Please check your details and try again.", tooShort: "Please describe your request in at least 10 characters.",
      company: "Company (optional)", appointment: "Request an appointment", day: "Preferred day", time: "Time, roughly", reason: "What is it about?", slot: "Preferred appointment", slotSent: "Thank you. Your appointment request has arrived. The team will confirm the time.",
      support: "Send a support request", subject: "Subject", ticketSent: "Thank you. Your support request has arrived; the team will reply by email.", ticketNumber: "Ticket number", needDay: "Please choose a preferred day from today on." },
    ru: { open: "Открыть чат", close: "Закрыть чат", ai: "ИИ-ассистент, не человек. Не вводите личные данные.", placeholder: "Ваш вопрос…", send: "Отправить", request: "Оставить заявку", typing: "Печатает…",
      unavailable: "Сейчас не могу ответить. Оставьте заявку, команда свяжется с вами.", limited: "Сейчас слишком много вопросов. Попробуйте позже или оставьте заявку.",
      name: "Имя", email: "Почта", message: "Ваш запрос", consent: "Я согласен(на), что мои данные сохранят для обработки заявки.", privacy: "Конфиденциальность",
      submit: "Отправить заявку", back: "Назад в чат", sent: "Спасибо. Заявка получена, команда свяжется с вами.", failed: "Не удалось отправить. Проверьте данные и попробуйте ещё раз.", tooShort: "Опишите запрос хотя бы в 10 символах.",
      company: "Компания (необязательно)", appointment: "Запросить запись", day: "Желаемый день", time: "Время, примерно", reason: "По какому вопросу?", slot: "Желаемое время", slotSent: "Спасибо. Запрос на запись получен. Команда подтвердит время.",
      support: "Написать в поддержку", subject: "Тема", ticketSent: "Спасибо. Обращение получено, команда ответит по почте.", ticketNumber: "Номер обращения", needDay: "Выберите желаемый день, начиная с сегодняшнего." }
  };

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    for (var key in attrs || {}) {
      if (key === "text") node.textContent = attrs[key];
      else if (key.slice(0, 2) === "on") node.addEventListener(key.slice(2), attrs[key]);
      else node.setAttribute(key, attrs[key]);
    }
    (children || []).forEach(function (child) { if (child) node.appendChild(child); });
    return node;
  }

  function onAccent(hex) {
    var n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    return (0.299 * r + 0.587 * g + 0.114 * b) > 160 ? "#111111" : "#ffffff";
  }

  function post(path, body) {
    return fetch(api + path, { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) })
      .then(function (r) { return r.json(); })
      .catch(function () { return { ok: false, reason: "unavailable" }; });
  }

  fetch(api).then(function (r) { return r.ok ? r.json() : null; }).then(function (data) {
    if (data && data.ok) mount(data.bot);
  }).catch(function () { /* no bot for this page: show nothing */ });

  function mount(bot) {
    var pageLang = (script.getAttribute("data-lang") || document.documentElement.lang || "").slice(0, 2).toLowerCase();
    var lang = bot.languages.indexOf(pageLang) >= 0 ? pageLang : bot.languages[0];
    var t = T[lang] || T.de;
    var accent = /^#[0-9a-f]{6}$/i.test(bot.color) ? bot.color : "#111111";
    var history = [];
    var asked = []; // every question the visitor typed, also those the AI could not answer, to prefill the request form
    var busy = false;
    var visitorLang = lang;
    // The assistant type decides the request button and the form: an appointment request asks for a day and time,
    // a support request opens a ticket with a subject, a lead request asks for the company.
    var kind = bot.kind || "website";
    var requestLabel = kind === "appointment" ? t.appointment : kind === "support" ? t.support : t.request;

    var host = el("div", { "data-oprynex-bot": "" });
    var root = host.attachShadow({ mode: "closed" });
    root.appendChild(el("style", { text: [
      ":host{all:initial}",
      "[hidden]{display:none!important}",
      "*{box-sizing:border-box;font-family:system-ui,-apple-system,'Segoe UI',sans-serif}",
      ".fab{position:fixed;right:20px;bottom:20px;z-index:2147483000;width:56px;height:56px;border-radius:50%;border:0;cursor:pointer;background:" + accent + ";color:" + onAccent(accent) + ";box-shadow:0 8px 24px rgba(0,0,0,.25);display:grid;place-items:center;transition:transform .3s cubic-bezier(.22,1,.36,1)}",
      ".fab:hover{transform:scale(1.05)}.fab:active{transform:scale(.98)}",
      ".fab:focus-visible,button:focus-visible,input:focus-visible,textarea:focus-visible,a:focus-visible{outline:2px solid " + accent + ";outline-offset:2px}",
      ".panel{position:fixed;right:20px;bottom:88px;z-index:2147483000;width:360px;max-width:calc(100vw - 32px);height:540px;max-height:calc(100vh - 112px);background:#fff;color:#111;border-radius:16px;box-shadow:0 16px 48px rgba(0,0,0,.3);display:flex;flex-direction:column;overflow:hidden;font-size:14px;line-height:20px}",
      "@media (max-width:480px){.panel{right:16px;left:16px;width:auto;bottom:84px;height:calc(100vh - 100px)}.fab{right:16px;bottom:16px}textarea,input{font-size:16px!important}}",
      ".head{background:" + accent + ";color:" + onAccent(accent) + ";padding:12px 16px;display:flex;align-items:center;gap:8px}",
      ".head b{flex:1;font-size:16px;line-height:24px}",
      ".x{background:transparent;border:0;color:inherit;cursor:pointer;font-size:24px;line-height:24px;width:32px;height:32px;border-radius:8px}",
      ".note{font-size:12px;line-height:16px;color:#404040;background:#f4f4f4;padding:8px 16px;margin:0}",
      ".log{flex:1;overflow-y:auto;padding:16px;display:flex;flex-direction:column;gap:8px}",
      ".msg{max-width:85%;padding:8px 12px;border-radius:12px;white-space:pre-wrap;word-wrap:break-word}",
      ".bot{align-self:flex-start;background:#f0f0f0}.me{align-self:flex-end;background:" + accent + ";color:" + onAccent(accent) + "}",
      ".typing{align-self:flex-start;color:#666;font-size:12px}",
      ".chips{display:flex;flex-wrap:wrap;gap:8px;padding:0 16px 8px}",
      ".chip,.cta{border:1px solid #d0d0d0;background:#fff;color:#111;border-radius:999px;padding:4px 12px;cursor:pointer;font-size:14px;line-height:20px}",
      ".chip:hover,.cta:hover{background:#f4f4f4}",
      ".cta{align-self:flex-start;border-color:" + accent + ";font-weight:600}",
      ".bar{display:flex;gap:8px;padding:12px 16px;border-top:1px solid #e6e6e6}",
      ".bar textarea{flex:1;resize:none;border:1px solid #d0d0d0;border-radius:12px;padding:8px 12px;font-size:14px;line-height:20px;height:40px;color:#111;background:#fff}",
      ".go{border:0;border-radius:12px;padding:8px 12px;background:" + accent + ";color:" + onAccent(accent) + ";font-weight:600;cursor:pointer;font-size:14px}",
      ".go:disabled{opacity:.5;cursor:default}",
      ".foot{display:flex;justify-content:center;padding:0 16px 12px}",
      ".link{background:none;border:0;color:#111;text-decoration:underline;cursor:pointer;font-size:12px}",
      "form{display:flex;flex-direction:column;gap:12px;padding:16px;overflow-y:auto;flex:1}",
      "label{display:flex;flex-direction:column;gap:4px;font-size:12px;font-weight:600;color:#404040}",
      "form input[type=text],form input[type=email],form input[type=date],form textarea{border:1px solid #d0d0d0;border-radius:8px;padding:8px 12px;font-size:14px;color:#111;background:#fff;font-weight:400}",
      ".check{flex-direction:row;align-items:flex-start;gap:8px;font-weight:400}",
      ".check a{color:#111}",
      ".hp{position:absolute;left:-10000px;width:1px;height:1px;overflow:hidden}",
      ".err{color:#b00020;font-size:12px;margin:0}.err:empty{display:none}",
      "@media (prefers-reduced-motion:reduce){.fab{transition:none}}"
    ].join("") }));

    var icon = '<svg width="26" height="26" viewBox="0 0 24 24" fill="none" aria-hidden="true"><path d="M4 5h16v11H8l-4 4V5z" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>';
    var fab = el("button", { class: "fab", type: "button", "aria-label": t.open, "aria-expanded": "false" });
    fab.innerHTML = icon; // fixed markup, no visitor text
    var panel = el("div", { class: "panel", role: "dialog", "aria-label": bot.name });
    panel.hidden = true;
    var log = el("div", { class: "log", "aria-live": "polite" });
    var chips = el("div", { class: "chips" });
    var input = el("textarea", { maxlength: "600", rows: "1", placeholder: t.placeholder, "aria-label": t.placeholder });
    var send = el("button", { class: "go", type: "submit", text: t.send });
    var bar = el("form", { class: "bar", onsubmit: function (e) { e.preventDefault(); ask(input.value); } }, [input, send]);
    bar.style.cssText = "flex-direction:row;padding:12px 16px;overflow:visible;flex:none";
    var chatView = el("div", { style: "display:flex;flex-direction:column;flex:1;min-height:0" }, [
      log, chips, bar,
      el("div", { class: "foot" }, [el("button", { class: "link", type: "button", text: requestLabel, onclick: function () { showForm(); } })])
    ]);
    panel.appendChild(el("div", { class: "head" }, [el("b", { text: bot.name }), el("button", { class: "x", type: "button", "aria-label": t.close, text: "×", onclick: function () { toggle(false); } })]));
    panel.appendChild(el("p", { class: "note", text: t.ai }));
    panel.appendChild(chatView);
    root.appendChild(panel);
    root.appendChild(fab);
    document.body.appendChild(host);

    input.addEventListener("keydown", function (e) { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); ask(input.value); } });
    panel.addEventListener("keydown", function (e) { if (e.key === "Escape") toggle(false); });
    fab.addEventListener("click", function () { toggle(panel.hidden); });

    if (bot.greeting) say("bot", bot.greeting);
    bot.quickReplies.forEach(function (text) { chips.appendChild(el("button", { class: "chip", type: "button", text: text, onclick: function () { ask(text); } })); });

    function toggle(open) {
      panel.hidden = !open;
      fab.setAttribute("aria-expanded", String(open));
      fab.setAttribute("aria-label", open ? t.close : t.open);
      if (open) input.focus(); else fab.focus();
    }

    function say(who, text) {
      var node = el("div", { class: "msg " + (who === "me" ? "me" : "bot"), text: text });
      log.appendChild(node);
      log.scrollTop = log.scrollHeight;
      return node;
    }

    function offerRequest() {
      log.appendChild(el("button", { class: "cta", type: "button", text: requestLabel, onclick: function () { showForm(); } }));
      log.scrollTop = log.scrollHeight;
    }

    function ask(raw) {
      var text = String(raw || "").trim().slice(0, 600);
      if (!text || busy) return;
      busy = true; send.disabled = true; input.value = ""; chips.hidden = true;
      say("me", text);
      history.push({ role: "user", content: text });
      asked.push(text);
      var typing = el("div", { class: "typing", text: t.typing });
      log.appendChild(typing);
      post("/chat", { messages: history.slice(-12), language: lang }).then(function (res) {
        typing.remove();
        if (res && res.ok) {
          say("bot", res.answer);
          history.push({ role: "assistant", content: res.answer });
          visitorLang = res.language || visitorLang;
          if (res.handoff) offerRequest();
        } else {
          history.pop();
          say("bot", res && res.reason === "limited" ? t.limited : t.unavailable);
          offerRequest();
        }
      }).finally(function () { busy = false; send.disabled = false; input.focus(); });
    }

    function showForm() {
      var lastQuestion = asked.slice(-3).join("\n").slice(0, 1900);
      var name = el("input", { type: "text", name: "name", required: "", maxlength: "100", autocomplete: "name" });
      var email = el("input", { type: "email", name: "email", required: "", maxlength: "255", autocomplete: "email" });
      var message = el("textarea", { name: "message", required: "", maxlength: "1900", rows: "4" });
      message.value = lastQuestion;
      var company = kind === "lead" ? el("input", { type: "text", name: "company", maxlength: "150", autocomplete: "organization" }) : null;
      var subject = kind === "support" ? el("input", { type: "text", name: "subject", required: "", maxlength: "200" }) : null;
      if (subject) subject.value = (lastQuestion.split("\n")[0] || "").slice(0, 80);
      var today = new Date();
      var day = kind === "appointment" ? el("input", { type: "date", name: "day", required: "", min: new Date(today.getTime() - today.getTimezoneOffset() * 60000).toISOString().slice(0, 10) }) : null;
      var time = kind === "appointment" ? el("input", { type: "text", name: "time", maxlength: "40", placeholder: "10:00" }) : null;
      var consent = el("input", { type: "checkbox", required: "" });
      var honeypot = el("input", { type: "text", name: "website", tabindex: "-1", autocomplete: "off" });
      var error = el("p", { class: "err", role: "alert" });
      var submit = el("button", { class: "go", type: "submit", text: kind === "appointment" || kind === "support" ? requestLabel : t.submit });
      var consentText = el("span", { text: t.consent + " " });
      if (bot.privacyUrl) consentText.appendChild(el("a", { href: bot.privacyUrl, target: "_blank", rel: "noopener", text: t.privacy }));
      var form = el("form", { novalidate: "" }, [
        el("label", { text: t.name }, [name]),
        el("label", { text: t.email }, [email]),
        company && el("label", { text: t.company }, [company]),
        day && el("label", { text: t.day }, [day]),
        time && el("label", { text: t.time }, [time]),
        subject && el("label", { text: t.subject }, [subject]),
        el("label", { text: kind === "appointment" ? t.reason : t.message }, [message]),
        el("label", { class: "check" }, [consent, consentText]),
        el("label", { class: "hp", "aria-hidden": "true" }, [honeypot]),
        error, submit,
        el("button", { class: "link", type: "button", text: t.back, onclick: back })
      ]);
      form.addEventListener("submit", function (e) {
        e.preventDefault();
        error.textContent = "";
        if (message.value.trim().length < (day ? 2 : 10)) { error.textContent = t.tooShort; message.focus(); return; }
        if (!name.value.trim() || !email.checkValidity() || !email.value || !consent.checked || (subject && !subject.value.trim())) { error.textContent = t.failed; return; }
        if (day && (!day.value || !day.checkValidity())) { error.textContent = t.needDay; day.focus(); return; }
        submit.disabled = true;
        var fields = { name: name.value, email: email.value, message: message.value, consent: true, language: visitorLang, pagePath: location.pathname.slice(0, 200), website: honeypot.value };
        if (company) fields.company = company.value;
        if (subject) fields.subject = subject.value;
        if (day) fields.message = t.slot + ": " + day.value + (time.value.trim() ? ", " + time.value.trim() : "") + "\n" + message.value;
        post(kind === "support" ? "/ticket" : "/lead", fields)
          .then(function (res) {
            if (res && res.ok) { back(); say("bot", kind === "support" ? t.ticketSent + (res.number ? " " + t.ticketNumber + ": " + res.number : "") : kind === "appointment" ? t.slotSent : t.sent); }
            else { error.textContent = res && res.reason === "limited" ? t.limited : t.failed; submit.disabled = false; }
          });
      });
      chatView.hidden = true;
      panel.appendChild(form);
      name.focus();
      function back() { form.remove(); chatView.hidden = false; input.focus(); }
    }
  }
})();
