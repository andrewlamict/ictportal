/* ICT Portal - one shared site map + navigation for EVERY page (index.html and all sub-pages).
   To add a page, add ONE line to the SITE list below. Back buttons, breadcrumbs, prev/next and the Ctrl/Cmd+K map all follow it. */
(function () {
  'use strict';

  /* ---------------- SITE MAP (single source of truth) ---------------- */
  var BOOKS = [
    ['a1', 'Book A1', 'A1', [1, 2, 3]],
    ['a2', 'Book A2', 'A2', [4, 5]],
    ['b', 'Book B', 'B', [1, 2, 3]],
    ['c1', 'Book C1', 'C1', [1, 2, 3]],
    ['c2', 'Book C2', 'C2', [4, 5, 6]],
    ['d', 'Book D1 & D2', 'D', [1, 2, 3, 6]],
    ['e', 'Book E', 'E', [1, 2, 3]],
    ['ea', 'Elective Book A', 'EA', [1, 2, 3, 4, 5]],
    ['eb', 'Elective Book B', 'EB', []],
    ['ec', 'Elective Book C', 'EC', [1, 2, 3, 4, 5, 6, 7, 8]]
  ];
  var FOLDER = { a1: 'booka1', a2: 'booka2', b: 'bookb', c1: 'bookc1', c2: 'bookc2', d: 'bookd', e: 'booke', ea: 'bookea', ec: 'bookec' };
  var ACT = { /* activity pages inside Book B */
    'bookb/ch1/keyboardvsscreen.html': 'Keyboard vs Screen', 'bookb/ch1/scanner.html': 'Scanner', 'bookb/ch1/sensor.html': 'Sensor',
    'bookb/ch1/printer.html': 'Printer', 'bookb/ch1/poskiosk.html': 'POS & Kiosk',
    'bookb/ch2/cpugpu.html': 'CPU vs GPU', 'bookb/ch2/cpu.html': 'CPU', 'bookb/ch2/storage.html': 'Storage',
    'bookb/ch3/os.html': 'Operating System', 'bookb/ch3/utility.html': 'Utility Software', 'bookb/ch3/driver.html': 'Device Driver',
    'bookb/ch3/processingmode.html': 'Processing Modes',
    'booke/ch1/bigdata4v.html': 'Big Data Lab',
    'booke/ch1/trainmodel.html': 'Training Your Own AI Model',
    'booke/ch2/tenyears.html': 'Health Issue',
    'booke/ch2/digitaldivide.html': 'Digital Divide',
    'booke/ch3/copyrightpolice.html': 'Copyright Police',
    'booke/ch3/softwarelicence.html': 'Software Licences'
  };

  var SITE = [ /* id, title, parent id, url (relative to site root), group */
    ['home', 'Home', null, 'index.html', 'Main'],
    ['python', 'S.2 Python', 'home', 'index.html#python', 'Main'],
    ['database', 'S.3 Database', 'home', 'index.html#database', 'Main'],
    ['concepts', 'ICT Concepts', 'home', 'index.html#concepts', 'Main'],
    ['dse', 'DSE Resources', 'home', 'index.html#dse', 'Main'],
    ['lab', 'Practice Lab', 'home', 'index.html#lab', 'Main'],
    /* labs */
    ['simplepythoncompiler.html', 'Python Lab', 'python', 'simplepythoncompiler.html', 'Python'],
    ['if.html', 'Logic Ladders (if)', 'python', 'if.html', 'Python'],
    ['sqllab1.html', 'SQL Lab 1', 'database', 'sqllab1.html', 'Database'],
    ['sqllab2.html', 'SQL Lab 2', 'database', 'sqllab2.html', 'Database'],
    ['mctrainer.html', 'MC Trainer', 'dse', 'mctrainer.html', 'DSE'],
    ['pseudocode.html', 'Pseudocode Lab', 'concepts-book-d', 'pseudocode.html', 'Book D1 & D2']
  ];
  BOOKS.forEach(function (b) {
    SITE.push(['concepts-book-' + b[0], b[1], 'concepts', 'index.html#concepts-book-' + b[0], 'Concepts']);
  });
  BOOKS.forEach(function (b) {
    if (!FOLDER[b[0]]) return;
    b[3].forEach(function (n) {
      var u = FOLDER[b[0]] + '/ch' + n + '/mindmap.html';
      SITE.push([u, 'Ch.' + n + ' Mind Map', 'concepts-book-' + b[0], u, b[1]]);
      Object.keys(ACT).forEach(function (a) {
        if (a.indexOf(FOLDER[b[0]] + '/ch' + n + '/') === 0) SITE.push([a, ACT[a], 'concepts-book-' + b[0], a, b[1]]);
      });
    });
  });

  var P = {}, ORDER = [];
  SITE.forEach(function (r) { P[r[0]] = { id: r[0], t: r[1], p: r[2], u: r[3], g: r[4] }; ORDER.push(r[0]); });
  function chain(id) { var out = [], c = id, n = 0; while (c && P[c] && n++ < 8) { out.unshift(P[c]); c = P[c].p; } return out; }
  function isFile(u) { return u.indexOf('#') < 0 && u !== 'index.html'; }

  /* ---------------- where am I? ---------------- */
  var me = document.currentScript, src = me && me.getAttribute('src') || 'nav.js';
  var rootPath = new URL(src.replace(/nav\.js.*$/, ''), location.href).pathname;
  var rel = decodeURIComponent(location.pathname.slice(rootPath.length)).replace(/^\/+/, '');
  var onIndex = rel === '' || rel === 'index.html' || !!document.getElementById('page-home') || !!document.querySelector('script[src*="scenes.js"]');
  var ROOT = src.replace(/nav\.js.*$/, '');
  /* school-account gate: sub-pages send visitors who have not signed in on the home page back to it */
  try { if (!/(^|\/)(index\.html)?$/.test(location.pathname) && !/[?&]embed=1/.test(location.search) && window.self === window.top && localStorage.getItem('ictAuthed') !== '1') { location.replace(ROOT + 'index.html'); return; } } catch (e) {}
  var framed = false; try { framed = window.parent !== window; } catch (e) { framed = true; }
  function href(u) { if (framed && u.indexOf('index.html') === 0) u = u.replace('index.html', 'index.html?embed=1'); return ROOT + u; }
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  /* ---------------- styles ---------------- */
  var css = document.createElement('style');
  css.textContent =
    '.nv-top{position:relative;z-index:5;display:flex;flex-wrap:wrap;align-items:center;gap:4px 8px;padding:8px max(14px,env(safe-area-inset-left));font:700 11px/1.3 system-ui,sans-serif;letter-spacing:.06em;text-transform:uppercase;background:rgba(15,23,42,.88);color:#cbd5e1;border-bottom:1px solid rgba(255,255,255,.1)}' +
    '.nv-top a{color:#cbd5e1;text-decoration:none}.nv-top a:hover{color:#fff;text-decoration:underline}.nv-top .cur{color:#93c5fd}.nv-top i{opacity:.4;font-style:normal}' +
    '.nv-dock{position:fixed;left:50%;bottom:max(14px,env(safe-area-inset-bottom));transform:translateX(-50%);z-index:9998;display:flex;align-items:center;gap:6px;padding:6px;border-radius:999px;background:rgba(15,23,42,.9);backdrop-filter:blur(14px);-webkit-backdrop-filter:blur(14px);border:1px solid rgba(255,255,255,.18);box-shadow:0 10px 30px rgba(0,0,0,.4);max-width:calc(100vw - 20px);font:800 12px/1 system-ui,sans-serif}' +
    '.nv-dock a,.nv-dock button{all:unset;box-sizing:border-box;cursor:pointer;display:inline-flex;align-items:center;gap:6px;height:36px;padding:0 13px;border-radius:999px;color:#e2e8f0;background:rgba(255,255,255,.08);white-space:nowrap;letter-spacing:.04em;text-transform:uppercase;font-size:11px;font-weight:800}' +
    '.nv-dock a:hover,.nv-dock button:hover{background:rgba(255,255,255,.2);color:#fff}.nv-dock .main{background:#4f46e5;color:#fff}.nv-dock .main:hover{background:#6366f1}' +
    '.nv-dock .lbl{overflow:hidden;text-overflow:ellipsis;max-width:34vw}.nv-dock [disabled]{opacity:.3;pointer-events:none}' +
    '@media(max-width:520px){.nv-dock .t{display:none}.nv-dock a,.nv-dock button{padding:0 11px}}' +
    '.nv-ov{position:fixed;inset:0;z-index:10000;display:none;align-items:flex-start;justify-content:center;padding:max(6vh,24px) 16px 16px;background:rgba(2,6,23,.62);backdrop-filter:blur(6px);-webkit-backdrop-filter:blur(6px)}.nv-ov.on{display:flex}' +
    '.nv-box{width:min(720px,100%);max-height:86vh;display:flex;flex-direction:column;border-radius:20px;background:rgba(15,23,42,.96);border:1px solid rgba(255,255,255,.15);box-shadow:0 30px 80px rgba(0,0,0,.55);color:#e2e8f0;font-family:system-ui,sans-serif;overflow:hidden}' +
    '.nv-box input{all:unset;box-sizing:border-box;padding:16px 20px;font-size:16px;border-bottom:1px solid rgba(255,255,255,.12);color:#fff}.nv-box input::placeholder{color:#94a3b8}' +
    '.nv-list{overflow:auto;padding:8px 8px 14px}.nv-g{margin:12px 12px 4px;font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:#64748b;font-weight:800}' +
    '.nv-i{display:flex;align-items:center;gap:10px;padding:9px 12px;margin:1px 4px;border-radius:10px;color:#e2e8f0;text-decoration:none;font-size:14px;cursor:pointer}.nv-i small{color:#64748b;margin-left:auto;font-size:11px}.nv-i:hover,.nv-i.sel{background:rgba(99,102,241,.3);color:#fff}' +
    '.nv-hint{padding:8px 16px;font-size:11px;color:#64748b;border-top:1px solid rgba(255,255,255,.08)}';
  document.head.appendChild(css);

  /* ---------------- site map overlay (Ctrl/Cmd+K) ---------------- */
  var ov = document.createElement('div');
  ov.className = 'nv-ov';
  ov.innerHTML = '<div class="nv-box" role="dialog" aria-label="Site map"><input id="nv-q" placeholder="Jump to a folder...  (Python, Database, Concepts, DSE)" autocomplete="off"><div class="nv-list" id="nv-list"></div><div class="nv-hint">Enter to open · Esc to close · Ctrl/⌘ + K anywhere</div></div>';
  var TOP = ['home', 'python', 'database', 'concepts', 'dse'];
  function openUrl(id) { return id === 'home' ? 'index.html' : 'index.html?open=' + id; }
  var qEl, listEl, shown = [], sel = 0;
  function go(id) {
    var p = P[id]; if (!p) return;
    close();
    if (onIndex && window.ICTDesk) { window.ICTDesk.open(id); return; }
    if (onIndex && typeof window.showPage === 'function') {
      window.showPage(id === 'home' ? 'home' : id);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    } else location.href = href(openUrl(id));
  }
  function render() {
    var q = qEl.value.trim().toLowerCase(), last = '', h = '';
    shown = TOP.filter(function (id) { var p = P[id]; return !q || (p.t + ' ' + p.g + ' ' + id).toLowerCase().indexOf(q) > -1; });
    if (sel >= shown.length) sel = 0;
    shown.forEach(function (id, i) {
      var p = P[id];
      if (p.g !== last) { last = p.g; h += '<div class="nv-g">' + esc(last) + '</div>'; }
      h += '<a class="nv-i' + (i === sel ? ' sel' : '') + '" data-id="' + esc(id) + '" href="' + esc(href(openUrl(id))) + '">' + esc(p.t) + '<small>' + (id === 'home' ? 'desktop' : 'folder') + '</small></a>';
    });
    listEl.innerHTML = h || '<div class="nv-g">No match</div>';
  }
  function open() { ov.classList.add('on'); qEl.value = ''; sel = 0; render(); setTimeout(function () { qEl.focus(); }, 30); }
  function close() { ov.classList.remove('on'); }
  function ready(f) { if (document.body) f(); else document.addEventListener('DOMContentLoaded', f); }
  ready(function () {
    document.body.appendChild(ov);
    qEl = ov.querySelector('#nv-q'); listEl = ov.querySelector('#nv-list');
    qEl.addEventListener('input', function () { sel = 0; render(); });
    ov.addEventListener('mousedown', function (e) { if (e.target === ov) close(); });
    listEl.addEventListener('click', function (e) {
      var a = e.target.closest('.nv-i'); if (!a) return;
      if (onIndex) { e.preventDefault(); go(a.getAttribute('data-id')); }
    });
    qEl.addEventListener('keydown', function (e) {
      if (e.key === 'ArrowDown') { sel = Math.min(sel + 1, shown.length - 1); render(); e.preventDefault(); }
      else if (e.key === 'ArrowUp') { sel = Math.max(sel - 1, 0); render(); e.preventDefault(); }
      else if (e.key === 'Enter' && shown[sel]) { go(shown[sel]); }
    });
    if (framed) [].forEach.call(document.querySelectorAll('a[href*="index.html"]'), function (a) { var u = a.getAttribute('href'); if (u.indexOf('embed=1') < 0 && u.indexOf('http') !== 0) a.setAttribute('href', u.replace('index.html', 'index.html?embed=1')); });
  });
  addEventListener('keydown', function (e) {
    if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') { e.preventDefault(); ov.classList.contains('on') ? close() : open(); }
    else if (e.key === 'Escape') close();
  });
  window.ICTNav = { open: open, close: close, pages: P, current: function () { return onIndex ? (location.hash.replace('#', '') || 'home') : rel; } };

  /* ---------------- index.html: add a site-map button to the top bar ---------------- */
  if (onIndex) {
    ready(function () {
      var tools = document.getElementById('fun-tools');
      var b = document.createElement('button');
      b.type = 'button'; b.id = 'map-btn'; b.textContent = '🗺️'; b.title = 'Site map (Ctrl/⌘ + K)'; b.setAttribute('aria-label', 'Site map');
      b.addEventListener('click', open);
      if (tools) tools.appendChild(b);
    });
    return;
  }

  /* ---------------- sub-pages: breadcrumb strip + bottom dock ---------------- */
  var cur = P[rel];
  if (!cur) return;
  /* Games earn XP, opening a page does not: an activity counts as "played" after GAME_SECONDS of real use with GAME_ACTIONS
     clicks/keys. A page can also call ICTGameDone() itself when its game is finished. */
  var GAME_SECONDS = 75, GAME_ACTIONS = 10;
  var isGame = /^concepts-book-/.test(cur.p || '') && !/mindmap\.html$/.test(cur.id) && isFile(cur.u);
  if (isGame) {
    var secs = 0, acts = 0, fired = false, lastA = 0;
    function fire() {
      if (fired) return; fired = true;
      try { var q = JSON.parse(localStorage.getItem('ictGamePending') || '[]'); if (q.indexOf(cur.id) < 0) { q.push(cur.id); localStorage.setItem('ictGamePending', JSON.stringify(q)); } } catch (e) {}
      ready(function () { var t = document.createElement('div'); t.textContent = '🎮 Game complete! +10 XP for your book — it lights up the map'; t.style.cssText = 'position:fixed;left:50%;top:16px;transform:translateX(-50%);z-index:10001;padding:10px 18px;border-radius:14px;background:rgba(10,20,50,.92);color:#fff;font:700 13px system-ui,sans-serif;border:1px solid rgba(255,215,90,.6);box-shadow:0 10px 30px rgba(0,0,0,.4)'; document.body.appendChild(t); setTimeout(function () { t.remove(); }, 4200); });
    }
    window.ICTGameDone = fire;
    ['pointerdown', 'keydown', 'input'].forEach(function (ev) { addEventListener(ev, function () { var n = Date.now(); if (n - lastA > 250) { lastA = n; acts++; } }, true); });
    setInterval(function () { if (!document.hidden) { secs++; if (secs >= GAME_SECONDS && acts >= GAME_ACTIONS) fire(); } }, 1000);
  }
  var parent = P[cur.p] || P.home;
  var sibs = ORDER.filter(function (id) { return P[id].p === cur.p && isFile(P[id].u); });
  var si = sibs.indexOf(cur.id);
  ready(function () {
    var trail = chain(cur.id).map(function (p, i, a) {
      return i === a.length - 1 ? '<span class="cur">' + esc(p.t) + '</span>' : '<a href="' + esc(href(p.u)) + '">' + esc(p.t) + '</a>';
    }).join(' <i>›</i> ');
    var top = document.createElement('div');
    top.className = 'nv-top'; top.innerHTML = trail;
    document.body.insertBefore(top, document.body.firstChild);

    var d = document.createElement('div');
    d.className = 'nv-dock';
    var prev = si > 0 ? P[sibs[si - 1]] : null, next = si > -1 && si < sibs.length - 1 ? P[sibs[si + 1]] : null;
    d.innerHTML =
      '<a class="main" href="' + esc(href(parent.u)) + '" title="Back to ' + esc(parent.t) + '">←<span class="lbl">' + esc(parent.t) + '</span></a>' +
      '<a href="' + href('index.html') + '" title="Home">🏠<span class="t">Home</span></a>' +
      (sibs.length > 1 ? '<a ' + (prev ? 'href="' + esc(href(prev.u)) + '" title="Previous: ' + esc(prev.t) + '"' : 'disabled') + '>‹</a><a ' + (next ? 'href="' + esc(href(next.u)) + '" title="Next: ' + esc(next.t) + '"' : 'disabled') + '>›</a>' : '') +
      '<button type="button" id="nv-map" title="Site map (Ctrl/⌘ + K)">🗺️<span class="t">Map</span></button>';
    document.body.appendChild(d);
    d.querySelector('#nv-map').addEventListener('click', open);
    document.body.style.paddingBottom = 'max(' + (parseInt(getComputedStyle(document.body).paddingBottom) || 0) + 'px, 72px)';
  });
})();
