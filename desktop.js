/* ICT Portal - Windows 11 style desktop.
   The home page is a desktop: 4 folders (Python, Database, Concepts, DSE). Opening a folder opens a File Explorer window;
   opening a file inside goes to the real lesson page. Folder contents come from the site map in nav.js. */
(function () {
  'use strict';
  var html = document.documentElement, moved = [];
  var F = window.ICTFun || { toast: function () {}, addXP: function () {}, get: function () { return {}; } };
  var TB = 52, MIN_W = 340, MIN_H = 240;
  var mobile = function () { return innerWidth < 720; };
  var coarse = false; try { coarse = matchMedia('(pointer:coarse)').matches; } catch (e) {}
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };
  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }

  var ROOTS = ['python', 'database', 'concepts', 'dse'];
  var APPS = {
    python: { t: 'Python', i: '🐍', c: ['#6bb5ff', '#2563eb'], sub: 'S.2 coding & labs' },
    database: { t: 'Database', i: '🗄️', c: ['#4ade9c', '#059669'], sub: 'S.3 SQL & labs' },
    concepts: { t: 'ICT Concepts', i: '📚', c: ['#c9a0ff', '#7c3aed'], sub: '10 books & mind maps' },
    dse: { t: 'DSE Portal', i: '🎯', c: ['#ffb86b', '#ea580c'], sub: 'Past papers & MC' },
    board: { t: 'Leaderboard', i: '🏆', file: true, sub: 'Top 20 in your form' },
    tour: { t: 'World Tour', i: '🌍', file: true, sub: 'Light up the map' },
    notes: { t: 'Notes', i: '📝', file: true, sub: 'Your private notes' },
    bin: { t: 'Recycle Bin', i: '🗑️', file: true, sub: 'Empty' },
    welcome: { t: 'Welcome', i: '👋', file: true, hidden: true }
  };
  var P = function () { return (window.ICTNav && window.ICTNav.pages) || {}; };
  function kids(id) { var p = P(); return Object.keys(p).filter(function (k) { return p[k].p === id; }); }
  function rootOf(id) { var p = P(), c = id, n = 0; while (c && p[c] && n++ < 8) { if (ROOTS.indexOf(c) > -1) return c; c = p[c].p; } return null; }
  function chain(id) { var p = P(), out = [], c = id, n = 0; while (c && p[c] && n++ < 8) { out.unshift(c); if (ROOTS.indexOf(c) > -1) break; c = p[c].p; } return out; }
  function isHash(id) { var p = P()[id]; return p && p.u.indexOf('#') > -1; }
  function iconFor(id) {
    var u = (P()[id] || {}).u || '';
    if (/mindmap/.test(u)) return '🧠'; if (/^bookb\/ch\d\//.test(u)) return '🧩'; if (/mctrainer/.test(u)) return '⚡'; if (/pseudocode/.test(u)) return '⌨️';
    if (/sqllab/.test(u)) return '🧮'; if (/simplepython/.test(u)) return '💻'; if (/if\.html/.test(u)) return '🪜'; return '📄';
  }
  function folderIco(c, em, fs) { return '<span class="fi" style="--f1:' + c[0] + ';--f2:' + c[1] + (fs ? ';--fs:' + fs + 'px' : '') + '"><i class="a"></i><i class="b"></i><i class="c"></i><em>' + em + '</em></span>'; }
  function fileIco(em, fs) { return '<span class="fl"' + (fs ? ' style="--fs:' + fs + 'px"' : '') + '><em>' + em + '</em></span>'; }
  function appIco(id, fs) { var a = APPS[id]; return a.file ? fileIco(a.i, fs) : folderIco(a.c, a.i, fs); }
  function colorsFor(id) { var r = rootOf(id); return r ? APPS[r].c : APPS.concepts.c; }

  /* ---------------- DOM ---------------- */
  var d = document.createElement('div');
  d.id = 'desktop';
  d.innerHTML = '<div id="dk-icons"></div><div id="dk-wins"></div><div id="dk-widgets"></div><div id="dk-start"></div><div id="dk-ctx"></div>' +
    '<div id="dk-bar"><div class="tbl"><button class="tbw" id="dk-wbtn" aria-label="Widgets">🗺️<span><b id="dk-wt">World tour</b><small id="dk-ws">Destination of the day</small></span></button></div>' +
    '<div class="tbc"><button class="tbb" id="dk-sbtn" aria-label="Start"><span class="wlogo"><i></i><i></i><i></i><i></i></span></button><button class="tbs" id="dk-sq">🔍 <span>Search folders</span></button><span id="dk-pinned" style="display:flex;gap:4px"></span></div>' +
    '<div class="tbr"><span id="dk-tools"></span><button class="tbt" id="dk-clock"><div id="dk-time"></div><div id="dk-date"></div></button><button class="tbd" id="dk-show" title="Show desktop"></button></div></div>';
  document.body.appendChild(d);
  var $ = function (s) { return d.querySelector(s); };
  var iconsEl = $('#dk-icons'), winsEl = $('#dk-wins'), startEl = $('#dk-start'), widEl = $('#dk-widgets'), ctx = $('#dk-ctx'), pinnedEl = $('#dk-pinned');

  var ICON_ORDER = ['tour', 'board', 'bin'].concat(ROOTS).concat(['notes']);
  iconsEl.innerHTML = ICON_ORDER.map(function (id) { return '<button class="dk-ic" data-id="' + id + '">' + appIco(id) + '<span>' + esc(APPS[id].t) + '</span></button>'; }).join('');
  var selIcon = null;
  iconsEl.addEventListener('click', function (e) {
    var b = e.target.closest('.dk-ic'); if (!b) return;
    if (selIcon) selIcon.classList.remove('sel'); selIcon = b; b.classList.add('sel'); if (coarse) open(b.dataset.id);
  });
  iconsEl.addEventListener('dblclick', function (e) { var b = e.target.closest('.dk-ic'); if (b) open(b.dataset.id); });
  iconsEl.addEventListener('keydown', function (e) { if (e.key === 'Enter') { var b = e.target.closest('.dk-ic'); if (b) open(b.dataset.id); } });
  d.addEventListener('pointerdown', function (e) {
    if (!e.target.closest('.dk-ic') && selIcon) { selIcon.classList.remove('sel'); selIcon = null; }
    if (!e.target.closest('#dk-start') && !e.target.closest('#dk-sbtn') && !e.target.closest('#dk-sq')) startEl.classList.remove('on');
    if (!e.target.closest('#dk-widgets') && !e.target.closest('#dk-wbtn')) widEl.classList.remove('on');
    if (!e.target.closest('#dk-ctx')) ctx.classList.remove('on');
  });

  /* ---------------- windows ---------------- */
  var wins = [], zTop = 10, cascade = 0, nSeq = 0;
  function area() { return { w: d.clientWidth, h: d.clientHeight - TB }; }
  function apply(w) {
    var s = w.st, el = w.el; el.classList.toggle('max', !!s.max); el.classList.toggle('min', !!s.min);
    if (!s.max) { el.style.left = s.x + 'px'; el.style.top = s.y + 'px'; el.style.width = s.w + 'px'; el.style.height = s.h + 'px'; }
    el.style.zIndex = s.z;
  }
  function clamp(w) { var a = area(), s = w.st; if (s.max) return; s.w = Math.min(s.w, a.w); s.h = Math.min(s.h, a.h); s.x = Math.max(-s.w + 80, Math.min(s.x, a.w - 80)); s.y = Math.max(0, Math.min(s.y, a.h - 40)); apply(w); }
  addEventListener('resize', function () { wins.forEach(clamp); });
  function focus(w) { w.st.min = false; w.st.z = ++zTop; wins.forEach(function (o) { o.el.classList.toggle('on', o === w); }); apply(w); taskbar(); }
  function taskbar() {
    var ids = ROOTS.concat(['tour']);
    wins.forEach(function (w) { if (ids.indexOf(w.id) < 0) ids.push(w.id); });
    pinnedEl.innerHTML = ids.map(function (id) {
      var w = wins.filter(function (o) { return o.id === id; })[0], on = w && w.el.classList.contains('on') && !w.st.min;
      return '<button class="tbb' + (w ? ' run' : '') + (on ? ' act' : '') + '" data-id="' + id + '" title="' + esc(APPS[id].t) + '">' + appIco(id, 24) + '</button>';
    }).join('');
  }
  pinnedEl.addEventListener('click', function (e) {
    var b = e.target.closest('.tbb'); if (!b) return; var id = b.dataset.id, w = wins.filter(function (o) { return o.id === id; })[0];
    if (w && w.el.classList.contains('on') && !w.st.min) { w.st.min = true; w.el.classList.remove('on'); apply(w); taskbar(); } else open(id);
  });

  function nativeHtml(id) {
    if (id === 'tour') return window.ICTTour ? window.ICTTour.html() : '<div class="nat">Loading…</div>';
    if (id === 'bin') return '<div class="nat"><h3>🗑️ Recycle Bin</h3><p>Empty — a tidy program leaves nothing behind.</p><p style="opacity:.55;font-size:12px">Hint: some old gamers know a famous code: ↑ ↑ ↓ ↓ ← → ← → B A. Try it on the desktop.</p><p style="opacity:.55;font-size:12px">Another hint: real hackers use a terminal. Type the magic word <b>sudo</b> on the desktop.</p></div>';
    return '<div class="nat"><h3>👋 Welcome — the map is dark!</h3><p>The world map behind your windows is waiting to be explored. <b>Your 7 big books are the 7 continents, and every chapter is a tourist spot.</b> Answer MC questions in MC Trainer and play the chapter games (just opening pages gives no XP) and its spot lights up — little people start walking there too.</p><ul style="padding-left:18px"><li><b>Double-click</b> a folder (tap on a phone) to open it, then open a book</li><li>🌍 <b>World Tour</b> shows every book, its missions and your XP</li><li>Finish <b>3, 6 and 9 books</b> to unlock bonus destinations: Beijing, Angkor and Sydney</li><li><b>Start</b> / the search box / <kbd>Ctrl</kbd>+<kbd>K</kbd> jump to a folder</li></ul><p style="opacity:.7">Each mission = 10 XP ⭐</p></div>';
  }
  function open(id) {
    var rid = APPS[id] ? id : rootOf(id); if (!rid) return false;
    if (rid === 'board') { startEl.classList.remove('on'); widEl.classList.remove('on'); window.ICTBoard && window.ICTBoard.open(); return true; }
    if (ROOTS.indexOf(rid) > -1) { startEl.classList.remove('on'); widEl.classList.remove('on'); go(function () { classic(id); }); return true; }
    show(); startEl.classList.remove('on'); widEl.classList.remove('on');
    var ex = wins.filter(function (w) { return w.id === rid; })[0];
    if (ex) { focus(ex); return true; }
    var a = area(), el = document.createElement('div'); el.className = 'win';
    var W = Math.min(940, Math.round(a.w * .74)), H = Math.min(640, Math.round(a.h * .8));
    var st = { x: 80 + (cascade % 6) * 32, y: 22 + (cascade % 6) * 30, w: W, h: H, z: ++zTop, max: mobile(), min: false }; cascade++;
    st.x = Math.min(st.x, Math.max(0, a.w - W)); st.y = Math.min(st.y, Math.max(0, a.h - H));
    var app = APPS[rid];
    el.innerHTML = '<div class="wt"><div class="tab"><span>' + app.i + '</span><span class="tt">' + esc(app.t) + '</span></div><div class="gap"></div><span class="wb"><button class="m" aria-label="Minimise">&#8212;</button><button class="z" aria-label="Maximise">&#9723;</button><button class="x" aria-label="Close">&#10005;</button></span></div>' +
      '<div class="wc"></div>' + '<i class="wr e"></i><i class="wr s"></i><i class="wr se"></i>';
    var w = { id: rid, el: el, st: st, hist: [rid], hi: 0, filter: '' };
    {
      var wc = el.querySelector('.wc');
      if (rid === 'notes') { var ta = document.createElement('textarea'); ta.placeholder = 'Type your notes here. They are saved on this device.'; ta.value = store.get('ictNotes', ''); ta.addEventListener('input', function () { store.set('ictNotes', ta.value); }); wc.appendChild(ta); }
      else { wc.innerHTML = nativeHtml(rid); if (rid === 'tour') tourWire(w, wc); }
    }
    winsEl.appendChild(el); wins.push(w);
    el.addEventListener('pointerdown', function () { if (!el.classList.contains('on')) focus(w); }, true);
    el.querySelector('.wt').addEventListener('dblclick', function (e) { if (!e.target.closest('.wb')) toggleMax(w); });
    el.querySelector('.m').addEventListener('click', function () { w.st.min = true; el.classList.remove('on'); apply(w); taskbar(); });
    el.querySelector('.z').addEventListener('click', function () { toggleMax(w); });
    el.querySelector('.x').addEventListener('click', function () { closeWin(w); });
    drag(w, el.querySelector('.wt')); [].forEach.call(el.querySelectorAll('.wr'), function (h) { resize(w, h); });
    apply(w); focus(w);
    return true;
  }
  function recent(id) { var r = []; try { r = JSON.parse(store.get('ictDeskRecent', '[]')); } catch (e) {} r = [id].concat(r.filter(function (x) { return x !== id; })).slice(0, 4); store.set('ictDeskRecent', JSON.stringify(r)); }
  function closeWin(w) {
    w.el.classList.add('closing');
    setTimeout(function () { w.el.remove(); wins.splice(wins.indexOf(w), 1); var top = wins.filter(function (o) { return !o.st.min; }).sort(function (a, b) { return b.st.z - a.st.z; })[0]; if (top) focus(top); else taskbar(); }, 140);
  }
  function toggleMax(w) { w.st.max = !w.st.max; apply(w); focus(w); }

  function go(fn) { d.style.transition = 'opacity .18s'; d.style.opacity = '0'; setTimeout(fn, 170); setTimeout(function () { d.style.opacity = ''; }, 900); }

  /* ---------------- drag / resize ---------------- */
  function drag(w, h) {
    h.addEventListener('pointerdown', function (e) {
      if (e.target.closest('.wb') || e.button > 0 || mobile()) return;
      var s = w.st, r = d.getBoundingClientRect(), ox, oy;
      if (s.max) { s.max = false; s.x = e.clientX - r.left - s.w / 2; s.y = 0; apply(w); }
      ox = e.clientX - r.left - s.x; oy = e.clientY - r.top - s.y; h.setPointerCapture(e.pointerId);
      function mv(ev) { var a = area(); s.x = Math.max(-s.w + 80, Math.min(ev.clientX - r.left - ox, a.w - 80)); s.y = Math.max(0, Math.min(ev.clientY - r.top - oy, a.h - 40)); apply(w); }
      function up() { h.removeEventListener('pointermove', mv); h.removeEventListener('pointerup', up); h.removeEventListener('pointercancel', up); }
      h.addEventListener('pointermove', mv); h.addEventListener('pointerup', up); h.addEventListener('pointercancel', up);
    });
  }
  function resize(w, h) {
    var dir = h.classList.contains('se') ? 'se' : h.classList.contains('e') ? 'e' : 's';
    h.addEventListener('pointerdown', function (e) {
      if (w.st.max) return; e.preventDefault();
      var s = w.st, sx = e.clientX, sy = e.clientY, sw = s.w, sh = s.h, a = area(); h.setPointerCapture(e.pointerId);
      function mv(ev) { if (dir !== 's') s.w = Math.max(MIN_W, Math.min(sw + ev.clientX - sx, a.w - s.x + 40)); if (dir !== 'e') s.h = Math.max(MIN_H, Math.min(sh + ev.clientY - sy, a.h - s.y)); apply(w); }
      function up() { h.removeEventListener('pointermove', mv); h.removeEventListener('pointerup', up); h.removeEventListener('pointercancel', up); }
      h.addEventListener('pointermove', mv); h.addEventListener('pointerup', up); h.addEventListener('pointercancel', up);
    });
  }
  function showDesktop() {
    var any = wins.some(function (w) { return !w.st.min; });
    wins.forEach(function (w) { w.st.min = any; w.el.classList.remove('on'); apply(w); });
    if (!any && wins.length) focus(wins.slice().sort(function (a, b) { return b.st.z - a.st.z; })[0]); else taskbar();
  }
  $('#dk-show').addEventListener('click', showDesktop);

  /* ---------------- start menu + search ---------------- */
  function startHtml(q) {
    var pins = ROOTS.concat(['tour', 'board', 'notes', 'bin']).filter(function (id) { return !q || APPS[id].t.toLowerCase().indexOf(q) > -1 || (APPS[id].sub || '').toLowerCase().indexOf(q) > -1; });
    var rec = []; try { rec = JSON.parse(store.get('ictDeskRecent', '[]')); } catch (e) {}
    var who = (document.getElementById('user-chip') || {}).textContent || '👤 Guest';
    startEl.innerHTML = '<div class="sq">🔍<input id="dk-q" placeholder="Search for a folder or app" autocomplete="off" value="' + esc(q || '') + '"></div>' +
      '<h4>' + (q ? 'Best match' : 'Pinned') + '</h4><div id="dk-pins">' + (pins.map(function (id) { return '<button class="pin" data-id="' + id + '">' + appIco(id) + '<span>' + esc(APPS[id].t) + '</span></button>'; }).join('') || '<div class="rec-none">No match</div>') + '</div>' +
      (q ? '' : '<h4>Recommended</h4><div id="dk-rec">' + (rec.length ? rec.map(function (id) { return '<button class="rec" data-id="' + id + '">' + appIco(id, 26) + '<span>' + esc(APPS[id].t) + '<small>' + esc(APPS[id].sub || '') + '</small></span></button>'; }).join('') : '<div class="rec-none">Folders you open will show up here.</div>') + '</div>') +
      '<div class="sf"><span>' + esc(who.trim()) + '</span><span>' + (document.getElementById('class-btn') ? '<button data-a="class" title="Class dashboard">👩‍🏫</button>' : '') + '<button data-a="tour" title="World Tour">🌍</button><button data-a="pw" title="Account">⏻</button></span></div>';
  }
  function toggleStart(force, q) {
    var on = force === undefined ? !startEl.classList.contains('on') : force; widEl.classList.remove('on');
    if (on) { startHtml(q || ''); startEl.classList.add('on'); var i = startEl.querySelector('#dk-q'); setTimeout(function () { i.focus(); i.setSelectionRange(i.value.length, i.value.length); }, 30); } else startEl.classList.remove('on');
  }
  $('#dk-sbtn').addEventListener('click', function () { toggleStart(); });
  $('#dk-sq').addEventListener('click', function () { toggleStart(true, ''); });
  startEl.addEventListener('input', function (e) { if (e.target.id === 'dk-q') { var v = e.target.value.trim().toLowerCase(); startHtml(v); var i = startEl.querySelector('#dk-q'); i.focus(); i.setSelectionRange(i.value.length, i.value.length); } });
  startEl.addEventListener('keydown', function (e) { if (e.key === 'Enter') { var b = startEl.querySelector('.pin'); if (b) open(b.dataset.id); } if (e.key === 'Escape') toggleStart(false); });
  startEl.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return;
    if (b.dataset.id) open(b.dataset.id);
    else if (b.dataset.a === 'tour') { toggleStart(false); open('tour'); }
    else if (b.dataset.a === 'class') { var c = document.getElementById('class-btn'); toggleStart(false); c && c.click(); }
    else if (b.dataset.a === 'pw') { var u = document.getElementById('user-chip'); toggleStart(false); u && u.click(); }
  });

  /* ---------------- widgets ---------------- */
  function widgets() {
    var T = window.ICTTour, xp = 0, lv = 1; try { var st = F.get(); xp = st.xp || 0; lv = Math.floor(xp / 50) + 1; } catch (e) {}
    var n = new Date(), nx = T && T.next(), cc = T ? T.complete() : 0, mhtml;
    if (nx) mhtml = '<p style="font-size:17px;font-weight:700">📍 Book ' + nx.b.code + ' → ' + esc(nx.b.lm) + '</p><p>' + '⚡ ' + nx.i.mcDone + ' / ' + nx.i.mcNeed + ' MC correct' + (nx.i.gamesTotal ? ' · 🎮 ' + nx.i.gamesDone + ' / ' + nx.i.gamesTotal + ' games' : '') + '. ' + esc(nx.b.spot) + ' is ' + Math.round(nx.i.pct * 100) + '% lit.</p><div class="bar"><i style="width:' + Math.round(nx.i.pct * 100) + '%"></i></div><button data-a="cont">Continue</button> <button data-a="show" style="background:rgba(255,255,255,.18);color:#fff">Show on map</button>';
    else mhtml = '<p style="font-size:17px;font-weight:700">🌟 The whole map is lit!</p><p>Every available book is complete. Amazing work.</p>';
    widEl.innerHTML = '<div class="wg"><h6>Clock</h6><div class="big">' + n.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + '</div><p>' + n.toLocaleDateString([], { weekday: 'long', day: 'numeric', month: 'long' }) + '</p></div>' +
      '<div class="wg"><h6>Next mission</h6>' + mhtml + '</div>' +
      '<div class="wg"><h6>World Tour</h6><p><b>' + cc + '</b> of ' + (T ? T.available() : 9) + ' continents lit. Light all seven and the whole map glows.</p><button data-a="tour">Open World Tour</button></div>' +
      '<div class="wg"><h6>Your progress</h6><p>Level <b>' + lv + '</b> · ' + xp + ' XP</p><div class="bar"><i style="width:' + ((xp % 50) * 2) + '%"></i></div></div>';
    $('#dk-wt').textContent = 'World Tour'; $('#dk-ws').textContent = cc + ' of ' + T.available() + ' continents lit';
  }
  $('#dk-wbtn').addEventListener('click', function () { startEl.classList.remove('on'); var on = !widEl.classList.contains('on'); if (on) widgets(); widEl.classList.toggle('on', on); });
  widEl.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return; var T = window.ICTTour, nx = T && T.next();
    if (b.dataset.a === 'tour') { widEl.classList.remove('on'); open('tour'); }
    if (b.dataset.a === 'cont' && nx) { widEl.classList.remove('on'); open('concepts-book-' + nx.b.id); }
    if (b.dataset.a === 'show' && nx) { widEl.classList.remove('on'); window.ICTScenes && window.ICTScenes.spot(nx.b.lm); }
  });
  function tourWire(w, wc) {
    wc.addEventListener('click', function (e) {
      var pvb = e.target.closest('[data-preview]'); if (pvb) { e.preventDefault(); w.st.min = true; w.el.classList.remove('on'); apply(w); taskbar(); window.ICTScenes && window.ICTScenes.preview(true); return; }
      var sp = e.target.closest('[data-spot]'), bk = e.target.closest('[data-book]'), li = e.target.closest('li[data-open]');
      if (sp) { e.preventDefault(); window.ICTScenes && window.ICTScenes.spot(sp.dataset.spot); w.st.min = true; w.el.classList.remove('on'); apply(w); taskbar(); }
      else if (bk) open('concepts-book-' + bk.dataset.book);
      else if (li) { var id = li.dataset.open, p = P()[id]; if (!p) return; if (isHash(id)) go(function () { classic(id); }); else go(function () { location.href = p.u; }); }
    });
  }
  addEventListener('ict:tour', function () {
    var w = wins.filter(function (o) { return o.id === 'tour'; })[0];
    if (w) { var wc = w.el.querySelector('.wc'), op = [].map.call(wc.querySelectorAll('details'), function (x) { return x.open; }), sc = wc.scrollTop; wc.innerHTML = nativeHtml('tour'); [].forEach.call(wc.querySelectorAll('details'), function (x, i) { x.open = !!op[i]; }); wc.scrollTop = sc; }
    if (widEl.classList.contains('on')) widgets(); labelWidget();
  });
  function labelWidget() { var T = window.ICTTour; if (T) { $('#dk-wt').textContent = 'World Tour'; $('#dk-ws').textContent = T.complete() + ' of ' + T.available() + ' continents lit'; } }

  /* ---------------- context menu, clock, keyboard ---------------- */
  d.addEventListener('contextmenu', function (e) {
    if (e.target.closest('.win') || e.target.closest('#dk-bar') || e.target.closest('#dk-start') || e.target.closest('#dk-widgets')) return;
    e.preventDefault(); var r = d.getBoundingClientRect();
    ctx.innerHTML = '<button data-a="tour">🌍&nbsp; World Tour — see your missions</button><button data-a="wid">🗺️&nbsp; Show widgets</button><button data-a="ref">🔄&nbsp; Refresh</button>';
    ctx.style.left = Math.min(e.clientX - r.left, d.clientWidth - 245) + 'px'; ctx.style.top = Math.min(e.clientY - r.top, d.clientHeight - 230) + 'px'; ctx.classList.add('on');
  });
  ctx.addEventListener('click', function (e) {
    var b = e.target.closest('button'); if (!b) return; ctx.classList.remove('on'); var a = b.dataset.a;
    if (a === 'tour') open('tour'); else if (a === 'wid') $('#dk-wbtn').click(); else if (a === 'ref') { iconsEl.style.opacity = 0; setTimeout(function () { iconsEl.style.opacity = ''; }, 160); }
  });
  function clock() { var n = new Date(); $('#dk-time').textContent = n.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }); $('#dk-date').textContent = n.toLocaleDateString([], { day: 'numeric', month: 'numeric', year: 'numeric' }); }
  clock(); setInterval(clock, 15000);
  addEventListener('keydown', function (e) { if (e.key === 'Escape') { startEl.classList.remove('on'); widEl.classList.remove('on'); ctx.classList.remove('on'); } if (e.key === 'Meta' && !e.ctrlKey && d.offsetParent !== null) { /* Windows key look-alike */ } });

  /* ---------------- desktop <-> classic pages ---------------- */
  var tools = $('#dk-tools');
  function toTray() { ['xp-chip', 'fun-tools'].forEach(function (id) { var el = document.getElementById(id); if (el && el.parentNode !== tools) { moved.push({ el: el, parent: el.parentNode, next: el.nextSibling }); tools.appendChild(el); } }); }
  function toDesk() { var ic = d.querySelector('#dk-icons'); ['quote-card', 'bit'].forEach(function (id) { var el = document.getElementById(id); if (el && el.parentNode !== d) { moved.push({ el: el, parent: el.parentNode, next: el.nextSibling }); d.insertBefore(el, ic.nextSibling); } }); }
  function fromTray() { moved.splice(0).reverse().forEach(function (m) { m.parent.insertBefore(m.el, m.next); }); }
  function homeVisible() { var h = document.getElementById('page-home'); return !h || !h.classList.contains('hidden'); }
  function sync() { var on = homeVisible(); if (!on && window.ICTPages) setTimeout(window.ICTPages.refresh, 0); if (!on) { setTimeout(refreshFolders, 0); } html.classList.toggle('desk', on); if (on) { toTray(); toDesk(); taskbar(); } else fromTray(); }
  function show() { if (!html.classList.contains('desk')) { if (typeof orig === 'function') orig('home', false); sync(); } }
  var orig = window.showPage;
  function classic(id) { if (typeof orig === 'function') orig(id); sync(); window.scrollTo(0, 0); }
  window.showPage = function (id, push) {
    if (id && id !== 'home' && ROOTS.indexOf(id) > -1 && html.classList.contains('desk')) { open(id); return; }
    if (typeof orig === 'function') orig(id, push); sync();
  };

  /* ---------------- "All content" index injected into the full folder pages ---------------- */
  function chipHtml(k) {
    var p = P()[k], T = window.ICTTour, done = false;
    if (T && T.games) { try { var bk = T.bookOf(k); if (bk) { var g = (F.get().books || {})[bk.id]; done = !!(g && g.games && g.games[k]); } } catch (e) {} }
    var isG = iconFor(k) === '🧩' || /pseudocode/.test(p.u);
    return '<a class="fa-chip" href="' + p.u + '">' + iconFor(k) + ' ' + esc(p.t) + (isG ? (done ? ' <b>✅</b>' : ' <small>+10 XP</small>') : '') + '</a>';
  }
  function injectFolder(root) {
    var page = document.getElementById('page-' + root); if (!page || document.getElementById('fa-' + root)) return;
    var a = APPS[root], T = window.ICTTour, cards = '';
    var list = kids(root);
    if (!list.length) return;
    list.forEach(function (k) {
      var p = P()[k], sub = kids(k), bk = T && /^concepts-book-/.test(k) ? T.books.filter(function (z) { return 'concepts-book-' + z.id === k; })[0] : null, head = '', chips = '';
      sub.forEach(function (c) { chips += chipHtml(c); });
      if (bk) {
        var i = T.info(bk), lk = T.locked(bk);
        chips += lk ? '' : '<a class="fa-chip fa-mc" href="mctrainer.html">⚡ Practice MC · ' + i.mcDone + '/' + i.mcNeed + '</a>';
        head = '<div class="fa-pct">' + (lk ? '🔒 coming soon' : '🌍 ' + esc(bk.lm) + ' · ' + Math.round(i.pct * 100) + '% lit') + '</div><div class="fa-bar"><i style="width:' + Math.round(i.pct * 100) + '%"></i></div>';
      }
      var url = isHash(k) ? '#' + k : p.u;
      cards += '<div class="fa-card"><h4>' + (isHash(k) ? '<a href="#" data-pg="' + k + '">' + esc(p.t) + '</a>' : '<a href="' + url + '">' + iconFor(k) + ' ' + esc(p.t) + '</a>') + '</h4>' + head + (chips ? '<div class="fa-chips">' + chips + '</div>' : '') + '</div>';
    });
    var sec = document.createElement('section'); sec.id = 'fa-' + root; sec.className = 'fa';
    sec.innerHTML = '<h3>' + a.i + ' All content in ' + esc(a.t) + '</h3><p class="fa-note">Everything in this folder in one place. XP comes from MC Trainer questions and games (⚡ / 🧩), not from opening pages.</p><div class="fa-grid">' + cards + '</div>';
    sec.addEventListener('click', function (e) { var l = e.target.closest('a[data-pg]'); if (l) { e.preventDefault(); if (typeof orig === 'function') orig(l.dataset.pg); sync(); window.scrollTo(0, 0); } });
    page.appendChild(sec);
  }
  function refreshFolders() { ROOTS.forEach(function (r) { var o = document.getElementById('fa-' + r); if (o) o.remove(); }); var cur = ROOTS.filter(function (r) { var pg = document.getElementById('page-' + r); return pg && !pg.classList.contains('hidden'); })[0]; if (cur) injectFolder(cur); }
  addEventListener('ict:tour', refreshFolders);
  window.ICTDesk = { open: open, sync: sync, windows: function () { return wins.length; } };
  addEventListener('pageshow', function () { d.style.opacity = ''; sync(); });
  addEventListener('hashchange', sync);

  /* ---------------- start ---------------- */
  sync(); taskbar();
  var qs = new URLSearchParams(location.search).get('open');
  if (qs) { try { history.replaceState(null, '', location.pathname); } catch (e) {} setTimeout(function () { open(qs); }, 150); }
  else if (!store.get('ictDeskWelcome', '') && homeVisible()) { store.set('ictDeskWelcome', '1'); setTimeout(function () { if (!wins.length && html.classList.contains('desk')) open('welcome'); }, 800); }
  setTimeout(labelWidget, 400);
})();
