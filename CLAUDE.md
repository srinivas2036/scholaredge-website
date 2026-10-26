# ScholarEdge — Project Guide

Static website for an academic/research consultancy offering **manuscript development**,
**thesis development**, and **research consultancy** across engineering domains, with an
embedded lead-capture chatbot that emails leads directly to the owner — no backend, no database.

## Goals

- Present services, engineering domains covered, and credibility (process, deliverables, FAQ).
- Capture leads through a lightweight guided chatbot widget (bottom-right, all pages).
- Deliver every captured lead straight to an email inbox in real time.
- Zero infrastructure to run or pay for: static files only, deployable on Netlify/Vercel/GitHub Pages.

## Architecture decision

**Fully static site + EmailJS.** No server, no database, no stored lead data anywhere except
the recipient's inbox.

- The chatbot (`js/chatbot.js`) runs entirely in the browser and walks the visitor through a
  short guided flow (not free-form AI chat — deterministic steps, so no LLM API key or cost).
- On completion it calls the EmailJS JS SDK (loaded from CDN) to send the captured lead
  directly from the browser to the owner's inbox, using a EmailJS service/template.
- An optional second EmailJS template auto-replies to the visitor confirming receipt.
- Because sending happens client-side, the EmailJS **public key** is not a secret (EmailJS is
  designed for this); it's committed in `js/config.js`. Nothing sensitive lives in the repo.

### Why not a backend

A Node/Express + Nodemailer backend was considered but rejected for this project: it would
require a server host, environment secrets for SMTP credentials, and ongoing maintenance for
what is fundamentally a brochure site with a contact-capture widget. EmailJS removes all of
that while still emailing leads instantly — the explicit no-database requirement is satisfied
either way, but this path also needs no server at all.

## Site structure

```
/
├── index.html          Home — hero, services overview, domains, trust signals, CTA
├── services.html        Manuscript / thesis / research consultancy service details
├── domains.html         Engineering domains covered
├── about.html           Process, credentials, why-us
├── contact.html         Contact form (mailto-free, also EmailJS) + chatbot entry point
├── css/
│   └── styles.css       Shared styling, responsive, light/dark-friendly
├── js/
│   ├── config.js        EmailJS public key / service id / template ids (edit these)
│   ├── main.js           Nav toggle, small UI behaviors
│   └── chatbot.js        Guided lead-capture chatbot widget + EmailJS send
└── CLAUDE.md
```

## Chatbot flow (guided, not open-ended AI)

A fixed decision tree keeps it reliable and cheap (no LLM calls):

1. Greeting + quick choice: *Manuscript development / Thesis development / Research
   consultancy / Just exploring*.
2. Engineering domain: Civil, Mechanical, Electrical & Electronics, Computer Science & AI,
   Environmental, Biomedical, Chemical, Other (free text).
3. Stage of work: *Starting from scratch / Have a draft / Need review & publishing support /
   Other*.
4. Short free-text description of their need (optional, textarea-style single input).
5. Contact details: name, email (required), phone (optional).
6. Confirmation screen → sends the lead via EmailJS → shows a success message with expected
   response time.

All answers are compiled into one structured lead object and sent as the EmailJS template
variables — nothing is persisted in localStorage/sessionStorage beyond the current page visit
(so no analytics/database of any kind).

## Setup required before going live

1. Create a free account at EmailJS (https://www.emailjs.com).
2. Add an Email Service (e.g., Gmail) connected to the inbox that should receive leads
   (xyz@gmail.com by default).
3. Create two templates:
   - **Lead notification** — sent to the owner, includes all captured fields.
   - **Auto-reply** (optional) — sent to the visitor's email confirming receipt.
4. Copy the Public Key, Service ID, and both Template IDs into `js/config.js`.
5. Deploy the `/` folder as-is to Netlify, Vercel, or GitHub Pages (static hosting, no build
   step needed).

## Content to customize

- `js/config.js` — EmailJS keys (placeholders present, must be filled in).
- Owner contact email/phone in `contact.html` and chatbot auto-reply template.
- Real credentials, past work examples, and testimonials in `about.html` (placeholders are
  marked `TODO` in the HTML comments).

## Non-goals

- No user accounts, no database, no CMS, no payment processing.
- No open-ended LLM chatbot — the guided flow is deliberately deterministic for reliability
  and zero per-conversation cost.
