/**
 * EmailJS configuration.
 * Create a free account at https://www.emailjs.com, then fill in the IDs below.
 * The public key is safe to expose client-side — EmailJS is designed for this.
 *
 * Steps:
 *  1. Add an Email Service (e.g. Gmail) connected to OWNER_EMAIL below.
 *  2. Create a "Lead notification" template (sent to you) using the variables
 *     referenced in js/chatbot.js: {{visitor_name}}, {{visitor_email}}, {{visitor_phone}},
 *     {{service_interest}}, {{engineering_domain}}, {{project_stage}}, {{project_details}}.
 *  3. (Optional) Create an "Auto-reply" template (sent to the visitor) confirming receipt.
 *  4. Copy the Public Key, Service ID, and both Template IDs here.
 */
window.SITE_CONFIG = {
  OWNER_EMAIL: "srinivas2036@gmail.com",

  EMAILJS_PUBLIC_KEY: "YOUR_EMAILJS_PUBLIC_KEY",
  EMAILJS_SERVICE_ID: "YOUR_EMAILJS_SERVICE_ID",
  EMAILJS_LEAD_TEMPLATE_ID: "YOUR_LEAD_NOTIFICATION_TEMPLATE_ID",
  EMAILJS_AUTOREPLY_TEMPLATE_ID: "YOUR_AUTOREPLY_TEMPLATE_ID", // leave as-is to skip auto-reply
};
