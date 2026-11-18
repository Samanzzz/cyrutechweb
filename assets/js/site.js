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

  /* ---------- Text split: words (default) or letters ---------- */
  var splitEls = document.querySelectorAll("[data-split]");
  if (reduceMotion) splitEls.forEach(function (el) { el.classList.add("is-in"); });
  if (splitEls.length && !reduceMotion) {
    splitEls.forEach(function (el) {
      var chars = el.getAttribute("data-split") === "chars";
      var i = 0;
      var walk = function (node) {
        Array.prototype.slice.call(node.childNodes).forEach(function (child) {
          if (child.nodeType === 3) {
            var parts = chars ? Array.from(child.textContent) : child.textContent.split(/(\s+)/);
            if (!child.textContent.trim()) return;
            var frag = document.createDocumentFragment();
            parts.forEach(function (part) {
              if (!part) return;
              if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
              var span = document.createElement("span");
              span.className = chars ? "ch" : "w";
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
    });
    var showSplit = function (el) { el.classList.add("is-in"); };
    if ("IntersectionObserver" in window) {
      var so = new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) {
          if (entry.isIntersecting) { so.unobserve(entry.target); showSplit(entry.target); }
        });
      }, { rootMargin: "0px 0px -6% 0px", threshold: 0.15 });
      /* Two frames so the hidden state paints before transitioning in. */
      window.requestAnimationFrame(function () {
        window.requestAnimationFrame(function () { splitEls.forEach(function (el) { so.observe(el); }); });
      });
      window.addEventListener("beforeprint", function () { splitEls.forEach(showSplit); });
    } else {
      splitEls.forEach(showSplit);
    }
  }

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

  /* ==========================================================================
     Detailed motion
     ========================================================================== */
  var finePointer = window.matchMedia && window.matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* Pause SVG (SMIL) animations when motion is reduced */
  if (reduceMotion) {
    document.querySelectorAll(".orbit svg, .x-svg").forEach(function (svgEl) {
      if (svgEl.pauseAnimations) svgEl.pauseAnimations();
    });
  }

  /* Eyebrow labels decode from scrambled letters */
  var GLYPHS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
  var scramble = function (el) {
    if (el.children.length || el.dataset.scrambled) return;
    el.dataset.scrambled = "1";
    var final = el.textContent;
    var frames = 22;
    var frame = 0;
    el.classList.add("is-scrambling");
    var tick = function () {
      frame++;
      var reveal = Math.floor((frame / frames) * final.length);
      var out = "";
      for (var k = 0; k < final.length; k++) {
        var ch = final.charAt(k);
        out += (k < reveal || /[\s—·.,&]/.test(ch)) ? ch : GLYPHS.charAt(Math.floor(Math.random() * GLYPHS.length));
      }
      el.textContent = out;
      if (frame < frames) window.setTimeout(function () { window.requestAnimationFrame(tick); }, 28);
      else { el.textContent = final; el.classList.remove("is-scrambling"); }
    };
    tick();
  };
  if (!reduceMotion && "IntersectionObserver" in window) {
    var eo = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) { eo.unobserve(entry.target); window.setTimeout(function () { scramble(entry.target); }, 120); }
      });
    }, { threshold: 0.6 });
    document.querySelectorAll(".eyebrow").forEach(function (el) { eo.observe(el); });
  }

  /* Hero: content drifts out on scroll (all viewports) */
  var hero = document.querySelector(".hero");
  var orbitEl = document.querySelector(".orbit");
  if (hero && !reduceMotion) {
    var heroTick = false;
    var heroScroll = function () {
      var h = hero.offsetHeight || 1;
      var prog = Math.max(0, Math.min(1, window.scrollY / h));
      hero.style.setProperty("--hp", prog.toFixed(3));
      if (orbitEl) orbitEl.style.setProperty("--hp", prog.toFixed(3));
      heroTick = false;
    };
    window.addEventListener("scroll", function () {
      if (!heroTick) { heroTick = true; window.requestAnimationFrame(heroScroll); }
    }, { passive: true });
    heroScroll();
  }

  if (finePointer && !reduceMotion) {
    /* Hero: cursor spotlight + orbit parallax */
    if (hero) {
      var hx = 0, hy = 0, heroRaf = 0;
      var heroMove = function () {
        heroRaf = 0;
        var r = hero.getBoundingClientRect();
        hero.style.setProperty("--sx", (hx - r.left) + "px");
        hero.style.setProperty("--sy", (hy - r.top) + "px");
        if (orbitEl) {
          orbitEl.style.setProperty("--mx", (((hx - r.left) / r.width) * 2 - 1).toFixed(3));
          orbitEl.style.setProperty("--my", (((hy - r.top) / r.height) * 2 - 1).toFixed(3));
        }
      };
      hero.addEventListener("pointermove", function (e) {
        hx = e.clientX; hy = e.clientY;
        hero.classList.add("is-pointer");
        if (!heroRaf) heroRaf = window.requestAnimationFrame(heroMove);
      });
      hero.addEventListener("pointerleave", function () {
        hero.classList.remove("is-pointer");
        if (orbitEl) { orbitEl.style.setProperty("--mx", "0"); orbitEl.style.setProperty("--my", "0"); }
      });
    }

    /* Sliding highlight behind hovered nav links */
    var navEl = document.getElementById("site-nav");
    if (navEl) {
      var pill = document.createElement("span");
      pill.className = "nav-pill";
      pill.setAttribute("aria-hidden", "true");
      navEl.appendChild(pill);
      navEl.classList.add("has-pill");
      navEl.querySelectorAll("a:not(.nav-mobile-cta)").forEach(function (a) {
        a.addEventListener("pointerenter", function () {
          pill.style.width = a.offsetWidth + "px";
          pill.style.transform = "translateX(" + a.offsetLeft + "px)";
          pill.style.opacity = "1";
        });
      });
      navEl.addEventListener("pointerleave", function () { pill.style.opacity = "0"; });
    }

    /* Cursor spotlight on cards */
    document.querySelectorAll(".venture, .benefit, .course-card, .quote, .feature, .member").forEach(function (card) {
      card.classList.add("spot");
      card.addEventListener("pointermove", function (e) {
        var r = card.getBoundingClientRect();
        card.style.setProperty("--x", (e.clientX - r.left) + "px");
        card.style.setProperty("--y", (e.clientY - r.top) + "px");
      });
    });

    /* 3D tilt */
    document.querySelectorAll(".venture, .course-card").forEach(function (card) {
      card.classList.add("tilt");
      var raf = 0, px = 0, py = 0;
      var apply = function () {
        raf = 0;
        var r = card.getBoundingClientRect();
        var nx = (px - r.left) / r.width - 0.5;
        var ny = (py - r.top) / r.height - 0.5;
        card.style.transform = "perspective(1000px) rotateX(" + (-ny * 6).toFixed(2) + "deg) rotateY(" + (nx * 8).toFixed(2) + "deg) translateY(-4px)";
      };
      card.addEventListener("pointerenter", function () { card.style.transition = "transform 0.2s ease-out, box-shadow 0.4s, border-color 0.3s"; });
      card.addEventListener("pointermove", function (e) {
        px = e.clientX; py = e.clientY;
        if (!raf) raf = window.requestAnimationFrame(apply);
      });
      card.addEventListener("pointerleave", function () {
        if (raf) { window.cancelAnimationFrame(raf); raf = 0; }
        card.style.transition = "transform 0.8s cubic-bezier(0.2, 0.7, 0.1, 1), box-shadow 0.4s, border-color 0.3s";
        card.style.transform = "";
      });
    });

    /* Magnetic primary buttons */
    document.querySelectorAll(".hero .btn, .page-hero .btn, .cta-band .btn, .header-cta .btn").forEach(function (b) {
      b.addEventListener("pointermove", function (e) {
        var r = b.getBoundingClientRect();
        var dx = e.clientX - (r.left + r.width / 2);
        var dy = e.clientY - (r.top + r.height / 2);
        b.style.transition = "transform 0.15s ease-out, background-color 0.25s";
        b.style.transform = "translate(" + (dx * 0.18).toFixed(1) + "px," + (dy * 0.3).toFixed(1) + "px)";
      });
      b.addEventListener("pointerleave", function () {
        b.style.transition = "transform 0.6s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.25s";
        b.style.transform = "";
      });
    });
  }

  /* ---------- "How it works" explainer: step player ---------- */
  document.querySelectorAll("[data-explainer]").forEach(function (ex) {
    var tabs = Array.prototype.slice.call(ex.querySelectorAll("[data-step-btn]"));
    var panels = Array.prototype.slice.call(ex.querySelectorAll("[data-step-panel]"));
    var toggle = ex.querySelector("[data-explainer-toggle]");
    if (!tabs.length) return;
    var DUR = 5200;
    var step = 1, elapsed = 0, last = null, raf = 0;
    var visible = false, hovering = false, userPaused = reduceMotion;

    var paintBars = function () {
      tabs.forEach(function (t, i) {
        var bar = t.querySelector(".x-tab-bar span");
        if (bar) bar.style.setProperty("--p", i + 1 === step ? Math.min(1, elapsed / DUR).toFixed(3) : "0");
      });
    };
    var go = function (n, focus) {
      step = n; elapsed = 0;
      ex.setAttribute("data-step", String(n));
      tabs.forEach(function (t, i) {
        var on = i + 1 === n;
        t.setAttribute("aria-selected", on ? "true" : "false");
        t.setAttribute("tabindex", on ? "0" : "-1");
      });
      panels.forEach(function (p) { p.hidden = Number(p.getAttribute("data-step-panel")) !== n; });
      if (focus) tabs[n - 1].focus();
      paintBars();
    };
    var playing = function () { return visible && !hovering && !userPaused; };
    var loop = function (ts) {
      raf = 0;
      if (!playing()) { last = null; return; }
      if (last !== null) elapsed += ts - last;
      last = ts;
      if (elapsed >= DUR) go((step % tabs.length) + 1);
      paintBars();
      raf = window.requestAnimationFrame(loop);
    };
    var kick = function () {
      if (!raf && playing()) { last = null; raf = window.requestAnimationFrame(loop); }
    };

    tabs.forEach(function (t, i) {
      t.addEventListener("click", function () { go(i + 1); kick(); });
      t.addEventListener("keydown", function (e) {
        var n = null;
        if (e.key === "ArrowRight" || e.key === "ArrowDown") n = (step % tabs.length) + 1;
        else if (e.key === "ArrowLeft" || e.key === "ArrowUp") n = step === 1 ? tabs.length : step - 1;
        else if (e.key === "Home") n = 1;
        else if (e.key === "End") n = tabs.length;
        if (n !== null) { e.preventDefault(); go(n, true); }
      });
    });

    if (finePointer) {
      ex.addEventListener("pointerenter", function () { hovering = true; });
      ex.addEventListener("pointerleave", function () { hovering = false; kick(); });
    }

    if (toggle) {
      toggle.setAttribute("aria-pressed", userPaused ? "true" : "false");
      toggle.addEventListener("click", function () {
        userPaused = !userPaused;
        toggle.setAttribute("aria-pressed", userPaused ? "true" : "false");
        kick();
      });
    }

    if ("IntersectionObserver" in window) {
      new IntersectionObserver(function (entries) {
        entries.forEach(function (entry) { visible = entry.isIntersecting; kick(); });
      }, { threshold: 0.35 }).observe(ex);
    } else {
      visible = true;
    }
    go(1);
    kick();
  });

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
