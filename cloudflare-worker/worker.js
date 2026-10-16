const ROLE_COLORS = {
  Actor: 0x5865F2,
  Trusted: 0x57F287,
  Builder: 0xFEE75C,
  "Script Writer": 0xEB459E,
  Moderator: 0xED4245,
};

const FIELD_LIMITS = {
  "Minecraft Username": 100,
  Email: 200,
  Discord: 100,
  Age: 3,
  Timezone: 100,
  Availability: 300,
  "Writing Experience": 1800,
  Portfolio: 1000,
  "Why Script Writer": 1500,
  "Story Approach": 1500,
  "Writing Sample": 2500,
  Teamwork: 1200,
  Application: 3000,
  "Additional Information": 1500,
  "Past Staff Experience": 1800,
  "Moderation Experience": 1800,
  "Scenario Response": 1800,
  "Conflict Handling": 1500,
  "Why Moderator": 1500,
};

const INLINE_FIELDS = new Set(["Minecraft Username", "Discord", "Age", "Role"]);

function json(data, status, origin = "") {
  const headers = { "Content-Type": "application/json; charset=utf-8", "Cache-Control": "no-store" };
  if (origin) {
    headers["Access-Control-Allow-Origin"] = origin;
    headers["Access-Control-Allow-Methods"] = "POST, OPTIONS";
    headers["Access-Control-Allow-Headers"] = "Content-Type";
    headers["Vary"] = "Origin";
  }
  return new Response(status === 204 ? null : JSON.stringify(data), { status, headers });
}

function clean(value, max) {
  return String(value ?? "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F]/g, "")
    .trim()
    .slice(0, max);
}

export default {
  async fetch(request, env) {
    const origin = request.headers.get("Origin") || "";
    const allowedOrigins = String(env.ALLOWED_ORIGINS || "https://miragesmp.org,https://www.miragesmp.org")
      .split(",").map(x => x.trim()).filter(Boolean);

    if (!origin || !allowedOrigins.includes(origin)) {
      return json({ ok: false, error: "This website is not allowed to submit applications." }, 403);
    }
    if (request.method === "OPTIONS") return json({ ok: true }, 204, origin);
    if (request.method !== "POST") return json({ ok: false, error: "Use POST to submit an application." }, 405, origin);
    if (!env.MIRAGE_DISCORD_WEBHOOK) {
      return json({ ok: false, error: "Applications are temporarily unavailable. Please contact the Mirage team." }, 503, origin);
    }

    let input;
    try {
      const contentType = request.headers.get("Content-Type") || "";
      if (!contentType.toLowerCase().includes("application/json")) {
        return json({ ok: false, error: "Invalid submission format." }, 415, origin);
      }
      const raw = await request.text();
      if (raw.length > 20000) return json({ ok: false, error: "Your application is too large." }, 413, origin);
      input = JSON.parse(raw);
    } catch {
      return json({ ok: false, error: "We couldn't read your application. Please try again." }, 400, origin);
    }

    // Honeypot: silently accept obvious automated spam without forwarding it.
    if (clean(input._honeypot, 200)) return json({ ok: true }, 200, origin);

    const submittedRole = clean(input.Role, 80);
    const role = Object.keys(ROLE_COLORS).find(name => name.toLowerCase() === submittedRole.toLowerCase());
    if (!role) return json({ ok: false, error: "Please choose a valid application role." }, 400, origin);

    const fields = { Role: role };
    for (const [name, max] of Object.entries(FIELD_LIMITS)) {
      const value = clean(input[name], max);
      if (value) fields[name] = value;
    }
    if (!fields["Minecraft Username"] || !fields.Email || !fields.Discord || !fields.Age) {
      return json({ ok: false, error: "Please complete all required fields." }, 400, origin);
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.Email)) {
      return json({ ok: false, error: "Please enter a valid email address." }, 400, origin);
    }
    const age = Number(fields.Age);
    if (!Number.isInteger(age) || age < 13 || age > 99) {
      return json({ ok: false, error: "Please enter a valid age." }, 400, origin);
    }
    if (role === "Moderator") {
      const required = ["Timezone", "Availability", "Past Staff Experience", "Moderation Experience", "Scenario Response", "Conflict Handling", "Why Moderator"];
      if (required.some(name => !fields[name])) return json({ ok: false, error: "Please complete all required Moderator fields." }, 400, origin);
    } else if (role === "Script Writer") {
      const required = ["Timezone", "Availability", "Writing Experience", "Why Script Writer", "Story Approach", "Writing Sample", "Teamwork"];
      if (required.some(name => !fields[name])) return json({ ok: false, error: "Please complete all required Script Writer fields." }, 400, origin);
    } else if (!fields.Application) {
      return json({ ok: false, error: "Please complete the Application field." }, 400, origin);
    }

    const embedFields = Object.entries(fields).slice(0, 25).map(([name, value]) => ({
      name,
      value: value.length > 1024 ? value.slice(0, 1021) + "…" : value,
      inline: INLINE_FIELDS.has(name),
    }));
    const payload = {
      username: "Mirage Applications",
      embeds: [{
        title: `📨 New Application — ${role}`,
        description: "A new application has been submitted for review.",
        color: ROLE_COLORS[role],
        fields: embedFields,
        footer: { text: "Mirage Productions • Applications" },
        timestamp: new Date().toISOString(),
      }],
      allowed_mentions: { parse: [] },
    };

    let discordResponse;
    try {
      discordResponse = await fetch(env.MIRAGE_DISCORD_WEBHOOK, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
    } catch {
      return json({ ok: false, error: "Discord couldn't be reached. Please try again shortly." }, 502, origin);
    }
    if (!discordResponse.ok) {
      // Never log the webhook URL or applicant content.
      console.error(`Mirage application delivery failed with Discord HTTP ${discordResponse.status}`);
      return json({ ok: false, error: "We couldn't deliver your application. Please try again or contact applications@miragesmp.org." }, 502, origin);
    }
    return json({ ok: true }, 200, origin);
  },
};
