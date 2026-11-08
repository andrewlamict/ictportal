/* ICT Portal - fun skin for the full folder / book pages: animated hero banner, popping cards, chapter spot badges, floating emoji. */
(function () {
  'use strict';
  if (window.ICT_EMBED) return;
  var TH = { python: ['blue', '🐍'], database: ['green', '🗄️'], concepts: ['purple', '📚'], dse: ['orange', '🎯'], lab: ['orange', '🧪'] };
  var DECO = { blue: ['🐍', '💻', '⌨️', '✨', '🧩', '🔢'], green: ['🗄️', '🧮', '🔑', '✨', '📊', '🔍'], purple: ['📚', '🧠', '💡', '🌍', '✨', '📡'], orange: ['🎯', '⭐', '📝', '🏆', '✨', '⚡'] };
  function themeOf(id) { var k = id.replace('page-', ''); if (TH[k]) return TH[k]; if (/^concepts/.test(k)) return TH.concepts; return ['purple', '✨']; }
  function bookOfPage(id) { var m = /^page-concepts-book-(.+)$/.exec(id), T = window.ICTTour; return m && T ? T.books.filter(function (b) { return b.id === m[1]; })[0] : null; }
  function icoFor(txt, href, th) {
    var s = (txt + ' ' + (href || '')).toLowerCase();
    if (/mind/.test(s)) return '🧠'; if (/quiz|mc/.test(s)) return '🎯'; if (/lab|compiler|sql|code/.test(s)) return '🧪'; if (/game|ladder|if\.html|scanner|sensor|printer|kiosk|cpu|storage|driver|utility|processing|keyboard|operating|os\b/.test(s)) return '🎮';
    if (/ch\.?\s*\d/.test(s)) return '📖'; return TH[th] ? '✨' : '📖';
  }
  function build(pg) {
    var th = themeOf(pg.id); pg.dataset.th = th[0]; pg.dataset.pgx = '1';
    var h2 = pg.querySelector(':scope > h2'), bk = bookOfPage(pg.id);
    if (h2) {
      var hero = document.createElement('div'); hero.className = 'pg-hero';
      var crumb = pg.id === 'page-concepts' || !/^page-concepts-book/.test(pg.id) ? 'ICT Portal' : 'ICT Portal › ICT Concepts';
      hero.innerHTML = '<div class="pg-ico">' + (bk ? '🌍' : th[1]) + '</div><div class="pg-ht"><small>' + crumb + '</small></div><div class="pg-side"></div>';
      pg.insertBefore(hero, h2); hero.querySelector('.pg-ht').appendChild(h2);
      if (bk) { var sub = document.createElement('div'); sub.className = 'pg-sub'; hero.querySelector('.pg-ht').appendChild(sub); }
    }
    var deco = document.createElement('div'); deco.className = 'pg-deco';
    DECO[th[0]].forEach(function (e, i) { var s = document.createElement('span'); s.textContent = e; s.style.left = (6 + i * 16) + '%'; s.style.animationDelay = (-i * 3.1) + 's'; s.style.animationDuration = (16 + i * 2) + 's'; s.style.fontSize = (22 + (i % 3) * 8) + 'px'; deco.appendChild(s); });
    pg.insertBefore(deco, pg.firstChild);
    [].forEach.call(pg.querySelectorAll('.glass'), function (c, i) {
      c.style.setProperty('--i', Math.min(i, 14)); c.classList.add('fun-card');
      var h = c.querySelector('h3,h4'); if (h && !h.querySelector('.pg-ci') && !/^\s*[\u{1F300}-\u{1FAFF}☀-➿]/u.test(h.textContent)) {
        var a = c.closest('a'), s = document.createElement('span'); s.className = 'pg-ci'; s.textContent = icoFor(h.textContent, a && a.getAttribute('href'), th[0]); h.insertBefore(s, h.firstChild);
      }
    });
    [].forEach.call(pg.querySelectorAll('.border-b'), function (hd) { var nb = hd.querySelector('.w-8'); if (nb) { hd.classList.add('pg-ch'); hd.dataset.n = (nb.textContent || '').trim(); } });
    var obs = null;
  }
  function update(pg) {
    var bk = bookOfPage(pg.id), T = window.ICTTour; if (!bk || !T) return;
    var i = T.info(bk), lk = T.locked(bk), sub = pg.querySelector('.pg-sub'), side = pg.querySelector('.pg-side');
    if (sub) sub.textContent = lk ? '🔒 ' + bk.lm + ' — questions and games coming soon' : '🌍 ' + bk.lm + ' · ' + Math.round(i.pct * 100) + '% lit';
    if (side) side.innerHTML = lk ? '' : '<div class="pg-ring" style="--p:' + Math.round(i.pct * 100) + '"><b>' + Math.round(i.pct * 100) + '%</b></div><a class="pg-btn" href="mctrainer.html">⚡ Practice MC</a>';
    [].forEach.call(pg.querySelectorAll('.pg-ch'), function (hd) {
      var old = hd.querySelector('.pg-spot'); if (old) old.remove();
      var c = T.chap(bk.id + '-' + hd.dataset.n); if (!c) return;
      var b = document.createElement('span'); b.className = 'pg-spot' + (c.pct >= 1 ? ' done' : '') + (c.locked ? ' lk' : '');
      b.innerHTML = c.locked ? '🔒 ' + c.code + ' · soon' : (c.pct >= 1 ? '🌟 ' : '📍 ') + c.code + ' · ' + Math.round(c.pct * 100) + '% lit<i><u style="width:' + Math.round(c.pct * 100) + '%"></u></i>';
      hd.appendChild(b);
    });
  }
  function refresh() {
    var pg = document.querySelector('.page-content:not(.hidden)'); if (!pg || pg.id === 'page-home') return;
    if (pg.dataset.pgx !== '1') build(pg);
    update(pg); pg.classList.remove('pg-in'); void pg.offsetWidth; pg.classList.add('pg-in');
  }
  window.ICTPages = { refresh: refresh };
  addEventListener('ict:tour', function () { var pg = document.querySelector('.page-content:not(.hidden)'); if (pg && pg.dataset.pgx === '1') update(pg); });
})();
