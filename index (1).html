/* ==========================================================================
   THE CONTAINER — Lead capture endpoint
   Cloudflare Pages Function · POST /api/lead
   --------------------------------------------------------------------------
   Receives contact / newsletter / merch form submissions from the site and
   files them in Odoo CRM as a Contact (res.partner) + a Lead (crm.lead),
   tagged by source. No npm dependencies — plain fetch to Odoo's JSON-RPC API.

   ── SETUP ────────────────────────────────────────────────────────────────
   1. Set four environment variables in the Cloudflare dashboard:
        Workers & Pages → (your project) → Settings → Environment variables
      (add them to BOTH "Production" and "Preview" if you want previews to work)

        ODOO_URL      Your Odoo base URL, e.g. https://your-company.odoo.com
                      (no trailing slash needed; the code strips it)
        ODOO_DB       The Odoo database name. On odoo.com this is usually the
                      subdomain, e.g. "your-company". (If unsure, visit
                      /web/database/selector on your Odoo to see the exact name.)
        ODOO_LOGIN    The login email of the Odoo user leads are filed under.
        ODOO_API_KEY  An Odoo API key for that user (NOT the raw password).

   2. Create the Odoo API key:
        Log in to Odoo → click your avatar (top-right) → My Profile
        → Account Security tab → New API Key → name it "website" → copy the
        value immediately (Odoo shows it only once) → paste into ODOO_API_KEY.
        The key inherits that user's permissions, so make sure the user may
        create res.partner, crm.tag and crm.lead records (Sales / CRM access).

   3. Redeploy (env-var changes only take effect on the next deploy).

   Until all four vars are present the endpoint returns HTTP 503
   {ok:false,error:"not_configured"} and the site shows a friendly
   "form isn't wired up yet" message — nothing breaks.

   ── CONTRACT (kept in sync with /assets/js/main.js) ────────────────────────
     Request  : POST JSON { type, name, email, phone, message, extra }
                Also accepts application/x-www-form-urlencoded (no-JS <form>
                posts; honeypot field is "cnt_extra", type defaults "contact").
                type ∈ "contact" | "newsletter" | "merch"  ·  extra = honeypot
     Success  : 200 { ok:true }
     Not set  : 503 { ok:false, error:"not_configured" }
     Bad input: 400 { ok:false, error:"..." }
     Too large: 413 { ok:false, error:"too_large" }
     Upstream : 502 { ok:false, error:"auth_failed" | "upstream" }
   All responses are application/json with Cache-Control: no-store.
   ========================================================================== */

"use strict";

/* Max accepted length per field (defence against oversized payloads). */
var LIMITS = { name: 200, email: 200, phone: 200, message: 4000 };

/* Human-readable CRM tag per submission source. */
var TAG_LABELS = {
  contact: "Website Inquiry",
  newsletter: "Newsletter",
  merch: "Merch Waitlist"
};

/* Pragmatic email check — good enough to reject obvious junk without
   rejecting valid-but-unusual real addresses. */
var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

/* Build a locked-down JSON response. Optional extraHeaders are merged in. */
function json(body, status, extraHeaders) {
  var headers = {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  };
  if (extraHeaders) {
    for (var k in extraHeaders) headers[k] = extraHeaders[k];
  }
  return new Response(JSON.stringify(body), {
    status: status || 200,
    headers: headers
  });
}

/* Coerce to string, strip control characters, collapse whitespace, trim,
   then cap length. Non-strings become "". */
function clean(value, max) {
  if (typeof value !== "string") return "";
  return value
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
}

/* One Odoo JSON-RPC round-trip. Throws on transport/RPC error so the caller's
   try/catch turns it into a generic 502 (never leak Odoo internals). */
async function odooRpc(endpoint, service, method, args) {
  var res = await fetch(endpoint, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Accept": "application/json"
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      method: "call",
      params: { service: service, method: method, args: args },
      id: Date.now()
    })
  });
  if (!res.ok) throw new Error("odoo_http_" + res.status);
  var data = await res.json();
  if (data && data.error) throw new Error("odoo_rpc_error");
  return data ? data.result : undefined;
}

