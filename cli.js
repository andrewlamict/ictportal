/* ICT Portal - Easter egg: Terminal mode. Type "sudo" on the desktop (or run the hint from the Recycle Bin) to open a command-line version of the portal. */
(function () {
  'use strict';
  if (window.ICT_EMBED) return;
  var F = window.ICTFun || { get: function () { return { xp: 0, books: {} }; }, addXP: function () {}, badge: function () {}, toast: function () {} };
  var P = function () { return (window.ICTNav && window.ICTNav.pages) || {}; };
  var root = null, out, inp, prompt, hist = [], hi = 0, cwd = 'home', guide = 0, tree = null;

  /* ---------- virtual file system built from the site map ---------- */
  function nameOf(id, p) {
    if (id === 'home') return '~';
    var m = /^concepts-book-(.+)$/.exec(id); if (m) return 'book-' + m[1];
    if (p.u.indexOf('#') > -1) return id;
    var seg = p.u.replace(/\.html$/, '').split('/');
    if (/mindmap\.html$/.test(p.u)) return seg[seg.length - 2] + '-mindmap';
    return seg[seg.length - 1];
  }
  function build() {
    var pg = P(), used = {}; tree = { byId: {}, kids: {} };
    Object.keys(pg).forEach(function (id) {
      var p = pg[id], par = p.p || null, n = nameOf(id, p);
      if (id === 'lab') return;
      var key = (par || '') + '/' + n; if (used[key]) n = n + '-' + (used[key]++); else used[key] = 1;
      tree.byId[id] = { id: id, name: n, parent: par, p: p };
      if (par) (tree.kids[par] = tree.kids[par] || []).push(id);
    });
  }
  function kids(id) { return (tree.kids[id] || []).filter(function (k) { return tree.byId[k]; }); }
  function isDir(id) { return kids(id).length > 0; }
  function pathOf(id) { var a = [], c = id, n = 0; while (c && tree.byId[c] && n++ < 8) { a.unshift(tree.byId[c].name); c = tree.byId[c].parent; } return a[0] === '~' ? (a.length === 1 ? '~' : '~/' + a.slice(1).join('/')) : a.join('/'); }
  function find(arg, from) {
    if (!arg || arg === '~' || arg === '/') return 'home';
    var cur = from, parts = arg.replace(/^~\/?/, '/').split('/').filter(Boolean);
    if (/^(~|\/)/.test(arg)) cur = 'home';
    for (var i = 0; i < parts.length; i++) {
      var s = parts[i];
      if (s === '.') continue;
      if (s === '..') { cur = (tree.byId[cur] && tree.byId[cur].parent) || 'home'; continue; }
      var hit = kids(cur).filter(function (k) { return tree.byId[k].name.toLowerCase() === s.toLowerCase(); })[0];
      if (!hit) { var c = kids(cur).filter(function (k) { return tree.byId[k].name.toLowerCase().indexOf(s.toLowerCase()) === 0; }); if (c.length === 1) hit = c[0]; }
      if (!hit) return null; cur = hit;
    }
    return cur;
  }

  /* ---------- output helpers ---------- */
  function esc(s) { return String(s).replace(/[&<>]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]; }); }
  function print(html, cls) { var d = document.createElement('div'); d.className = 'cl ' + (cls || ''); d.innerHTML = html; out.appendChild(d); out.scrollTop = out.scrollHeight; }
  function bar(p, n) { n = n || 20; var f = Math.round(p * n); return '[' + '█'.repeat(f) + '░'.repeat(n - f) + '] ' + Math.round(p * 100) + '%'; }
  function say(s) { print(esc(s)); }
  function hint(s) { print('<span class="hn">💡 ' + esc(s) + '</span>'); }

  /* ---------- guided tutorial ---------- */
  var STEPS = [
    { t: 'Type  ls  and press Enter to LiSt what is inside the current folder.', ok: function (c) { return c === 'ls'; } },
    { t: 'Type  cd concepts  to Change Directory into the ICT Concepts folder.', ok: function (c) { return /^cd\s+concepts\/?$/.test(c); } },
    { t: 'Type  ls  again. You should see one folder for every DSE book.', ok: function (c) { return c === 'ls'; } },
    { t: 'Type  cd book-b  to walk into Book B.', ok: function (c) { return /^cd\s+book-b\/?$/.test(c); } },
    { t: 'Type  pwd  to Print the Working Directory (where am I?).', ok: function (c) { return c === 'pwd'; } },
    { t: 'Type  progress  to see how brightly your world map is lit.', ok: function (c) { return c === 'progress'; } },
    { t: 'Last one! Type  open scanner  to launch an activity (any  open <name>  works). Tip: press Tab to auto-complete names.', ok: function (c) { return /^open\s+\S+/.test(c); } }
  ];
  function showStep() { if (guide <= 0) return; if (guide > STEPS.length) return; print('<span class="gd">▶ Step ' + guide + ' / ' + STEPS.length + ' — ' + esc(STEPS[guide - 1].t) + '</span>'); }
  function checkGuide(c) {
    if (!guide || guide > STEPS.length) return;
    if (STEPS[guide - 1].ok(c)) {
      guide++;
      if (guide > STEPS.length) {
        guide = 0; print('<span class="gd">🎉 Tutorial complete! You now know ls, cd, pwd, progress and open — real command-line skills.</span>');
        var s = F.get(); s.cli = s.cli || {};
        if (!s.cli.done) { s.cli.done = 1; F.addXP && F.addXP(20); F.badge && F.badge('cli-hacker', '⌨️ Terminal Hacker'); F.toast && F.toast('⌨️ Terminal Hacker! +20 XP', 4); }
      } else setTimeout(showStep, 60);
    } else if (c) { var tx = STEPS[guide - 1].t; setTimeout(function () { print('<span class="hn">Not quite — ' + esc(tx) + '</span>'); }, 60); }
  }

  /* ---------- commands ---------- */
  function lsLine(id) { var n = tree.byId[id]; return (isDir(id) ? '<b class="d">' + esc(n.name) + '/</b>' : '<span class="f">' + esc(n.name) + '</span>'); }
  function launch(id) {
    var p = P()[id], u = p.u;
    print('Launching <b>' + esc(p.t) + '</b> …'); setTimeout(function () {
      if (u.indexOf('#') > -1) { close(); if (typeof window.showPage === 'function') window.showPage(id); } else location.href = u;
    }, 500);
  }
  var CMD = {
    help: function () {
      print('<pre>Commands\n  ls [path]       list a folder          cd &lt;path&gt;      go into a folder (cd .. = back, cd ~ = home)\n  pwd             where am I?            tree            show everything under this folder\n  open &lt;name&gt;    launch a page or game  progress        your world-map progress\n  xp              your level and XP      mc              start MC Trainer (this is how you earn XP!)\n  map             open the lit-up world map preview\n  guide           step-by-step tutorial  clear           wipe the screen\n  history         your past commands     whoami / date   fun facts\n  exit            back to the desktop (also: gui)\nTips: ↑ ↓ recall old commands · Tab auto-completes names.</pre>');
    },
    ls: function (a) {
      var id = a[0] ? find(a[0], cwd) : cwd; if (!id) return say('ls: cannot access \'' + a[0] + '\': No such file or directory');
      if (!isDir(id)) return print(lsLine(id));
      print(kids(id).map(lsLine).join('   ') || '(empty)');
    },
    cd: function (a) {
      var id = find(a[0], cwd); if (!id) return say('cd: ' + a[0] + ': No such directory');
      if (!isDir(id)) return say('cd: ' + a[0] + ': Not a directory (try  open ' + (a[0] || '') + ')');
      cwd = id; refreshPrompt();
    },
    pwd: function () { say(pathOf(cwd)); },
    tree: function () {
      var lines = [pathOf(cwd)];
      (function walk(id, pre, depth) { var ks = kids(id); ks.forEach(function (k, i) { var last = i === ks.length - 1; lines.push(pre + (last ? '└── ' : '├── ') + tree.byId[k].name + (isDir(k) ? '/' : '')); if (depth < 2) walk(k, pre + (last ? '    ' : '│   '), depth + 1); }); })(cwd, '', 0);
      print('<pre>' + esc(lines.slice(0, 80).join('\n')) + (lines.length > 80 ? '\n… (' + (lines.length - 80) + ' more)' : '') + '</pre>');
    },
    open: function (a) {
      if (!a[0]) return say('usage: open <name>   e.g.  open scanner');
      var id = find(a[0], cwd);
      if (!id) { /* search whole site by name */ var q = a[0].toLowerCase(), all = Object.keys(tree.byId).filter(function (k) { return k !== 'home' && (tree.byId[k].name.toLowerCase().indexOf(q) > -1 || tree.byId[k].p.t.toLowerCase().indexOf(q) > -1); }); if (all.length === 1) id = all[0]; else if (all.length > 1) return say('open: ambiguous — did you mean: ' + all.slice(0, 6).map(function (k) { return tree.byId[k].name; }).join(', ') + ' ?'); }
      if (!id) return say('open: ' + a[0] + ': not found');
      launch(id);
    },
    progress: function () {
      var T = window.ICTTour; if (!T || !T.conts) return say('World Tour is still loading…');
      var rows = T.conts.map(function (ct) { var k = T.cont(ct.id); return (ct.name + '                ').slice(0, 15) + (ct.code + '            ').slice(0, 12) + (k.locked ? '🔒 coming soon' : bar(k.pct, 16) + '  ' + k.done + '/' + k.open + ' spots'); });
      print('<pre>' + esc(rows.join('\n')) + '\n\n' + esc(T.complete() + ' of ' + T.available() + ' open continents fully lit (7 in total).') + '</pre>');
      hint('Each chapter is a tourist spot. Light it with  mc  (answer questions) and by playing its games.');
    },
    xp: function () { var s = F.get(), xp = s.xp || 0; print('<pre>Level ' + (Math.floor(xp / 50) + 1) + '   ' + xp + ' XP\n' + esc(bar((xp % 50) / 50, 20)) + ' to next level</pre>'); },
    mc: function () { launch('mctrainer.html'); },
    map: function () { print('Showing the fully-lit map…'); setTimeout(function () { if (window.ICTScenes && ICTScenes.preview) { close(); ICTScenes.preview(true); } else location.href = 'mappreview.html'; }, 500); },
    guide: function () { guide = 1; print('<span class="gd">📘 Tutorial started. Do each step in order — I will check what you type.</span>'); showStep(); },
    clear: function () { out.innerHTML = ''; },
    history: function () { print('<pre>' + esc(hist.map(function (h, i) { return (i + 1) + '  ' + h; }).join('\n')) + '</pre>'); },
    whoami: function () { var u = (document.getElementById('user-chip') || {}).textContent || 'guest'; say(u.replace(/^\W+/, '').trim() || 'guest'); },
    date: function () { say(new Date().toString()); },
    echo: function (a) { say(a.join(' ')); },
    sudo: function () { say('Nice try. 😄 With great power comes great responsibility — you are already root of this portal.'); },
    exit: function () { close(); }, gui: function () { close(); },
    python: function () { say('Python 3 lives in the Python Lab. Try:  open simplepythoncompiler'); },
    cat: function () { say('cat: files here are pages, not text. Use  open <name>  instead.'); },
    rm: function () { say('rm: permission denied — nothing here to delete. 🙂'); }
  };
  CMD.dir = CMD.ls; CMD.quit = CMD.exit; CMD['?'] = CMD.help;
  function run(line) {
    line = line.trim(); print('<span class="pr">' + promptHtml() + '</span> ' + esc(line));
    if (!line) return;
    hist.push(line); hi = hist.length;
    var parts = line.split(/\s+/), c = parts[0].toLowerCase(), a = parts.slice(1);
    if (CMD[c]) CMD[c](a); else print('<span class="er">' + esc(c) + ': command not found.</span> Type <b>help</b> or <b>guide</b>.');
    checkGuide(line.toLowerCase().replace(/\s+/g, ' '));
  }
  function promptHtml() { return 'student@ict-portal:<b class="d">' + esc(pathOf(cwd)) + '</b>$'; }
  function refreshPrompt() { if (prompt) prompt.innerHTML = promptHtml(); }

  /* ---------- UI ---------- */
  function css() {
    if (document.getElementById('cli-css')) return;
    var s = document.createElement('style'); s.id = 'cli-css';
    s.textContent = '#cli{position:fixed;inset:0;z-index:100000;background:#05080a;color:#7CFC9a;font:15px/1.5 ui-monospace,SFMono-Regular,Menlo,Consolas,monospace;display:flex;flex-direction:column;padding:max(12px,env(safe-area-inset-top)) 14px max(12px,env(safe-area-inset-bottom));opacity:0;transition:opacity .25s}#cli.on{opacity:1}' +
      '#cli:before{content:"";position:absolute;inset:0;pointer-events:none;background:repeating-linear-gradient(0deg,rgba(255,255,255,.03) 0 1px,transparent 1px 3px);}' +
      '#cli .top{display:flex;justify-content:space-between;align-items:center;font-size:12px;opacity:.75;margin-bottom:6px}#cli .top button{background:none;border:1px solid #2a6a40;color:#7CFC9a;border-radius:6px;padding:3px 10px;font:inherit;cursor:pointer}' +
      '#cli-out{flex:1;overflow:auto;white-space:pre-wrap;word-break:break-word}#cli-out pre{margin:0;font:inherit;white-space:pre-wrap}.cl{margin:2px 0}' +
      '#cli .d{color:#6bb5ff}#cli .f{color:#e8f5ec}#cli .pr{color:#7CFC9a}#cli .er{color:#ff7b72}#cli .hn{color:#ffd166}#cli .gd{display:inline-block;color:#05080a;background:#7CFC9a;padding:2px 8px;border-radius:4px;font-weight:700}' +
      '#cli-row{display:flex;gap:8px;align-items:center;border-top:1px solid #1f4d33;padding-top:8px}#cli-pr{white-space:nowrap}#cli-in{flex:1;min-width:0;background:transparent;border:0;outline:0;color:#fff;font:inherit;caret-color:#7CFC9a}' +
      '@media(max-width:640px){#cli{font-size:13px}#cli-pr{display:none}}';
    document.head.appendChild(s);
  }
  function open() {
    if (root) return; if (!tree) build(); css(); cwd = 'home'; guide = 0;
    root = document.createElement('div'); root.id = 'cli';
    root.innerHTML = '<div class="top"><span>ICT Portal Terminal v1.0 — secret mode unlocked 🔓</span><button id="cli-x">exit ⏏</button></div><div id="cli-out"></div><div id="cli-row"><span id="cli-pr"></span><input id="cli-in" autocomplete="off" autocapitalize="off" spellcheck="false" aria-label="Command"></div>';
    document.body.appendChild(root); out = root.querySelector('#cli-out'); inp = root.querySelector('#cli-in'); prompt = root.querySelector('#cli-pr');
    refreshPrompt(); requestAnimationFrame(function () { root.classList.add('on'); inp.focus(); });
    print('<pre>  ___ ____ _____   ____            _        _ \n |_ _/ ___|_   _| |  _ \\ ___  _ __| |_ __ _| |\n  | | |     | |   | |_) / _ \\| \'__| __/ _` | |\n  | | |___  | |   |  __/ (_) | |  | || (_| | |\n |___\\____| |_|   |_|   \\___/|_|   \\__\\__,_|_|</pre>');
    say('Welcome, student. This is how real programmers talk to computers.');
    print('Type <b>guide</b> for a 1-minute tutorial, <b>help</b> for all commands, <b>exit</b> to go back.');
    root.addEventListener('click', function (e) { if (e.target.id === 'cli-x') close(); else if (!window.getSelection().toString()) inp.focus(); });
    inp.addEventListener('keydown', function (e) {
      if (e.key === 'Enter') { var v = inp.value; inp.value = ''; run(v); }
      else if (e.key === 'ArrowUp') { e.preventDefault(); if (hi > 0) inp.value = hist[--hi]; }
      else if (e.key === 'ArrowDown') { e.preventDefault(); inp.value = hi < hist.length - 1 ? hist[++hi] : (hi = hist.length, ''); }
      else if (e.key === 'Tab') { e.preventDefault(); complete(); }
      else if (e.key === 'l' && e.ctrlKey) { e.preventDefault(); CMD.clear(); }
      else if (e.key === 'Escape') close();
      e.stopPropagation();
    });
    document.documentElement.style.overflow = 'hidden';
  }
  function complete() {
    var v = inp.value, m = /^(\S+)\s+(.*)$/.exec(v);
    if (!m) { var cs = Object.keys(CMD).filter(function (c) { return c.indexOf(v) === 0; }); if (cs.length === 1) inp.value = cs[0] + ' '; else if (cs.length > 1) say(cs.join('   ')); return; }
    var seg = m[2], slash = seg.lastIndexOf('/'), base = slash > -1 ? find(seg.slice(0, slash + 1) || '/', cwd) : cwd, pre = slash > -1 ? seg.slice(0, slash + 1) : '', part = seg.slice(slash + 1).toLowerCase();
    if (!base) return; var c = kids(base).filter(function (k) { return tree.byId[k].name.toLowerCase().indexOf(part) === 0; });
    if (c.length === 1) inp.value = m[1] + ' ' + pre + tree.byId[c[0]].name + (isDir(c[0]) ? '/' : ''); else if (c.length > 1) say(c.map(function (k) { return tree.byId[k].name; }).join('   '));
  }
  function close() { if (!root) return; var r = root; root = null; r.classList.remove('on'); setTimeout(function () { r.remove(); }, 250); document.documentElement.style.overflow = ''; }
  window.ICTCli = { open: open, close: close };

  /* secret trigger: type the word "sudo" anywhere (outside text boxes), or open with ?cli=1 */
  var seq = '', want = 'sudo';
  addEventListener('keydown', function (e) {
    if (root) return; var t = e.target; if (t && (/^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName) || t.isContentEditable)) return;
    if (e.key.length !== 1) return; seq = (seq + e.key.toLowerCase()).slice(-want.length);
    if (seq === want) { seq = ''; var T = window.ICTFun; T && T.toast && T.toast('⌨️ Terminal mode unlocked…', 1.6); setTimeout(open, 300); }
  });
  if (/[?&]cli=1/.test(location.search)) setTimeout(open, 400);
})();
