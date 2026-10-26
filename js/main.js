// Mobile nav toggle + FAQ/contact form wiring shared across pages.
document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.querySelector(".nav-toggle");
  const links = document.querySelector(".nav-links");
  if (toggle && links) {
    toggle.addEventListener("click", () => {
      links.classList.toggle("open");
    });
  }

  // Highlight current page in nav
  const current = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-links a").forEach((a) => {
    if (a.getAttribute("href") === current) a.classList.add("active");
  });

  // Contact page form -> EmailJS (reuses the same lead template as the chatbot)
  const contactForm = document.querySelector("#contact-form");
  if (contactForm) {
    contactForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const statusEl = document.querySelector("#contact-status");
      const data = Object.fromEntries(new FormData(contactForm).entries());
      statusEl.textContent = "Sending...";
      statusEl.className = "form-status";
      try {
        await window.sendLeadEmail({
          visitor_name: data.name || "",
          visitor_email: data.email || "",
          visitor_phone: data.phone || "",
          service_interest: data.service || "Not specified",
          engineering_domain: data.domain || "Not specified",
          project_stage: "Submitted via contact form",
          project_details: data.message || "",
        });
        statusEl.textContent = "Thanks! Your message has been sent — we'll reply within 1 business day.";
        statusEl.className = "form-status ok";
        contactForm.reset();
      } catch (err) {
        console.error(err);
        statusEl.textContent = "Something went wrong sending your message. Please email us directly instead.";
        statusEl.className = "form-status err";
      }
    });
  }
});
