// Oprynex contact or support form for client websites. Embedded with
//   <div data-oprynex-form="FORM-ID"></div>
//   <script src="https://bot.oprynex.workers.dev/form.js" async></script>
// Renders into every element with data-oprynex-form, inside a closed Shadow DOM so the page's styles and the form never
// touch each other; it takes over the page's font and text colour. A request form creates a request in the client's CRM,
// a support form a ticket (with a subject field). Nothing is stored in the browser, and every text
// is set with textContent, never as HTML. A form that is unknown, switched off or not allowed on this site shows nothing.
(function () {
  "use strict";
  var script = document.currentScript || document.querySelector("script[src*='/form.js']");
  if (!script) return;
  var base = new URL(script.src).origin + "/v1/forms/";

  var T = {
    de: { name: "Name", email: "E-Mail", company: "Firma (optional)", message: "Ihr Anliegen", submit: "Anfrage senden", sending: "Wird gesendet…",
      consent: function (owner) { return "Ich bin einverstanden, dass " + owner + " meine Angaben zur Bearbeitung meiner Anfrage verarbeitet."; }, privacy: "Datenschutz",
      sent: function (owner) { return "Danke. Ihre Anfrage ist bei " + owner + " angekommen."; }, number: "Anfragenummer", again: "Weitere Anfrage senden",
      required: "Bitte füllen Sie Name, E-Mail und Ihr Anliegen aus und bestätigen Sie die Einwilligung.", badEmail: "Bitte prüfen Sie die E-Mail-Adresse.",
      tooShort: "Bitte beschreiben Sie Ihr Anliegen in mindestens 10 Zeichen.", limited: "Gerade kommen zu viele Anfragen. Bitte versuchen Sie es später erneut.",
      failed: "Senden fehlgeschlagen. Bitte versuchen Sie es erneut.",
      subject: "Betreff", question: "Ihre Frage oder Ihr Problem", submitTicket: "Support-Anfrage senden",
      ticketSent: function (owner) { return "Danke. Ihre Support-Anfrage ist bei " + owner + " angekommen, das Team meldet sich per E-Mail."; }, ticketNumber: "Ticketnummer",
      requiredTicket: "Bitte füllen Sie Name, E-Mail, Betreff und Ihre Frage aus und bestätigen Sie die Einwilligung." },
    en: { name: "Name", email: "Email", company: "Company (optional)", message: "Your request", submit: "Send request", sending: "Sending…",
      consent: function (owner) { return "I agree that " + owner + " processes my details to handle my request."; }, privacy: "Privacy policy",
      sent: function (owner) { return "Thank you. Your request has reached " + owner + "."; }, number: "Request number", again: "Send another request",
      required: "Please fill in name, email and your request and confirm the consent.", badEmail: "Please check the email address.",
      tooShort: "Please describe your request in at least 10 characters.", limited: "Too many requests right now. Please try again later.",
      failed: "Sending failed. Please try again.",
      subject: "Subject", question: "Your question or problem", submitTicket: "Send support request",
      ticketSent: function (owner) { return "Thank you. Your support request has reached " + owner + "; the team will reply by email."; }, ticketNumber: "Ticket number",
      requiredTicket: "Please fill in name, email, subject and your question and confirm the consent." },
    ru: { name: "Имя", email: "Почта", company: "Компания (необязательно)", message: "Ваш запрос", submit: "Отправить заявку", sending: "Отправляем…",
      consent: function (owner) { return "Я согласен(на), что " + owner + " обработает мои данные, чтобы ответить на заявку."; }, privacy: "Конфиденциальность",
      sent: function (owner) { return "Спасибо. Заявка получена: " + owner + "."; }, number: "Номер заявки", again: "Отправить ещё одну заявку",
      required: "Заполните имя, почту и запрос и подтвердите согласие.", badEmail: "Проверьте адрес почты.",
      tooShort: "Опишите запрос хотя бы в 10 символах.", limited: "Сейчас слишком много заявок. Попробуйте позже.",
      failed: "Не удалось отправить. Попробуйте ещё раз.",
      subject: "Тема", question: "Ваш вопрос или проблема", submitTicket: "Отправить в поддержку",
      ticketSent: function (owner) { return "Спасибо. Обращение получено: " + owner + ". Команда ответит по почте."; }, ticketNumber: "Номер обращения",
      requiredTicket: "Заполните имя, почту, тему и вопрос и подтвердите согласие." }
  };

  function el(tag, attrs, children) {
    var node = document.createElement(tag);
    for (var key in attrs || {}) {
      if (key === "text") node.textContent = attrs[key];
      else node.setAttribute(key, attrs[key]);
    }
    (children || []).forEach(function (child) { if (child) node.appendChild(child); });
    return node;
  }

  function onAccent(hex) {
    var n = parseInt(hex.slice(1), 16), r = n >> 16, g = (n >> 8) & 255, b = n & 255;
    return (0.299 * r + 0.587 * g + 0.114 * b) > 160 ? "#111111" : "#ffffff";
  }

  var seen = 0;
  function scan() {
    var nodes = document.querySelectorAll("[data-oprynex-form]");
    for (var i = 0; i < nodes.length; i++) {
      var box = nodes[i];
      if (box.__oprynexForm) continue;
      box.__oprynexForm = true;
      var id = box.getAttribute("data-oprynex-form") || "";
      if (/^[0-9a-f-]{36}$/.test(id) && seen++ < 5) load(box, id);
    }
  }

  function load(box, id) {
    fetch(base + id).then(function (r) { return r.ok ? r.json() : null; }).then(function (data) {
      if (data && data.ok) mount(box, id, data.form);
    }).catch(function () { /* nothing to show */ });
  }

  function mount(box, id, form) {
    var t = T[form.language] || T.de;
    var accent = /^#[0-9a-f]{6}$/i.test(form.color) ? form.color : "#111111";
    var support = form.purpose === "support";
    var submitText = support ? t.submitTicket : t.submit;
    var root = box.attachShadow({ mode: "closed" });
    root.appendChild(el("style", { text: [
      ":host{display:block;font:inherit;color:inherit}",
      "[hidden]{display:none!important}",
      "*{box-sizing:border-box;font:inherit}",
      "form{display:flex;flex-direction:column;gap:16px;max-width:560px}",
      "label{display:flex;flex-direction:column;gap:4px;font-size:14px;line-height:20px;font-weight:600}",
      "input[type=text],input[type=email],textarea{border:1px solid rgba(127,127,127,.5);border-radius:8px;padding:8px 12px;font-size:16px;line-height:24px;font-weight:400;color:inherit;background:transparent;width:100%}",
      "textarea{resize:vertical;min-height:120px}",
      ".check{flex-direction:row;align-items:flex-start;gap:8px;font-weight:400}",
      ".check input{margin-top:3px;accent-color:" + accent + "}",
      ".check a{color:inherit}",
      "button{align-self:flex-start;border:0;border-radius:8px;padding:8px 12px;font-size:16px;line-height:24px;font-weight:600;cursor:pointer;background:" + accent + ";color:" + onAccent(accent) + ";transition:transform .3s cubic-bezier(.22,1,.36,1)}",
      "button:hover{transform:translateY(-1px)}button:active{transform:scale(.98)}button:disabled{opacity:.6;cursor:default;transform:none}",
      "input:focus-visible,textarea:focus-visible,button:focus-visible,a:focus-visible{outline:2px solid " + accent + ";outline-offset:2px}",
      ".hp{position:absolute;left:-10000px;width:1px;height:1px;overflow:hidden}",
      ".err{color:#b00020;font-size:14px;line-height:20px;margin:0}.err:empty{display:none}",
      ".done{display:flex;flex-direction:column;gap:12px;max-width:560px}.done p{margin:0}",
      ".link{background:none;color:inherit;text-decoration:underline;padding:0;font-weight:400}",
      "@media (prefers-reduced-motion:reduce){button{transition:none}}"
    ].join("") }));

    var name = el("input", { type: "text", name: "name", required: "", maxlength: "100", autocomplete: "name" });
    var email = el("input", { type: "email", name: "email", required: "", maxlength: "255", autocomplete: "email" });
    var company = !support && form.askCompany ? el("input", { type: "text", name: "company", maxlength: "150", autocomplete: "organization" }) : null;
    var subject = support ? el("input", { type: "text", name: "subject", required: "", maxlength: "200" }) : null;
    var message = el("textarea", { name: "message", required: "", maxlength: "2000", rows: "5" });
    var consent = el("input", { type: "checkbox", required: "" });
    var honeypot = el("input", { type: "text", name: "website", tabindex: "-1", autocomplete: "off" });
    var error = el("p", { class: "err", role: "alert" });
    var submit = el("button", { type: "submit", text: submitText });
    var consentText = el("span", { text: t.consent(form.owner) + " " });
    if (form.privacyUrl) consentText.appendChild(el("a", { href: form.privacyUrl, target: "_blank", rel: "noopener", text: t.privacy }));
    var formNode = el("form", { novalidate: "", lang: form.language }, [
      el("label", { text: t.name }, [name]),
      el("label", { text: t.email }, [email]),
      company && el("label", { text: t.company }, [company]),
      subject && el("label", { text: t.subject }, [subject]),
      el("label", { text: support ? t.question : t.message }, [message]),
      el("label", { class: "check" }, [consent, consentText]),
      el("label", { class: "hp", "aria-hidden": "true" }, [honeypot]),
      error, submit
    ]);
    var thanks = el("p", { role: "status" });
    var numberLine = el("p");
    var again = el("button", { type: "button", class: "link", text: t.again });
    var done = el("div", { class: "done", lang: form.language }, [thanks, numberLine, again]);
    done.hidden = true;
    root.appendChild(formNode);
    root.appendChild(done);

    again.addEventListener("click", function () { done.hidden = true; formNode.hidden = false; message.value = ""; name.focus(); });
    formNode.addEventListener("submit", function (e) {
      e.preventDefault();
      error.textContent = "";
      if (!name.value.trim() || !email.value.trim() || !message.value.trim() || (subject && !subject.value.trim()) || !consent.checked) { error.textContent = support ? t.requiredTicket : t.required; return; }
      if (!email.checkValidity()) { error.textContent = t.badEmail; email.focus(); return; }
      if (message.value.trim().length < 10) { error.textContent = t.tooShort; message.focus(); return; }
      submit.disabled = true; submit.textContent = t.sending;
      var fields = { name: name.value, email: email.value, message: message.value, consent: true, language: form.language, pagePath: location.pathname.slice(0, 200), website: honeypot.value };
      if (support) fields.subject = subject.value; else fields.company = company ? company.value : "";
      fetch(base + id + (support ? "/ticket" : "/lead"), { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(fields) }).then(function (r) { return r.json(); }).catch(function () { return { ok: false }; }).then(function (res) {
        submit.disabled = false; submit.textContent = submitText;
        if (res && res.ok) {
          thanks.textContent = support ? t.ticketSent(form.owner) : t.sent(form.owner);
          numberLine.textContent = res.number ? (support ? t.ticketNumber : t.number) + ": " + res.number : "";
          numberLine.hidden = !res.number;
          formNode.hidden = true; done.hidden = false;
          name.value = ""; email.value = ""; if (company) company.value = ""; if (subject) subject.value = ""; consent.checked = false;
        } else {
          error.textContent = res && res.reason === "limited" ? t.limited : t.failed;
        }
      });
    });
  }

  scan();
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", scan);
})();
