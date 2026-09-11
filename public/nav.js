/* Masthead behaviour and the gallery lightbox.
 *
 * Loaded on every public page. Three jobs, all of them progressive: with
 * the script blocked the drawer button simply never appears (CSS hides it
 * until this file marks the document as enhanced), the header stays at its
 * full height, and gallery tiles are inert buttons.
 */
(function () {
  'use strict';

  document.documentElement.classList.add('js');

  /* ── the drawer ────────────────────────────────────────────────────
     Eight destinations will not fit across a phone. Under 900px the rail
     is gone and this button opens a full-width list instead. */
  var toggle = document.getElementById('nav-toggle');
  var drawer = document.getElementById('nav-drawer');

  function setDrawer(open) {
    if (!toggle || !drawer) return;
    toggle.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (open) {
      drawer.hidden = false;
      drawer.setAttribute('data-open', '1');
    } else {
      drawer.removeAttribute('data-open');
      drawer.hidden = true;
    }
    document.body.style.overflow = open ? 'hidden' : '';
  }

  if (toggle && drawer) {
    toggle.addEventListener('click', function () {
      setDrawer(toggle.getAttribute('aria-expanded') !== 'true');
    });
    // Escape closes it, and focus goes back to the button that opened it.
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        setDrawer(false);
        toggle.focus();
      }
    });
    // Widening past the breakpoint must not leave a locked body behind.
    window.addEventListener('resize', function () {
      if (window.innerWidth > 900 && toggle.getAttribute('aria-expanded') === 'true') {
        setDrawer(false);
      }
    });
  }

  /* ── shrink on scroll ──────────────────────────────────────────────
     The ribbon plus the full masthead took 221px of a 900px laptop
     viewport before a word of the page showed. Past the first screenful
     the bar slims to a single row. */
  var mast = document.querySelector('.mast');
  if (mast && !window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
    var shrunk = false;
    var tick = false;
    var onScroll = function () {
      if (tick) return;
      tick = true;
      requestAnimationFrame(function () {
        var want = window.scrollY > 120;
        if (want !== shrunk) {
          shrunk = want;
          mast.classList.toggle('is-shrunk', want);
        }
        tick = false;
      });
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  /* ── the lightbox ──────────────────────────────────────────────────
     A native <dialog>, so the modal semantics, the focus trap and
     Escape-to-close come from the browser rather than from here. */
  var dlg = document.getElementById('lightbox');
  var opens = [].slice.call(document.querySelectorAll('.gal-open'));
  if (dlg && opens.length && typeof dlg.showModal === 'function') {
    var img = document.getElementById('lb-img');
    var name = document.getElementById('lb-name');
    var note = document.getElementById('lb-note');
    var at = 0;

    function show(i) {
      at = (i + opens.length) % opens.length;
      var b = opens[at];
      img.src = b.getAttribute('data-src');
      img.alt = b.getAttribute('data-name') || '';
      name.textContent = b.getAttribute('data-name') || '';
      note.textContent = b.getAttribute('data-cap') || '';
    }

    opens.forEach(function (b, i) {
      b.addEventListener('click', function () {
        show(i);
        dlg.showModal();
      });
    });

    var prev = document.getElementById('lb-prev');
    var next = document.getElementById('lb-next');
    if (prev) prev.addEventListener('click', function () { show(at - 1); });
    if (next) next.addEventListener('click', function () { show(at + 1); });

    var close = document.getElementById('lb-close');
    if (close) close.addEventListener('click', function () { dlg.close(); });

    dlg.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowLeft') { e.preventDefault(); show(at - 1); }
      if (e.key === 'ArrowRight') { e.preventDefault(); show(at + 1); }
    });

    // Clicking outside the plate closes. The dialog fills the viewport, so
    // a click landing on the stage rather than on the panel is a miss.
    var stage = document.getElementById('lb-stage');
    if (stage) {
      stage.addEventListener('click', function (e) {
        if (e.target === stage) dlg.close();
      });
    }
    dlg.addEventListener('click', function (e) {
      if (e.target === dlg) dlg.close();
    });

    // Return focus to the tile that was opened.
    dlg.addEventListener('close', function () {
      var b = opens[at];
      if (b) b.focus();
    });
  }
})();
