// The order page: the bill of fare with quantities, a date that knows which
// days are market days, and a form that posts one order.
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var app = $('order-app'); if (!app) return;

  var menu = { courses: {}, items: [] };
  var cart = {};                       // menu item id -> quantity
  var avail = { minNoticeDays: 0, marketDays: [3, 6], blocked: [] };
  var selected = null;
  var orderIdempotencyKey = null;
  var today = new Date(); today.setHours(0, 0, 0, 0);
  var calMonth = new Date(today.getFullYear(), today.getMonth(), 1);

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function money(n) { return Number(n).toLocaleString('en-US', { style: 'currency', currency: 'USD' }); }
  function iso(d) { return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0'); }
  function longDate(s) {
    var d = new Date(s + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'long' }) + ', ' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0') + '-' + d.getFullYear();
  }
  function fulfillment() { return app.querySelector('input[name="fulfillment"]:checked').value; }

  // ── menu ──
  // Each course is a <details> so a phone is not asked to scroll thirty-one
  // rows before it reaches step II. Wide screens keep every course open and
  // the summary behaves as a plain heading.
  var narrow = window.matchMedia('(max-width:900px)');

  function renderMenu() {
    var byCourse = {};
    menu.items.forEach(function (it) { (byCourse[it.course] = byCourse[it.course] || []).push(it); });
    var html = '';
    Object.keys(menu.courses).forEach(function (key) {
      var items = byCourse[key]; if (!items || !items.length) return;
      var rows = items.map(function (it) {
        var q = cart[it.id] || 0;
        // people buy bread with their eyes, and every one of these already has
        // a photograph in the gallery; a bake without one keeps the old layout
        var shot = it.image
          ? '<img class="menu-thumb" src="./img/' + esc(it.image) + '" alt="" loading="lazy" decoding="async" width="74" height="74">'
          : '';
        return '<div class="menu-item' + (q ? ' is-chosen' : '') + (shot ? '' : ' no-shot') +
          '" data-id="' + it.id + '">' + shot + '<div>' +
          '<p class="fare-t"><span>' + esc(it.name) + '</span></p>' +
          (it.description ? '<p class="fare-d">' + esc(it.description) + '</p>' : '') + '</div>' +
          '<div class="fare-buy">' +
          (it.price != null ? '<span class="price">' + money(it.price) + '</span>' : '<span class="price tbq">quoted on confirmation</span>') +
          '<div class="qty"><button type="button" data-delta="-1" aria-label="Fewer ' + esc(it.name) + '">&minus;</button>' +
          '<output aria-label="Quantity">' + q + '</output>' +
          '<button type="button" data-delta="1" aria-label="More ' + esc(it.name) + '">+</button></div>' +
          '</div></div>';
      }).join('');
      html += '<details class="course-fold" data-course="' + esc(key) + '" open>' +
        '<summary><span class="fold-name">' + esc(menu.courses[key]) + '</span>' +
        '<span class="fold-n" data-n="' + items.length + '">' + items.length + (items.length === 1 ? ' bake' : ' bakes') + '</span></summary>' +
        '<div class="course-fold-body">' + rows + '</div></details>';
    });
    $('menu').innerHTML = html || '<p class="empty">The bill of fare is empty right now. Please write to us instead.</p>';
    syncFolds();
  }

  // On a phone, only the first course starts open.
  function syncFolds() {
    var folds = $('menu').querySelectorAll('.course-fold');
    for (var i = 0; i < folds.length; i++) {
      folds[i].open = narrow.matches ? i === 0 : true;
    }
  }
  if (narrow.addEventListener) narrow.addEventListener('change', syncFolds);

  // A wide screen must not be able to collapse a course.
  $('menu').addEventListener('click', function (e) {
    if (narrow.matches) return;
    if (e.target.closest('summary')) e.preventDefault();
  });

  // Each course label carries its own tally, so a collapsed course still says
  // what is inside it.
  function syncFoldTallies() {
    var folds = $('menu').querySelectorAll('.course-fold');
    for (var i = 0; i < folds.length; i++) {
      var label = folds[i].querySelector('.fold-n');
      var chosen = 0;
      var outs = folds[i].querySelectorAll('.menu-item');
      for (var j = 0; j < outs.length; j++) chosen += Number(cart[outs[j].dataset.id] || 0);
      if (chosen) {
        label.textContent = chosen + (chosen === 1 ? ' chosen' : ' chosen');
        label.className = 'fold-n fold-chosen';
      } else {
        var n = Number(label.dataset.n);
        label.textContent = n + (n === 1 ? ' bake' : ' bakes');
        label.className = 'fold-n';
      }
    }
  }

  $('menu').addEventListener('click', function (e) {
    var btn = e.target.closest('button[data-delta]'); if (!btn) return;
    var row = btn.closest('.menu-item'); var id = Number(row.dataset.id);
    var next = Math.max(0, Math.min(50, (cart[id] || 0) + Number(btn.dataset.delta)));
    if (next) cart[id] = next; else delete cart[id];
    row.querySelector('output').textContent = next;
    row.classList.toggle('is-chosen', next > 0);
    syncFoldTallies();
    renderCart();
  });

  function cartItems() {
    return Object.keys(cart).map(function (id) {
      var it = menu.items.find(function (m) { return m.id === Number(id); });
      return it ? { id: it.id, name: it.name, price: it.price, quantity: cart[id] } : null;
    }).filter(Boolean);
  }

  // Flat, and only on shipping. The figure comes from /api/availability so a
  // change in the admin reaches the page without a rebuild.
  function shippingFee() {
    if (fulfillment() !== 'shipping') return 0;
    return (avail && Number(avail.shippingFee)) || 0;
  }

  function renderCart() {
    var items = cartItems();
    var lines = $('cart-lines'), total = 0, unpriced = false;
    if (!items.length) {
      lines.innerHTML = '<p class="cart-empty">Nothing chosen yet.</p>';
      $('cart-total').textContent = '—'; $('cart-note').textContent = '';
      syncBar(0, '—');
      return;
    }
    lines.innerHTML = items.map(function (it) {
      var line;
      if (it.price != null) { total += it.price * it.quantity; line = money(it.price * it.quantity); }
      else { unpriced = true; line = 'quoted'; }
      return '<div class="cart-line"><span>' + esc(it.name) + ' <span style="opacity:.6">&times; ' + it.quantity + '</span></span><span>' + line + '</span></div>';
    }).join('');
    var ship = shippingFee();
    if (ship > 0) {
      total += ship;
      lines.innerHTML += '<div class="cart-line cart-line-fee"><span>Shipping</span><span>' + money(ship) + '</span></div>';
    }
    var shown = unpriced ? (total ? money(total) + ' +' : 'Quoted') : money(total);
    $('cart-total').textContent = shown;
    $('cart-note').textContent = unpriced ? 'Some items are quoted when we confirm; the total will follow by email.' : '';
    var loaves = items.reduce(function (n, it) { return n + it.quantity; }, 0);
    syncBar(loaves, shown);
  }

  // ── the sticky tally ──
  function syncBar(loaves, shown) {
    var bar = $('order-bar'); if (!bar) return;
    bar.hidden = loaves === 0;
    $('bar-count').textContent = loaves + (loaves === 1 ? ' loaf' : ' loaves');
    $('bar-total').textContent = shown;
  }
  var review = $('bar-review');
  if (review) {
    review.addEventListener('click', function () {
      var s = document.querySelector('.order-summary');
      if (s) s.scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  }

  // ── calendar ──
  function blocked(s) { return avail.blocked.some(function (r) { return s >= r.start && s <= r.end; }); }
  function minDate() { var d = new Date(today); d.setDate(d.getDate() + (avail.minNoticeDays || 0)); return d; }
  function allowed(d) {
    var s = iso(d);
    if (d < minDate() || blocked(s)) return false;
    if (fulfillment() === 'pickup' && avail.marketDays.indexOf(d.getDay()) === -1) return false;
    return true;
  }
  function renderCal() {
    var grid = $('cal-grid'); grid.innerHTML = '';
    ['S', 'M', 'T', 'W', 'T', 'F', 'S'].forEach(function (d) { var el = document.createElement('div'); el.className = 'cal-dow'; el.textContent = d; grid.appendChild(el); });
    var y = calMonth.getFullYear(), m = calMonth.getMonth();
    $('cal-month').textContent = calMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
    for (var i = 0; i < new Date(y, m, 1).getDay(); i++) grid.appendChild(document.createElement('span'));
    var days = new Date(y, m + 1, 0).getDate();
    for (var day = 1; day <= days; day++) {
      var d = new Date(y, m, day), s = iso(d);
      var b = document.createElement('button'); b.type = 'button'; b.className = 'cal-day'; b.textContent = day; b.dataset.date = s;
      if (avail.marketDays.indexOf(d.getDay()) !== -1) b.classList.add('market');
      if (!allowed(d)) b.disabled = true;
      if (s === selected) b.classList.add('selected');
      grid.appendChild(b);
    }
    var first = new Date(today.getFullYear(), today.getMonth(), 1);
    $('cal-prev').disabled = calMonth <= first;
  }
  $('cal-grid').addEventListener('click', function (e) {
    var b = e.target.closest('.cal-day'); if (!b || b.disabled) return;
    selected = b.dataset.date; $('needed-date').value = selected; clearErr('needed-date'); renderCal();
    $('cal-note').textContent = (fulfillment() === 'pickup' ? 'Pickup ' : 'Needed ') + longDate(selected) + '.';
  });
  $('cal-prev').addEventListener('click', function () { calMonth.setMonth(calMonth.getMonth() - 1); renderCal(); });
  $('cal-next').addEventListener('click', function () { calMonth.setMonth(calMonth.getMonth() + 1); renderCal(); });

  app.addEventListener('change', function (e) {
    if (e.target.name !== 'fulfillment') return;
    var pickup = fulfillment() === 'pickup';
    $('address-field').hidden = pickup;
    $('date-label').textContent = pickup ? 'Pickup day' : 'Needed by';
    if (selected && !allowed(new Date(selected + 'T00:00:00'))) { selected = null; $('needed-date').value = ''; }
    $('cal-note').textContent = pickup ? 'Gold dot — a market day.' : (selected ? 'Needed ' + longDate(selected) + '.' : 'Any day we are baking.');
    renderCal();
    renderCart();
  });

  // ── errors ──
  function showErr(id, msg) { var f = $(id); f.closest('.field').classList.add('is-error'); f.setAttribute('aria-invalid', 'true'); var e = app.querySelector('.err[data-for="' + id + '"]'); if (e) { e.id = id + '-error'; e.setAttribute('role', 'alert'); f.setAttribute('aria-describedby', e.id); e.textContent = msg; e.classList.add('show'); } }
  function clearErr(id) { var f = $(id); if (!f) return; f.closest('.field').classList.remove('is-error'); f.removeAttribute('aria-invalid'); f.removeAttribute('aria-describedby'); var e = app.querySelector('.err[data-for="' + id + '"]'); if (e) e.classList.remove('show'); }
  ['first-name', 'last-name', 'email', 'address'].forEach(function (id) { $(id).addEventListener('input', function () { clearErr(id); }); });
  function say(msg, ok) { var m = $('form-msg'); m.textContent = msg; m.className = 'msg show ' + (ok ? 'ok' : 'error'); }

  // ── submit ──
  $('order-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    var items = cartItems(), ok = true;
    ['first-name', 'last-name', 'email', 'address', 'needed-date'].forEach(clearErr);
    $('form-msg').className = 'msg';
    if (!items.length) { say('Choose at least one thing from the bill of fare.', false); return; }
    if (!$('first-name').value.trim()) { showErr('first-name', 'Please tell us your first name.'); ok = false; }
    if (!$('last-name').value.trim()) { showErr('last-name', 'And your last name.'); ok = false; }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test($('email').value.trim())) { showErr('email', 'We need an email address to confirm your order.'); ok = false; }
    if (!selected) { showErr('needed-date', fulfillment() === 'pickup' ? 'Pick a market day.' : 'Pick the day you need it.'); ok = false; }
    if (fulfillment() !== 'pickup' && !$('address').value.trim()) { showErr('address', 'Where should it go?'); ok = false; }
    if (!ok) { var first = app.querySelector('.field.is-error'); if (first) first.scrollIntoView({ behavior: 'smooth', block: 'center' }); return; }

    var btn = $('submit'); btn.disabled = true; btn.textContent = 'Sending…';
    try {
      if (!orderIdempotencyKey) orderIdempotencyKey = window.crypto && window.crypto.randomUUID
        ? window.crypto.randomUUID()
        : Date.now().toString(36) + '-' + Math.random().toString(36).slice(2);
      var res = await fetch('/api/order', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Idempotency-Key': orderIdempotencyKey },
        body: JSON.stringify({
          firstName: $('first-name').value.trim(), lastName: $('last-name').value.trim(),
          email: $('email').value.trim(), phone: $('phone').value.trim(),
          fulfillment: fulfillment(), neededDate: selected, address: $('address').value.trim(),
          notes: $('notes').value.trim(), items: items.map(function (it) { return { id: it.id, quantity: it.quantity }; }),
        }),
      });
      var data = await res.json().catch(function () { return {}; });
      if (!res.ok) {
        say(data.error || 'Something went wrong. Please try again, or email us.', false);
        if (res.status === 409) { selected = null; $('needed-date').value = ''; loadAvailability(); }
        return;
      }
      showConfirmation(data, items);
    } catch (err) {
      say('We could not reach the bakery just now. Please try again, or email info@ohyoufancyfocaccia.com.', false);
    } finally { btn.disabled = false; btn.textContent = 'Send the Order'; }
  });

  function showConfirmation(data, items) {
    var name = $('first-name').value.trim();
    $('confirm-title').textContent = 'Your order is in, ' + name;
    $('confirm-lead').textContent = 'Order #' + data.orderId + ' — ' + (fulfillment() === 'pickup' ? 'pickup ' : 'needed ') + longDate(selected) + '.';
    $('confirm-lines').innerHTML = items.map(function (it) { return '<div class="cart-line"><span>' + esc(it.name) + '</span><span>&times; ' + it.quantity + '</span></div>'; }).join('');
    $('confirm-foot').textContent = data.emailSent
      ? 'A note is on its way to ' + $('email').value.trim() + '. Amanda will confirm the order and the total from there.'
      : 'Amanda has your order and will confirm it and the total by email.';
    app.style.display = 'none'; $('confirmation').hidden = false;
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
  $('order-again').addEventListener('click', function () {
    cart = {}; selected = null; $('order-form').reset(); $('needed-date').value = '';
    orderIdempotencyKey = null;
    $('confirmation').hidden = true; app.style.display = ''; renderMenu(); renderCart(); renderCal();
  });

  // ── load ──
  async function loadAvailability() {
    try { var r = await fetch('/api/availability'); if (r.ok) { avail = await r.json(); if (avail.pickupNote) $('pickup-note').textContent = avail.pickupNote; } } catch (err) { /* the calendar still works */ }
    var m = minDate(); if (calMonth < new Date(m.getFullYear(), m.getMonth(), 1)) calMonth = new Date(m.getFullYear(), m.getMonth(), 1);
    renderCal();
  }
  // ── arriving from the gallery ──
  // The gallery shows thirty-one bakes; twelve are standing rows on the bill
  // of fare. So a link cannot assume the photograph corresponds to an item
  // id. Match on the name, and where there is no match carry the bake into
  // the request box rather than dropping it on the floor.
  function normName(s) { return String(s == null ? '' : s).toLowerCase().replace(/[^a-z0-9]/g, ''); }

  function findBake(bake) {
    var want = normName(bake);
    if (!want) return null;
    var exact = menu.items.filter(function (it) { return normName(it.name) === want; });
    if (exact.length === 1) return exact[0];
    // "Olive & Sun-Dried Tomato" in the gallery against "Olive & Sun-Dried
    // Tomato Swirl" on the menu. Prefix only, long enough not to be an
    // accident, and only when exactly one row is a candidate.
    var loose = menu.items.filter(function (it) {
      var n = normName(it.name);
      return n.length > 8 && want.length > 8 && (n.indexOf(want) === 0 || want.indexOf(n) === 0);
    });
    return loose.length === 1 ? loose[0] : null;
  }

  // The note is moved next to whatever it is explaining, so it is not left
  // stranded at the top of the page once we scroll somewhere else.
  function say(msg, before) {
    var f = $('order-flash'); if (!f) return;
    f.textContent = msg;
    f.hidden = false;
    if (before && before.parentNode) before.parentNode.insertBefore(f, before);
    return f;
  }

  function bring(el) {
    if (!el) return;
    var still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    try { el.scrollIntoView({ behavior: still ? 'auto' : 'smooth', block: 'center' }); }
    catch (e) { el.scrollIntoView(); }
    el.classList.add('is-target');
    setTimeout(function () { el.classList.remove('is-target'); }, 4000);
  }

  function applyBake() {
    var bake = null;
    try { bake = new URLSearchParams(window.location.search).get('bake'); } catch (e) { return; }
    if (!bake) return;
    bake = bake.slice(0, 120);

    var hit = findBake(bake);
    if (hit) {
      if (!cart[hit.id]) cart[hit.id] = 1;
      renderMenu(); renderCart();
      var row = $('menu').querySelector('.menu-item[data-id="' + hit.id + '"]');
      if (row) {
        var fold = row.closest('.course-fold');
        if (fold) fold.open = true;
        say('Added one ' + hit.name + ' from the gallery. Change the quantity below, or keep choosing.', row);
        bring(row);
      }
    } else {
      var notes = $('notes');
      if (notes) {
        var line = 'From the gallery: ' + bake;
        if (notes.value.indexOf(line) === -1) {
          notes.value = notes.value ? notes.value.replace(/\s+$/, '') + '\n' + line : line;
        }
        say('“' + bake + '” is one of Amanda\u2019s specialties rather than a standing row, so we have put it in your notes for Amanda. Add anything else you would like below.', notes.closest('.field') || notes);
        bring(notes);
      }
    }
    // so a refresh does not add it a second time
    try { window.history.replaceState(null, '', window.location.pathname); } catch (e) { /* ignore */ }
  }

  async function loadMenu() {
    try {
      var r = await fetch('/api/menu');
      if (!r.ok) throw new Error();
      menu = await r.json();
    } catch (err) {
      $('menu').innerHTML = '<p class="empty">Ordering is not available just now. Please email info@ohyoufancyfocaccia.com.</p>';
      return;
    }
    renderMenu(); renderCart();
    applyBake();
  }
  loadMenu(); loadAvailability();
  setInterval(loadAvailability, 60000);
})();
