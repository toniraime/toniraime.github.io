/* ==========================================================================
   THE CONTAINER — interactions
   Vanilla JS, no dependencies. Everything degrades gracefully without JS.
   ========================================================================== */
(function () {
  "use strict";

  var html = document.documentElement;
  html.classList.add("js");
  var $ = function (s, c) { return (c || document).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || document).querySelectorAll(s)); };

  /* ---------- Crane loader ---------- */
  var loader = $(".loader");
  if (loader) {
    var reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (html.getAttribute("data-skip-loader") === "1" || reduced) {
      loader.classList.add("is-off");
    } else {
      try { sessionStorage.setItem("tc-loaded", "1"); } catch (e) {}
      var dismiss = function () {
        loader.classList.add("is-done");
        setTimeout(function () { loader.classList.add("is-off"); }, 650);
      };
      /* let the crane set the box down on the truck (~2.1s), then lift the curtain */
      setTimeout(dismiss, 2300);
    }
  }

  /* ---------- Day / Night mode ---------- */
  var sweep = $(".sweep");
  var sweeping = false;

  function setMode(mode, animate) {
    if (sweeping) return;
    var apply = function () {
      html.setAttribute("data-mode", mode);
      try { sessionStorage.setItem("tc-mode", mode); } catch (e) {}
      var tc = document.querySelector('meta[name=theme-color]');
      if (tc) tc.content = mode === "day" ? "#f4f4f6" : "#0b0c10";
    };
    if (animate && sweep && !window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      sweeping = true;
      sweep.classList.add("run");
      setTimeout(apply, 330);                 /* swap behind the wipe */
      var settled = false;
      var settle = function () {
        if (settled) return;
        settled = true;
        sweep.classList.remove("run");
        sweeping = false;
      };
      sweep.addEventListener("animationend", function onEnd() {
        sweep.removeEventListener("animationend", onEnd);
        settle();
      });
      setTimeout(settle, 1000);               /* failsafe if animationend never fires */
    } else {
      apply();
    }
    $$(".mode-toggle").forEach(function (t) {
      t.setAttribute("aria-pressed", mode === "night" ? "true" : "false");
    });
  }

  /* sync toggle state + theme-color to the mode chosen pre-paint by theme.js */
  $$(".mode-toggle").forEach(function (t) {
    t.setAttribute("aria-pressed", html.getAttribute("data-mode") === "night" ? "true" : "false");
  });
  (function () {
    var tc = document.querySelector('meta[name=theme-color]');
    if (tc) tc.content = html.getAttribute("data-mode") === "day" ? "#f4f4f6" : "#0b0c10";
  })();

  $$(".mode-toggle").forEach(function (t) {
    t.addEventListener("click", function () {
      setMode(html.getAttribute("data-mode") === "night" ? "day" : "night", true);
    });
  });

  /* world cards can pull you into their mode */
  $$("[data-set-mode]").forEach(function (el) {
    el.addEventListener("click", function () {
      var m = el.getAttribute("data-set-mode");
      if (html.getAttribute("data-mode") !== m) setMode(m, false);
    });
  });

  /* ---------- Header scroll state + burger ---------- */
  var head = $(".site-head");
  var onScroll = function () {
    if (head) head.classList.toggle("is-scrolled", window.scrollY > 12);
  };
  onScroll();
  window.addEventListener("scroll", onScroll, { passive: true });

  var burger = $(".burger");
  if (burger) {
    burger.addEventListener("click", function () {
      var open = document.body.classList.toggle("nav-open");
      burger.setAttribute("aria-expanded", open ? "true" : "false");
    });
    $$(".nav a").forEach(function (a) {
      a.addEventListener("click", function () {
        document.body.classList.remove("nav-open");
        burger.setAttribute("aria-expanded", "false");
      });
    });
    document.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape" && document.body.classList.contains("nav-open")) {
        document.body.classList.remove("nav-open");
        burger.setAttribute("aria-expanded", "false");
        burger.focus();
      }
    });
  }

  /* ---------- Reveal on scroll ---------- */
  if ("IntersectionObserver" in window) {
    var io = new IntersectionObserver(function (entries) {
      entries.forEach(function (en) {
        if (en.isIntersecting) { en.target.classList.add("is-in"); io.unobserve(en.target); }
      });
    }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });
    $$(".reveal").forEach(function (el) { io.observe(el); });
  } else {
    $$(".reveal").forEach(function (el) { el.classList.add("is-in"); });
  }

  /* ---------- Event filters (events page) ---------- */
  var grid = $("[data-event-grid]");
  if (grid) {
    var chips = $$(".chip[data-filter]");
    var applyFilter = function (kind) {
      chips.forEach(function (c) {
        c.setAttribute("aria-pressed", c.getAttribute("data-filter") === kind ? "true" : "false");
      });
      $$("[data-kind]", grid).forEach(function (card) {
        card.style.display =
          (kind === "all" || card.getAttribute("data-kind") === kind) ? "" : "none";
      });
    };
    chips.forEach(function (c) {
      c.addEventListener("click", function () { applyFilter(c.getAttribute("data-filter")); });
    });
    /* default filter follows current mode via ?w= or mode itself */
    var q = new URLSearchParams(location.search).get("w");
    applyFilter(q === "day" || q === "night" ? q : "all");
  }

  /* ---------- Ticket buttons: swap "Booking soon" for live links ----------
     To activate ticketing later: add data-ticket-url="https://..." on .event  */
  $$("[data-ticket-url]").forEach(function (card) {
    var url = card.getAttribute("data-ticket-url");
    var slot = $("[data-ticket-slot]", card);
    if (!slot) return;
    if (url) {
      var a = document.createElement("a");
      a.className = "btn btn--solid";
      a.href = url;
      a.target = "_blank";
      a.rel = "noopener noreferrer";
      a.textContent = "Book now";
      slot.replaceChildren(a);
    }
  });

  /* ---------- Forms → /api/lead (Odoo CRM) ---------- */
  $$("form[data-lead]").forEach(function (form) {
    form.addEventListener("submit", function (ev) {
      ev.preventDefault();
      var status = $("[data-status]", form.parentElement) || $("[data-status]", form);
      var btn = $("button[type=submit]", form);
      var original = btn ? btn.innerHTML : "";
      var show = function (msg, ok) {
        if (!status) return;
        status.textContent = msg;
        status.classList.add("is-on");
        status.classList.toggle("ok", !!ok);
      };

      /* honeypot: bots fill it, humans never see it */
      var hp = form.querySelector("input[name=cnt_extra]");
      if (hp && hp.value) { show("Received.", true); form.reset(); return; }

      /* forms carry novalidate — trigger native validation manually */
      if (!form.reportValidity()) return;

      var field = function (n) {
        var el = form.elements.namedItem(n);
        return (el && el.value || "").trim();
      };
      var data = {
        type: form.getAttribute("data-lead"),
        name: field("name"),
        email: field("email"),
        phone: field("phone"),
        message: field("message"),
        extra: (hp && hp.value) || ""
      };

      if (btn) {
        btn.disabled = true;
        btn.innerHTML = '<span class="mini-load"><i></i></span> Loading cargo…';
      }

      fetch("https://the-container-leads.tonyraimy.workers.dev/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      })
        .then(function (r) { return r.json().then(function (j) { return { s: r.status, j: j }; }); })
        .then(function (res) {
          if (res.j && res.j.ok) {
            show("Cargo received. We'll get back to you shortly.", true);
            form.reset();
          } else if (res.s === 400) {
            show("Please double-check your details — a valid email address is required.");
          } else if (res.s === 503) {
            show("The form isn't wired up yet — email support@thecontainer.group or DM @thecontainerlive.");
          } else {
            show("Something jammed. Please try again, or email support@thecontainer.group.");
          }
        })
        .catch(function () {
          show("Something jammed. Please try again, or email support@thecontainer.group.");
        })
        .then(function () {
          if (btn) { btn.disabled = false; btn.innerHTML = original; }
        });
    });
  });

  /* ---------- Respect reduced motion for ambient videos ---------- */
  if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
    $$("video[autoplay]").forEach(function (v) {
      v.removeAttribute("autoplay");
      try { v.pause(); } catch (e) {}
    });
  }

  /* ---------- Footer year ---------- */
  $$("[data-year]").forEach(function (el) { el.textContent = new Date().getFullYear(); });
})();
