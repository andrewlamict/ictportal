/* ICT Portal - leaderboard (top 20 per form). Only signed-in students appear. */
(function () {
  'use strict';
  if (window.ICT_EMBED) return;
  var FORMS = ['S4', 'S5', 'S6'], fb, db, user, prof = null, T;
  var esc = function (s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); };
  var css = document.createElement('style');
  css.textContent = '#lb-btn{display:inline-flex;align-items:center;gap:.4rem;border-radius:999px;padding:.32rem .8rem;font-size:.72rem;font-weight:800;color:#fff;background:rgba(234,179,8,.8);border:0;cursor:pointer;white-space:nowrap;flex:none}' +
    '#dk-tools #lb-btn{padding:.3rem .6rem}' +
    '#lb{position:fixed;inset:0;z-index:100000;background:rgba(2,6,23,.65);display:flex;align-items:center;justify-content:center;padding:16px}' +
    '#lb .lb-card{background:#fff;color:#0f172a;border-radius:18px;max-width:520px;width:100%;max-height:88vh;overflow:auto;padding:20px;box-shadow:0 20px 60px rgba(0,0,0,.5);font:15px/1.5 system-ui,sans-serif}' +
    '#lb h3{margin:0 0 4px;font-size:22px}#lb p.s{margin:0 0 12px;color:#475569;font-size:13px}' +
    '#lb .tabs{display:flex;gap:6px;margin:8px 0 12px}#lb .tabs button{flex:1;border:2px solid #cbd5e1;background:#f8fafc;border-radius:10px;padding:6px;font-weight:800;cursor:pointer;color:#0f172a}#lb .tabs button.on{background:#2563eb;border-color:#2563eb;color:#fff}' +
    '#lb ol{list-style:none;margin:0;padding:0}#lb li{display:flex;align-items:center;gap:10px;padding:7px 10px;border-radius:10px}#lb li:nth-child(odd){background:#f1f5f9}#lb li.me{background:#fef08a;font-weight:800}' +
    '#lb .rk{width:34px;text-align:center;font-weight:900}#lb .nm{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap}#lb .pc{font-weight:900;color:#2563eb}#lb small{color:#64748b}' +
    '#lb .bar{height:6px;border-radius:4px;background:#e2e8f0;margin-top:3px;overflow:hidden}#lb .bar i{display:block;height:100%;background:linear-gradient(90deg,#22c55e,#eab308)}' +
    '#lb label{display:block;font-weight:700;margin:10px 0 4px}#lb input[type=text],#lb select{width:100%;padding:8px;border:2px solid #cbd5e1;border-radius:10px;font-size:15px;color:#0f172a;background:#fff}' +
    '#lb .row{display:flex;gap:8px;margin-top:14px;justify-content:flex-end;flex-wrap:wrap}#lb .row button{border:0;border-radius:10px;padding:8px 14px;font-weight:800;cursor:pointer;background:#e2e8f0;color:#0f172a}#lb .row button.go{background:#2563eb;color:#fff}';
  document.head.appendChild(css);

  function pct() { try { return Math.max(0, Math.min(100, Math.round((T.worldLit() || 0) * 100))); } catch (e) { return 0; } }
  function xpNow() { try { return (window.ICTFun.get().xp | 0); } catch (e) { return 0; } }
  var saveT = 0;
  function publish() {
    if (!db || !user || !prof || !prof.form || prof.hide) return Promise.resolve();
    var xp = Math.min(99999, xpNow());
    return db.collection('board').doc(user.uid).set({ name: prof.nick, form: prof.form, pct: pct(), xp: xp, updated: fb.firestore.FieldValue.serverTimestamp() }).catch(function (e) { console.warn('Board save failed', e); });
  }
  function close() { var m = document.getElementById('lb'); if (m) m.remove(); }
  function modal(inner) {
    close(); var m = document.createElement('div'); m.id = 'lb'; m.innerHTML = '<div class="lb-card">' + inner + '</div>';
    m.addEventListener('click', function (e) { if (e.target === m) close(); }); document.body.appendChild(m); return m;
  }
  function profileForm(first) {
    var cur = prof || {}, def = cur.nick || ((user.displayName || 'Student').split(' ')[0]);
    var m = modal('<h3>🏆 Leaderboard profile</h3><p class="s">Other students in your form can see your <b>display name</b>, your <b>% of the world map lit</b> and your XP. Use a nickname if you prefer. Your email is never shown.</p>' +
      '<label for="lb-f">My form</label><select id="lb-f">' + FORMS.map(function (f) { return '<option' + (cur.form === f ? ' selected' : '') + '>' + f + '</option>'; }).join('') + '</select>' +
      '<label for="lb-n">Display name</label><input type="text" id="lb-n" maxlength="20" value="' + esc(def) + '">' +
      '<label style="font-weight:600"><input type="checkbox" id="lb-h"' + (cur.hide ? ' checked' : '') + '> Don\'t show me on the leaderboard</label>' +
      '<div class="row">' + (first ? '<button id="lb-skip">Later</button>' : '<button id="lb-cancel">Cancel</button>') + '<button class="go" id="lb-ok">Save</button></div>');
    var q = function (s) { return m.querySelector(s); };
    var x = q('#lb-skip') || q('#lb-cancel'); x.onclick = close;
    q('#lb-ok').onclick = function () {
      var nick = q('#lb-n').value.trim().slice(0, 20) || 'Student';
      prof = { form: q('#lb-f').value, nick: nick, hide: q('#lb-h').checked };
      try { localStorage.setItem('ictBoard:' + user.uid, JSON.stringify(prof)); } catch (e) {}
      var p = prof.hide ? db.collection('board').doc(user.uid).delete().catch(function () {}) : publish();
      p.then(function () { show(prof.form); });
    };
  }
  function show(form) {
    if (!user) { modal('<h3>🏆 Leaderboard</h3><p class="s">Sign in with Google to join the leaderboard.</p><div class="row"><button id="lb-x">Close</button></div>').querySelector('#lb-x').onclick = close; return; }
    if (!prof || !prof.form) { profileForm(true); return; }
    form = form || prof.form;
    var m = modal('<h3>🏆 Leaderboard</h3><p class="s">Top 20 in each form by % of the world map lit.</p><div class="tabs">' + FORMS.map(function (f) { return '<button data-f="' + f + '"' + (f === form ? ' class="on"' : '') + '>' + f + '</button>'; }).join('') + '</div><div id="lb-list">Loading…</div><div class="row"><button id="lb-prof">My profile</button><button class="go" id="lb-x">Close</button></div>');
    m.querySelector('#lb-x').onclick = close; m.querySelector('#lb-prof').onclick = function () { profileForm(false); };
    [].forEach.call(m.querySelectorAll('.tabs button'), function (b) { b.onclick = function () { show(b.dataset.f); }; });
    publish().then(function () { return db.collection('board').where('form', '==', form).limit(300).get(); }).then(function (snap) {
      var rows = []; snap.forEach(function (d) { var v = d.data(); rows.push({ id: d.id, name: v.name || 'Student', pct: v.pct | 0, xp: v.xp | 0 }); });
      rows.sort(function (a, b) { return b.pct - a.pct || b.xp - a.xp; });
      var top = rows.slice(0, 20), mine = rows.map(function (r) { return r.id; }).indexOf(user.uid);
      var li = function (r, i) { return '<li class="' + (r.id === user.uid ? 'me' : '') + '"><span class="rk">' + (i < 3 ? ['🥇', '🥈', '🥉'][i] : i + 1) + '</span><span class="nm">' + esc(r.name) + (r.id === user.uid ? ' (you)' : '') + '<div class="bar"><i style="width:' + r.pct + '%"></i></div></span><span class="pc">' + r.pct + '%<br><small>' + r.xp + ' XP</small></span></li>'; };
      var h = top.length ? '<ol>' + top.map(li).join('') + '</ol>' : '<p class="s">Nobody in ' + form + ' yet. Be the first!</p>';
      if (mine >= 20) h += '<p class="s" style="margin-top:10px">Your rank in ' + form + ': <b>#' + (mine + 1) + '</b> of ' + rows.length + '</p><ol>' + li(rows[mine], mine) + '</ol>';
      m.querySelector('#lb-list').innerHTML = h;
    }).catch(function (e) { m.querySelector('#lb-list').innerHTML = '<p class="s">Could not load the leaderboard (' + esc(e && e.code || 'error') + '). Ask your teacher to publish the latest Firestore rules.</p>'; });
  }
  function addBtn() {
    if (document.getElementById('lb-btn')) return;
    var b = document.createElement('button'); b.type = 'button'; b.id = 'lb-btn'; b.textContent = '🏆 Top 20'; b.title = 'Leaderboard';
    (document.getElementById('fun-tools') || document.querySelector('nav') || document.body).appendChild(b);
    b.addEventListener('click', function () { show(); });
  }
  window.ICTBoard = {
    open: function () { show(); },
    start: function (f, d, u) {
      fb = f; db = d; user = u; T = window.ICTTour || { worldLit: function () { return 0; } }; addBtn();
      try { prof = JSON.parse(localStorage.getItem('ictBoard:' + u.uid) || 'null'); } catch (e) { prof = null; }
      db.collection('board').doc(u.uid).get().then(function (s) {
        if (s.exists && !prof) { var v = s.data(); prof = { form: v.form, nick: v.name }; try { localStorage.setItem('ictBoard:' + u.uid, JSON.stringify(prof)); } catch (e) {} }
        if (!prof || !prof.form) setTimeout(function () { show(); }, 1200); else publish();
      }).catch(function () {});
      window.addEventListener('ictfun:save', function () { clearTimeout(saveT); saveT = setTimeout(publish, 4000); });
      window.addEventListener('ict:tour', function () { clearTimeout(saveT); saveT = setTimeout(publish, 4000); });
    }
  };
})();
