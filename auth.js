/* ICT Portal - login gate (Google via Firebase) school accounts only, XP cloud save and a teacher dashboard. */
(function () {
  'use strict';
  if (window.ICT_EMBED) return; /* inside a desktop window: plain page only */
  var F = window.ICTFun || { toast: function () {}, get: function () { return { xp: 0, visited: {}, badges: {} }; }, setUser: function () {}, merge: function () {} };
  var cfg = window.ICT_FIREBASE || {};
  var admins = (window.ICT_ADMINS || []).map(function (x) { return String(x).toLowerCase(); });
  var configured = !!(cfg.apiKey && cfg.projectId);
  var html = document.documentElement;
  var DOMAIN = String(window.ICT_DOMAIN || 'stcc.edu.hk').toLowerCase();
  var allowed = function (u) { var e = String(u && u.email || '').toLowerCase(); return !!u && u.emailVerified !== false && (e.slice(-(DOMAIN.length + 1)) === '@' + DOMAIN || admins.indexOf(e) > -1); };
  var setAuthed = function (v) { try { v ? localStorage.setItem('ictAuthed', '1') : localStorage.removeItem('ictAuthed'); } catch (e) {} };
  var guestFlag = function () { return false; };
  var setGuest = function () {};

  var G_LOGO = '<svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true"><path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.6 17.7 9.5 24 9.5z"/><path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z"/><path fill="#FBBC05" d="M10.5 28.7A14.5 14.5 0 0 1 9.5 24c0-1.6.3-3.2.8-4.7l-7.9-6.1A24 24 0 0 0 0 24c0 3.9.9 7.5 2.6 10.8l7.9-6.1z"/><path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.9 2.3-8.4 2.3-6.3 0-11.6-4.1-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z"/></svg>';

  /* ---------- Gate ---------- */
  var gate = document.createElement('div');
  gate.id = 'gate';
  gate.innerHTML =
    '<div class="gate-emoji" aria-hidden="true"><span>🐞</span><span>💻</span><span>📡</span><span>🔐</span><span>🧠</span><span>📊</span></div>' +
    '<div class="gate-card">' +
    '<div class="gate-logo">ICT <span>PORTAL</span></div>' +
    '<p class="gate-sub">Practice, play and track your XP.</p>' +
    '<div class="gate-checking"><i></i> Checking sign-in…</div>' +
    '<div class="gate-actions" hidden>' +
    '<button type="button" id="gate-google" class="gate-btn gate-google">' + G_LOGO + '<span>Sign in with Google</span></button>' +
    '</div>' +
    '<p class="gate-note" id="gate-note"></p>' +
    '<p class="gate-priv">Sign in with your <b>@stcc.edu.hk</b> school Google account. Your XP is saved and your teacher can see your name, email and progress.</p>' +
    '</div>';
  document.body.appendChild(gate);
  var $ = function (s) { return gate.querySelector(s); };
  var note = $('#gate-note');

  function showActions() {
    var chk = $('.gate-checking'); if (chk) chk.hidden = true;
    var a = $('.gate-actions'); if (a) a.hidden = false;
    if (!configured) note.textContent = 'Google sign-in is not switched on yet. Please ask your teacher.';
  }
  var passed = false;
  function pass() {
    if (passed) return; passed = true;
    html.classList.remove('gate-on');
    gate.classList.add('leave');
    setTimeout(function () { gate.remove(); }, 800);
    if (F.confetti && !guestFlag()) F.confetti({ particleCount: 70, spread: 70, origin: { y: .3 } });
  }

  /* ---------- User chip in the nav ---------- */
  var chip = document.createElement('button');
  chip.id = 'user-chip'; chip.type = 'button';
  var tools = document.getElementById('fun-tools');
  (tools || document.querySelector('nav')).appendChild(chip);
  function paintChip(u) {
    chip.textContent = '';
    if (u) {
      if (u.photoURL) { var im = document.createElement('img'); im.src = u.photoURL; im.alt = ''; im.referrerPolicy = 'no-referrer'; chip.appendChild(im); }
      var nm = document.createElement('span'); nm.textContent = (u.displayName || u.email || 'Student').split(' ')[0]; chip.appendChild(nm);
      chip.title = 'Signed in as ' + (u.email || '') + '. Click to sign out.';
      chip.dataset.mode = 'user';
    } else {
      chip.textContent = '🔒 Sign in';
      chip.title = 'Sign in with your school Google account';
      chip.dataset.mode = 'guest';
    }
  }
  paintChip(null);
  chip.addEventListener('click', function () {
    if (chip.dataset.mode === 'user' && fb) { fb.auth().signOut().then(function () { setAuthed(false); location.reload(); }); }
    else { setGuest(false); location.reload(); }
  });

  /* ---------- Guest ---------- */

  /* ---------- Firebase ---------- */
  var fb = null, db = null, uid = null, saveT = 0;
  function load(src) { return new Promise(function (res, rej) { var s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s); }); }
  var V = '10.12.2', BASE = 'https://www.gstatic.com/firebasejs/' + V + '/';

  function level(xp) { return Math.floor(xp / 50) + 1; }
  function snapshot(u) {
    var s = F.get();
    return { uid: u.uid, name: u.displayName || '', email: u.email || '', photo: u.photoURL || '', xp: s.xp | 0, level: level(s.xp | 0),
      pages: Object.keys(s.visited || {}).length, visited: Object.keys(s.visited || {}), badges: Object.keys(s.badges || {}), books: s.books || {}, qlog: (F.qlog ? F.qlog() : {}), lastSeen: fb.firestore.FieldValue.serverTimestamp() };
  }
  function onSignedIn(u) {
    if (!allowed(u)) { setAuthed(false); fb.auth().signOut().then(function () { html.classList.add('gate-on'); showActions(); note.textContent = 'Only @' + DOMAIN + ' school accounts can enter. ' + (u.email || 'That account') + ' is not allowed. Please choose your school account.'; }); return; }
    setAuthed(true);
    uid = u.uid; setGuest(false);
    F.setUser(uid);
    var ref = db.collection('users').doc(uid);
    ref.get().then(function (d) {
      var c = d.exists ? d.data() : null;
      if (c) F.merge({ xp: c.xp, visited: c.visited || [], badges: c.badges || [], books: c.books || {}, qlog: c.qlog || {} });
      var data = snapshot(u);
      data.visits = fb.firestore.FieldValue.increment(1);
      if (!c) data.firstSeen = fb.firestore.FieldValue.serverTimestamp();
      var counted = false; try { counted = sessionStorage.getItem('ictVisit') === uid; sessionStorage.setItem('ictVisit', uid); } catch (e) {}
      if (counted) delete data.visits;
      return ref.set(data, { merge: true });
    }).catch(function (e) { console.warn('Cloud load failed', e); }).then(function () {
      paintChip(u); pass(); showAdmin(u); if (window.ICTBoard) window.ICTBoard.start(fb, db, u);
      if (F.toast) F.toast('Welcome, ' + ((u.displayName || 'student').split(' ')[0]) + '! 🎉');
    });
  }
  window.addEventListener('ictfun:save', function () {
    if (!uid || !db) return;
    clearTimeout(saveT);
    saveT = setTimeout(function () {
      var u = fb.auth().currentUser; if (!u) return;
      var d = snapshot(u); delete d.uid; delete d.name; delete d.email; delete d.photo;
      db.collection('users').doc(uid).set(d, { merge: true }).catch(function (e) { console.warn('Save failed', e); });
    }, 1500);
  });

  $('#gate-google').addEventListener('click', function () {
    if (!configured) { F.toast('Google sign-in is not set up yet. See SETUP.md.'); return; }
    if (!fb) { F.toast('Sign-in is still loading, try again in a moment.'); return; }
    var prov = new fb.auth.GoogleAuthProvider();
    prov.setCustomParameters({ prompt: 'select_account', hd: DOMAIN });
    fb.auth().signInWithPopup(prov).catch(function (e) {
      if (e && e.code === 'auth/popup-blocked') { fb.auth().signInWithRedirect(prov); return; }
      if (e && e.code === 'auth/popup-closed-by-user') return;
      note.textContent = 'Sign-in failed (' + (e && e.code || 'error') + '). Check that this site is in the Firebase authorized domains.';
    });
  });

  if (configured) {
    load(BASE + 'firebase-app-compat.js').then(function () { return load(BASE + 'firebase-auth-compat.js'); })
      .then(function () { return load(BASE + 'firebase-firestore-compat.js'); })
      .then(function () {
        fb = window.firebase; fb.initializeApp(cfg); db = fb.firestore();
        fb.auth().onAuthStateChanged(function (u) {
          if (u) onSignedIn(u);
          else { setAuthed(false); html.classList.add('gate-on'); showActions(); }
        });
      }).catch(function () { configured = false; showActions(); note.textContent = 'Could not reach Google sign-in. Check your internet connection and reload the page.'; });
    setTimeout(function () { if (!passed && !fb) showActions(); }, 6000);
  } else { setTimeout(showActions, 450); }

  /* ---------- Teacher dashboard ---------- */
  function showAdmin(u) {
    if (!u.email || admins.indexOf(u.email.toLowerCase()) < 0) return;
    var b = document.createElement('button');
    b.type = 'button'; b.id = 'class-btn'; b.textContent = '👩‍🏫 Class'; b.title = 'See who has used the portal';
    (document.getElementById('fun-tools') || document.querySelector('nav')).appendChild(b);
    b.addEventListener('click', openDash);
  }
  function openDash() {
    var m = document.createElement('div'); m.id = 'dash';
    m.innerHTML = '<div class="dash-card"><div class="dash-top"><h3>Class activity</h3><input id="dash-q" placeholder="Search name or email" aria-label="Search"><button id="dash-copy" type="button">Copy CSV</button><button id="dash-x" type="button" aria-label="Close">✕</button></div><div class="dash-body"><div class="dash-load">Loading…</div></div></div>';
    document.body.appendChild(m);
    var rows = [];
    m.querySelector('#dash-x').onclick = function () { m.remove(); };
    m.addEventListener('click', function (e) { if (e.target === m) m.remove(); });
    function fmt(ts) { try { return ts.toDate().toLocaleString('en-HK', { dateStyle: 'medium', timeStyle: 'short' }); } catch (e) { return '-'; } }
    function chName(id) { var T = window.ICTTour, c = T && T.chapters.filter(function (x) { return x.id === id; })[0]; return c ? c.code : id; }
    function summary(r) {
      var mc = 0, at = 0, ok = 0, g = 0, bk = r.books || {};
      Object.keys(bk).forEach(function (b) { mc += Object.keys(bk[b].mc || {}).length; g += Object.keys(bk[b].games || {}).length; Object.keys(bk[b].stat || {}).forEach(function (c) { at += bk[b].stat[c][0]; ok += bk[b].stat[c][1]; }); });
      return { mc: mc, games: g, att: at, ok: ok, acc: at ? Math.round(ok * 100 / at) + '%' : '-' };
    }
    function detail(r) {
      var T = window.ICTTour, P = (window.ICTNav && window.ICTNav.pages) || {}, bk = r.books || {}, sm = summary(r), body = m.querySelector('.dash-body'), h = '';
      h += '<p><button type="button" class="dash-det" id="dash-back">← All students</button></p><h4 style="margin:.4rem 0">' + esc(r.name || r.email) + ' <small style="color:#64748b">' + esc(r.email || '') + '</small></h4>';
      h += '<p class="dash-count">Level ' + (r.level || 1) + ' · ' + (r.xp || 0) + ' XP · ' + sm.mc + ' MC questions answered correctly · ' + sm.games + ' games done · overall accuracy <b>' + sm.acc + '</b> (' + sm.ok + ' correct of ' + sm.att + ' attempts)</p>';
      h += '<table><thead><tr><th>Chapter</th><th>MC correct</th><th>Attempts</th><th>Accuracy</th><th>Games finished</th></tr></thead><tbody>';
      var any = false;
      (T ? T.chapters : []).forEach(function (c) {
        var b = bk[c.book] || {}, pre = c.n + ':', mc = Object.keys(b.mc || {}).filter(function (k) { return k.indexOf(pre) === 0; }).length, st = (b.stat || {})[c.n] || [0, 0],
          gm = Object.keys(b.games || {}).filter(function (id) { return T.chapterOfGame(id) === c.id; });
        if (!mc && !st[0] && !gm.length) return; any = true;
        h += '<tr><td><b>' + esc(c.code) + '</b></td><td>' + mc + '</td><td>' + (st[0] || '-') + '</td><td>' + (st[0] ? Math.round(st[1] * 100 / st[0]) + '%' : '-') + '</td><td style="white-space:normal">' + (gm.length ? gm.map(function (id) { return esc((P[id] && P[id].t) || id); }).join(', ') : '-') + '</td></tr>';
      });
      h += '</tbody></table>' + (any ? '' : '<p class="dash-count">No MC or game activity yet.</p>') + '<p class="dash-count">Accuracy counts every MC Trainer answer since the tracking update; older answers show as correct only.</p>';
      var ql = r.qlog || {}, bt = {}, ty = {};
      Object.keys(ql).forEach(function (k) { var x = ql[k], t = x.t || '?', y = x.y || '?'; var o = bt[t] = bt[t] || { a: 0, c: 0, w: 0, fix: 0 }; o.a += x.a || 0; o.c += x.c || 0; if (x.w > 0) { o.w++; if ((x.f || 0) >= 2) o.fix++; } var p = ty[y] = ty[y] || { a: 0, c: 0 }; p.a += x.a || 0; p.c += x.c || 0; });
      var pc = function (o) { return o.a ? Math.round(o.c * 100 / o.a) + '%' : '-'; };
      if (Object.keys(bt).length) {
        h += '<h4 style="margin:1rem 0 .3rem">MC Trainer by topic (weakest first)</h4><table><thead><tr><th>Topic</th><th>Answers</th><th>Accuracy</th><th>Wrong questions</th><th>Fixed</th></tr></thead><tbody>' +
          Object.keys(bt).sort(function (p, q) { return (bt[p].a ? bt[p].c / bt[p].a : 2) - (bt[q].a ? bt[q].c / bt[q].a : 2); }).map(function (t) { var o = bt[t]; return '<tr><td><b>' + esc(t) + '</b></td><td>' + o.a + '</td><td>' + pc(o) + '</td><td>' + o.w + '</td><td>' + o.fix + '</td></tr>'; }).join('') + '</tbody></table>' +
          '<h4 style="margin:1rem 0 .3rem">By question type</h4><table><thead><tr><th>Type</th><th>Answers</th><th>Accuracy</th></tr></thead><tbody>' +
          Object.keys(ty).map(function (t) { return '<tr><td><b>' + esc(t) + '</b></td><td>' + ty[t].a + '</td><td>' + pc(ty[t]) + '</td></tr>'; }).join('') + '</tbody></table>';
      }
      body.innerHTML = h; body.querySelector('#dash-back').onclick = render;
    }
    function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
    var sortK = 'xp', sortD = -1;
    var COLS = [{ t: 'Name', k: 'name' }, { t: 'Email', k: 'email' }, { t: 'Level', k: 'level' }, { t: 'XP', k: 'xp' }, { t: 'MC correct', k: 'mc' }, { t: 'Accuracy', k: 'acc' }, { t: 'Games', k: 'games' }, { t: 'Visits', k: 'visits' }, { t: 'Last visit', k: 'last' }];
    function val(r, k) {
      var sm = summary(r);
      switch (k) {
        case 'name': return String(r.name || '').toLowerCase(); case 'email': return String(r.email || '').toLowerCase();
        case 'level': return r.level || 1; case 'xp': return r.xp || 0; case 'mc': return sm.mc;
        case 'acc': return sm.att ? sm.ok / sm.att : -1; case 'games': return sm.games; case 'visits': return r.visits || 0;
        case 'last': try { return r.lastSeen.toMillis(); } catch (e) { return 0; }
      }
      return 0;
    }
    function view() {
      var q = (m.querySelector('#dash-q').value || '').toLowerCase();
      return rows.filter(function (r) { return !q || ((r.name || '') + ' ' + (r.email || '')).toLowerCase().indexOf(q) >= 0; }).sort(function (a, b) {
        var x = val(a, sortK), y = val(b, sortK), c = typeof x === 'string' ? x.localeCompare(y, undefined, { numeric: true }) : x - y;
        return (c || (val(b, 'xp') - val(a, 'xp'))) * (c ? sortD : 1);
      });
    }
    function render() {
      var q = (m.querySelector('#dash-q').value || '').toLowerCase();
      var body = m.querySelector('.dash-body'); body.textContent = '';
      var t = document.createElement('table');
      var h = t.createTHead().insertRow();
      COLS.forEach(function (c) {
        var th = document.createElement('th'); th.className = 'dash-sort' + (sortK === c.k ? ' on' : ''); th.tabIndex = 0; th.title = 'Sort by ' + c.t;
        th.textContent = c.t + (sortK === c.k ? (sortD > 0 ? ' ▲' : ' ▼') : ' ↕');
        var go = function () { if (sortK === c.k) sortD = -sortD; else { sortK = c.k; sortD = c.k === 'name' || c.k === 'email' ? 1 : -1; } render(); };
        th.onclick = go; th.onkeydown = function (e) { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); go(); } }; h.appendChild(th);
      });
      h.appendChild(document.createElement('th'));
      var tb = t.createTBody();
      view().forEach(function (r) {
        var tr = tb.insertRow();
        var sm = summary(r); [r.name, r.email, 'Lv ' + (r.level || 1), r.xp || 0, sm.mc, sm.acc, sm.games, r.visits || 0, fmt(r.lastSeen)].forEach(function (x) { tr.insertCell().textContent = x; });
        var bt = document.createElement('button'); bt.type = 'button'; bt.textContent = 'Details'; bt.className = 'dash-det'; bt.onclick = function () { detail(r); }; tr.insertCell().appendChild(bt);
      });
      body.appendChild(t);
      var cnt = document.createElement('p'); cnt.className = 'dash-count'; cnt.textContent = rows.length + ' students have signed in.'; body.appendChild(cnt);
    }
    db.collection('users').get().then(function (snap) {
      rows = snap.docs.map(function (d) { return d.data(); }).sort(function (a, b) { return (b.xp || 0) - (a.xp || 0); });
      render();
    }).catch(function (e) { m.querySelector('.dash-body').textContent = 'Could not load: ' + (e && e.code || e) + '. Check the Firestore rules and your ICT_ADMINS email.'; });
    m.querySelector('#dash-q').addEventListener('input', render);
    m.querySelector('#dash-copy').onclick = function () {
      var csv = 'name,email,level,xp,mc_correct,accuracy,games,visits\n' + view().map(function (r) { var sm = summary(r); return [r.name, r.email, r.level, r.xp, sm.mc, sm.acc, sm.games, r.visits].map(function (x) { return '"' + String(x == null ? '' : x).replace(/"/g, '""') + '"'; }).join(','); }).join('\n');
      navigator.clipboard.writeText(csv).then(function () { F.toast('CSV copied'); }, function () { F.toast('Copy failed'); });
    };
  }
})();
