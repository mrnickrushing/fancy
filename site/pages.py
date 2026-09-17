# -*- coding: utf-8 -*-
"""The pages that only exist on the live site: the order page and the admin.

They are composed from the same masthead, tokens and furniture as the design
artboards so they read as one site, but they are not artboards themselves —
they need a server behind them, so there is nothing to put on the canvas.
"""
import _build as D  # noqa: E402  (sys.path is set by build_site)

# ── extra CSS: forms, the cart, the calendar, the admin ────────────────
FORMS_CSS = """
/* ── form furniture, in the house voice ── */
.field{display:flex;flex-direction:column;gap:var(--s2);margin-bottom:var(--s5)}
.field label,.field > .caps{font-family:var(--serif);font-size:.68rem;font-weight:600;
  letter-spacing:.3em;text-transform:uppercase;color:var(--olive)}
.field input,.field select,.field textarea,.adm input,.adm select,.adm textarea{
  font-family:var(--body);font-size:var(--base);color:var(--ink);background:var(--paper-2);
  border:1px solid var(--rule);border-radius:var(--r-sm);padding:.7rem .9rem;width:100%;
  transition:border-color 200ms var(--ease),box-shadow 200ms var(--ease)}
.field input:focus,.field select:focus,.field textarea:focus,.adm input:focus,.adm select:focus,.adm textarea:focus{
  outline:none;border-color:var(--burgundy);box-shadow:0 0 0 3px oklch(.45 .15 25/.14)}
.field textarea{min-height:110px;resize:vertical}
.field.is-error input,.field.is-error textarea,.field.is-error select{border-color:var(--burgundy)}
.err{color:var(--burgundy);font-size:var(--sm);font-style:italic;display:none}
.err.show{display:block}
.hp{position:absolute!important;left:-10000px!important;width:1px!important;height:1px!important;overflow:hidden!important}
.row2{display:grid;grid-template-columns:1fr 1fr;gap:var(--s5)}
.choice{display:grid;gap:var(--s3)}
.choice label{display:flex;gap:var(--s3);align-items:flex-start;padding:var(--s4);
  border:1px solid var(--rule);background:var(--paper-2);cursor:pointer;
  transition:border-color 200ms var(--ease)}
.choice label:has(input:checked){border-color:var(--burgundy);box-shadow:inset 0 0 0 1px var(--burgundy)}
.choice input{margin-top:.35rem;accent-color:var(--burgundy)}
.choice b{font-family:var(--serif);font-weight:600;display:block}
.choice small{display:block;font-size:var(--sm);opacity:.8}
.msg{padding:var(--s4) var(--s5);border:1px solid var(--rule);background:var(--paper-2);
  font-size:var(--sm);display:none;margin-top:var(--s4)}
.msg.show{display:block}
.msg.ok{border-color:var(--olive);color:var(--olive-deep)}
.msg.error{border-color:var(--burgundy);color:var(--burgundy-deep)}
.btn:disabled{opacity:.55;cursor:not-allowed;letter-spacing:.28em}
.btn-sm{min-height:36px;padding:.45rem 1rem;font-size:.62rem;letter-spacing:.2em}

/* ── the menu with quantities ── */
.menu-course{margin-bottom:var(--s12)}
.menu-course h2{font-size:var(--xl);text-align:left;margin-bottom:var(--s2)}
.menu-item{display:grid;grid-template-columns:auto minmax(0,1fr) auto;gap:var(--s5);align-items:center;
  padding:var(--s5) var(--s4);border-bottom:1px solid var(--rule-soft);
  transition:background .18s ease}
/* a bake with no photograph yet keeps the same two columns as the rest */
.menu-item.no-shot{grid-template-columns:minmax(0,1fr) auto}
.menu-thumb{width:74px;height:74px;object-fit:cover;border:1px solid var(--rule);
  background:var(--paper-3);flex-shrink:0}
.menu-item .fare-t{margin-bottom:var(--s1)}
.price{font-family:var(--serif);font-weight:600;white-space:nowrap}
.price.tbq{font-weight:400;opacity:.72;font-size:var(--sm);white-space:normal;max-width:9em;text-align:right;line-height:1.3}
.qty{display:inline-flex;align-items:center;border:1px solid var(--rule);background:var(--paper-2);flex-shrink:0}
.qty button{flex-shrink:0}
.qty button{width:44px;height:44px;background:none;border:none;font-family:var(--serif);
  font-size:1.2rem;color:var(--burgundy);cursor:pointer}
.qty button:hover{background:var(--paper-3)}
.qty output{width:36px;text-align:center;font-family:var(--serif);font-weight:600}

/* ── the order card ── */
.cart{position:sticky;top:120px;background:var(--paper-2);border:1px solid var(--rule);
  padding:var(--s8);box-shadow:var(--sh-md)}
.cart::before{content:'';position:absolute;inset:7px;border:1px solid var(--rule);opacity:.45;pointer-events:none}
.cart > *{position:relative}
.cart-lines{margin-block:var(--s4) var(--s5)}
.cart-line{display:flex;justify-content:space-between;gap:var(--s4);padding-block:var(--s2);
  border-bottom:1px dotted var(--rule);font-size:var(--sm)}
.cart-line span:last-child{white-space:nowrap}
.cart-total{display:flex;justify-content:space-between;font-family:var(--serif);font-weight:600;
  padding-top:var(--s3);border-top:1px solid var(--rule)}
.cart-empty{opacity:.7;font-size:var(--sm)}

/* ── calendar ── */
.cal{border:1px solid var(--rule);background:var(--paper-2);padding:var(--s4)}
.cal-head{display:flex;justify-content:space-between;align-items:center;margin-bottom:var(--s3)}
.cal-head button{background:none;border:1px solid var(--rule);width:44px;height:44px;
  font-family:var(--serif);color:var(--burgundy);cursor:pointer}
.cal-head button:disabled{opacity:.3;cursor:default}
.cal-month{font-family:var(--serif);font-weight:600;letter-spacing:.06em}
.cal-grid{display:grid;grid-template-columns:repeat(7,1fr);gap:3px}
.cal-dow{text-align:center;font-family:var(--serif);font-size:.62rem;letter-spacing:.2em;
  text-transform:uppercase;opacity:.55;padding-block:var(--s2)}
.cal-day{aspect-ratio:1;display:flex;align-items:center;justify-content:center;position:relative;
  background:none;border:1px solid transparent;font-family:var(--serif);cursor:pointer;color:var(--ink)}
.cal-day:not(:disabled):hover{border-color:var(--rule)}
.cal-day:disabled{opacity:.28;cursor:default;text-decoration:line-through}
.cal-day.market::after{content:'';position:absolute;bottom:5px;width:5px;height:5px;
  border-radius:50%;background:var(--gold)}
.cal-day.selected{background:var(--burgundy);color:var(--paper-2);border-color:var(--burgundy)}
.cal-day.selected::after{background:var(--gold-pale)}
.cal-note{font-size:var(--xs);opacity:.78;margin-top:var(--s3);line-height:1.5}
.field-help{font-size:var(--xs);opacity:.75;margin:0;line-height:1.5;max-width:56ch}
/* reads as one of the choices above it, not a stray tickbox. It is a label
   inside .field, so the caps and letter-spacing of a field label have to be
   undone here or the small print arrives shouting. */
.field label.gift-check{display:flex;align-items:flex-start;gap:var(--s4);cursor:pointer;
  border:1px solid var(--rule);background:var(--paper-2);padding:var(--s4) var(--s5);
  font-family:var(--body);font-size:var(--sm);font-weight:400;letter-spacing:normal;
  text-transform:none;color:var(--ink);line-height:1.5}
.gift-check input{margin-top:.25rem;flex-shrink:0;width:18px;height:18px;accent-color:var(--burgundy)}
.gift-check b{font-family:var(--serif);font-size:var(--base);font-weight:600;display:block;
  letter-spacing:normal;text-transform:none;color:var(--ink)}
.gift-check small{display:block;font-size:var(--xs);opacity:.78;line-height:1.5;margin-top:var(--s1)}
.gift-check:has(input:checked){background:var(--olive-pale);border-color:var(--olive)}

/* ── confirmation ── */
.confirm{background:var(--paper-2);border:1px solid var(--rule);padding:var(--s12);text-align:center;
  position:relative;max-width:640px;margin:0 auto}
.confirm::before{content:'';position:absolute;inset:8px;border:1px solid var(--rule);opacity:.45;pointer-events:none}

/* ── the order flow: clear stages on the left, a living summary on the right ── */
.order-layout{display:grid;grid-template-columns:minmax(0,1.35fr) minmax(280px,.65fr);gap:var(--s12);align-items:start}
.order-main{display:grid;gap:var(--s8);min-width:0}
.order-step{background:var(--paper-2);border:1px solid var(--rule);padding:var(--s8);position:relative}
.order-step::before{content:'';position:absolute;inset:7px;border:1px solid var(--rule);opacity:.35;pointer-events:none}
.order-step>*{position:relative}
.order-step-head{display:flex;align-items:baseline;gap:var(--s4);margin-bottom:var(--s6);padding-bottom:var(--s4);border-bottom:1px solid var(--rule-soft)}
/* --gold is an ornament colour (2.8:1 on paper); numerals are read, so they
   take the readable gold instead */
.order-step-num{font-family:var(--serif);font-size:var(--lg);font-weight:600;color:var(--gold-read);min-width:1.4em}
.opt{opacity:.68;letter-spacing:.1em;font-weight:400}
.order-step h2{font-size:var(--lg);text-align:left;margin:0}
.order-step-intro{font-size:var(--sm);opacity:.8;margin:calc(var(--s3) * -1) 0 var(--s6);max-width:56ch}
.order-summary{position:sticky;top:120px;background:var(--paper-2);border:1px solid var(--rule);padding:var(--s8);box-shadow:var(--sh-md)}
.order-summary::before{content:'';position:absolute;inset:7px;border:1px solid var(--rule);opacity:.45;pointer-events:none}
.order-summary>*{position:relative}
.order-summary h2{font-size:var(--lg);text-align:left;margin:var(--s2) 0 0}
.order-summary .summary-note{font-size:var(--sm);opacity:.78;line-height:1.55}
.order-summary .btn{width:100%;margin-top:var(--s5)}
.order-reassurance{margin-top:var(--s8);padding-top:var(--s6);border-top:1px solid var(--rule-soft);font-size:var(--sm);line-height:1.6;opacity:.76}
.order-reassurance strong{display:block;color:var(--olive);font-family:var(--serif);font-weight:600;margin-bottom:var(--s2)}
.order-submit{display:flex;align-items:center;gap:var(--s5);padding-top:var(--s2)}
.order-submit .cal-note{margin:0}

/* ── the courses collapse into accordions on small screens, so the whole
      bill of fare is not one endless scroll before step II ── */
.course-fold{border-bottom:1px solid var(--rule-soft)}
.course-fold:last-of-type{border-bottom:0}
.course-fold>summary{display:flex;align-items:center;justify-content:space-between;gap:var(--s4);
  min-height:56px;padding:var(--s4) 0;cursor:pointer;list-style:none;
  font-family:var(--serif);font-size:.72rem;font-weight:600;letter-spacing:.26em;
  text-transform:uppercase;color:var(--burgundy)}
.course-fold>summary::-webkit-details-marker{display:none}
.course-fold>summary::after{content:'\002B';font-size:1.1rem;letter-spacing:0;color:var(--gold-read);flex:0 0 auto}
.course-fold[open]>summary::after{content:'\2212'}
.course-fold>summary .fold-n{font-family:var(--body);font-size:var(--sm);letter-spacing:.04em;
  text-transform:none;color:var(--ink);opacity:.6}
.course-fold>summary .fold-chosen{font-family:var(--body);font-size:var(--sm);letter-spacing:.04em;
  text-transform:none;color:var(--olive-deep)}
.course-fold-body{padding-bottom:var(--s5)}
/* wide screens read every course at once: the summary is a heading, not a control */
@media (min-width:901px){
  .course-fold>summary{cursor:default}
  .course-fold>summary::after{display:none}
}
.fare-buy{display:flex;align-items:center;gap:var(--s5);flex-wrap:wrap;justify-content:flex-end}

/* a row with something in the basket earns a visible mark */
.menu-item.is-chosen{background:var(--olive-pale);box-shadow:inset 3px 0 0 var(--olive)}
/* arriving from a gallery photograph: say what happened, and show where */
.order-flash{font-size:var(--sm);color:var(--burgundy-deep);background:var(--gold-pale);
  border-left:3px solid var(--gold-read);padding:var(--s3) var(--s4);
  margin:var(--s4) 0 var(--s5);max-width:64ch;border-radius:0 var(--r-sm) var(--r-sm) 0}
.menu-item.is-target,textarea.is-target{outline:2px solid var(--burgundy);outline-offset:2px}
.course-fold-body>.menu-item:last-child{border-bottom:0}

/* ── the sticky tally: on a phone the summary is far below the fold, so the
      running total follows the thumb instead ── */
.order-bar{position:fixed;inset:auto 0 0 0;z-index:60;display:none;
  background:var(--paper-2);border-top:1px solid var(--rule);box-shadow:0 -6px 24px oklch(.2 .04 30/.14);
  padding:var(--s3) var(--s5) calc(var(--s3) + env(safe-area-inset-bottom))}
.order-bar-in{display:flex;align-items:center;gap:var(--s4);max-width:640px;margin-inline:auto}
.order-bar-tally{display:grid;gap:.1rem;flex:1 1 auto;min-width:0}
.order-bar-count,.order-bar-total{white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.order-bar-count{font-family:var(--serif);font-size:.6rem;font-weight:600;letter-spacing:.2em;
  text-transform:uppercase;color:var(--olive-deep)}
.order-bar-total{font-family:var(--serif);font-size:var(--sm);font-weight:600;color:var(--ink)}
.order-bar .btn{flex:0 0 auto;width:auto;margin:0;min-height:44px;
  padding:.7rem 1.1rem;font-size:.62rem;letter-spacing:.16em;white-space:nowrap}

/* ── admin ── */
.adm-bar{display:flex;justify-content:space-between;align-items:center;gap:var(--s5);flex-wrap:wrap;
  padding-block:var(--s8);border-bottom:1px solid var(--rule)}
.adm-tabs{display:flex;gap:var(--s2);flex-wrap:wrap;margin-block:var(--s6) var(--s8)}
.adm-tab{font-family:var(--serif);font-size:.68rem;font-weight:600;letter-spacing:.26em;text-transform:uppercase;
  min-height:44px;padding:.7rem 1.1rem;border:1px solid var(--rule);background:var(--paper-2);color:var(--ink);cursor:pointer}
.adm-tab.active{background:var(--burgundy);border-color:var(--burgundy);color:var(--paper-2)}
.adm-tab .n{display:inline-block;min-width:1.3em;padding:0 .35em;margin-left:.5em;border-radius:1em;
  background:var(--gold);color:var(--burgundy-ink);font-size:.62rem;text-align:center}
.adm-tab .n[hidden]{display:none}
.adm-panel{display:none}.adm-panel.active{display:block}
.adm-section{background:var(--paper-2);border:1px solid var(--rule);padding:var(--s8);margin-bottom:var(--s8)}
.adm-section h2{font-size:var(--lg);text-align:left;margin-bottom:var(--s5)}
.adm{width:100%;border-collapse:collapse;font-size:var(--sm)}
.adm th{font-family:var(--serif);font-size:.62rem;font-weight:600;letter-spacing:.26em;text-transform:uppercase;
  color:var(--olive);text-align:left;padding:var(--s3) var(--s3);border-bottom:1px solid var(--rule)}
.adm td{padding:var(--s3);border-bottom:1px solid var(--rule-soft);vertical-align:top}
.adm tr.detail{display:none;background:var(--paper)}
.adm tr.detail.show{display:table-row}
.adm input,.adm select,.adm textarea{padding:.4rem .6rem;font-size:var(--sm);width:auto}
.adm textarea{width:100%}
.actions{display:flex;flex-wrap:wrap;gap:var(--s2)}
.actions button,.adm button.act{font-family:var(--serif);font-size:.6rem;font-weight:600;letter-spacing:.18em;
  text-transform:uppercase;min-height:44px;padding:.45rem .9rem;border:1px solid var(--rule);background:var(--paper-2);
  color:var(--ink);cursor:pointer;white-space:nowrap}
.actions button:hover{border-color:var(--burgundy);color:var(--burgundy)}
.actions button.good{border-color:var(--olive);color:var(--olive-deep)}
.actions button.bad{border-color:var(--burgundy);color:var(--burgundy)}
.badge{display:inline-block;font-family:var(--serif);font-size:.6rem;font-weight:600;letter-spacing:.18em;
  text-transform:uppercase;padding:.25rem .55rem;border:1px solid var(--rule);white-space:nowrap}
.badge-pending{border-color:var(--gold);color:#7a5a12;background:oklch(.93 .06 85)}
.badge-accepted,.badge-approved,.badge-paid{border-color:var(--olive);color:var(--olive-deep);background:var(--olive-pale)}
.badge-completed{border-color:var(--olive-deep);color:var(--paper-2);background:var(--olive-deep)}
.badge-declined,.badge-cancelled,.badge-rejected,.badge-refunded{border-color:var(--burgundy);color:var(--burgundy);background:oklch(.95 .03 25)}
.badge-deposit_paid{border-color:var(--gold);color:#7a5a12}
.detail-grid{display:grid;grid-template-columns:max-content 1fr;gap:var(--s2) var(--s5);font-size:var(--sm);margin-bottom:var(--s5)}
.detail-grid dt{font-family:var(--serif);font-size:.62rem;letter-spacing:.2em;text-transform:uppercase;color:var(--olive);padding-top:.2em}
.detail-grid dd{margin:0}
.detail-cols{display:grid;grid-template-columns:1fr 1fr;gap:var(--s8)}
.chips{display:flex;gap:var(--s2);flex-wrap:wrap;margin-bottom:var(--s5)}
.chip{font-family:var(--serif);font-size:.62rem;letter-spacing:.2em;text-transform:uppercase;min-height:44px;padding:.4rem .9rem;
  border:1px solid var(--rule);background:none;cursor:pointer;color:var(--ink)}
.chip.active{background:var(--ink);color:var(--paper-2);border-color:var(--ink)}
.empty{opacity:.7;padding:var(--s5) 0}
.modal{position:fixed;inset:0;background:oklch(.15 .05 30/.6);display:none;align-items:center;justify-content:center;z-index:200;padding:var(--s5)}
.modal.show{display:flex}
.modal-box{background:var(--paper-2);border:1px solid var(--rule);padding:var(--s8);width:100%;max-width:560px}
.table-wrap{overflow-x:auto}
@media (max-width:900px){
  .row2,.detail-cols{grid-template-columns:1fr}
  /* iOS Safari zooms the whole page when a focused field is under 16px, and
     these were 15. Amanda taps them on every order — the total, the payment,
     the note — and each tap zoomed in and had to be pinched back out. The
     compact size is kept on desktop, where nothing zooms. */
  .adm input,.adm select,.adm textarea{font-size:16px}
  /* one column, and the summary keeps its DOM position AFTER the steps —
     nobody wants to read a summary of an order they have not made yet */
  .order-layout{grid-template-columns:1fr;gap:var(--s8)}
  .order-summary{position:static}
  .order-summary .summary-note{display:none}
  /* the sticky tally replaces the sidebar as the running total */
  .order-bar{display:block}
  .order-bar[hidden]{display:none}
  /* room so the fixed bar never covers the submit button */
  .order-layout{padding-bottom:var(--s16)}
}
@media (max-width:640px){
  /* the photograph stays beside the name rather than taking a row of its own;
     price and stepper drop to a full-width line underneath */
  .menu-item{grid-template-columns:auto minmax(0,1fr);gap:var(--s3) var(--s4)}
  .menu-item.no-shot{grid-template-columns:1fr}
  .menu-item .fare-buy{grid-column:1/-1}
  /* price on the left, stepper on the right, both on one line */
  .fare-buy{justify-content:space-between;flex-wrap:nowrap;gap:var(--s4)}
  .price.tbq{text-align:left;max-width:11em}
  .adm-section{padding:var(--s5)}
  .order-step,.order-summary{padding:var(--s5)}
  .order-submit{display:block}
  .order-submit .btn{width:100%}
  .order-submit .cal-note{margin-top:var(--s4);text-align:center}
}
"""

