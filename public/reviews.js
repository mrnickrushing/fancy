// Approved reviews from the order book, and the form that adds to them.
(function () {
  var list = document.getElementById('live-reviews'), form = document.getElementById('review-form');
  if (!list || !form) return;
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function stars(n) { return '★'.repeat(n) + '☆'.repeat(5 - n); }

  async function load() {
    try {
      var res = await fetch('/api/reviews'); if (!res.ok) throw new Error();
      var data = await res.json();
      var reviews = data.reviews || [];
      var section = list.closest('section');
      if (!reviews.length) { list.innerHTML = ''; list.style.display = 'none'; section.querySelector('.h-sec').textContent = 'Tell us what you thought'; return; }
      list.style.display = '';
      list.innerHTML = reviews.map(function (r) {
        return '<div class="plate" style="padding:var(--s10)">' +
          '<p style="color:var(--gold);letter-spacing:.2em;margin-bottom:var(--s3)">' + stars(r.rating) + '</p>' +
          '<p style="font-family:var(--serif);font-size:1.28rem;font-style:italic;line-height:1.56;margin-bottom:var(--s6)">' + esc(r.review) + '</p>' +
          '<p class="caps" style="color:var(--burgundy);font-size:.68rem">' + esc(r.name) + '</p></div>';
      }).join('');
    } catch (err) { list.style.display = 'none'; }
  }

  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    var msg = document.getElementById('review-msg'); msg.className = 'msg';
    var btn = form.querySelector('button[type="submit"]'); btn.disabled = true;
    try {
      var res = await fetch('/api/reviews', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: document.getElementById('rv-name').value.trim(), rating: Number(document.getElementById('rv-rating').value), review: document.getElementById('rv-text').value.trim(), website: document.getElementById('rv-website').value }),
      });
      var data = await res.json().catch(function () { return {}; });
      if (!res.ok) { msg.textContent = data.error || 'Could not send that.'; msg.className = 'msg show error'; return; }
      form.reset(); msg.textContent = 'Thank you! Your review will appear once Amanda has read it.'; msg.className = 'msg show ok';
    } catch (err) { msg.textContent = 'Could not reach the bakery just now.'; msg.className = 'msg show error'; }
    finally { btn.disabled = false; }
  });
  load();
})();
