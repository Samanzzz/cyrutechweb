/* CyruTech Capital — site behaviour. No dependencies. */
(function () {
  "use strict";

  var root = document.documentElement;
  var reduceMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- Header: scrolled state ---------- */
  var header = document.querySelector(".site-header");
  if (header) {
    var ticking = false;
    var progress = header.querySelector(".scroll-progress");
    var updateHeader = function () {
      header.classList.toggle("is-scrolled", window.scrollY > 8);
      if (progress) {
        var max = document.documentElement.scrollHeight - window.innerHeight;
        progress.style.transform = "scaleX(" + (max > 0 ? Math.min(1, window.scrollY / max) : 0) + ")";
      }
      ticking = false;
    };
    window.addEventListener("resize", function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(updateHeader); }
    });
    window.addEventListener("scroll", function () {
      if (!ticking) { ticking = true; window.requestAnimationFrame(updateHeader); }
    }, { passive: true });
    updateHeader();
  }

  /* ---------- Mobile navigation ---------- */
  var toggle = document.querySelector(".nav-toggle");
  var nav = document.getElementById("site-nav");
  if (toggle && nav) {
    var desktop = window.matchMedia("(min-width: 1024px)");

    var setOpen = function (open, returnFocus) {
      root.classList.toggle("nav-open", open);
      toggle.setAttribute("aria-expanded", open ? "true" : "false");
      toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
      if (open) {
        var first = nav.querySelector("a");
        if (first) first.focus({ preventScroll: true });
      } else if (returnFocus) {
        toggle.focus({ preventScroll: true });
      }
    };

    toggle.addEventListener("click", function () {
      setOpen(toggle.getAttribute("aria-expanded") !== "true", true);
    });

    nav.addEventListener("click", function (e) {
      if (e.target.closest("a")) setOpen(false, false);
    });

    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape" && root.classList.contains("nav-open")) setOpen(false, true);
    });

    var onBreakpoint = function (e) { if (e.matches) setOpen(false, false); };
    if (desktop.addEventListener) desktop.addEventListener("change", onBreakpoint);
    else if (desktop.addListener) desktop.addListener(onBreakpoint);

    /* Keep keyboard focus inside the open menu */
    document.addEventListener("keydown", function (e) {
      if (e.key !== "Tab" || !root.classList.contains("nav-open")) return;
      var items = [toggle].concat(Array.prototype.slice.call(nav.querySelectorAll("a")));
      var firstEl = items[0];
      var lastEl = items[items.length - 1];
      if (e.shiftKey && document.activeElement === firstEl) { e.preventDefault(); lastEl.focus(); }
      else if (!e.shiftKey && document.activeElement === lastEl) { e.preventDefault(); firstEl.focus(); }
      else if (items.indexOf(document.activeElement) === -1) { e.preventDefault(); firstEl.focus(); }
    });
  }

  /* ---------- Headline word split ---------- */
  document.querySelectorAll("[data-split]").forEach(function (el) {
    if (reduceMotion) return;
    var i = 0;
    var walk = function (node) {
      Array.prototype.slice.call(node.childNodes).forEach(function (child) {
        if (child.nodeType === 3) {
          var parts = child.textContent.split(/(\s+)/);
          if (parts.length === 1 && !parts[0].trim()) return;
          var frag = document.createDocumentFragment();
          parts.forEach(function (part) {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
            var span = document.createElement("span");
            span.className = "w";
            span.style.setProperty("--i", i++);
            span.textContent = part;
            frag.appendChild(span);
          });
          node.replaceChild(frag, child);
        } else if (child.nodeType === 1) {
          walk(child);
        }
      });
    };
    walk(el);
    /* Two frames so the hidden state paints before transitioning in. */
    window.requestAnimationFrame(function () {
      window.requestAnimationFrame(function () { el.classList.add("is-in"); });
    });
  });

  /* ---------- Count-up numbers ---------- */
  var counters = document.querySelectorAll("[data-count]");
  if (counters.length && !reduceMotion && "IntersectionObserver" in window) {
    var runCount = function (el) {
      var target = parseInt(el.getAttribute("data-count"), 10);
      var start = null;
      var dur = 1400;
      var step = function (ts) {
        if (start === null) start = ts;
        var t = Math.min(1, (ts - start) / dur);
        var eased = 1 - Math.pow(1 - t, 4);
        el.textContent = String(Math.round(target * eased));
        if (t < 1) window.requestAnimationFrame(step);
      };
      window.requestAnimationFrame(step);
    };
    var co = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { co.unobserve(entry.target); runCount(entry.target); }
      });
    }, { threshold: 0.6 });
    counters.forEach(function (el) { el.textContent = "0"; co.observe(el); });
  }

  /* ---------- Reveal on scroll ---------- */
  var revealEls = document.querySelectorAll("[data-reveal]");
  if (revealEls.length) {
    if (reduceMotion || !("IntersectionObserver" in window)) {
      revealEls.forEach(function (el) { el.classList.add("is-in"); });
    } else {
      var io = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-in");
            io.unobserve(entry.target);
          }
        });
      }, { rootMargin: "0px 0px -8% 0px", threshold: 0.08 });
      revealEls.forEach(function (el) { io.observe(el); });
      /* Safety net: never leave content hidden (e.g. print, odd viewports). */
      window.addEventListener("beforeprint", function () {
        revealEls.forEach(function (el) { el.classList.add("is-in"); });
      });
    }
  }

  /* ---------- Footer year ---------- */
  document.querySelectorAll("[data-year]").forEach(function (el) {
    el.textContent = String(new Date().getFullYear());
  });

  /* ---------- Contact forms ---------- */
  var ENDPOINT = "https://script.google.com/macros/s/AKfycbyiAqrWtAhyO6_sjZ7DiqXc01Je5Ij9Pa0QwdHlpbv9z2atBX6ymnp5Mp6F6GvKi3ql/exec";
  var FIELDS = ["fullName", "email", "phone", "websiteUrl", "message"];
  var MESSAGES = {
    fullName: "Please enter your name.",
    email: "Please enter a valid email address.",
    phone: "Please enter a phone number we can reach you on.",
    websiteUrl: "Please enter a full URL, starting with https://",
    message: "Please tell us a little about what you need."
  };

  var fieldError = function (input) {
    var v = input.validity;
    if (v.valid) return "";
    return MESSAGES[input.name] || input.validationMessage;
  };

  var showError = function (input, msg) {
    var err = document.getElementById(input.id + "-error");
    input.setAttribute("aria-invalid", msg ? "true" : "false");
    if (err) err.textContent = msg;
  };

  document.querySelectorAll("form[data-contact-form]").forEach(function (form) {
    var status = form.querySelector(".form-status");
    var button = form.querySelector('button[type="submit"]');
    var buttonLabel = button ? button.querySelector(".btn-label") : null;
    var idleLabel = buttonLabel ? buttonLabel.textContent : "";
    var sending = false;

    var setStatus = function (state, text) {
      if (!status) return;
      status.setAttribute("data-state", state);
      status.textContent = text;
    };

    form.querySelectorAll("input, textarea").forEach(function (input) {
      input.addEventListener("blur", function () {
        if (input.value.trim() !== "" || input.getAttribute("aria-invalid") === "true") showError(input, fieldError(input));
      });
      input.addEventListener("input", function () {
        if (input.getAttribute("aria-invalid") === "true") showError(input, fieldError(input));
      });
    });

    form.addEventListener("submit", function (e) {
      e.preventDefault();
      if (sending) return;

      /* Trim whitespace-only answers so "required" catches them. */
      FIELDS.forEach(function (name) {
        var el = form.elements[name];
        if (el && el.value.trim() === "") el.value = "";
      });
      /* Be forgiving: "example.com" -> "https://example.com" */
      var site = form.elements.websiteUrl;
      if (site && site.value && !/^https?:\/\//i.test(site.value.trim())) {
        site.value = "https://" + site.value.trim();
      }

      var firstInvalid = null;
      FIELDS.forEach(function (name) {
        var el = form.elements[name];
        if (!el) return;
        var msg = fieldError(el);
        showError(el, msg);
        if (msg && !firstInvalid) firstInvalid = el;
      });
      if (firstInvalid) {
        setStatus("error", "Please check the highlighted fields.");
        firstInvalid.focus();
        return;
      }

      /* Honeypot: bots fill hidden fields. Pretend success, send nothing. */
      var trap = form.elements.company;
      if (trap && trap.value) {
        form.reset();
        setStatus("success", "Thanks — your message is on its way. We'll be in touch shortly.");
        return;
      }

      var payload = {};
      FIELDS.forEach(function (name) {
        var el = form.elements[name];
        if (el) payload[name] = el.value.trim();
      });

      sending = true;
      setStatus("", "");
      if (button) { button.disabled = true; button.setAttribute("aria-busy", "true"); }
      if (buttonLabel) buttonLabel.textContent = "Sending…";

      var controller = "AbortController" in window ? new AbortController() : null;
      var timer = controller ? window.setTimeout(function () { controller.abort(); }, 15000) : null;

      /* Google Apps Script does not send CORS headers, so the response is opaque:
         a resolved promise means the request reached Google; a rejection means it didn't. */
      fetch(ENDPOINT, {
        method: "POST",
        mode: "no-cors",
        headers: { "Content-Type": "text/plain;charset=utf-8" },
        body: JSON.stringify(payload),
        signal: controller ? controller.signal : undefined
      })
        .then(function () {
          form.reset();
          form.querySelectorAll("[aria-invalid]").forEach(function (el) { el.setAttribute("aria-invalid", "false"); });
          setStatus("success", "Thanks — your message is on its way. We'll be in touch shortly.");
        })
        .catch(function () {
          setStatus("error", "We couldn't send your message. Please check your connection and try again, or email team@cyrutech.com.");
        })
        .then(function () {
          if (timer) window.clearTimeout(timer);
          sending = false;
          if (button) { button.disabled = false; button.removeAttribute("aria-busy"); }
          if (buttonLabel) buttonLabel.textContent = idleLabel;
        });
    });
  });
})();