# ── the order page ──────────────────────────────────────────────────────
ORDER = D.masthead("Order") + D.head_band("Ordina", "Place an Order",
  "Choose from the bill of fare, tell us when you need it, and we will confirm and let you know the total.") + f"""
<section class="sec" style="background:var(--paper)">
  <div class="wrap">
    <div id="order-app">
      <form id="order-form" class="order-layout" novalidate>
        <div class="order-main">
          <section class="order-step">
            <div class="order-step-head"><span class="order-step-num">I</span><h2>Choose your bread</h2></div>
            <p class="order-step-intro">Everything is baked to order in small batches. Where a price is not shown yet, this is a quote request; Amanda confirms availability, any delivery or shipping cost, and the final total before payment.</p>
            <p class="order-flash" id="order-flash" role="status" hidden></p>
            <div id="menu"><p class="empty">Loading the bill of fare&#8230;</p></div>
          </section>

          <section class="order-step">
            <div class="order-step-head"><span class="order-step-num">II</span><h2>How and when</h2></div>
            <div class="choice" style="margin-bottom:var(--s5)">
          <label><input type="radio" name="fulfillment" value="pickup" checked>
            <span><b>Market pickup</b><small id="pickup-note">Brookings-Harbor Farmers Market, Wednesdays and Saturdays.</small></span></label>
          <label><input type="radio" name="fulfillment" value="delivery">
            <span><b>Local delivery</b><small>Around Brookings and Harbor. Any delivery fee and timing will be confirmed.</small></span></label>
          <label><input type="radio" name="fulfillment" value="shipping">
            <span><b>Shipping</b><small>A flat shipping fee is added to your total; tell us where it is going and we will confirm timing.</small></span></label>
            </div>
            <div class="field">
              <span class="caps" id="date-label">Pickup day</span>
              <div class="cal" id="cal">
                <div class="cal-head"><button type="button" id="cal-prev" aria-label="Previous month">&#8249;</button>
                  <span class="cal-month" id="cal-month"></span>
                  <button type="button" id="cal-next" aria-label="Next month">&#8250;</button></div>
                <div class="cal-grid" id="cal-grid"></div>
                <p class="cal-note" id="cal-note">Gold dot &#8212; a market day.</p>
              </div>
              <input type="hidden" id="needed-date" name="neededDate">
              <p class="err" data-for="needed-date"></p>
            </div>
            <div class="field" id="address-field" hidden>
              <label for="address">Address</label>
              <textarea id="address" name="address" rows="3"></textarea>
              <p class="err" data-for="address"></p>
            </div>
          </section>

          <section class="order-step">
            <div class="order-step-head"><span class="order-step-num">III</span><h2>Tell us who it is for</h2></div>
            <p class="order-step-intro">We will use these details to confirm the order and send the final total.</p>
          <div class="row2">
          <div class="field"><label for="first-name">First name</label><input id="first-name" name="firstName" autocomplete="given-name"><p class="err" data-for="first-name"></p></div>
          <div class="field"><label for="last-name">Last name</label><input id="last-name" name="lastName" autocomplete="family-name"><p class="err" data-for="last-name"></p></div>
        </div>
            <div class="field"><label for="email">Email</label><input id="email" name="email" type="email" autocomplete="email"><p class="err" data-for="email"></p></div>
            <div class="field"><label for="phone">Phone <span class="opt" id="phone-opt">(optional)</span></label><input id="phone" name="phone" type="tel" autocomplete="tel"><p class="err" data-for="phone"></p></div>
            <div class="field">
              <label class="gift-check"><input type="checkbox" id="is-gift" name="isGift">
                <span><b>This is a gift</b><small>We will not email the address above &#8212; so if it belongs to
                  whoever the bread is for, the surprise keeps. Leave a phone number and Amanda
                  confirms the order and the total with you directly.</small></span></label>
            </div>
            <div class="field"><label for="notes">Notes for Amanda <span class="opt">(optional)</span></label>
              <p class="field-help">Anything we should know &#8212; an occasion, an allergy, or a request for one of the bakes.</p>
              <textarea id="notes" name="notes" rows="3" placeholder="Extra crisp on the Roasted Garlic Boss, please&#8230;"></textarea></div>
            <div class="order-submit">
              <button type="submit" class="btn btn-fill" id="submit">Send the Order</button>
              <p class="cal-note">Nothing is charged online. We confirm availability, costs, and every order by email.</p>
            </div>
            <p class="cal-note">We cannot promise an allergen-free kitchen; please tell us about allergies before we confirm.</p>
            <div id="form-msg" class="msg" role="status" aria-live="polite"></div>
          </section>
        </div>

        <aside class="order-summary">
          <p class="caps" style="color:var(--olive)">Your order</p>
          <h2>From the tray</h2>
          <div id="cart-lines" class="cart-lines"><p class="cart-empty">Nothing chosen yet.</p></div>
          <div class="cart-total"><span>Total</span><span id="cart-total">&#8212;</span></div>
          <p id="cart-note" class="cal-note"></p>
          <p class="summary-note">Choose your loaves on the left, then tell us how and when you would like them.</p>
          <div class="order-reassurance"><strong>Made for your table</strong>Every order is baked in small batches and confirmed by Amanda before anything is final.</div>
        </aside>
      </form>

      <div class="order-bar" id="order-bar" hidden>
        <div class="order-bar-in">
          <div class="order-bar-tally">
            <span class="order-bar-count" id="bar-count">Nothing chosen</span>
            <span class="order-bar-total" id="bar-total">&#8212;</span>
          </div>
          <button type="button" class="btn btn-fill" id="bar-review">Review order</button>
        </div>
      </div>
    </div>

    <div id="confirmation" hidden>
      <div class="confirm">
        <div style="display:flex;justify-content:center;margin-bottom:var(--s5)">{D.olive_rule(170)}</div>
        <p class="caps" style="color:var(--olive)">Grazie</p>
        <h2 style="font-size:var(--xxl);margin-block:var(--s3) var(--s5)" id="confirm-title">Your order is in</h2>
        <p style="font-size:var(--lg);font-style:italic;opacity:.8" id="confirm-lead" role="status" aria-live="polite"></p>
        <div id="confirm-lines" class="cart-lines" style="text-align:left;max-width:380px;margin:var(--s8) auto"></div>
        <p style="opacity:.74;font-size:var(--sm)" id="confirm-foot"></p>
        <div style="margin-top:var(--s8);display:flex;gap:var(--s4);justify-content:center;flex-wrap:wrap">
          <a href="#" class="btn btn-line">Home</a>
          <button type="button" class="btn btn-fill" id="order-again">Order Something Else</button>
        </div>
      </div>
    </div>
  </div>
</section>

<section class="sec" style="background:var(--paper-3);border-block:1px solid var(--rule)">
  <div class="wrap">
    <p class="caps kicker">Come Funziona</p>
    <h2 class="h-sec">How ordering works</h2>
    {D.dimple_rule()}
    <div class="grid g4">
      <div class="plate"><p class="roman">I</p><h3>Choose</h3><p>Pick your bread and how many. Mix and match across the bill of fare.</p></div>
      <div class="plate"><p class="roman">II</p><h3>Tell us when</h3><p>Market pickup on a Wednesday or Saturday, or delivery and shipping on the day you need it.</p></div>
      <div class="plate"><p class="roman">III</p><h3>We confirm</h3><p>You get a thank-you straight away and a confirmation from Amanda with the total.</p></div>
      <div class="plate"><p class="roman">IV</p><h3>Collect</h3><p>Come to the stall, or wait for the knock at the door. Warm, if we can manage it.</p></div>
    </div>
  </div>
</section>

<section class="sec" style="background:var(--paper-3);border-block:1px solid var(--rule)">
  <div class="narrow">
    <p class="caps kicker">Prima di ordinare</p>
    <h2 class="h-sec">A few useful things to know</h2>
    {D.dimple_rule()}
    <ul style="display:grid;gap:var(--s4);opacity:.86">
      <li>Orders are requests until Amanda confirms availability and the final total.</li>
      <li>For changes or cancellations, email <a href="#">info@ohyoufancyfocaccia.com</a> as soon as possible.</li>
      <li>Shipping is charged at a flat fee, shown in your total before you send the order. Delivery availability and timing depend on the destination.</li>
      <li>Please disclose allergies in the notes; we will tell you what we can safely accommodate.</li>
      <li>Pickup is at the Brookings-Harbor Farmers Market on Wednesdays and Saturdays from 9am; exact arrangements are confirmed by email.</li>
    </ul>
  </div>
</section>
""" + D.FOOTER

