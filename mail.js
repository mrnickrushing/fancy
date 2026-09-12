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
const { resolveBaseUrl } = require('./base-url');

const BAKERY_NAME = 'Oh! You Fancy Focaccia';
// Keep the public correspondence address separate from the order queue. The
// latter can be noisy; replies from Amanda should still invite customers to
// write to the address they see on the site.
const INFO_EMAIL = process.env.INFO_EMAIL || 'info@ohyoufancyfocaccia.com';
const ORDERS_INBOX = process.env.ORDERS_INBOX || 'orders@ohyoufancyfocaccia.com';
// Kept as a read-only compatibility alias for local integrations that used
// the old name for the public bakery address.
const BAKERY_INBOX = INFO_EMAIL;
// Resend will only send from a domain it has verified, so the sender is
// configurable rather than assumed.
const FROM_ADDRESS = process.env.EMAIL_FROM || `${BAKERY_NAME} <${INFO_EMAIL}>`;

const resend = process.env.RESEND_API_KEY ? new Resend(process.env.RESEND_API_KEY) : null;

// Absolute, because an email is read somewhere this server is not. PNG rather
// than the site's WebP: Outlook still will not render WebP.
const SITE_URL = resolveBaseUrl();
const LOGO_URL = `${SITE_URL}/img/email-logo.png`;
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
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${d.toLocaleDateString('en-US', { weekday: 'long' })}, ${month}-${day}-${d.getFullYear()}`;
}

function formatMoney(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  if (!isFinite(n)) return null;
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD' });
}

// The palette is the label's: burgundy on parchment, gold rules, olive caps.
const C = { burgundy: '#8E1B1B', ink: '#33190F', paper: '#F4EFE2', paper2: '#FBF8EF', rule: '#CBBB97', olive: '#4E6023', gold: '#B8862F' };

// The wordmark stays under the logo on purpose: plenty of clients block
// images by default, and the email should still say whose it is.
function shell(inner, footer = '') {
  return `
<div style="background:${C.paper};padding:28px 12px;font-family:Georgia,'Times New Roman',serif;color:${C.ink};">
  <div style="max-width:600px;margin:0 auto;background:${C.paper2};border:1px solid ${C.rule};">
    <div style="background:${C.burgundy};color:#F6E6C6;text-align:center;padding:0 20px 24px;border-bottom:4px double rgba(239,224,190,.5);">
      <img src="${LOGO_URL}" alt="${BAKERY_NAME}" width="560" style="width:100%;max-width:560px;height:auto;display:block;margin:0 auto 4px;border:0;" />
      <div style="font-size:26px;font-style:italic;letter-spacing:.02em;">Oh! You Fancy</div>
      <div style="font-size:13px;letter-spacing:.38em;text-transform:uppercase;margin-top:6px;">Focaccia</div>
    </div>
    <div style="padding:26px 24px;">
      ${inner}
      ${footer}
      <p style="margin-top:28px;color:${C.olive};font-size:12px;letter-spacing:.3em;text-transform:uppercase;text-align:center;">Pane &middot; Amore &middot; Sempre</p>
    </div>
  </div>
</div>`;
}

// Only on the emails a customer might pay from, and only once Amanda has
// filled the settings in. Nothing here invents a destination for money.
function paymentFooter(settings = {}) {
  const venmo = String(settings.venmo_handle || '').trim();
  const applePay = String(settings.apple_pay_accepted || '') === '1';
  if (!venmo && !applePay) return '';

  const lines = [];
  if (venmo) {
    const handle = venmo.replace(/^https?:\/\/(www\.)?venmo\.com\/u\//i, '').replace(/^@/, '');
    const url = /^https?:\/\//i.test(venmo) ? venmo : `https://venmo.com/u/${encodeURIComponent(handle)}`;
    lines.push(`<p style="margin:0 0 8px;"><strong>Venmo</strong> &mdash; <a href="${escapeHtml(url)}" style="color:${C.burgundy};">@${escapeHtml(handle)}</a></p>`);
  }
  // A typographic badge, not Apple's mark: that is a trademark with its own
  // identity guidelines, and a lookalike drawn here would be neither.
  if (applePay) {
    lines.push(`<p style="margin:0;"><span style="display:inline-block;border:1px solid ${C.rule};border-radius:6px;padding:5px 12px;font-size:13px;letter-spacing:.04em;">Apple&nbsp;Pay</span> &mdash; taken as well.</p>`);
  }
  return `
      <div style="margin-top:24px;padding:16px;background:${C.paper};border:1px dashed ${C.rule};">
        <p style="margin:0 0 8px;color:${C.olive};font-size:12px;letter-spacing:.2em;text-transform:uppercase;">How to pay</p>
        ${lines.join('')}
      </div>`;
}

