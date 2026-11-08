/* ICT Portal - World Tour: the seven big books are the seven continents, every chapter is a tourist spot on its continent.
   XP is earned ONLY by (1) answering MC questions correctly in MC Trainer and (2) playing the games / activities of that chapter
   (more games, e.g. the keyword-highlighter, simply drop into the chapter's folder and count automatically).
   Opening a page gives nothing. A spot lights up when its chapter goal is reached; a continent lights up as its spots do. */
(function () {
  'use strict';
  if (window.ICT_EMBED) return;
  var F = window.ICTFun || { get: function () { return { books: {}, visited: {} }; }, save: function () {}, addXP: function () {}, toast: function () {}, badge: function () {}, confetti: function () {} };
  var XP_MC = 3, XP_GAME = 10, MC_CAP = 12;
  /* ---- the seven continents (edit here to move a book to another continent) ---- */
  var CONTS = [
    { id: 'na', name: 'North America', code: 'Book A', books: ['a1', 'a2'] },
    { id: 'as', name: 'Asia', code: 'Book B', books: ['b'] },
    { id: 'eu', name: 'Europe', code: 'Book C', books: ['c1', 'c2'] },
    { id: 'oc', name: 'Oceania', code: 'Book D', books: ['d'] },
    { id: 'af', name: 'Africa', code: 'Book E', books: ['e'] },
    { id: 'sa', name: 'South America', code: 'Elective A', books: ['ea'] },
    { id: 'an', name: 'Antarctica', code: 'Elective C', books: ['ec'] }
  ];
  var BK = { a1: ['A1', [1, 2, 3]], a2: ['A2', [4, 5]], b: ['B', [1, 2, 3]], c1: ['C1', [1, 2, 3]], c2: ['C2', [4, 5, 6]], d: ['D1·D2', [1, 2, 3, 6]], e: ['E', [1, 2, 3]], ea: ['EA', [1, 2, 3, 4, 5]], ec: ['EC', [1, 2, 3, 4, 5, 6, 7, 8]] };
  /* number of MC questions in the question sheet per chapter (updated live from MC Trainer) */
  var POOL = { 'a1-1': 3, 'a1-2': 21, 'a1-3': 75, 'a2-4': 25, 'a2-5': 29, 'b-1': 18, 'b-2': 55, 'b-3': 29, 'c1-1': 30, 'c1-2': 27, 'c1-3': 15, 'c2-4': 22, 'c2-5': 29, 'c2-6': 16, 'd-1': 17, 'd-2': 71, 'd-6': 10, 'e-1': 4, 'e-2': 21, 'e-3': 24 };
  var FOLDER = { booka1: 'a1', booka2: 'a2', bookb: 'b', bookc1: 'c1', bookc2: 'c2', bookd: 'd', booke: 'e', bookea: 'ea', bookec: 'ec' };
  var GAME_CH = { 'pseudocode.html': 'd-2' }; /* games that live outside a chapter folder */
  var BOOKS = [], CH = {}, CHL = [];
  CONTS.forEach(function (ct) {
    ct.chs = [];
    ct.books.forEach(function (bid) {
      var b = { id: bid, code: BK[bid][0], lm: ct.name, cont: ct.id, spot: 'Book ' + BK[bid][0], chs: [] };
      BK[bid][1].forEach(function (n) { var c = { id: bid + '-' + n, book: bid, n: n, code: BK[bid][0] + '·Ch' + n, cont: ct.id }; CH[c.id] = c; CHL.push(c); b.chs.push(c.id); ct.chs.push(c.id); });
      BOOKS.push(b);
    });
  });
  var P = function () { return (window.ICTNav && window.ICTNav.pages) || {}; };
  function bookById(id) { return BOOKS.filter(function (b) { return b.id === id; })[0] || null; }
  function bookTitle(b) { var p = P()['concepts-book-' + b.id]; return p ? p.t : 'Book ' + b.code; }
  function bookOf(pageId) {
    var p = P(), c = pageId, n = 0;
    while (c && p[c] && n++ < 8) { var m = /^concepts-book-(.+)$/.exec(c); if (m) return bookById(m[1]); c = p[c].p; }
    return null;
  }
  function chapterOfGame(id) {
    if (GAME_CH[id]) return GAME_CH[id];
    var m = /^(book[a-z0-9]+)\/ch(\d+)\//.exec(id); return m && FOLDER[m[1]] ? FOLDER[m[1]] + '-' + m[2] : null;
  }
  function isGamePage(id) { var p = P()[id]; return !!p && p.u.indexOf('#') < 0 && !/mindmap\.html$/.test(id) && !!bookOf(id); }
  function gamesOf(cid) { return Object.keys(P()).filter(function (k) { return isGamePage(k) && chapterOfGame(k) === cid; }); }
  function pool(cid) { try { var o = JSON.parse(localStorage.getItem('ictMcPool') || '{}'); if (o[cid] != null) return o[cid]; if (Object.keys(o).length) return 0; } catch (e) {} return POOL[cid] || 0; }
  function needMc(cid) { var n = pool(cid); return n ? Math.min(MC_CAP, Math.max(2, Math.ceil(n / 2))) : 0; }
  function st() { var s = F.get(); if (!s.books) s.books = {}; return s; }
  function bs(bid) { var s = st().books; var o = s[bid] = s[bid] || {}; o.mc = o.mc || {}; o.games = o.games || {}; return o; }
  function mcCount(cid) { var c = CH[cid], pre = c.n + ':', s = bs(c.book).mc; return Object.keys(s).filter(function (k) { return k.indexOf(pre) === 0; }).length; }
  /* ---- per chapter (= tourist spot) ---- */
  function chap(cid) {
    var c = CH[cid]; if (!c) return null;
    var g = gamesOf(cid), s = bs(c.book), need = needMc(cid), all = mcCount(cid), gd = g.filter(function (k) { return s.games[k]; }).length;
    var goal = XP_MC * need + XP_GAME * g.length, xp = XP_MC * Math.min(all, need) + XP_GAME * gd;
    return { id: cid, code: c.code, book: c.book, n: c.n, cont: c.cont, mcDone: Math.min(all, need), mcNeed: need, mcAll: all, gamesDone: gd, gamesTotal: g.length, games: g, goal: goal, xp: xp, pct: goal ? Math.min(1, xp / goal) : 0, locked: goal === 0 };
  }
  function chapterPct(cid) { var i = chap(cid); return i ? i.pct : 0; }
  /* ---- per book (aggregated, used by the folder pages and widgets) ---- */
  function info(b) {
    var cs = b.chs.map(chap), open = cs.filter(function (c) { return !c.locked; }), goal = 0, xp = 0, o = { mcDone: 0, mcNeed: 0, gamesDone: 0, gamesTotal: 0, spots: cs.length, spotsOpen: open.length, spotsDone: 0 };
    open.forEach(function (c) { goal += c.goal; xp += c.xp; o.mcDone += c.mcDone; o.mcNeed += c.mcNeed; o.gamesDone += c.gamesDone; o.gamesTotal += c.gamesTotal; if (c.pct >= 1) o.spotsDone++; });
    o.done = o.gamesDone; o.total = o.gamesTotal; o.goal = goal; o.xp = xp; o.pct = goal ? Math.min(1, xp / goal) : 0; return o;
  }
  function locked(b) { return b.chs.every(function (id) { return chap(id).locked; }); }
  /* ---- per continent ---- */
  function cont(id) {
    var ct = CONTS.filter(function (c) { return c.id === id; })[0]; if (!ct) return null;
    var cs = ct.chs.map(chap), open = cs.filter(function (c) { return !c.locked; });
    var pct = open.length ? open.reduce(function (s, c) { return s + c.pct; }, 0) / open.length : 0;
    return { id: id, name: ct.name, code: ct.code, spots: cs, open: open.length, total: cs.length, done: open.filter(function (c) { return c.pct >= 1; }).length, pct: pct, locked: !open.length, complete: open.length > 0 && pct >= 1 - 1e-9 };
  }
  function contPct(id) { var c = cont(id); return c ? c.pct : 0; }
  function complete() { return CONTS.filter(function (c) { return cont(c.id).complete; }).length; }
  function available() { return CONTS.filter(function (c) { return !cont(c.id).locked; }).length; }
  function worldLit() { return CONTS.reduce(function (s, c) { return s + contPct(c.id); }, 0) / CONTS.length; } /* all seven continents lit = the whole map glows */
  function stage(p) { return Math.floor(p * 4 + 1e-9); }
  function flush() {
    var mc = [], gm = [], changed = false, per = {};
    try { mc = JSON.parse(localStorage.getItem('ictMcPending') || '[]'); localStorage.removeItem('ictMcPending'); } catch (e) {}
    var stt = []; try { stt = JSON.parse(localStorage.getItem('ictMcStat') || '[]'); localStorage.removeItem('ictMcStat'); } catch (e) {}
    stt.forEach(function (r) { if (!CH[r[0] + '-' + r[1]]) return; var o = bs(r[0]); o.stat = o.stat || {}; var a = o.stat[r[1]] = o.stat[r[1]] || [0, 0]; a[0]++; a[1] += r[2] ? 1 : 0; changed = true; });
    try { gm = JSON.parse(localStorage.getItem('ictGamePending') || '[]'); localStorage.removeItem('ictGamePending'); } catch (e) {}
    function slot(cid) { return per[cid] = per[cid] || { cid: cid, before: chap(cid).pct, bc: contPct(CH[cid].cont), bcomp: cont(CH[cid].cont).complete, gain: 0 }; }
    mc.forEach(function (r) { var cid = r[0] + '-' + r[2]; if (!CH[cid]) return; var s = bs(r[0]), key = r[2] + ':' + r[1]; if (s.mc[key]) return; slot(cid); s.mc[key] = 1; per[cid].gain += XP_MC; });
    gm.forEach(function (id) { var cid = chapterOfGame(id); if (!cid || !CH[cid]) return; var s = bs(CH[cid].book); if (s.games[id]) return; slot(cid); s.games[id] = 1; per[cid].gain += XP_GAME; });
    Object.keys(per).forEach(function (cid) {
      var x = per[cid], i = chap(cid), ct = cont(CH[cid].cont); changed = true; if (x.gain) F.addXP(x.gain);
      if (i.pct >= 1 && x.before < 1) { F.toast('📍 ' + i.code + ' spot fully lit!', 3.6); F.confetti && F.confetti({ particleCount: 70, spread: 70, origin: { y: .7 } }); F.badge('spot-' + cid, '📍 ' + i.code); }
      else if (stage(i.pct) > stage(x.before)) F.toast('📍 ' + i.code + ' is ' + Math.round(i.pct * 100) + '% lit — keep going!', 3.2);
      else F.toast('📍 ' + i.code + ' · +' + x.gain + ' XP · ' + Math.round(i.pct * 100) + '%');
      if (ct.complete && !x.bcomp) { F.toast('🌍 ' + ct.name + ' is fully lit!', 4.5); F.confetti && F.confetti({ particleCount: 160, spread: 110, origin: { y: .6 } }); F.badge('cont-' + ct.id, '🌍 ' + ct.name); }
    });
    if (changed) { F.save(); window.dispatchEvent(new Event('ict:tour')); if (complete() === CONTS.length) F.toast('✨ All seven continents are lit — the whole world glows!', 5); }
  }
  /* ---- window content ---- */
  function bar(p, soon) { return '<div class="tbar' + (soon ? ' soon' : '') + '"><i style="width:' + Math.round(p * 100) + '%"></i></div>'; }
  function gname(id) { var p = P()[id]; return p ? p.t : id; }
  function html() {
    var rows = CONTS.map(function (ct) {
      var k = cont(ct.id), lis = k.spots.map(function (c) {
        if (c.locked) return '<li class="lk">🔒 <b>' + c.code + '</b> <small>no MC questions or games yet</small></li>';
        var s = bs(c.book), gl = c.games.map(function (id) { return '<div class="tg">' + (s.games[id] ? '✅' : '⬜') + ' 🎮 ' + gname(id) + ' <small>+' + XP_GAME + ' XP</small></div>'; }).join('');
        return '<li class="' + (c.pct >= 1 ? 'ok' : '') + '">' + (c.pct >= 1 ? '🌟' : '📍') + ' <b>' + c.code + '</b> · ' + Math.round(c.pct * 100) + '%<div class="tg">⚡ MC: <b>' + c.mcDone + ' / ' + c.mcNeed + '</b> correct <small>+' + XP_MC + ' XP each</small></div>' + gl + '</li>';
      }).join('');
      return '<details class="trow' + (k.locked ? ' soon' : '') + '"><summary><span class="tl">' + (k.complete ? '🌟' : k.locked ? '🔒' : '🌍') + '</span><span class="tn"><b>' + ct.name + ' · ' + ct.code + '</b><small>' + (k.locked ? 'coming soon' : k.done + ' of ' + k.open + ' spots lit') + '</small>' + bar(k.pct, k.locked) + '</span><span class="tp">' + (k.locked ? '—' : Math.round(k.pct * 100) + '%') + '</span></summary><ul class="tm">' + lis + '</ul><div class="tb"><button data-spot="' + ct.name + '">Show on map</button>' + (k.locked ? '' : '<a class="tbtn" href="mctrainer.html">Open MC Trainer</a>') + '</div></details>';
    }).join('');
    return '<div class="tour"><h3>🌍 World Tour</h3><p class="ts">Your 7 big books are the <b>7 continents</b> and each chapter is a <b>tourist spot</b>. Light a spot up by answering MC questions correctly in <b>MC Trainer</b> (+' + XP_MC + ' XP each) and playing its <b>games</b> (+' + XP_GAME + ' XP each). Just opening pages gives nothing. <b>' + complete() + ' of ' + available() + '</b> open continents lit — light all seven and the <b>whole map glows</b>!</p><p class="ts"><button class="tbtn" data-preview="1">🔆 Preview the fully lit map</button></p>' + rows + '</div>';
  }
  function next() {
    var best = null; BOOKS.forEach(function (b) { if (locked(b)) return; var i = info(b); if (i.pct >= 1) return; if (!best || i.pct > best.i.pct) best = { b: b, i: i }; });
    return best;
  }
  window.ICTTour = { books: BOOKS, conts: CONTS, chapters: CHL, info: info, locked: locked, chap: chap, chapInfo: chap, chapterPct: chapterPct, cont: cont, contPct: contPct, flush: flush, html: html, next: next, complete: complete, available: available, worldLit: worldLit, bookOf: bookOf, chapterOfGame: chapterOfGame, bookTitle: bookTitle, mark: function () {}, games: function (b) { return [].concat.apply([], b.chs.map(gamesOf)); }, missions: function (b) { return [].concat.apply([], b.chs.map(gamesOf)); } };
  addEventListener('ictfun:user', function () { window.dispatchEvent(new Event('ict:tour')); });
  setTimeout(flush, 500); addEventListener('pageshow', function () { setTimeout(flush, 100); });
  addEventListener('storage', function (e) { if (/ictMcPending|ictGamePending|ictMcStat/.test(e.key || '')) flush(); });
  addEventListener('focus', flush);
})();
