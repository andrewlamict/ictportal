/* ICT Portal - login gate (Google via Firebase) with guest mode, XP cloud save and a teacher dashboard. */
(function () {
  'use strict';
  if (window.ICT_EMBED) return; /* inside a desktop window: plain page only */
  var F = window.ICTFun || { toast: function () {}, get: function () { return { xp: 0, visited: {}, badges: {} }; }, setUser: function () {}, merge: function () {} };
  var cfg = window.ICT_FIREBASE || {};
  var admins = (window.ICT_ADMINS || []).map(function (x) { return String(x).toLowerCase(); });
  var configured = !!(cfg.apiKey && cfg.projectId);
  var html = document.documentElement;
  var guestFlag = function () { try { return localStorage.getItem('ictGuest') === '1'; } catch (e) { return false; } };
  var setGuest = function (v) { try { v ? localStorage.setItem('ictGuest', '1') : localStorage.removeItem('ictGuest'); } catch (e) {} };

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
    '<button type="button" id="gate-guest" class="gate-btn gate-guest">Continue as guest</button>' +
    '</div>' +
    '<p class="gate-note" id="gate-note"></p>' +
    '<p class="gate-priv">Signing in saves your XP and lets your teacher see your name, email and progress. Guests keep XP on this device only.</p>' +
    '</div>';
  document.body.appendChild(gate);
  var $ = function (s) { return gate.querySelector(s); };
  var note = $('#gate-note');

  function showActions() {
    var chk = $('.gate-checking'); if (chk) chk.hidden = true;
    var a = $('.gate-actions'); if (a) a.hidden = false;
    if (!configured) note.textContent = 'Google sign-in is not switched on yet. You can continue as a guest.';
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
      chip.textContent = '👤 Guest · Sign in';
      chip.title = 'Sign in with Google to save your XP';
      chip.dataset.mode = 'guest';
    }
  }
  paintChip(null);
  chip.addEventListener('click', function () {
    if (chip.dataset.mode === 'user' && fb) { fb.auth().signOut().then(function () { setGuest(false); location.reload(); }); }
    else { setGuest(false); location.reload(); }
  });

  /* ---------- Guest ---------- */
  $('#gate-guest').addEventListener('click', function () { setGuest(true); F.setUser(null); paintChip(null); pass(); });

  /* ---------- Firebase ---------- */
  var fb = null, db = null, uid = null, saveT = 0;
  function load(src) { return new Promise(function (res, rej) { var s = document.createElement('script'); s.src = src; s.onload = res; s.onerror = rej; document.head.appendChild(s); }); }
  var V = '10.12.2', BASE = 'https://www.gstatic.com/firebasejs/' + V + '/';

  function level(xp) { return Math.floor(xp / 50) + 1; }
  function snapshot(u) {
    var s = F.get();
    return { uid: u.uid, name: u.displayName || '', email: u.email || '', photo: u.photoURL || '', xp: s.xp | 0, level: level(s.xp | 0),
      pages: Object.keys(s.visited || {}).length, visited: Object.keys(s.visited || {}), badges: Object.keys(s.badges || {}), books: s.books || {}, lastSeen: fb.firestore.FieldValue.serverTimestamp() };
  }
  function onSignedIn(u) {
    uid = u.uid; setGuest(false);
    F.setUser(uid);
    var ref = db.collection('users').doc(uid);
    ref.get().then(function (d) {
      var c = d.exists ? d.data() : null;
      if (c) F.merge({ xp: c.xp, visited: c.visited || [], badges: c.badges || [], books: c.books || {} });
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
    prov.setCustomParameters({ prompt: 'select_account' });
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
          else if (guestFlag()) { paintChip(null); pass(); }
          else showActions();
        });
      }).catch(function () { configured = false; if (guestFlag()) pass(); else { showActions(); note.textContent = 'Could not reach Google sign-in. You can continue as a guest.'; } });
    setTimeout(function () { if (!passed && !fb) showActions(); }, 6000);
  } else if (guestFlag()) { pass(); }
  else { setTimeout(showActions, 450); }

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
    function render() {
      var q = (m.querySelector('#dash-q').value || '').toLowerCase();
      var body = m.querySelector('.dash-body'); body.textContent = '';
      var t = document.createElement('table');
      var h = t.createTHead().insertRow(); ['Name', 'Email', 'Level', 'XP', 'Pages', 'Visits', 'Last visit'].forEach(function (x) { var th = document.createElement('th'); th.textContent = x; h.appendChild(th); });
      var tb = t.createTBody();
      rows.filter(function (r) { return !q || (r.name + ' ' + r.email).toLowerCase().indexOf(q) >= 0; }).forEach(function (r) {
        var tr = tb.insertRow();
        [r.name, r.email, 'Lv ' + (r.level || 1), r.xp || 0, r.pages || 0, r.visits || 0, fmt(r.lastSeen)].forEach(function (x) { tr.insertCell().textContent = x; });
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
      var csv = 'name,email,level,xp,pages,visits\n' + rows.map(function (r) { return [r.name, r.email, r.level, r.xp, r.pages, r.visits].map(function (x) { return '"' + String(x == null ? '' : x).replace(/"/g, '""') + '"'; }).join(','); }).join('\n');
      navigator.clipboard.writeText(csv).then(function () { F.toast('CSV copied'); }, function () { F.toast('Copy failed'); });
    };
  }
})();
