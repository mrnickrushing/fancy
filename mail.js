// The emails the order book sends, and the one place they are sent from.
//
// Only the website's own order form sends anything on its own — a thank-you,
// which confirms nothing and asks for nothing. Every other email is Amanda's
// to send from the admin when she has decided what to say.
//
// Without RESEND_API_KEY nothing goes out and nothing fails: orders still
// save, the admin still works, and the response says so. A bakery whose email
// is not set up yet should not be a bakery that cannot take orders.
const { Resend } = require('resend');

const BAKERY_NAME = 'Oh! You Fancy Focaccia';
const BAKERY_INBOX = process.env.BAKERY_INBOX || 'ohyoufancyfocaccia@gmail.com';
// Resend will only send from a domain it has verified, so the sender is
// configurable rather than assumed.
const FROM_ADDRESS = process.env.EMAIL_FROM || `${BAKERY_NAME} <orders@ohyoufancyfocaccia.com>`;

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;
function configured() { return Boolean(resend); }

const FULFILLMENT_LABELS = {
  pickup: 'Pickup at the Brookings-Harbor Farmers Market',
  delivery: 'Local delivery (Brookings / Harbor)',
  shipping: 'Shipping',
};

function escapeHtml(str) {
  return String(str ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(String(iso).slice(0, 10) + 'T00:00:00');
  if (isNaN(d.getTime())) return String(iso);
  return d.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
}

function formatMoney(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  if (!isFinite(n)) return null;
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

// The palette is the label's: burgundy on parchment, gold rules, olive caps.
const C = { burgundy: '#8E1B1B', ink: '#33190F', paper: '#F4EFE2', paper2: '#FBF8EF', rule: '#CBBB97', olive: '#4E6023', gold: '#B8862F' };

function shell(inner) {
  return `
<div style="background:${C.paper};padding:28px 12px;font-family:Georgia,'Times New Roman',serif;color:${C.ink};">
  <div style="max-width:600px;margin:0 auto;background:${C.paper2};border:1px solid ${C.rule};">
    <div style="background:${C.burgundy};color:#F6E6C6;text-align:center;padding:26px 20px;border-bottom:4px double rgba(239,224,190,.5);">
      <div style="font-size:26px;font-style:italic;letter-spacing:.02em;">Oh! You Fancy</div>
      <div style="font-size:13px;letter-spacing:.38em;text-transform:uppercase;margin-top:6px;">Focaccia</div>
    </div>
    <div style="padding:26px 24px;">
      ${inner}
      <p style="margin-top:28px;color:${C.olive};font-size:12px;letter-spacing:.3em;text-transform:uppercase;text-align:center;">Pane &middot; Amore &middot; Sempre</p>
    </div>
  </div>
</div>`;
}

function rowsToHtml(rows) {
  return `<table style="border-collapse:collapse;width:100%;">${rows.map(([label, val]) =>
    `<tr><td style="padding:6px 10px 6px 0;color:${C.olive};font-size:13px;letter-spacing:.08em;text-transform:uppercase;white-space:nowrap;vertical-align:top;border-bottom:1px solid ${C.rule};">${escapeHtml(label)}</td>
     <td style="padding:6px 0;vertical-align:top;border-bottom:1px solid ${C.rule};">${escapeHtml(val)}</td></tr>`).join('')}</table>`;
}

function itemsToHtml(items) {
  return `<table style="border-collapse:collapse;width:100%;margin:8px 0 4px;">${items.map((it) => {
    const price = formatMoney(it.unit_price ?? it.unitPrice);
    const line = price ? formatMoney(Number(it.unit_price ?? it.unitPrice) * it.quantity) : 'to be quoted';
    return `<tr><td style="padding:6px 0;border-bottom:1px dotted ${C.rule};">${escapeHtml(it.name)}</td>
      <td style="padding:6px 8px;border-bottom:1px dotted ${C.rule};text-align:center;white-space:nowrap;">&times; ${it.quantity}</td>
      <td style="padding:6px 0;border-bottom:1px dotted ${C.rule};text-align:right;white-space:nowrap;color:${price ? C.ink : C.olive};">${line}</td></tr>`;
  }).join('')}</table>`;
}

// The order as a customer would read it. `o` is a db row with items.
function orderRows(o) {
  return [
    ['Name', `${o.first_name} ${o.last_name}`],
    o.email ? ['Email', o.email] : null,
    o.phone ? ['Phone', o.phone] : null,
    [o.fulfillment === 'pickup' ? 'Pickup' : 'Needed by', formatDate(o.needed_date)],
    ['How', FULFILLMENT_LABELS[o.fulfillment] || o.fulfillment],
    o.address ? ['Address', o.address] : null,
    o.notes ? ['Notes', o.notes] : null,
  ].filter(Boolean);
}

// Sent to the bakery when an order comes in from the website.
function buildBakeryNotice(o, respondUrl) {
  return {
    subject: `New order — ${o.first_name} ${o.last_name} for ${formatDate(o.needed_date)}`,
    html: shell(`
      <h2 style="margin:0 0 14px;font-weight:600;">New order #${o.id}</h2>
      ${rowsToHtml(orderRows(o))}
      <h3 style="margin:22px 0 4px;color:${C.olive};font-size:13px;letter-spacing:.2em;text-transform:uppercase;">Items</h3>
      ${itemsToHtml(o.items)}
      <div style="margin-top:24px;text-align:center;">
        <a href="${respondUrl}" style="display:inline-block;background:${C.burgundy};color:#F6E6C6;text-decoration:none;padding:12px 28px;letter-spacing:.2em;text-transform:uppercase;font-size:12px;">Review &amp; respond</a>
      </div>`),
  };
}

// The thank-you: acknowledges the order, confirms nothing.
function buildThankYou(o, settings) {
  return {
    subject: `Thank you for your order — ${BAKERY_NAME}`,
    html: shell(`
      <h2 style="margin:0 0 10px;font-weight:600;">Thank you, ${escapeHtml(o.first_name)}!</h2>
      <p>We have your order below. We will get back to you shortly to confirm it and let you know the total.</p>
      ${itemsToHtml(o.items)}
      ${rowsToHtml(orderRows(o).slice(3))}
      <p style="margin-top:18px;">${escapeHtml(settings.payment_instructions)}</p>
      <p>Questions in the meantime? Reply to this email or write to ${BAKERY_INBOX}.</p>
      <p>— Amanda</p>`),
  };
}

// The confirmation: the one email that confirms, and the only one that asks
// for money, when a deposit has been set in Settings.
function buildConfirmation(o, settings) {
  const total = formatMoney(o.amount);
  const pct = Number(settings.deposit_percent) || 0;
  let money = '';
  if (total && Number(o.amount) > 0) {
    money = `<p style="font-size:18px;margin:16px 0 4px;">Your order total is <strong>${total}</strong>.</p>`;
    if (pct > 0) {
      const dep = formatMoney((Number(o.amount) * pct) / 100);
      money += `<p>A ${pct}% deposit of <strong>${dep}</strong> holds your order.</p>`;
    }
  }
  return {
    subject: `Your order is confirmed — ${BAKERY_NAME}`,
    html: shell(`
      <h2 style="margin:0 0 10px;font-weight:600;">Confirmed, ${escapeHtml(o.first_name)}!</h2>
      <p>Your order is in the book for <strong>${formatDate(o.needed_date)}</strong>.</p>
      ${itemsToHtml(o.items)}
      ${rowsToHtml(orderRows(o).slice(3))}
      ${money}
      <div style="margin-top:18px;padding:16px;background:${C.paper};border:1px dashed ${C.rule};">
        <p style="margin:0 0 6px;color:${C.olive};font-size:12px;letter-spacing:.2em;text-transform:uppercase;">Paying</p>
        <p style="margin:0;">${escapeHtml(settings.payment_instructions)}</p>
      </div>
      ${o.fulfillment === 'pickup' ? `<p style="margin-top:16px;">${escapeHtml(settings.pickup_note)}</p>` : ''}
      <p>Questions? Reply to this email or write to ${BAKERY_INBOX}.</p>
      <p>— Amanda</p>`),
  };
}

// A receipt for money actually received. States what came in, what the order
// costs, and what is left, so the customer is not doing the subtraction.
function buildReceipt(o, payment) {
  const total = Number(o.amount);
  const hasTotal = isFinite(total) && total > 0;
  const paid = Number(o.paid_amount) || 0;
  const paidInFull = o.payment_status === 'paid' || (hasTotal && paid >= total);
  const balance = hasTotal ? Math.max(total - paid, 0) : null;
  const money = [
    ['This payment', formatMoney(payment.amount)],
    paid !== Number(payment.amount) ? ['Paid to date', formatMoney(paid)] : null,
    hasTotal ? ['Order total', formatMoney(total)] : null,
    balance !== null ? ['Balance remaining', formatMoney(paidInFull ? 0 : balance)] : null,
  ].filter(Boolean);
  return {
    subject: paidInFull ? `Paid in full — thank you — ${BAKERY_NAME}` : `Payment received — ${BAKERY_NAME}`,
    html: shell(`
      <h2 style="margin:0 0 10px;font-weight:600;">Thank you, ${escapeHtml(o.first_name)}!</h2>
      <p>${paidInFull ? 'Your order is paid in full — nothing further is due.' : `We received your payment of ${formatMoney(payment.amount)}.`}</p>
      ${rowsToHtml(money)}
      <h3 style="margin:22px 0 4px;color:${C.olive};font-size:13px;letter-spacing:.2em;text-transform:uppercase;">Your order</h3>
      ${itemsToHtml(o.items)}
      <p style="margin-top:18px;">— Amanda</p>`),
  };
}

function buildPlain(subject, message) {
  return {
    subject,
    html: shell(`<div style="white-space:pre-wrap;">${escapeHtml(message)}</div><p style="margin-top:18px;">— Amanda</p>`),
  };
}

// Returns { sent: true } or { sent: false, reason }. Never throws: an email
// that does not go out is a nuisance, an order lost because of one is a sale.
async function send({ to, replyTo, subject, html }) {
  if (!resend) return { sent: false, reason: 'not configured' };
  if (!to) return { sent: false, reason: 'no recipient' };
  try {
    const result = await resend.emails.send({ from: FROM_ADDRESS, to, replyTo, subject, html });
    if (result.error) {
      console.error('Email rejected:', result.error);
      return { sent: false, reason: result.error.message || 'rejected' };
    }
    return { sent: true };
  } catch (err) {
    console.error('Email failed:', err);
    return { sent: false, reason: err.message || 'failed' };
  }
}

module.exports = {
  BAKERY_NAME, BAKERY_INBOX, FULFILLMENT_LABELS,
  configured, send, escapeHtml, formatDate, formatMoney,
  buildBakeryNotice, buildThankYou, buildConfirmation, buildReceipt, buildPlain,
  // exposed so tests can mock the transport
  get resend() { return resend; },
};