export async function onRequestPost(context) {
  var request = context.request;
  var env = context.env || {};

  /* 0a — Optional host lock. Set ALLOWED_HOST (e.g. "thecontainer.group") in
     the environment to reject submissions arriving via *.pages.dev or preview
     hostnames, so the WAF rate limit on the custom domain can't be bypassed. */
  if (env.ALLOWED_HOST) {
    var reqHost = (request.headers.get("host") || "").toLowerCase().split(":")[0];
    var allowedHost = String(env.ALLOWED_HOST).toLowerCase();
    if (reqHost !== allowedHost && reqHost !== "www." + allowedHost) {
      return json({ ok: false, error: "forbidden" }, 403);
    }
  }

  /* 0b — Reject oversized bodies. Content-Length is checked when present;
     the raw body length is enforced regardless (chunked/H2 requests). */
  var contentLength = request.headers.get("content-length");
  if (contentLength && Number(contentLength) > 10240) {
    return json({ ok: false, error: "too_large" }, 413);
  }

  /* 1 — Parse body. Supports JSON (site JS) and application/x-www-form-urlencoded
     (no-JS <form> POSTs). Malformed input is a client error, not an upstream one. */
  var body;
  var contentType = request.headers.get("content-type") || "";
  if (contentType.indexOf("application/x-www-form-urlencoded") !== -1) {
    try {
      var form = await request.formData();
      body = {
        type: form.get("type") || "contact",
        name: form.get("name") || "",
        email: form.get("email") || "",
        phone: form.get("phone") || "",
        message: form.get("message") || "",
        extra: form.get("cnt_extra") || ""
      };
    } catch (e) {
      return json({ ok: false, error: "bad_request" }, 400);
    }
  } else {
    try {
      var rawBody = await request.text();
      if (rawBody.length > 10240) {
        return json({ ok: false, error: "too_large" }, 413);
      }
      body = JSON.parse(rawBody);
    } catch (e) {
      return json({ ok: false, error: "bad_request" }, 400);
    }
  }
  if (!body || typeof body !== "object") {
    return json({ ok: false, error: "bad_request" }, 400);
  }

  /* 2 — Honeypot. A real browser leaves the "extra" field empty; bots fill
     everything. Any non-empty string (or non-string truthy value) is a bot —
     pretend success so it doesn't retry, but do nothing. */
  var extra = body.extra;
  if (typeof extra === "string" ? extra.trim() !== "" : !!extra) {
    return json({ ok: true });
  }

  /* 3 — Sanitize + validate. */
  var type = (body.type === "newsletter" || body.type === "merch")
    ? body.type
    : "contact";
  var esc = function (v) {
    return String(v).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  };
  var name = esc(clean(body.name, LIMITS.name));
  var email = clean(body.email, LIMITS.email);
  var phone = clean(body.phone, LIMITS.phone);
  var message = esc(clean(body.message, LIMITS.message));

  if (!email || !EMAIL_RE.test(email)) {
    return json({ ok: false, error: "invalid_email" }, 400);
  }
  if (type === "contact" && (!name || !message)) {
    return json({ ok: false, error: "missing_fields" }, 400);
  }

  /* 4 — Config gate. Missing any var → graceful "not wired up yet". */
  var ODOO_URL = env.ODOO_URL;
  var ODOO_DB = env.ODOO_DB;
  var ODOO_LOGIN = env.ODOO_LOGIN;
  var ODOO_API_KEY = env.ODOO_API_KEY;
  if (!ODOO_URL || !ODOO_DB || !ODOO_LOGIN || !ODOO_API_KEY) {
    return json({ ok: false, error: "not_configured" }, 503);
  }

  /* 5 — Talk to Odoo. Any failure → opaque 502. */
  try {
    var endpoint = String(ODOO_URL).replace(/\/+$/, "") + "/jsonrpc";

    /* a. Authenticate → uid (number). Bad creds return false, not an error. */
    var uid = await odooRpc(endpoint, "common", "authenticate", [
      ODOO_DB, ODOO_LOGIN, ODOO_API_KEY, {}
    ]);
    if (!uid) {
      return json({ ok: false, error: "auth_failed" }, 502);
    }

    /* b. execute_kw helper bound to this session. */
    var kw = function (model, method, args, kwargs) {
      return odooRpc(endpoint, "object", "execute_kw", [
        ODOO_DB, uid, ODOO_API_KEY, model, method, args, kwargs || {}
      ]);
    };

    /* c. Find-or-create the contact (res.partner) by email. */
    var partnerIds = await kw(
      "res.partner", "search", [[["email", "=", email]]], { limit: 1 }
    );
    var partnerId = (Array.isArray(partnerIds) && partnerIds.length)
      ? partnerIds[0]
      : await kw("res.partner", "create", [{
          name: name || email,
          email: email,
          phone: phone || false
        }]);

    /* d. Find-or-create the CRM tag for this source. */
    var label = TAG_LABELS[type];
    var tagIds = await kw(
      "crm.tag", "search", [[["name", "=", label]]], { limit: 1 }
    );
    var tagId = (Array.isArray(tagIds) && tagIds.length)
      ? tagIds[0]
      : await kw("crm.tag", "create", [{ name: label }]);

    /* e. Create the lead, linked to the contact and tagged. */
    await kw("crm.lead", "create", [{
      name: label + " — " + (name || email),
      contact_name: name || false,
      email_from: email,
      phone: phone || false,
      description: message || false,
      partner_id: partnerId,
      tag_ids: [[6, 0, [tagId]]]
    }]);

    return json({ ok: true });
  } catch (e) {
    /* Never surface Odoo/stack details to the browser. */
    return json({ ok: false, error: "upstream" }, 502);
  }
}

/* Only POST is meaningful here. */
export async function onRequestGet() {
  return json({ ok: false, error: "method_not_allowed" }, 405, { "Allow": "POST" });
}
