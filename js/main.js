/* ============================================================
   Page behaviour: scroll progress, mobile nav, GSAP reveals,
   subtle 3D tilt on project cards.
   ============================================================ */
(function () {
  var prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  /* ---------- footer year ---------- */
  var yearEl = document.getElementById("year");
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  /* ---------- scroll progress bar ---------- */
  var bar = document.getElementById("scrollBar");
  var ticking = false;
  window.addEventListener("scroll", function () {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(function () {
      var doc = document.documentElement;
      var max = doc.scrollHeight - window.innerHeight;
      if (bar) bar.style.width = (max > 0 ? (window.scrollY / max) * 100 : 0) + "%";
      ticking = false;
    });
  }, { passive: true });

  /* ---------- mobile menu ---------- */
  var toggle = document.getElementById("navToggle");
  var menu = document.getElementById("mobileMenu");
  if (toggle && menu) {
    toggle.addEventListener("click", function () {
      var open = !menu.hidden;
      menu.hidden = open;
      toggle.setAttribute("aria-expanded", String(!open));
      toggle.setAttribute("aria-label", open ? "Open menu" : "Close menu");
    });
    menu.addEventListener("click", function (e) {
      if (e.target.tagName === "A") {
        menu.hidden = true;
        toggle.setAttribute("aria-expanded", "false");
      }
    });
  }

  /* ---------- GSAP scroll reveals ---------- */
  if (typeof gsap !== "undefined" && typeof ScrollTrigger !== "undefined") {
    gsap.registerPlugin(ScrollTrigger);

    gsap.matchMedia().add("(prefers-reduced-motion: no-preference)", function () {
      document.querySelectorAll(".reveal").forEach(function (el) {
        gsap.fromTo(el,
          { y: 34, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.9,
            ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 88%", once: true }
          }
        );
      });
    });
    // reduced motion: elements simply stay in their final CSS state

    // re-measure trigger positions once fonts/images finish loading
    window.addEventListener("load", function () { ScrollTrigger.refresh(); });
  }

  /* ---------- 3D tilt on project cards (pointer devices only) ---------- */
  if (!prefersReducedMotion && window.matchMedia("(hover: hover)").matches) {
    document.querySelectorAll("[data-tilt]").forEach(function (card) {
      var raf = null;
      function onMove(e) {
        if (raf) return;
        raf = requestAnimationFrame(function () {
          var r = card.getBoundingClientRect();
          var rx = ((e.clientY - r.top) / r.height - 0.5) * -7;
          var ry = ((e.clientX - r.left) / r.width - 0.5) * 9;
          card.style.transform = "perspective(800px) rotateX(" + rx + "deg) rotateY(" + ry + "deg) translateY(-4px)";
          raf = null;
        });
      }
      function onLeave() {
        card.style.transform = "";
      }
      card.addEventListener("pointermove", onMove);
      card.addEventListener("pointerleave", onLeave);
    });
  }
})();
