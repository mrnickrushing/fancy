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
  function renderMenu() {
    var byCourse = {};
    menu.items.forEach(function (it) { (byCourse[it.course] = byCourse[it.course] || []).push(it); });
    var html = '';
    Object.keys(menu.courses).forEach(function (key) {
      var items = byCourse[key]; if (!items || !items.length) return;
      html += '<div class="menu-course"><p class="caps" style="color:var(--olive)">' + esc(menu.courses[key]) + '</p>' +
        '<div style="width:64px;height:2px;background:var(--burgundy);margin-block:var(--s2) var(--s2)"></div>';
      items.forEach(function (it) {
        var q = cart[it.id] || 0;
        html += '<div class="menu-item" data-id="' + it.id + '"><div>' +
          '<p class="fare-t"><span>' + esc(it.name) + '</span></p>' +
          (it.description ? '<p class="fare-d">' + esc(it.description) + '</p>' : '') + '</div>' +
          '<div style="display:flex;align-items:center;gap:var(--s5)">' +
          (it.price != null ? '<span class="price">' + money(it.price) + '</span>' : '<span class="price tbq">quoted on confirmation</span>') +
          '<div class="qty"><button type="button" data-delta="-1" aria-label="Fewer">&minus;</button><output>' + q + '</output><button type="button" data-delta="1" aria-label="More">+</button></div>' +
          '</div></div>';
      });
      html += '</div>';
    });
    $('menu').innerHTML = html || '<p class="empty">The bill of fare is empty right now. Please write to us instead.</p>';
  }

  $('menu').addEventListener('click', function (e) {
    var btn = e.target.closest('button[data-delta]'); if (!btn) return;
    var row = btn.closest('.menu-item'); var id = Number(row.dataset.id);
    var next = Math.max(0, Math.min(50, (cart[id] || 0) + Number(btn.dataset.delta)));
    if (next) cart[id] = next; else delete cart[id];
    row.querySelector('output').textContent = next;
    renderCart();
  });

  function cartItems() {
    return Object.keys(cart).map(function (id) {
      var it = menu.items.find(function (m) { return m.id === Number(id); });
      return it ? { id: it.id, name: it.name, price: it.price, quantity: cart[id] } : null;
    }).filter(Boolean);
  }

  function renderCart() {
    var items = cartItems();
    var lines = $('cart-lines'), total = 0, unpriced = false;
    if (!items.length) {
      lines.innerHTML = '<p class="cart-empty">Nothing chosen yet.</p>';
      $('cart-total').textContent = '—'; $('cart-note').textContent = '';
      return;
    }
    lines.innerHTML = items.map(function (it) {
      var line;
      if (it.price != null) { total += it.price * it.quantity; line = money(it.price * it.quantity); }
      else { unpriced = true; line = 'quoted'; }
      return '<div class="cart-line"><span>' + esc(it.name) + ' <span style="opacity:.6">&times; ' + it.quantity + '</span></span><span>' + line + '</span></div>';
    }).join('');
    $('cart-total').textContent = unpriced ? (total ? money(total) + ' +' : 'Quoted') : money(total);
    $('cart-note').textContent = unpriced ? 'Some items are quoted when we confirm; the total will follow by email.' : '';
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
  }
  loadMenu(); loadAvailability();
  setInterval(loadAvailability, 60000);
})();
