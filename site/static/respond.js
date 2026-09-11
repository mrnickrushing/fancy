// The accept / decline buttons on the page the order email links to.
(function () {
  var box = document.getElementById('respond'); if (!box) return;
  var msg = document.getElementById('respond-msg');
  var buttons = box.querySelectorAll('button');
  box.addEventListener('click', async function (e) {
    var btn = e.target.closest('button[data-action]'); if (!btn) return;
    buttons.forEach(function (b) { b.disabled = true; });
    try {
      var res = await fetch('/api/orders/' + box.dataset.id + '/respond', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: btn.dataset.action, token: box.dataset.token }),
      });
      var data = await res.json().catch(function () { return {}; });
      msg.style.display = 'block';
      if (res.ok) {
        msg.style.color = 'var(--olive-deep)';
        msg.textContent = btn.dataset.action === 'accept' ? 'Accepted. Send the confirmation from the admin when you are ready.' : 'Declined.';
        box.style.display = 'none';
      } else {
        msg.style.color = 'var(--burgundy)'; msg.textContent = data.error || 'Something went wrong.';
        buttons.forEach(function (b) { b.disabled = false; });
      }
    } catch (err) {
      msg.style.display = 'block'; msg.style.color = 'var(--burgundy)'; msg.textContent = 'Could not reach the server.';
      buttons.forEach(function (b) { b.disabled = false; });
    }
  });
})();
