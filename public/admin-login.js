(function () {
  var form = document.getElementById('login-form'); if (!form) return;
  var msg = document.getElementById('login-msg'), btn = document.getElementById('login-submit');
  form.addEventListener('submit', async function (e) {
    e.preventDefault();
    msg.className = 'msg'; btn.disabled = true;
    try {
      var res = await fetch('/admin/login', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: document.getElementById('username').value.trim(), password: document.getElementById('password').value }),
      });
      var data = await res.json().catch(function () { return {}; });
      if (!res.ok) { msg.textContent = data.error || 'Could not sign in.'; msg.className = 'msg show error'; return; }
      window.location.href = '/admin';
    } catch (err) {
      msg.textContent = 'Could not reach the server.'; msg.className = 'msg show error';
    } finally { btn.disabled = false; }
  });
})();
