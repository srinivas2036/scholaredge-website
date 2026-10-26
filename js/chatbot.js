/**
 * Guided lead-capture chatbot.
 * Deterministic step flow (no LLM calls) that ends by emailing the lead via EmailJS.
 * Nothing is persisted to localStorage/sessionStorage/any database — the lead object
 * lives only in memory for the duration of the conversation.
 */
(function () {
  const cfg = window.SITE_CONFIG || {};

  // ---- EmailJS bootstrap -------------------------------------------------
  let emailjsReady = false;
  function ensureEmailJs() {
    if (emailjsReady) return;
    if (window.emailjs && cfg.EMAILJS_PUBLIC_KEY && cfg.EMAILJS_PUBLIC_KEY.indexOf("YOUR_") !== 0) {
      window.emailjs.init({ publicKey: cfg.EMAILJS_PUBLIC_KEY });
      emailjsReady = true;
    }
  }

  // Shared send helper used by both the chatbot and the static contact form.
  window.sendLeadEmail = async function sendLeadEmail(fields) {
    ensureEmailJs();
    if (!emailjsReady) {
      throw new Error("EmailJS is not configured yet — fill in js/config.js");
    }
    const params = {
      to_email: cfg.OWNER_EMAIL,
      ...fields,
    };
    await window.emailjs.send(cfg.EMAILJS_SERVICE_ID, cfg.EMAILJS_LEAD_TEMPLATE_ID, params);

    const autoReplyId = cfg.EMAILJS_AUTOREPLY_TEMPLATE_ID;
    if (autoReplyId && autoReplyId.indexOf("YOUR_") !== 0 && fields.visitor_email) {
      try {
        await window.emailjs.send(cfg.EMAILJS_SERVICE_ID, autoReplyId, params);
      } catch (err) {
        console.warn("Auto-reply failed (lead email still sent):", err);
      }
    }
  };

  // ---- Conversation flow --------------------------------------------------
  const DOMAIN_OPTIONS = [
    "Civil Engineering",
    "Mechanical Engineering",
    "Electrical & Electronics",
    "Computer Science & AI",
    "Environmental Engineering",
    "Biomedical Engineering",
    "Chemical Engineering",
    "Other",
  ];

  const STAGE_OPTIONS = [
    "Starting from scratch",
    "I have a draft",
    "Need review & publishing support",
    "Other",
  ];

  const SERVICE_OPTIONS = [
    "Manuscript development",
    "Thesis development",
    "Research consultancy",
    "Just exploring",
  ];

  const lead = {
    service_interest: "",
    engineering_domain: "",
    project_stage: "",
    project_details: "",
    visitor_name: "",
    visitor_email: "",
    visitor_phone: "",
  };

  let step = "welcome";

  // ---- DOM scaffolding -----------------------------------------------------
  let launcher, win, body, inputRow, inputField, sendBtn, errorBox;

  function buildWidget() {
    launcher = document.createElement("button");
    launcher.id = "chat-launcher";
    launcher.setAttribute("aria-label", "Open chat");
    launcher.innerHTML = "💬";

    win = document.createElement("div");
    win.id = "chat-window";
    win.hidden = true;
    win.innerHTML = `
      <div class="chat-header">
        <div>
          <div class="title">ScholarEdge Assistant</div>
          <div class="subtitle">Tell us about your project — usually replies within 1 business day</div>
        </div>
        <button type="button" id="chat-close" aria-label="Close chat">✕</button>
      </div>
      <div class="chat-body" id="chat-body"></div>
      <div class="chat-error" id="chat-error" hidden></div>
      <div class="chat-input-row" id="chat-input-row" hidden>
        <input type="text" id="chat-input-field" placeholder="Type your answer..." autocomplete="off" />
        <button type="button" id="chat-send" aria-label="Send">➤</button>
      </div>
    `;

    document.body.appendChild(launcher);
    document.body.appendChild(win);

    body = win.querySelector("#chat-body");
    inputRow = win.querySelector("#chat-input-row");
    inputField = win.querySelector("#chat-input-field");
    sendBtn = win.querySelector("#chat-send");
    errorBox = win.querySelector("#chat-error");

    launcher.addEventListener("click", openChat);
    win.querySelector("#chat-close").addEventListener("click", closeChat);
    sendBtn.addEventListener("click", submitTextInput);
    inputField.addEventListener("keydown", (e) => {
      if (e.key === "Enter") submitTextInput();
    });
  }

  let opened = false;
  function openChat() {
    win.hidden = false;
    launcher.style.display = "none";
    if (!opened) {
      opened = true;
      runStep("welcome");
    }
  }
  function closeChat() {
    win.hidden = true;
    launcher.style.display = "flex";
  }

  function addBotMessage(text) {
    const el = document.createElement("div");
    el.className = "msg bot";
    el.textContent = text;
    body.appendChild(el);
    body.scrollTop = body.scrollHeight;
  }

  function addUserMessage(text) {
    const el = document.createElement("div");
    el.className = "msg user";
    el.textContent = text;
    body.appendChild(el);
    body.scrollTop = body.scrollHeight;
  }

  function showOptions(options, onPick) {
    const wrap = document.createElement("div");
    wrap.className = "chat-options";
    options.forEach((opt) => {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "chat-option-btn";
      btn.textContent = opt;
      btn.addEventListener("click", () => {
        wrap.remove();
        addUserMessage(opt);
        onPick(opt);
      });
      wrap.appendChild(btn);
    });
    body.appendChild(wrap);
    body.scrollTop = body.scrollHeight;
  }

  let pendingTextHandler = null;
  function showTextInput(placeholder, onSubmit) {
    inputRow.hidden = false;
    inputField.placeholder = placeholder || "Type your answer...";
    inputField.value = "";
    pendingTextHandler = onSubmit;
    inputField.focus();
  }

  function hideTextInput() {
    inputRow.hidden = true;
    pendingTextHandler = null;
  }

  function submitTextInput() {
    const val = inputField.value.trim();
    if (!val || !pendingTextHandler) return;
    addUserMessage(val);
    inputField.value = "";
    const handler = pendingTextHandler;
    hideTextInput();
    handler(val);
  }

  function setError(msg) {
    errorBox.hidden = !msg;
    errorBox.textContent = msg || "";
  }

  // ---- Step machine ---------------------------------------------------------
  function runStep(name) {
    step = name;
    setError("");

    switch (name) {
      case "welcome":
        addBotMessage("Hi! I'm the ScholarEdge assistant. What are you looking for help with?");
        showOptions(SERVICE_OPTIONS, (choice) => {
          lead.service_interest = choice;
          runStep("domain");
        });
        break;

      case "domain":
        addBotMessage("Which engineering domain is your work in?");
        showOptions(DOMAIN_OPTIONS, (choice) => {
          if (choice === "Other") {
            showTextInput("e.g. Aerospace, Materials Science...", (text) => {
              lead.engineering_domain = text;
              runStep("stage");
            });
          } else {
            lead.engineering_domain = choice;
            runStep("stage");
          }
        });
        break;

      case "stage":
        addBotMessage("Where are you in the process right now?");
        showOptions(STAGE_OPTIONS, (choice) => {
          lead.project_stage = choice;
          runStep("details");
        });
        break;

      case "details":
        addBotMessage("In a sentence or two, what do you need help with? (journal target, deadline, chapter count, etc.)");
        showTextInput("Describe your project...", (text) => {
          lead.project_details = text;
          runStep("name");
        });
        break;

      case "name":
        addBotMessage("Great — what's your name?");
        showTextInput("Your full name", (text) => {
          lead.visitor_name = text;
          runStep("email");
        });
        break;

      case "email":
        addBotMessage("And the best email to reach you at?");
        showTextInput("you@example.com", (text) => {
          const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(text);
          if (!emailOk) {
            addBotMessage("That doesn't look like a valid email — could you re-enter it?");
            runStep("email");
            return;
          }
          lead.visitor_email = text;
          runStep("phone");
        });
        break;

      case "phone":
        addBotMessage("Optional: a phone number if you'd like a call back? (Type \"skip\" to continue.)");
        showTextInput('Phone number or "skip"', (text) => {
          lead.visitor_phone = text.toLowerCase() === "skip" ? "" : text;
          runStep("confirm");
        });
        break;

      case "confirm":
        addBotMessage(
          `Here's what I'll send over:\n` +
            `• Interest: ${lead.service_interest}\n` +
            `• Domain: ${lead.engineering_domain}\n` +
            `• Stage: ${lead.project_stage}\n` +
            `• Details: ${lead.project_details}\n` +
            `• Name: ${lead.visitor_name}\n` +
            `• Email: ${lead.visitor_email}` +
            (lead.visitor_phone ? `\n• Phone: ${lead.visitor_phone}` : "")
        );
        showOptions(["Send it", "Start over"], (choice) => {
          if (choice === "Start over") {
            Object.keys(lead).forEach((k) => (lead[k] = ""));
            body.innerHTML = "";
            runStep("welcome");
          } else {
            runStep("sending");
          }
        });
        break;

      case "sending":
        addBotMessage("Sending your message now...");
        window
          .sendLeadEmail(lead)
          .then(() => {
            addBotMessage(
              "Done! Your message is on its way to our team — we typically reply within 1 business day. Thank you!"
            );
          })
          .catch((err) => {
            console.error(err);
            setError(
              `Could not send automatically (${err.message || "unknown error"}). Please email ${cfg.OWNER_EMAIL} directly, or try again.`
            );
            addBotMessage(`You can also reach us directly at ${cfg.OWNER_EMAIL}.`);
            showOptions(["Try again"], () => runStep("sending"));
          });
        break;
    }
  }

  document.addEventListener("DOMContentLoaded", buildWidget);
})();