# ── admin sign-in ───────────────────────────────────────────────────────
ADMIN_LOGIN = D.masthead("Order") + f"""
<section class="sec" style="background:var(--paper)">
  <div class="narrow" style="max-width:460px">
    <div class="cart" style="position:static">
      <div style="display:flex;justify-content:center;margin-bottom:var(--s5)">{D.olive_rule(150)}</div>
      <p class="caps" style="color:var(--olive);text-align:center">Il Registro</p>
      <h1 style="font-size:var(--xl);text-align:center;margin-block:var(--s3) var(--s8)">Sign in</h1>
      <form id="login-form" novalidate>
        <div class="field"><label for="username">Username</label><input id="username" name="username" autocomplete="username" autofocus></div>
        <div class="field"><label for="password">Password</label><input id="password" name="password" type="password" autocomplete="current-password"></div>
        <button type="submit" class="btn btn-fill" style="width:100%" id="login-submit">Sign In</button>
        <div id="login-msg" class="msg" role="status" aria-live="polite"></div>
      </form>
    </div>
  </div>
</section>
""" + D.FOOTER

# ── the admin ───────────────────────────────────────────────────────────
def _tab(key, label, count=False):
    n = f'<span class="n" id="count-{key}" hidden>0</span>' if count else ''
    return f'<button class="adm-tab{" active" if key=="orders" else ""}" data-tab="{key}">{label}{n}</button>'

