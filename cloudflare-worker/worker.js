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

const DEFAULT_COLOR = 0x5865F2;
const MAX_TOTAL_CHARS = 12000;   // whole application; it is split over several Discord messages if needed
const MAX_FIELDS = 40;
const CHUNK_CHARS = 5000;        // Discord allows ~6000 characters per message

// The application form is defined in the website's content.json (edited in Mirage Access).
// Reading it here lets new roles and questions work without redeploying this worker.
async function loadDefinition(env) {
  const url = env.CONTENT_URL || "https://miragesmp.org/content.json";
  try {
    const res = await fetch(url, { cf: { cacheTtl: 60, cacheEverything: true } });
    if (!res.ok) return null;
    const forms = (await res.json())?.forms;
    if (forms && Array.isArray(forms.roles) && forms.roles.some(r => Array.isArray(r.questions) && r.questions.length)) return forms;
  } catch { /* fall back to the built-in rules */ }
  return null;
}

const roleClosed = r => r.open === false || (r.closesOn && new Date(r.closesOn + "T23:59:59Z") < new Date());
const parseColor = hex => /^#[0-9a-f]{6}$/i.test(hex || "") ? parseInt(hex.slice(1), 16) : DEFAULT_COLOR;

function validateDynamic(def, input) {
  const bad = (error, status = 400) => ({ error, status });
  const submitted = clean(input.Role, 80).toLowerCase();
  const cfg = def.roles.find(r => String(r.name || "").toLowerCase() === submitted);
  if (!cfg || !Array.isArray(cfg.questions)) return bad("Please choose a valid application role.");
  if (roleClosed(cfg)) return bad("Applications for this role are closed.", 403);

  const fields = { Role: cfg.name };
  const core = (def.core && Array.isArray(def.core.fields) && def.core.fields.length) ? def.core.fields.map(f => f.key)
    : ["Minecraft Username", "Email", "Discord", "Age"];
  for (const key of core) {
    const value = clean(input[key], key === "Email" ? 200 : key === "Age" ? 3 : 100);
    if (!value) return bad("Please complete all required fields.");
    fields[key] = value;
  }
  if (fields.Email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.Email)) return bad("Please enter a valid email address.");
  if (fields.Age !== undefined) {
    const age = Number(fields.Age), min = Number(def.minAge) || 13;
    if (!Number.isInteger(age) || age < min || age > 99) return bad(`You must be at least ${min} to apply.`);
  }

  for (const q of cfg.questions) {
    const label = clean(q.label, 250);
    if (!label || label in fields) continue;
    const type = q.type || "text";
    const options = Array.isArray(q.options) ? q.options.map(String) : [];
    const max = Math.min(Number(q.maxLength) || (type === "textarea" ? 1000 : 200), 1000);
    let value = clean(input[q.label], max);
    if (!value) {
      if (q.required) return bad(`Please answer: ${label}`);
      continue;
    }
    if (type === "select" || type === "radio") {
      if (!options.includes(value)) return bad(`Please choose a valid option for: ${label}`);
    } else if (type === "yesno") {
      if (!["Yes", "No"].includes(value)) return bad(`Please choose Yes or No for: ${label}`);
    } else if (type === "checkbox") {
      const picked = options.filter(o => value.split(", ").includes(o));
      if (!picked.length) return bad(`Please choose a valid option for: ${label}`);
      value = picked.join(", ");
    } else if (type === "number") {
      if (!Number.isFinite(Number(value))) return bad(`Please enter a number for: ${label}`);
    } else if (type === "email") {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return bad(`Please enter a valid email for: ${label}`);
    } else if (type === "url") {
      if (!/^https?:\/\/\S+$/i.test(value)) return bad(`Please enter a valid link (starting with https://) for: ${label}`);
    }
    fields[label] = value;
  }
  const total = Object.entries(fields).reduce((n, [k, v]) => n + k.length + v.length, 0);
  if (Object.keys(fields).length > MAX_FIELDS) return bad("This application has too many questions.");
  if (total > MAX_TOTAL_CHARS) return bad("Your application is too long. Please shorten your answers and try again.", 413);
  return { role: cfg.name, color: parseColor(cfg.color), fields };
}

function validateLegacy(input) {
  const bad = (error, status = 400) => ({ error, status });
  const submittedRole = clean(input.Role, 80);
  const role = Object.keys(ROLE_COLORS).find(name => name.toLowerCase() === submittedRole.toLowerCase());
  if (!role) return bad("Please choose a valid application role.");
  const fields = { Role: role };
  for (const [name, max] of Object.entries(FIELD_LIMITS)) {
    const value = clean(input[name], max);
    if (value) fields[name] = value;
  }
  if (!fields["Minecraft Username"] || !fields.Email || !fields.Discord || !fields.Age) return bad("Please complete all required fields.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(fields.Email)) return bad("Please enter a valid email address.");
  const age = Number(fields.Age);
  if (!Number.isInteger(age) || age < 13 || age > 99) return bad("Please enter a valid age.");
  if (role === "Moderator") {
    const required = ["Timezone", "Availability", "Past Staff Experience", "Moderation Experience", "Scenario Response", "Conflict Handling", "Why Moderator"];
    if (required.some(name => !fields[name])) return bad("Please complete all required Moderator fields.");
  } else if (role === "Script Writer") {
    const required = ["Timezone", "Availability", "Writing Experience", "Why Script Writer", "Story Approach", "Writing Sample", "Teamwork"];
    if (required.some(name => !fields[name])) return bad("Please complete all required Script Writer fields.");
  } else if (!fields.Application) {
    return bad("Please complete the Application field.");
  }
  return { role, color: ROLE_COLORS[role], fields };
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

    const def = await loadDefinition(env);
    const result = def ? validateDynamic(def, input) : validateLegacy(input);
    if (result.error) return json({ ok: false, error: result.error }, result.status || 400, origin);
    const { role, color, fields } = result;

    const toField = ([name, value]) => ({
      name: name.slice(0, 256),
      value: value.length > 1024 ? value.slice(0, 1021) + "…" : value,
      inline: INLINE_FIELDS.has(name),
    });
    // Split into as many messages as needed so long applications are never cut off.
    const chunks = [];
    let current = [], size = 0;
    for (const entry of Object.entries(fields).map(toField).map(f => [f, f.name.length + f.value.length])) {
      if (current.length && (current.length >= 25 || size + entry[1] > CHUNK_CHARS)) { chunks.push(current); current = []; size = 0; }
      current.push(entry[0]); size += entry[1];
    }
    if (current.length) chunks.push(current);

    for (let i = 0; i < chunks.length; i++) {
      const payload = {
        username: "Mirage Applications",
        embeds: [{
          title: i === 0 ? `📨 New Application — ${role}` : `📨 Application continued (${i + 1}/${chunks.length}) — ${role}`,
          description: i === 0 ? "A new application has been submitted for review." : `Continued from the application by ${fields["Minecraft Username"] || "the applicant"}.`,
          color,
          fields: chunks[i],
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
    }
    return json({ ok: true }, 200, origin);
  },
};