function rowsToHtml(rows) {
  return `<table style="border-collapse:collapse;width:100%;">${rows.map(({ label, value }) =>
    `<tr><td style="padding:6px 10px 6px 0;color:${C.olive};font-size:13px;letter-spacing:.08em;text-transform:uppercase;white-space:nowrap;vertical-align:top;border-bottom:1px solid ${C.rule};">${escapeHtml(label)}</td>
     <td style="padding:6px 0;vertical-align:top;border-bottom:1px solid ${C.rule};">${escapeHtml(value)}</td></tr>`).join('')}</table>`;
}

// `shippingFee` is the figure stored on the order, not the current setting, so
// an old email re-rendered today still shows what the customer was charged.
function itemsToHtml(items, shippingFee = 0) {
  const ship = Number(shippingFee) || 0;
  const shipRow = ship > 0
    ? `<tr><td style="padding:6px 0;border-bottom:1px dotted ${C.rule};">Shipping</td>
       <td style="padding:6px 8px;border-bottom:1px dotted ${C.rule};"></td>
       <td style="padding:6px 0;border-bottom:1px dotted ${C.rule};text-align:right;white-space:nowrap;color:${C.ink};">${formatMoney(ship)}</td></tr>`
    : '';
  return `<table style="border-collapse:collapse;width:100%;margin:8px 0 4px;">${items.map((it) => {
    const price = formatMoney(it.unit_price ?? it.unitPrice);
    const line = price ? formatMoney(Number(it.unit_price ?? it.unitPrice) * it.quantity) : 'to be quoted';
    return `<tr><td style="padding:6px 0;border-bottom:1px dotted ${C.rule};">${escapeHtml(it.name)}</td>
      <td style="padding:6px 8px;border-bottom:1px dotted ${C.rule};text-align:center;white-space:nowrap;">&times; ${it.quantity}</td>
      <td style="padding:6px 0;border-bottom:1px dotted ${C.rule};text-align:right;white-space:nowrap;color:${price ? C.ink : C.olive};">${line}</td></tr>`;
  }).join('')}${shipRow}</table>`;
}

// The order as a table. `o` is a db row with items. Each row carries a `key`
// saying what it is, because the customer's own emails leave out the three
// rows that only read their details back to them — and picking those off by
// position silently took the date with them whenever a row above was absent,
// which is every order without a phone number.
const WHO_ROWS = ['name', 'email', 'phone'];

function orderRows(o) {
  return [
    { key: 'name', label: 'Name', value: `${o.first_name} ${o.last_name}` },
    o.email ? { key: 'email', label: 'Email', value: o.email } : null,
    o.phone ? { key: 'phone', label: 'Phone', value: o.phone } : null,
    { key: 'when', label: o.fulfillment === 'pickup' ? 'Pickup' : 'Needed by', value: formatDate(o.needed_date) },
    { key: 'how', label: 'How', value: FULFILLMENT_LABELS[o.fulfillment] || o.fulfillment },
    o.address ? { key: 'address', label: 'Address', value: o.address } : null,
    o.notes ? { key: 'notes', label: 'Notes', value: o.notes } : null,
  ].filter(Boolean);
}

// What to read back to the customer: the date, how, where, and whatever they
// asked us for in their notes. Not their own name and contact details.
function customerRows(o) {
  return orderRows(o).filter((r) => !WHO_ROWS.includes(r.key));
}