ADMIN = D.masthead("Order") + f"""
<section style="background:var(--paper)">
  <div class="wrap">
    <div class="adm-bar">
      <div><p class="caps" style="color:var(--olive)">Il Registro</p>
        <h1 style="font-size:var(--xl);margin-top:var(--s2)">The Order Book</h1></div>
      <div style="display:flex;gap:var(--s3);align-items:center">
        <a href="#" class="btn btn-line btn-sm">View the Order Page</a>
        <button type="button" class="btn btn-fill btn-sm" id="sign-out">Sign Out</button>
      </div>
    </div>
    <div class="adm-tabs">
      {_tab("orders","Orders",True)}{_tab("menu","Menu")}{_tab("customers","Customers")}
      {_tab("blocks","Days Off")}{_tab("reviews","Reviews",True)}{_tab("settings","Settings")}
    </div>

    <div class="adm-panel active" data-panel="orders">
      <div class="adm-section">
        <div style="display:flex;justify-content:space-between;align-items:baseline;gap:var(--s4);flex-wrap:wrap">
          <h2>Orders</h2>
          <button type="button" class="btn btn-line btn-sm" id="toggle-manual">Add an order by hand</button>
        </div>
        <form id="manual-form" hidden style="margin-block:var(--s5) var(--s8);padding:var(--s6);background:var(--paper);border:1px dashed var(--rule)" novalidate>
          <p style="font-size:var(--sm);opacity:.82;margin-bottom:var(--s5)">For orders taken at the stall, by phone or by message. Nothing is emailed until you send it.</p>
          <div class="row2">
            <div class="field"><label for="mo-first">First name</label><input id="mo-first"></div>
            <div class="field"><label for="mo-last">Last name</label><input id="mo-last"></div>
            <div class="field"><label for="mo-email">Email</label><input id="mo-email" type="email"></div>
            <div class="field"><label for="mo-phone">Phone</label><input id="mo-phone" type="tel"></div>
            <div class="field"><label for="mo-fulfillment">How</label><select id="mo-fulfillment">
              <option value="pickup">Market pickup</option><option value="delivery">Local delivery</option><option value="shipping">Shipping</option></select></div>
            <div class="field"><label for="mo-date">Date</label><input id="mo-date" type="date"></div>
          </div>
          <div class="field"><label for="mo-address">Address (delivery / shipping)</label><input id="mo-address"></div>
          <div class="field"><span class="caps">Items</span><div id="mo-items" class="choice" style="grid-template-columns:repeat(auto-fill,minmax(240px,1fr))"></div></div>
          <div class="field"><label for="mo-notes">Notes</label><textarea id="mo-notes" rows="2"></textarea></div>
          <button type="submit" class="btn btn-fill btn-sm" id="mo-submit">Add Order</button>
          <div id="mo-msg" class="msg"></div>
        </form>
        <div class="chips" id="order-filters">
          <button type="button" class="chip active" data-filter="open">Open</button>
          <button type="button" class="chip" data-filter="pending">Pending</button>
          <button type="button" class="chip" data-filter="accepted">Accepted</button>
          <button type="button" class="chip" data-filter="completed">Completed</button>
          <button type="button" class="chip" data-filter="all">All</button>
        </div>
        <div class="table-wrap"><table class="adm" id="orders-table">
          <thead><tr><th>Date</th><th>Customer</th><th>Items</th><th>Status</th><th>Total</th><th>Paid</th><th></th></tr></thead>
          <tbody id="orders-body"></tbody></table></div>
        <p class="empty" id="orders-empty" hidden>No orders here.</p>
      </div>
    </div>

    <div class="adm-panel" data-panel="menu">
      <div class="adm-section">
        <h2>The Bill of Fare</h2>
        <p style="font-size:var(--sm);opacity:.82;margin-bottom:var(--s5)">What customers can order, and what it costs. An item without a price is still orderable &#8212; you quote it when you confirm. Untick <em>available</em> to take something off the menu for a while. <em>Photo</em> is the file name of a picture in the site&#8217;s image folder, like <code>savory-round.webp</code> &#8212; it shows beside the bake on the order page. Leave it empty for none.</p>
        <div class="table-wrap"><table class="adm" id="menu-table">
          <thead><tr><th>Course</th><th>Name</th><th>Description</th><th>Price</th><th>Photo</th><th>Available</th><th></th></tr></thead>
          <tbody id="menu-body"></tbody></table></div>
        <form id="menu-add" style="margin-top:var(--s8);padding:var(--s6);background:var(--paper);border:1px dashed var(--rule)" novalidate>
          <p class="caps" style="color:var(--olive);margin-bottom:var(--s4)">Add an item</p>
          <div class="row2">
            <div class="field"><label for="mi-course">Course</label><select id="mi-course"></select></div>
            <div class="field"><label for="mi-name">Name</label><input id="mi-name"></div>
            <div class="field"><label for="mi-price">Price ($)</label><input id="mi-price" type="number" min="0" step="0.01" placeholder="leave blank to quote"></div>
            <div class="field"><label for="mi-desc">Description</label><input id="mi-desc"></div>
            <div class="field"><label for="mi-image">Photo <span class="opt">(optional)</span></label><input id="mi-image" placeholder="savory-round.webp"></div>
          </div>
          <button type="submit" class="btn btn-fill btn-sm">Add to the Menu</button>
          <div id="menu-msg" class="msg"></div>
        </form>
      </div>
    </div>

    <div class="adm-panel" data-panel="customers">
      <div class="adm-section">
        <h2>Customers</h2>
        <div class="table-wrap"><table class="adm">
          <thead><tr><th>Name</th><th>Email</th><th>Phone</th><th>Orders</th><th>Spent</th><th>Last order</th><th></th></tr></thead>
          <tbody id="customers-body"></tbody></table></div>
        <p class="empty" id="customers-empty" hidden>No customers yet.</p>
      </div>
    </div>

    <div class="adm-panel" data-panel="blocks">
      <div class="adm-section">
        <h2>Days Off</h2>
        <p style="font-size:var(--sm);opacity:.82;margin-bottom:var(--s5)">Dates you are not baking. They are greyed out on the order page, and an order for one of them cannot be accepted.</p>
        <form id="block-form" novalidate>
          <div class="row2" style="grid-template-columns:1fr 1fr 2fr auto;align-items:end">
            <div class="field"><label for="block-start">From</label><input id="block-start" type="date"></div>
            <div class="field"><label for="block-end">To</label><input id="block-end" type="date"></div>
            <div class="field"><label for="block-reason">Reason (optional)</label><input id="block-reason"></div>
            <div class="field"><button type="submit" class="btn btn-fill btn-sm">Add</button></div>
          </div>
          <div id="block-msg" class="msg"></div>
        </form>
        <div class="table-wrap"><table class="adm"><thead><tr><th>From</th><th>To</th><th>Reason</th><th></th></tr></thead><tbody id="blocks-body"></tbody></table></div>
        <p class="empty" id="blocks-empty" hidden>No days off booked.</p>
      </div>
    </div>

    <div class="adm-panel" data-panel="reviews">
      <div class="adm-section">
        <h2>Reviews</h2>
        <p style="font-size:var(--sm);opacity:.82;margin-bottom:var(--s5)">Reviews left on the website wait here until you approve them.</p>
        <div class="table-wrap"><table class="adm"><thead><tr><th>Submitted</th><th>Name</th><th>Rating</th><th>Review</th><th>Status</th><th></th></tr></thead><tbody id="reviews-body"></tbody></table></div>
        <p class="empty" id="reviews-empty" hidden>No reviews submitted yet.</p>
      </div>
    </div>

    <div class="adm-panel" data-panel="settings">
      <div class="adm-section">
        <h2>Ordering</h2>
        <form id="settings-form" novalidate>
          <div class="row2">
            <div class="field"><label for="set-notice">Minimum notice (days)</label><input id="set-notice" type="number" min="0" max="60"></div>
            <div class="field"><label for="set-deposit">Deposit to confirm (%)</label><input id="set-deposit" type="number" min="0" max="100"><p class="cal-note">0 means no deposit is asked for.</p></div>
            <div class="field"><label for="set-shipping">Flat shipping fee ($)</label><input id="set-shipping" type="number" min="0" max="1000" step="0.01"><p class="cal-note">Added to every shipped order. Orders already taken keep the fee they were quoted.</p></div>
          </div>
          <div class="field"><label for="set-payment">How customers pay</label><textarea id="set-payment" rows="3"></textarea>
            <p class="cal-note">Shown on the order page and in every confirmation.</p></div>
          <div class="row2">
            <div class="field"><label for="set-venmo">Venmo</label><input id="set-venmo" placeholder="@handle"><p class="cal-note">Shown at the foot of customer emails. Leave empty to keep it out.</p></div>
            <div class="field"><label for="set-applepay">Apple Pay</label><label style="display:flex;gap:.5rem;align-items:center;font-weight:400;min-height:44px"><input id="set-applepay" type="checkbox" style="width:auto"> <span>Say you take Apple Pay too</span></label></div>
          </div>
          <div class="field"><label for="set-pickup">Pickup note</label><textarea id="set-pickup" rows="2"></textarea></div>
          <button type="submit" class="btn btn-fill btn-sm">Save</button>
          <div id="settings-msg" class="msg"></div>
        </form>
        <p id="email-state" class="cal-note" style="margin-top:var(--s5)" role="status" aria-live="polite"></p>
        <button type="button" class="btn btn-line btn-sm" id="email-retry" hidden>Retry failed emails</button>
      </div>
      <div class="adm-section">
        <h2>Change Password</h2>
        <form id="password-form" novalidate>
          <div class="row2">
            <div class="field"><label for="pw-current">Current password</label><input id="pw-current" type="password" autocomplete="current-password"></div>
            <div></div>
            <div class="field"><label for="pw-new">New password</label><input id="pw-new" type="password" autocomplete="new-password"></div>
            <div class="field"><label for="pw-confirm">Confirm new password</label><input id="pw-confirm" type="password" autocomplete="new-password"></div>
          </div>
          <button type="submit" class="btn btn-fill btn-sm">Update Password</button>
          <div id="password-msg" class="msg"></div>
        </form>
      </div>
    </div>
  </div>
</section>

<div class="modal" id="email-modal">
  <div class="modal-box">
    <p class="caps" style="color:var(--olive);margin-bottom:var(--s4)">Email the customer</p>
    <div class="field"><label for="email-subject">Subject</label><input id="email-subject"></div>
    <div class="field"><label for="email-message">Message</label><textarea id="email-message" rows="6"></textarea></div>
    <div style="display:flex;gap:var(--s3);justify-content:flex-end">
      <button type="button" class="btn btn-line btn-sm" id="email-cancel">Cancel</button>
      <button type="button" class="btn btn-fill btn-sm" id="email-send">Send</button>
    </div>
    <div id="email-msg" class="msg"></div>
  </div>
</div>
""" + D.FOOTER

