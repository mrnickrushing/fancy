// The order book. One file, one tab at a time; every action goes through the
// admin API and re-reads what it touched, so the screen never drifts from
// the database.
(function () {
  var $ = function (id) { return document.getElementById(id); };
  if (!$('orders-body')) return;

  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function money(n) { return (Number(n) || 0).toLocaleString('en-US', { style: 'currency', currency: 'USD' }); }
  function fmtDate(iso) {
    if (!iso) return '—';
    var d = new Date(String(iso).slice(0, 10) + 'T00:00:00');
    return d.toLocaleDateString('en-US', { weekday: 'short' }) + ' ' +
      String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0') + '-' + d.getFullYear();
  }
  function fmtWhen(iso) {
    if (!iso) return '—';
    var d = new Date(iso);
    return fmtDate(d.toISOString()) + ' ' + d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  }
  function badge(s) { return '<span class="badge badge-' + esc(s) + '">' + esc(String(s).replace('_', ' ')) + '</span>'; }
  function say(id, text, ok) { var m = $(id); m.textContent = text; m.className = 'msg' + (text ? ' show ' + (ok ? 'ok' : 'error') : ''); }
  async function api(path, opts) {
    var res = await fetch(path, Object.assign({ headers: { 'Content-Type': 'application/json' } }, opts || {}));
    if (res.status === 401) { window.location.href = '/admin/login'; throw new Error('signed out'); }
    var data = await res.json().catch(function () { return {}; });
    if (!res.ok) throw new Error(data.error || 'Something went wrong.');
    return data;
  }
  var FULFILL = { pickup: 'Market pickup', delivery: 'Local delivery', shipping: 'Shipping' };

  // ── tabs ──
  document.querySelectorAll('.adm-tab').forEach(function (t) {
    t.addEventListener('click', function () {
      document.querySelectorAll('.adm-tab').forEach(function (x) { x.classList.toggle('active', x === t); });
      document.querySelectorAll('.adm-panel').forEach(function (p) { p.classList.toggle('active', p.dataset.panel === t.dataset.tab); });
    });
  });
  $('sign-out').addEventListener('click', async function () { await fetch('/admin/logout', { method: 'POST' }); window.location.href = '/admin/login'; });

  // ── orders ──
  var orders = [], filter = 'open', menuItems = [], courses = {};
  async function loadOrders() { orders = (await api('/api/admin/orders')).orders || []; renderOrders(); }

  function visible(o) {
    if (filter === 'all') return true;
    if (filter === 'open') return o.status === 'pending' || o.status === 'accepted';
    return o.status === filter;
  }

  function renderOrders() {
    var pending = orders.filter(function (o) { return o.status === 'pending'; }).length;
    var c = $('count-orders'); c.textContent = pending; c.hidden = !pending;
    var rows = orders.filter(visible);
    $('orders-empty').hidden = rows.length > 0;
    $('orders-body').innerHTML = rows.map(function (o) {
      var acts = [];
      if (o.status === 'pending') acts.push('<button class="good" data-act="accept">Accept</button><button class="bad" data-act="decline">Decline</button>');
      if (o.status === 'accepted') acts.push('<button class="good" data-act="complete">Completed</button>');
      if (o.status !== 'cancelled' && o.status !== 'completed') acts.push('<button data-act="cancel">Cancel</button>');
      acts.push('<button data-act="toggle">Details</button>');
      var itemsShort = o.items.map(function (i) { return i.quantity + '× ' + esc(i.name); }).join(', ');
      var paid = Number(o.paid_amount) || 0;
      return '<tr data-id="' + o.id + '">' +
        '<td><strong>' + fmtDate(o.needed_date) + '</strong><br><span style="opacity:.6;font-size:var(--xs)">' + esc(FULFILL[o.fulfillment] || o.fulfillment) + (o.source === 'manual' ? ' · by hand' : '') + '</span></td>' +
        '<td>' + esc(o.first_name) + ' ' + esc(o.last_name) + '<br><span style="opacity:.6;font-size:var(--xs)">' + esc(o.email || o.phone || '') + '</span></td>' +
        '<td style="max-width:260px">' + itemsShort + '</td>' +
        '<td>' + badge(o.status) + '</td>' +
        '<td>' + (o.amount != null ? money(o.amount) : '<span style="opacity:.5">to quote</span>') + '</td>' +
        '<td>' + badge(o.payment_status || 'unpaid') + (paid ? '<br><span style="font-size:var(--xs)">' + money(paid) + '</span>' : '') + '</td>' +
        '<td><div class="actions">' + acts.join('') + '</div></td></tr>' +
        '<tr class="detail" id="detail-' + o.id + '" data-id="' + o.id + '"><td colspan="7">' + detail(o) + '</td></tr>';
    }).join('');
  }

  function detail(o) {
    var items = o.items.map(function (i) {
      var line = i.unit_price != null ? money(i.unit_price * i.quantity) : '<span style="opacity:.5">quote</span>';
      return '<div class="cart-line"><span>' + esc(i.name) + ' <span style="opacity:.6">× ' + i.quantity + '</span></span><span>' + line + '</span></div>';
    }).join('');
    var ship = Number(o.shipping_fee) || 0;
    if (ship > 0) items += '<div class="cart-line"><span>Shipping</span><span>' + money(ship) + '</span></div>';
    // Every item priced means the total can be suggested, shipping included,
    // so the fee is not left to memory when she sets it.
    var allPriced = o.items.length && o.items.every(function (i) { return i.unit_price != null; });
    var suggest = allPriced ? o.items.reduce(function (n, i) { return n + Number(i.unit_price) * i.quantity; }, 0) + ship : null;
    var pays = o.payments.length ? o.payments.map(function (p) {
      return '<div class="cart-line"><span><strong>' + money(p.amount) + '</strong> <span style="opacity:.6;font-size:var(--xs)">' + fmtWhen(p.received_at) + (p.note ? ' · ' + esc(p.note) : '') + '</span></span>' +
        '<button class="act" data-act="remove-payment" data-payment="' + p.id + '">Remove</button></div>';
    }).join('') : '<p class="empty" style="padding:var(--s2) 0">No payments recorded.</p>';
    var balance = o.amount != null ? Math.max(Number(o.amount) - Number(o.paid_amount || 0), 0) : null;
    var sends = [];
    if (o.email) {
      sends.push('<button data-act="confirmation">Send Confirmation</button>');
      if (o.payments.length) sends.push('<button data-act="receipt">Send Receipt</button>');
      sends.push('<button data-act="email">Email</button>');
    }
    sends.push('<button class="bad" data-act="delete">Delete</button>');
    return '<div class="detail-cols"><div>' +
      '<dl class="detail-grid">' +
      '<dt>Order</dt><dd>#' + o.id + ' · placed ' + fmtWhen(o.created_at) + '</dd>' +
      '<dt>Phone</dt><dd>' + esc(o.phone || '—') + '</dd>' +
      '<dt>Email</dt><dd>' + esc(o.email || '—') + '</dd>' +
      (o.address ? '<dt>Address</dt><dd>' + esc(o.address) + '</dd>' : '') +
      (o.notes ? '<dt>Notes</dt><dd>' + esc(o.notes) + '</dd>' : '') + '</dl>' +
      '<p class="caps" style="color:var(--olive);font-size:.62rem">Items</p><div class="cart-lines">' + items + '</div>' +
      '<div class="actions">' + sends.join('') + '</div>' +
      '</div><div>' +
      '<p class="caps" style="color:var(--olive);font-size:.62rem;margin-bottom:var(--s2)">Total</p>' +
      '<div style="display:flex;gap:var(--s2);align-items:center;margin-bottom:var(--s5)">$<input type="number" min="0" step="0.01" style="width:110px" data-field="amount" value="' + (o.amount != null ? o.amount : '') + '" placeholder="quote"> <button class="act" data-act="save-amount">Save</button></div>' +
      (suggest != null ? '<p class="cal-note" style="margin-top:calc(var(--s5) * -1);margin-bottom:var(--s5)">Bill of fare' + (ship ? ' plus shipping' : '') + ' comes to ' + money(suggest) + '.</p>' : '') +
      '<p class="caps" style="color:var(--olive);font-size:.62rem;margin-bottom:var(--s2)">Payments</p><div class="cart-lines">' + pays + '</div>' +
      '<div style="display:flex;gap:var(--s2);align-items:center;flex-wrap:wrap;margin-bottom:var(--s4)">$<input type="number" min="0" step="0.01" style="width:100px" data-field="payment" placeholder="0.00"><input style="width:150px" data-field="payment-note" placeholder="note (optional)"><button class="act" data-act="add-payment">Record</button></div>' +
      '<div style="display:flex;gap:var(--s2);align-items:center;flex-wrap:wrap"><select data-field="pstatus">' +
      ['unpaid', 'deposit_paid', 'paid', 'refunded'].map(function (s) { return '<option value="' + s + '"' + (s === o.payment_status ? ' selected' : '') + '>' + s.replace('_', ' ') + '</option>'; }).join('') +
      '</select><button class="act" data-act="save-pstatus">Set status</button></div>' +
      '<p class="cal-note">Paid ' + money(o.paid_amount) + (balance != null ? ' · balance ' + money(balance) : ' · set a total to see the balance') + '</p>' +
      '</div></div>';
  }

  $('order-filters').addEventListener('click', function (e) {
    var chip = e.target.closest('.chip'); if (!chip) return;
    filter = chip.dataset.filter;
    document.querySelectorAll('#order-filters .chip').forEach(function (c) { c.classList.toggle('active', c === chip); });
    renderOrders();
  });

  $('orders-body').addEventListener('click', async function (e) {
    var btn = e.target.closest('button[data-act]'); if (!btn) return;
    var tr = btn.closest('tr'), id = tr.dataset.id, act = btn.dataset.act;
    var field = function (name) { return tr.querySelector('[data-field="' + name + '"]'); };
    try {
      if (act === 'toggle') { $('detail-' + id).classList.toggle('show'); return; }
      if (act === 'accept' || act === 'decline') await api('/api/admin/orders/' + id + '/respond', { method: 'POST', body: JSON.stringify({ action: act }) });
      else if (act === 'complete') await api('/api/admin/orders/' + id + '/status', { method: 'POST', body: JSON.stringify({ status: 'completed' }) });
      else if (act === 'cancel') { if (!confirm('Cancel this order?')) return; await api('/api/admin/orders/' + id + '/status', { method: 'POST', body: JSON.stringify({ status: 'cancelled' }) }); }
      else if (act === 'delete') { if (!confirm('Delete this order for good?')) return; await api('/api/admin/orders/' + id, { method: 'DELETE' }); }
      else if (act === 'save-amount') await api('/api/admin/orders/' + id + '/amount', { method: 'POST', body: JSON.stringify({ amount: field('amount').value.trim() }) });
      else if (act === 'add-payment') {
        var amt = Number(field('payment').value);
        if (!(amt > 0)) { alert('Enter how much was paid.'); return; }
        await api('/api/admin/orders/' + id + '/payments', { method: 'POST', body: JSON.stringify({ amount: amt, note: field('payment-note').value }) });
      }
      else if (act === 'remove-payment') { if (!confirm('Remove this payment?')) return; await api('/api/admin/payments/' + btn.dataset.payment, { method: 'DELETE' }); }
      else if (act === 'save-pstatus') await api('/api/admin/orders/' + id + '/payment', { method: 'POST', body: JSON.stringify({ paymentStatus: field('pstatus').value }) });
      else if (act === 'confirmation') { await api('/api/admin/orders/' + id + '/confirmation', { method: 'POST' }); alert('Confirmation sent.'); }
      else if (act === 'receipt') { await api('/api/admin/orders/' + id + '/receipt', { method: 'POST' }); alert('Receipt sent.'); }
      else if (act === 'email') { openEmail(id); return; }
      var open = $('detail-' + id) && $('detail-' + id).classList.contains('show');
      await loadOrders(); loadCustomers();
      if (open && $('detail-' + id)) $('detail-' + id).classList.add('show');
    } catch (err) { if (err.message !== 'signed out') alert(err.message); }
  });

  // ── manual order ──
  $('toggle-manual').addEventListener('click', function () { $('manual-form').hidden = !$('manual-form').hidden; });
  function renderManualItems() {
    $('mo-items').innerHTML = menuItems.map(function (m) {
      return '<label><input type="number" min="0" max="50" value="0" data-item="' + m.id + '" style="width:64px;margin:0"><span><b>' + esc(m.name) + '</b><small>' + esc(courses[m.course] || m.course) + (m.price != null ? ' · ' + money(m.price) : '') + (m.available ? '' : ' · off the menu') + '</small></span></label>';
    }).join('');
  }
  $('manual-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    var items = [];
    $('mo-items').querySelectorAll('input[data-item]').forEach(function (i) { var q = Number(i.value); if (q > 0) items.push({ id: Number(i.dataset.item), quantity: q }); });
    say('mo-msg', 'Saving…', true); $('mo-submit').disabled = true;
    try {
      await api('/api/admin/orders', { method: 'POST', body: JSON.stringify({
        firstName: $('mo-first').value, lastName: $('mo-last').value, email: $('mo-email').value, phone: $('mo-phone').value,
        fulfillment: $('mo-fulfillment').value, neededDate: $('mo-date').value, address: $('mo-address').value, notes: $('mo-notes').value, items: items,
      }) });
      $('manual-form').reset(); renderManualItems();
      say('mo-msg', 'Order added. Nothing was emailed — send the confirmation when you are ready.', true);
      await loadOrders(); loadCustomers();
    } catch (err) { say('mo-msg', err.message, false); }
    finally { $('mo-submit').disabled = false; }
  });

  // ── email modal ──
  var emailTarget = null;
  function openEmail(id) { emailTarget = id; $('email-subject').value = ''; $('email-message').value = ''; say('email-msg', '', true); $('email-modal').classList.add('show'); $('email-subject').focus(); }
  function closeEmail() { $('email-modal').classList.remove('show'); emailTarget = null; }
  $('email-cancel').addEventListener('click', closeEmail);
  $('email-modal').addEventListener('click', function (e) { if (e.target === $('email-modal')) closeEmail(); });
  $('email-send').addEventListener('click', async function () {
    if (!emailTarget) return;
    try {
      await api('/api/admin/orders/' + emailTarget + '/email', { method: 'POST', body: JSON.stringify({ subject: $('email-subject').value.trim(), message: $('email-message').value.trim() }) });
      say('email-msg', 'Sent.', true); setTimeout(closeEmail, 700);
    } catch (err) { say('email-msg', err.message, false); }
  });

  // ── menu ──
  async function loadMenu() {
    var data = await api('/api/admin/menu');
    menuItems = data.items || []; courses = data.courses || {};
    $('mi-course').innerHTML = Object.keys(courses).map(function (k) { return '<option value="' + k + '">' + esc(courses[k]) + '</option>'; }).join('');
    $('menu-body').innerHTML = menuItems.map(function (m) {
      return '<tr data-id="' + m.id + '">' +
        '<td><select data-field="course">' + Object.keys(courses).map(function (k) { return '<option value="' + k + '"' + (k === m.course ? ' selected' : '') + '>' + esc(courses[k]) + '</option>'; }).join('') + '</select></td>' +
        '<td><input data-field="name" value="' + esc(m.name) + '" style="width:200px"></td>' +
        '<td><input data-field="description" value="' + esc(m.description || '') + '" style="width:100%;min-width:220px"></td>' +
        '<td>$<input type="number" min="0" step="0.01" data-field="price" value="' + (m.price != null ? m.price : '') + '" style="width:90px" placeholder="quote"></td>' +
        '<td><input data-field="image" value="' + esc(m.image || '') + '" style="width:150px" placeholder="none"></td>' +
        '<td><input type="checkbox" data-field="available"' + (m.available ? ' checked' : '') + '></td>' +
        '<td><div class="actions"><button data-act="save-item">Save</button><button class="bad" data-act="delete-item">Remove</button></div></td></tr>';
    }).join('');
    renderManualItems();
  }
  $('menu-body').addEventListener('click', async function (e) {
    var btn = e.target.closest('button[data-act]'); if (!btn) return;
    var tr = btn.closest('tr'), id = tr.dataset.id;
    var f = function (n) { return tr.querySelector('[data-field="' + n + '"]'); };
    try {
      if (btn.dataset.act === 'delete-item') { if (!confirm('Remove this item from the menu? Past orders keep their copy of it.')) return; await api('/api/admin/menu/' + id, { method: 'DELETE' }); }
      else await api('/api/admin/menu/' + id, { method: 'PATCH', body: JSON.stringify({ course: f('course').value, name: f('name').value, description: f('description').value, price: f('price').value.trim(), image: f('image').value.trim(), available: f('available').checked }) });
      await loadMenu();
    } catch (err) { alert(err.message); }
  });
  $('menu-add').addEventListener('submit', async function (e) {
    e.preventDefault();
    try {
      await api('/api/admin/menu', { method: 'POST', body: JSON.stringify({ course: $('mi-course').value, name: $('mi-name').value, description: $('mi-desc').value, price: $('mi-price').value.trim(), image: $('mi-image').value.trim() }) });
      $('menu-add').reset(); say('menu-msg', 'Added.', true); await loadMenu();
    } catch (err) { say('menu-msg', err.message, false); }
  });

  // ── customers ──
  async function loadCustomers() {
    var rows = (await api('/api/admin/customers')).customers || [];
    $('customers-empty').hidden = rows.length > 0;
    $('customers-body').innerHTML = rows.map(function (c) {
      return '<tr><td>' + esc(c.first_name) + ' ' + esc(c.last_name) + '</td><td>' + esc(c.email || '—') + '</td><td>' + esc(c.phone || '—') + '</td>' +
        '<td>' + c.order_count + '</td><td>' + money(c.total_spent) + '</td><td>' + fmtWhen(c.last_order_at) + '</td>' +
        '<td><div class="actions"><button class="bad" data-key="' + esc(c.customer_key) + '">Delete</button></div></td></tr>';
    }).join('');
  }
  $('customers-body').addEventListener('click', async function (e) {
    var btn = e.target.closest('button[data-key]'); if (!btn) return;
    if (!confirm('Delete this customer and every one of their orders? This cannot be undone.')) return;
    try { await api('/api/admin/customers/' + encodeURIComponent(btn.dataset.key), { method: 'DELETE' }); await loadCustomers(); await loadOrders(); } catch (err) { alert(err.message); }
  });

  // ── blocks ──
  async function loadBlocks() {
    var rows = (await api('/api/admin/blocks')).blocks || [];
    $('blocks-empty').hidden = rows.length > 0;
    $('blocks-body').innerHTML = rows.map(function (b) {
      return '<tr><td>' + fmtDate(b.start_date) + '</td><td>' + fmtDate(b.end_date) + '</td><td>' + esc(b.reason || '—') + '</td>' +
        '<td><div class="actions"><button class="bad" data-id="' + b.id + '">Remove</button></div></td></tr>';
    }).join('');
  }
  $('blocks-body').addEventListener('click', async function (e) {
    var btn = e.target.closest('button[data-id]'); if (!btn) return;
    try { await api('/api/admin/blocks/' + btn.dataset.id, { method: 'DELETE' }); await loadBlocks(); } catch (err) { alert(err.message); }
  });
  $('block-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    try {
      await api('/api/admin/blocks', { method: 'POST', body: JSON.stringify({ startDate: $('block-start').value, endDate: $('block-end').value, reason: $('block-reason').value }) });
      $('block-form').reset(); say('block-msg', '', true); await loadBlocks();
    } catch (err) { say('block-msg', err.message, false); }
  });

  // ── reviews ──
  async function loadReviews() {
    var rows = (await api('/api/admin/reviews')).reviews || [];
    var pending = rows.filter(function (r) { return r.status === 'pending'; }).length;
    var c = $('count-reviews'); c.textContent = pending; c.hidden = !pending;
    $('reviews-empty').hidden = rows.length > 0;
    $('reviews-body').innerHTML = rows.map(function (r) {
      var acts = [];
      if (r.status !== 'approved') acts.push('<button class="good" data-act="approve">Approve</button>');
      if (r.status !== 'rejected') acts.push('<button data-act="reject">Reject</button>');
      acts.push('<button class="bad" data-act="delete">Delete</button>');
      return '<tr data-id="' + r.id + '"><td>' + fmtWhen(r.created_at) + '</td><td>' + esc(r.name) + '</td><td style="color:var(--gold)">' + '★'.repeat(r.rating) + '</td>' +
        '<td style="max-width:360px">' + esc(r.review) + '</td><td>' + badge(r.status) + '</td><td><div class="actions">' + acts.join('') + '</div></td></tr>';
    }).join('');
  }
  $('reviews-body').addEventListener('click', async function (e) {
    var btn = e.target.closest('button[data-act]'); if (!btn) return;
    var id = btn.closest('tr').dataset.id, act = btn.dataset.act;
    try {
      if (act === 'delete') { if (!confirm('Delete this review?')) return; await api('/api/admin/reviews/' + id, { method: 'DELETE' }); }
      else await api('/api/admin/reviews/' + id + '/' + act, { method: 'POST' });
      await loadReviews();
    } catch (err) { alert(err.message); }
  });

  // ── settings ──
  async function loadSettings() {
    var data = await api('/api/admin/settings'), s = data.settings;
    $('set-notice').value = s.min_notice_days; $('set-deposit').value = s.deposit_percent;
    $('set-payment').value = s.payment_instructions; $('set-pickup').value = s.pickup_note;
    $('set-shipping').value = s.shipping_fee;
    $('set-venmo').value = s.venmo_handle || ''; $('set-applepay').value = s.apple_pay_contact || '';
    var outbox = data.emailOutbox || {}, failed = (outbox.failed || 0) + (outbox.dead || 0), pending = (outbox.pending || 0) + (outbox.sending || 0);
    $('email-retry').hidden = !failed;
    $('email-state').textContent = !data.emailConfigured
      ? 'Email is not set up yet (no RESEND_API_KEY on the server), so nothing can be sent from here until it is. Orders still come in.'
      : failed ? failed + ' email' + (failed === 1 ? '' : 's') + ' need attention. You can retry them here.'
      : pending ? pending + ' email' + (pending === 1 ? '' : 's') + ' queued for delivery.'
      : 'Email is set up and the outbox is clear.';
  }
  $('settings-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    try {
      await api('/api/admin/settings', { method: 'PUT', body: JSON.stringify({ min_notice_days: Number($('set-notice').value), deposit_percent: Number($('set-deposit').value), shipping_fee: Number($('set-shipping').value), payment_instructions: $('set-payment').value, pickup_note: $('set-pickup').value, venmo_handle: $('set-venmo').value, apple_pay_contact: $('set-applepay').value }) });
      say('settings-msg', 'Saved.', true);
    } catch (err) { say('settings-msg', err.message, false); }
  });
  $('email-retry').addEventListener('click', async function () {
    try { $('email-retry').disabled = true; await api('/api/admin/email-outbox/retry', { method: 'POST' }); await loadSettings(); }
    catch (err) { say('settings-msg', err.message, false); }
    finally { $('email-retry').disabled = false; }
  });
  $('password-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    if ($('pw-new').value !== $('pw-confirm').value) { say('password-msg', 'The new passwords do not match.', false); return; }
    try {
      await api('/api/admin/password', { method: 'POST', body: JSON.stringify({ currentPassword: $('pw-current').value, newPassword: $('pw-new').value }) });
      $('password-form').reset(); say('password-msg', 'Password updated. You will need to sign in again.', true);
    } catch (err) { say('password-msg', err.message, false); }
  });

  loadMenu().then(loadOrders).catch(function () {});
  loadCustomers().catch(function () {}); loadBlocks().catch(function () {}); loadReviews().catch(function () {}); loadSettings().catch(function () {});
})();
