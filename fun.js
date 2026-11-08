/* ICT Portal - fun layer. Everything is wrapped in try/catch-style guards so the portal still works if anything here fails. */
(function () {
  'use strict';
  if (window.ICT_EMBED) return; /* inside a desktop window: plain page only */
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var finePointer = window.matchMedia && matchMedia('(pointer: fine)').matches;

  var store = {
    get: function (k, d) { try { var v = JSON.parse(localStorage.getItem(k)); return v === null ? d : v; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  };
  var rand = function (a, b) { return a + Math.random() * (b - a); };
  var confetti = function (o) { if (window.confetti && !reduce) window.confetti(o); };

  /* ---------- Toasts ---------- */
  var toastBox = document.createElement('div');
  toastBox.id = 'fun-toasts';
  document.body.appendChild(toastBox);
  function toast(msg, life) {
    var t = document.createElement('div');
    t.className = 'fun-toast';
    t.style.setProperty('--life', (life || 2.6) + 's');
    t.textContent = msg;
    toastBox.appendChild(t);
    setTimeout(function () { t.remove(); }, ((life || 2.6) + 0.5) * 1000);
  }

  /* ---------- XP / levels ---------- */
  var KEY = 'ictFun';
  var fresh = function () { return { xp: 0, visited: {}, badges: {}, books: {} }; };
  var state = store.get(KEY, fresh());
  function persist() { store.set(KEY, state); try { window.dispatchEvent(new Event('ictfun:save')); } catch (e) {} }
  var chip = document.createElement('div');
  chip.id = 'xp-chip';
  chip.title = 'Explore pages and squash bugs to earn XP!';
  chip.innerHTML = '<span id="xp-lv"></span><span class="xp-bar"><i></i></span><span id="xp-pts"></span>';
  var logo = document.querySelector('nav h1');
  if (logo && logo.parentNode) logo.parentNode.insertBefore(chip, logo.nextSibling);
  function renderXP(bump) {
    var lv = Math.floor(state.xp / 50) + 1, into = state.xp % 50;
    var a = document.getElementById('xp-lv'), b = document.getElementById('xp-pts'), bar = chip.querySelector('.xp-bar i');
    if (a) a.textContent = 'Lv ' + lv;
    if (b) b.textContent = state.xp + ' XP';
    if (bar) bar.style.width = (into / 50 * 100) + '%';
    if (bump) { chip.classList.remove('bump'); void chip.offsetWidth; chip.classList.add('bump'); }
  }
  function addXP(n, why) {
    var before = Math.floor(state.xp / 50);
    state.xp += n;
    persist();
    renderXP(true);
    if (Math.floor(state.xp / 50) > before) {
      toast('Level up! You are now Lv ' + (Math.floor(state.xp / 50) + 1) + ' 🎉');
      confetti({ particleCount: 90, spread: 70, origin: { y: 0.2 } });
    } else if (why) toast(why + '  +' + n + ' XP');
  }
  function badge(id, text) {
    if (state.badges[id]) return;
    state.badges[id] = 1; persist();
    toast('🏅 Badge unlocked: ' + text, 3.6);
    confetti({ particleCount: 120, spread: 100, origin: { y: 0.6 } });
  }
  renderXP(false);

  /* ---------- Background: aurora + falling binary ---------- */
  var aur = document.createElement('div');
  aur.className = 'fun-aurora';
  aur.innerHTML = '<span></span><span></span><span></span>';
  document.body.prepend(aur);

  var cv = document.createElement('canvas');
  cv.id = 'fun-bg';
  document.body.prepend(cv);
  var ctx = cv.getContext && cv.getContext('2d');
  var W = 0, H = 0, parts = [], mouse = { x: -999, y: -999 }, matrix = false;
  var GLYPHS = ['0', '1', '{', '}', ';', '<', '>', '=', '#', '()', '[]', 'if', 'SQL', 'IP'];
  function resize() { W = cv.width = innerWidth; H = cv.height = innerHeight; fill(); }
  function fill() {
    var n = matrix ? Math.min(260, Math.floor(W / 7)) : Math.min(60, Math.floor(W / 24));
    while (parts.length < n) parts.push(mk(true));
    parts.length = n;
  }
  function mk(anywhere) {
    return { x: rand(0, W), y: anywhere ? rand(0, H) : -20, v: rand(.25, 1.1), s: rand(11, 20), a: rand(.07, .22),
      c: matrix ? (Math.random() < .5 ? '0' : '1') : GLYPHS[(Math.random() * GLYPHS.length) | 0] };
  }
  function frame() {
    if (!ctx) return;
    if (!document.hidden) {
      ctx.clearRect(0, 0, W, H);
      for (var i = 0; i < parts.length; i++) {
        var p = parts[i];
        p.y += p.v * (matrix ? 3 : 1);
        var dx = p.x - mouse.x, dy = p.y - mouse.y, d = Math.sqrt(dx * dx + dy * dy), boost = 0;
        if (d < 140) { p.x += dx / d * (140 - d) * .04; boost = (140 - d) / 140 * .5; }
        if (p.y > H + 20) { parts[i] = mk(false); continue; }
        ctx.font = p.s + 'px ui-monospace, Menlo, Consolas, monospace';
        ctx.fillStyle = matrix ? 'rgba(74,222,128,' + Math.min(1, p.a + boost + .15) + ')' : 'rgba(255,255,255,' + Math.min(1, p.a + boost) + ')';
        ctx.fillText(p.c, p.x, p.y);
      }
    }
    if (!reduce) requestAnimationFrame(frame);
  }
  if (ctx) {
    addEventListener('resize', resize);
    addEventListener('pointermove', function (e) { mouse.x = e.clientX; mouse.y = e.clientY; });
    resize(); frame();
  }

  /* ---------- Scroll progress ---------- */
  var prog = document.createElement('div');
  prog.id = 'fun-progress';
  document.body.appendChild(prog);
  addEventListener('scroll', function () {
    var h = document.documentElement.scrollHeight - innerHeight;
    prog.style.width = (h > 0 ? scrollY / h * 100 : 0) + '%';
  }, { passive: true });

  /* ---------- Hero: word-in animation + typewriter + ICT egg ---------- */
  var title = document.getElementById('hero-title');
  if (title && !reduce) {
    title.querySelectorAll('.hero-word').forEach(function (w, i) { w.style.animationDelay = (i * 0.12) + 's'; });
  }
  var typedEl = document.getElementById('typed');
  var lines = ['Debug your code.', 'Query your data.', 'Beat the DSE past papers.', 'Trace that algorithm.', 'Pack your packets (TCP/IP).', 'Think like a computer.'];
  (function typeLoop() {
    if (!typedEl) return;
    if (reduce) { typedEl.textContent = lines[0]; return; }
    var li = 0, ci = 0, del = false;
    function tick() {
      var s = lines[li];
      typedEl.textContent = s.slice(0, ci);
      if (!del && ci < s.length) { ci++; setTimeout(tick, rand(40, 90)); }
      else if (!del) { del = true; setTimeout(tick, 1400); }
      else if (ci > 0) { ci--; setTimeout(tick, 22); }
      else { del = false; li = (li + 1) % lines.length; setTimeout(tick, 300); }
    }
    tick();
  })();
  var ictClicks = 0, ictWords = ['Information…', 'Information & Communication…', 'Information & Communication Technology! 🖥️'];
  var ict = document.getElementById('ict-egg');
  if (ict) ict.addEventListener('click', function () {
    toast(ictWords[Math.min(ictClicks, 2)]);
    ictClicks++;
    if (ictClicks === 3) { confetti({ particleCount: 140, spread: 90 }); badge('ict', 'ICT Decoder'); addXP(10); }
    if (ictClicks > 3) ictClicks = 0;
  });

  /* ---------- Cards: reveal, tilt, spotlight ---------- */
  var io = ('IntersectionObserver' in window) ? new IntersectionObserver(function (es) {
    es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: .08 }) : null;
  function decorate(root) {
    var cards = (root || document).querySelectorAll('.glass.cursor-pointer, .glass.group, a.glass');
    var idx = 0;
    cards.forEach(function (c) {
      if (c.classList.contains('fun-card')) return;
      if (c.closest('nav') || c.id === 'breadcrumb-container') return;
      c.classList.add('fun-card');
      if (io) { c.classList.add('rv'); c.style.transitionDelay = '0s, 0s, 0s, ' + (idx % 8 * 0.07) + 's, ' + (idx % 8 * 0.07) + 's'; io.observe(c); }
      idx++;
    });
  }
  decorate(document);
  if (finePointer && !reduce) {
    document.addEventListener('pointermove', function (e) {
      var c = e.target.closest && e.target.closest('.fun-card');
      if (!c) return;
      var r = c.getBoundingClientRect(), px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      c.style.setProperty('--mx', (px * 100) + '%'); c.style.setProperty('--my', (py * 100) + '%');
      c.style.setProperty('--rx', ((.5 - py) * 9) + 'deg'); c.style.setProperty('--ry', ((px - .5) * 11) + 'deg');
    });
    document.addEventListener('pointerout', function (e) {
      var c = e.target.closest && e.target.closest('.fun-card');
      if (c && !c.contains(e.relatedTarget)) { c.style.setProperty('--rx', '0deg'); c.style.setProperty('--ry', '0deg'); }
    });
  }

  /* ---------- Cursor sparkles ---------- */
  var lastSpark = 0, colors = ['#60a5fa', '#a78bfa', '#34d399', '#fbbf24', '#f472b6'];
  if (finePointer && !reduce) addEventListener('pointermove', function (e) {
    var now = performance.now();
    if (now - lastSpark < 55) return;
    lastSpark = now;
    var s = document.createElement('span');
    s.className = 'fun-spark';
    s.style.left = (e.clientX - 4) + 'px'; s.style.top = (e.clientY - 4) + 'px';
    s.style.background = colors[(Math.random() * colors.length) | 0];
    s.style.setProperty('--dx', rand(-26, 26) + 'px'); s.style.setProperty('--dy', rand(8, 36) + 'px');
    document.body.appendChild(s);
    setTimeout(function () { s.remove(); }, 700);
  });

  /* ---------- Page change hook + explorer badges ---------- */
  var origShow = window.showPage;
  if (typeof origShow === 'function') {
    window.showPage = function (id, push) {
      var r = origShow.apply(this, arguments);
      try {
        var pg = document.getElementById('page-' + id);
        if (pg) {
          pg.classList.remove('page-enter'); void pg.offsetWidth; pg.classList.add('page-enter');
          decorate(pg);
        }
        if (id !== 'home' && !state.visited[id]) {
          state.visited[id] = 1; persist();
          var n = Object.keys(state.visited).length;
          if (n >= 3) badge('explorer', 'Explorer 🧭 (3 pages)');
          if (['python', 'database', 'concepts', 'dse'].every(function (k) { return state.visited[k]; })) badge('all', 'Completionist ⭐ (all 4 tracks)');
        }
      } catch (e) {}
      return r;
    };
  }

  /* ---------- Bug critter ---------- */
  function spawnBug() {
    if (document.hidden) return;
    var b = document.createElement('div');
    b.className = 'fun-bug';
    b.style.setProperty('--dur', rand(9, 15) + 's');
    b.innerHTML = '<span>🐞</span>';
    b.title = 'A bug! Squash it!';
    b.addEventListener('click', function () {
      b.classList.add('dead');
      addXP(5, 'Bug fixed! 🐛➡️✅');
      setTimeout(function () { b.remove(); }, 450);
    });
    document.body.appendChild(b);
    setTimeout(function () { b.remove(); }, 16000);
  }
  if (!reduce) { setTimeout(spawnBug, 12000); setInterval(function () { if (Math.random() < .6) spawnBug(); }, 30000); }

  /* ---------- Easter eggs ---------- */
  // 1. Click the logo 7 times: rocket + disco mode
  var logoClicks = 0, logoTimer;
  if (logo) logo.addEventListener('click', function () {
    logoClicks++; clearTimeout(logoTimer);
    logoTimer = setTimeout(function () { logoClicks = 0; }, 1500);
    if (logoClicks === 7) {
      logoClicks = 0;
      var r = document.createElement('div');
      r.className = 'fun-rocket'; r.textContent = '🚀';
      r.style.setProperty('--rx', rand(-200, 200) + 'px'); r.style.setProperty('--rr', rand(-25, 25) + 'deg');
      document.body.appendChild(r); setTimeout(function () { r.remove(); }, 2600);
      document.body.classList.toggle('disco');
      toast(document.body.classList.contains('disco') ? '🪩 Disco mode ON (click logo 7x again to stop)' : 'Disco mode off');
      badge('disco', 'Party Starter 🪩');
    }
  });

  // 2. Konami code: Matrix mode
  var konami = ['ArrowUp', 'ArrowUp', 'ArrowDown', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'ArrowLeft', 'ArrowRight', 'b', 'a'], kpos = 0;
  // 3. Typed words
  var buf = '';
  var words = {
    hello: function () { toast('print("Hello, World!")  ← your first program 👋'); },
    sudo: function () { toast('Permission denied. Nice try though 😏'); },
    dse: function () { toast('You\'ve got this! Every past paper makes you stronger 💪'); confetti({ particleCount: 120, spread: 80 }); },
    bug: function () { toast('Summoning a bug…'); spawnBug(); },
    binary: function () { toast('01001001 01000011 01010100  =  "ICT"'); },
    sql: function () { toast('SELECT fun FROM portal WHERE student = "you";'); },
    matrix: function () { toggleMatrix(); }
  };
  function toggleMatrix() {
    matrix = !matrix; document.body.classList.toggle('matrix', matrix);
    parts = []; fill();
    toast(matrix ? '🟩 Wake up, Neo… (Matrix mode)' : 'Back to the real world');
    if (matrix) badge('matrix', 'The One 🕶️');
  }
  addEventListener('keydown', function (e) {
    var k = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    if (k === konami[kpos]) { kpos++; if (kpos === konami.length) { kpos = 0; toggleMatrix(); } } else { kpos = (k === konami[0]) ? 1 : 0; }
    var tag = (e.target.tagName || '').toLowerCase();
    if (tag === 'input' || tag === 'textarea' || e.target.isContentEditable) return;
    if (e.key.length === 1) {
      buf = (buf + e.key.toLowerCase()).slice(-10);
      Object.keys(words).forEach(function (w) { if (buf.slice(-w.length) === w) { buf = ''; words[w](); } });
    }
  });

  // 4. Secret footer bits
  var foot = document.getElementById('fun-foot-bug');
  if (foot) foot.addEventListener('click', function () { toast('Found me! It\'s not a bug, it\'s a feature 🐛'); badge('footer', 'Bug Whisperer 🐛'); });


  /* ---------- Public API for the other fun files ---------- */
  window.ICTFun = {
    get: function () { if (!state.books) state.books = {}; return state; }, save: function () { persist(); },
    toast: toast, addXP: addXP, badge: badge, confetti: confetti, reduce: reduce,
    setUser: function (id) { KEY = id ? 'ictFun:' + id : 'ictFun'; state = store.get(KEY, fresh()); if (!state.books) state.books = {}; renderXP(false); window.dispatchEvent(new Event('ictfun:user')); },
    merge: function (c) {
      if (!c) return;
      state.xp = Math.max(state.xp || 0, c.xp || 0);
      (c.visited || []).forEach(function (k) { state.visited[k] = 1; });
      (c.badges || []).forEach(function (k) { state.badges[k] = 1; });
      if (!state.books) state.books = {};
      Object.keys(c.books || {}).forEach(function (b) { var d = state.books[b] = state.books[b] || {}, o = c.books[b] || {}; ['mc', 'games'].forEach(function (k) { d[k] = d[k] || {}; Object.keys(o[k] || {}).forEach(function (q) { d[k][q] = 1; }); }); d.stat = d.stat || {}; Object.keys(o.stat || {}).forEach(function (ch) { var x = d.stat[ch] || [0, 0], y = o.stat[ch] || [0, 0]; d.stat[ch] = [Math.max(x[0], y[0]), Math.max(x[1], y[1])]; }); });
      persist(); renderXP(false); window.dispatchEvent(new Event('ictfun:user'));
    }
  };

  // 5. Console greeting
  try {
    console.log('%c👋 Hey, curious one!', 'font-size:18px;font-weight:bold;color:#818cf8');
    console.log('%cTry the Konami code, click the logo 7 times, or type "hello", "sql", "binary", "bug" or "matrix" on the page.', 'color:#4ade80');
  } catch (e) {}
})();