# ── the review form, appended to the reviews page ───────────────────────
REVIEW_FORM = f"""
<section class="sec" style="background:var(--paper)">
  <div class="wrap">
    <p class="caps kicker">Dite La Vostra</p>
    <h2 class="h-sec">More from our customers</h2>
    {D.dimple_rule()}
    <div class="grid g2" id="live-reviews" style="align-items:start"></div>
    <div class="cart" style="position:static;max-width:560px;margin:var(--s12) auto 0">
      <p class="caps" style="color:var(--olive);margin-bottom:var(--s5)">Leave a review</p>
      <form id="review-form" novalidate>
        <div class="field"><label for="rv-name">Your name</label><input id="rv-name" autocomplete="name"></div>
        <div class="field"><label for="rv-rating">Rating</label><select id="rv-rating">
          <option value="5">&#9733;&#9733;&#9733;&#9733;&#9733;</option><option value="4">&#9733;&#9733;&#9733;&#9733;</option>
          <option value="3">&#9733;&#9733;&#9733;</option><option value="2">&#9733;&#9733;</option><option value="1">&#9733;</option></select></div>
        <div class="field"><label for="rv-text">A few words</label><textarea id="rv-text" rows="4"></textarea></div>
        <button type="submit" class="btn btn-fill" style="width:100%">Send</button>
        <div id="rv-website-wrap" class="hp" aria-hidden="true"><label for="rv-website">Website</label><input id="rv-website" name="website" autocomplete="off" tabindex="-1"></div>
        <div id="review-msg" class="msg" role="status" aria-live="polite"></div>
      </form>
    </div>
  </div>
</section>
"""