// Sent to the bakery when an order comes in from the website.
function buildBakeryNotice(o, respondUrl) {
  return {
    subject: `New order — ${o.first_name} ${o.last_name} for ${formatDate(o.needed_date)}`,
    html: shell(`
      <h2 style="margin:0 0 14px;font-weight:600;">New order #${o.id}</h2>
      ${rowsToHtml(orderRows(o))}
      <h3 style="margin:22px 0 4px;color:${C.olive};font-size:13px;letter-spacing:.2em;text-transform:uppercase;">Items</h3>
      ${itemsToHtml(o.items, o.shipping_fee)}
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
      ${itemsToHtml(o.items, o.shipping_fee)}
      ${rowsToHtml(customerRows(o))}
      <p style="margin-top:18px;">${escapeHtml(settings.payment_instructions)}</p>
      <p>Questions in the meantime? Reply to this email or write to ${INFO_EMAIL}.</p>
      <p>— Amanda</p>`, paymentFooter(settings)),
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
      ${itemsToHtml(o.items, o.shipping_fee)}
      ${rowsToHtml(customerRows(o))}
      ${money}
      <div style="margin-top:18px;padding:16px;background:${C.paper};border:1px dashed ${C.rule};">
        <p style="margin:0 0 6px;color:${C.olive};font-size:12px;letter-spacing:.2em;text-transform:uppercase;">Paying</p>
        <p style="margin:0;">${escapeHtml(settings.payment_instructions)}</p>
      </div>
      ${o.fulfillment === 'pickup' ? `<p style="margin-top:16px;">${escapeHtml(settings.pickup_note)}</p>` : ''}
      <p>Questions? Reply to this email or write to ${INFO_EMAIL}.</p>
      <p>— Amanda</p>`, paymentFooter(settings)),
  };
}

// A receipt for money actually received. States what came in, what the order
// costs, and what is left, so the customer is not doing the subtraction.
function buildReceipt(o, payment, settings = {}) {
  const total = Number(o.amount);
  const hasTotal = isFinite(total) && total > 0;
  const paid = Number(o.paid_amount) || 0;
  const paidInFull = o.payment_status === 'paid' || (hasTotal && paid >= total);
  const balance = hasTotal ? Math.max(total - paid, 0) : null;
  const money = [
    { label: 'This payment', value: formatMoney(payment.amount) },
    paid !== Number(payment.amount) ? { label: 'Paid to date', value: formatMoney(paid) } : null,
    hasTotal ? { label: 'Order total', value: formatMoney(total) } : null,
    balance !== null ? { label: 'Balance remaining', value: formatMoney(paidInFull ? 0 : balance) } : null,
  ].filter(Boolean);
  return {
    subject: paidInFull ? `Paid in full — thank you — ${BAKERY_NAME}` : `Payment received — ${BAKERY_NAME}`,
    html: shell(`
      <h2 style="margin:0 0 10px;font-weight:600;">Thank you, ${escapeHtml(o.first_name)}!</h2>
      <p>${paidInFull ? 'Your order is paid in full — nothing further is due.' : `We received your payment of ${formatMoney(payment.amount)}.`}</p>
      ${rowsToHtml(money)}
      <h3 style="margin:22px 0 4px;color:${C.olive};font-size:13px;letter-spacing:.2em;text-transform:uppercase;">Your order</h3>
      ${itemsToHtml(o.items, o.shipping_fee)}
      <p style="margin-top:18px;">— Amanda</p>`, paymentFooter(settings)),
  };
}

function buildPlain(subject, message, settings = {}) {
  return {
    subject,
    html: shell(`<div style="white-space:pre-wrap;">${escapeHtml(message)}</div><p style="margin-top:18px;">— Amanda</p>`, paymentFooter(settings)),
  };
}

function buildReviewNotice(review) {
  return {
    subject: `New review to approve — ${BAKERY_NAME}`,
    html: shell(`
      <h2 style="margin:0 0 14px;font-weight:600;">New review</h2>
      ${rowsToHtml([{ label: 'Name', value: review.name }, { label: 'Rating', value: `${review.rating}/5` }])}
      <p style="margin-top:18px;white-space:pre-wrap;">${escapeHtml(review.review)}</p>
      <p style="margin-top:18px;">Approve or reject it from the admin Reviews tab.</p>`),
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
  BAKERY_NAME, BAKERY_INBOX, INFO_EMAIL, ORDERS_INBOX, FULFILLMENT_LABELS,
  configured, send, escapeHtml, formatDate, formatMoney,
  buildBakeryNotice, buildThankYou, buildConfirmation, buildReceipt, buildPlain, buildReviewNotice,
  // exposed so tests can mock the transport
  get resend() { return resend; },
};
