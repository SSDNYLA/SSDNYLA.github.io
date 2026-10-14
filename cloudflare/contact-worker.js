// Cloudflare Worker for the website contact form.
//
// The form on the site POSTs JSON ({ name, email, phone, message }) to /api/contact on the same domain.
// This Worker checks the fields and forwards the message to a Slack channel through an incoming webhook.
// Setup steps are in README.md under "Contact form".
//
// Required secret: SLACK_WEBHOOK_URL (the Slack incoming webhook URL). Never paste it into this file.

const ALLOWED_ORIGINS = new Set(["https://scoringandsounddesign.com", "https://www.scoringandsounddesign.com"]);

// Same limits the form enforces in the browser.
const LIMITS = { name: 120, email: 320, message: 5000 };
const EMAIL_PATTERN = /^[^\s@<>|]+@[^\s@<>|]+\.[^\s@<>|]+$/;
const PHONE_PATTERN = /^[0-9+().\-\s xX#]{7,40}$/;
const MAX_BODY_CHARS = 16000;

// Slack rejects a section block whose text is longer than 3,000 characters.
const SLACK_SECTION_LIMIT = 3000;

export default {
  async fetch(request, env) {
    if (request.method !== "POST") {
      return reply(405, { error: "Method not allowed." }, { Allow: "POST" });
    }
    if (!ALLOWED_ORIGINS.has(request.headers.get("Origin"))) {
      return reply(403, { error: "Forbidden." });
    }
    if (!env.SLACK_WEBHOOK_URL) {
      console.error("The SLACK_WEBHOOK_URL secret is not set.");
      return reply(500, { error: "The contact form is not configured." });
    }
    if (Number(request.headers.get("Content-Length")) > MAX_BODY_CHARS) {
      return reply(413, { error: "Message too large." });
    }

    const body = await request.text();
    if (body.length > MAX_BODY_CHARS) {
      return reply(413, { error: "Message too large." });
    }

    let data;
    try {
      data = JSON.parse(body);
    } catch {
      return reply(400, { error: "Invalid request." });
    }
    if (typeof data !== "object" || data === null) {
      return reply(400, { error: "Invalid request." });
    }

    const field = (key) => (typeof data[key] === "string" ? data[key].trim() : "");
    const inquiry = { name: field("name"), email: field("email"), phone: field("phone"), message: field("message") };

    const problem = validate(inquiry);
    if (problem) {
      return reply(400, { error: problem });
    }

    const slack = await fetch(env.SLACK_WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(slackMessage(inquiry)),
    });
    if (!slack.ok) {
      console.error(`Slack webhook failed: ${slack.status} ${await slack.text()}`);
      return reply(502, { error: "We couldn't send your message right now." });
    }
    return reply(200, { ok: true });
  },
};

function reply(status, body, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store", ...headers },
  });
}

function validate({ name, email, phone, message }) {
  if (!name || name.length > LIMITS.name) return "Please enter your name.";
  if (!email || email.length > LIMITS.email || !EMAIL_PATTERN.test(email)) return "Please enter a valid email address.";
  if (phone && !PHONE_PATTERN.test(phone)) return "Please enter a valid phone number.";
  if (message.length > LIMITS.message) return "Your message is too long.";
  return null;
}

function slackMessage({ name, email, phone, message }) {
  const blocks = [
    { type: "header", text: { type: "plain_text", text: "New website inquiry" } },
    {
      type: "section",
      fields: [
        { type: "mrkdwn", text: `*Name*\n${escape(name)}` },
        // Slack turns email addresses into mailto links on its own.
        { type: "mrkdwn", text: `*Email*\n${escape(email)}` },
        { type: "mrkdwn", text: `*Phone*\n${phone ? escape(phone) : "Not given"}` },
      ],
    },
  ];
  for (const part of split(`*Message*\n${message ? escape(message) : "_No message._"}`, SLACK_SECTION_LIMIT)) {
    blocks.push({ type: "section", text: { type: "mrkdwn", text: part } });
  }
  blocks.push({
    type: "context",
    elements: [{ type: "mrkdwn", text: "Sent from the contact form on scoringandsounddesign.com" }],
  });
  // `text` is what Slack shows in notifications.
  return { text: `New website inquiry from ${escape(name)}`, blocks };
}

// Slack treats <, > and & as control characters, so visitor text could otherwise post links or @channel pings.
function escape(text) {
  return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

// Splits text into pieces no longer than `size`, preferring line breaks and spaces and never cutting an escape.
function split(text, size) {
  const parts = [];
  while (text.length > size) {
    let cut = Math.max(text.lastIndexOf("\n", size), text.lastIndexOf(" ", size));
    if (cut < size / 2) {
      cut = size;
      const amp = text.lastIndexOf("&", cut - 1);
      if (amp > cut - "&amp;".length) cut = amp;
    }
    parts.push(text.slice(0, cut));
    text = text.slice(cut).replace(/^\s+/, "");
  }
  parts.push(text);
  return parts;
}