POLICIES = D.masthead("Policies") + D.head_band("Le Regole", "Before You Order",
  "A clear note on requests, confirmations, allergens, and the information this website needs to serve you.") + f"""
<section class="sec" style="background:var(--paper)">
  <div class="narrow">
    <div class="plate" style="padding:var(--s10);margin-bottom:var(--s8)">
      <h2>Ordering and changes</h2>
      <p>Submitting the order form sends a request. An order is not final until Amanda confirms availability, timing, delivery or shipping details, and the final total by email. There is no online payment or card collection on this website.</p>
      <p>For a change or cancellation, email <a href="#">info@ohyoufancyfocaccia.com</a> as soon as possible. Shipping is a flat fee shown in your total; delivery availability and timing depend on the destination.</p>
    </div>
    <div class="plate" style="padding:var(--s10);margin-bottom:var(--s8)">
      <h2>Allergens and ingredients</h2>
      <p>Please include allergies or dietary questions in your order notes before we confirm. This is a small bakery kitchen, and we cannot promise an allergen-free environment. Amanda will explain what can safely be accommodated.</p>
    </div>
    <div class="plate" style="padding:var(--s10);margin-bottom:var(--s8)">
      <h2>Privacy</h2>
      <p>We use the name, email, phone number, address, order details, and messages you provide to answer questions, prepare orders, and administer the bakery. We do not collect payment card details on this website. Orders and reviews are stored in the bakery's private order system so they can be fulfilled and managed.</p>
      <p>To ask about information associated with your request, email <a href="#">info@ohyoufancyfocaccia.com</a>.</p>
    </div>
    <p class="cal-note">Last updated 09-11-2026. These notes describe the current site behavior; Amanda should confirm the final business policy before publishing.</p>
  </div>
</section>
""" + D.FOOTER

NOT_FOUND = D.masthead("Lost") + f"""
<section class="sec" style="background:var(--paper);text-align:center">
  <div class="narrow">
    <p class="caps kicker">404</p>
    <h1 class="h-sec">That page wandered off.</h1>
    <p style="opacity:.82;margin-bottom:var(--s8)">The bread is still here. Try the bill of fare or send us a note.</p>
    <div style="display:flex;gap:var(--s4);justify-content:center;flex-wrap:wrap">
      <a href="#" class="btn btn-fill">Back to the bakery</a>
      <a href="#" class="btn btn-line">Place an order</a>
    </div>
  </div>
</section>
""" + D.FOOTER
