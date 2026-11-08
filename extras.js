/* ICT Portal - extras: gradient sky + theme picker, floating shapes, mascot "Bit", text scramble, click bursts. */
(function () {
  'use strict';
  if (window.ICT_EMBED) return; /* inside a desktop window: plain page only */
  var F = window.ICTFun || { toast: function () {}, reduce: false };
  var reduce = F.reduce;
  var rand = function (a, b) { return a + Math.random() * (b - a); };
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };

  /* ---------- Gradient sky + themes ---------- */
  var THEMES = [
    { id: 'sunset', name: 'Sunset', icon: '🌅' },
    { id: 'ocean', name: 'Ocean', icon: '🌊' },
    { id: 'mint', name: 'Mint', icon: '🍃' },
    { id: 'candy', name: 'Candy', icon: '🍬' },
    { id: 'night', name: 'Night', icon: '🌙' }
  ];
  var sky = document.createElement('div');
  sky.className = 'fun-sky';
  document.body.prepend(sky);
  var cur = store.get('ictBg', 'sunset');
  if (!THEMES.some(function (t) { return t.id === cur; })) cur = 'sunset';
  function applyTheme(id) { cur = id; document.documentElement.setAttribute('data-bg', id); store.set('ictBg', id); }
  applyTheme(cur);

  var btn = document.createElement('button');
  btn.id = 'theme-btn'; btn.type = 'button'; btn.setAttribute('aria-label', 'Change background');
  function paintBtn() { var t = THEMES.filter(function (x) { return x.id === cur; })[0]; btn.textContent = '🎨'; btn.title = 'Backgrounds & quotes'; }
  paintBtn();
  function nextTheme() {
    var i = THEMES.map(function (t) { return t.id; }).indexOf(cur);
    var next = THEMES[(i + 1) % THEMES.length];
    applyTheme(next.id); paintBtn(); F.toast(next.icon + ' ' + next.name + ' colours');
  }
  window.ICTTheme = { next: nextTheme };
  btn.addEventListener('click', function () { if (window.ICTScenes) window.ICTScenes.toggle(); else nextTheme(); });
  var tools = document.createElement('div');
  tools.id = 'fun-tools';
  tools.appendChild(btn);
  var anchor = document.getElementById('xp-chip') || document.querySelector('nav h1');
  if (anchor && anchor.parentNode) anchor.parentNode.insertBefore(tools, anchor.nextSibling);

  /* ---------- Floating shapes with mouse parallax ---------- */
  var shapes = document.createElement('div');
  shapes.className = 'fun-shapes';
  var kinds = ['ring', 'dot', 'tri', 'plus', 'square'];
  for (var i = 0; i < 16; i++) {
    var s = document.createElement('i');
    s.className = 'shape ' + kinds[i % kinds.length];
    s.style.left = rand(2, 96) + '%'; s.style.top = rand(3, 94) + '%';
    var sz = rand(14, 46); s.style.width = sz + 'px'; s.style.height = sz + 'px';
    s.style.setProperty('--d', rand(9, 20) + 's'); s.style.setProperty('--dl', (-rand(0, 15)) + 's');
    s.dataset.depth = rand(.2, 1).toFixed(2);
    shapes.appendChild(s);
  }
  document.body.prepend(shapes);
  if (!reduce) addEventListener('pointermove', function (e) {
    var cx = e.clientX / innerWidth - .5, cy = e.clientY / innerHeight - .5;
    shapes.style.transform = 'translate(' + (-cx * 30) + 'px,' + (-cy * 30) + 'px)';
  });

  /* ---------- Text scramble on card titles ---------- */
  var CH = '01<>{}[]#$%&*+=?/\\|~';
  function scramble(el) {
    if (el._sc || reduce) return;
    var final = el.dataset.orig || (el.dataset.orig = el.textContent), n = 0;
    el._sc = setInterval(function () {
      n++;
      var out = '';
      for (var k = 0; k < final.length; k++) out += (k < n / 1.6 || final[k] === ' ') ? final[k] : CH[(Math.random() * CH.length) | 0];
      el.textContent = out;
      if (n / 1.6 >= final.length) { clearInterval(el._sc); el._sc = 0; el.textContent = final; }
    }, 32);
  }
  document.addEventListener('pointerover', function (e) {
    var h = e.target.closest && e.target.closest('.fun-card h3, .fun-card h4');
    if (h && h.children.length === 0 && h.textContent.length < 40) scramble(h);
  });

  /* ---------- Emoji burst when a card is clicked ---------- */
  var EMO = ['⭐', '💡', '🐞', '💻', '📡', '🔐', '✨', '🧠'];
  document.addEventListener('click', function (e) {
    if (reduce || !(e.target.closest && e.target.closest('.fun-card'))) return;
    for (var i = 0; i < 7; i++) {
      var b = document.createElement('span');
      b.className = 'fun-burst'; b.textContent = EMO[(Math.random() * EMO.length) | 0];
      b.style.left = e.clientX + 'px'; b.style.top = e.clientY + 'px';
      var a = rand(0, Math.PI * 2), d = rand(40, 110);
      b.style.setProperty('--bx', Math.cos(a) * d + 'px'); b.style.setProperty('--by', Math.sin(a) * d - 30 + 'px');
      b.style.setProperty('--br', rand(-200, 200) + 'deg');
      document.body.appendChild(b); setTimeout((function (n) { return function () { n.remove(); }; })(b), 900);
    }
  });

  /* ---------- Mascot "Bit" ---------- */
  var TIPS = [
    'IPv4 has 32 bits. IPv6 has 128 bits!',
    '1 byte = 8 bits. 1 KB = 1024 bytes.',
    'Binary 1010 = decimal 10 (8 + 2).',
    'RAM is volatile: it forgets everything when the power is off. ROM keeps its data.',
    'The CPU repeats fetch → decode → execute, billions of times a second.',
    'A pixel is the smallest dot of an image. More pixels = sharper picture but a bigger file.',
    'Lossy compression (JPEG, MP3) throws data away. Lossless (PNG, ZIP) keeps everything.',
    'An IP address identifies a device. DNS turns a domain name into that address.',
    'HTTPS = HTTP + encryption.',
    'A firewall filters the traffic going in and out of a network.',
    'Phishing tricks you into giving away passwords. Check the sender and the link!',
    'Two-factor authentication needs two different proofs, e.g. password + code on your phone.',
    'Backup rule of thumb: keep a copy somewhere else, not only on the same computer.',
    'Cloud computing = storing and using data and software over the Internet.',
    'A primary key must be unique and never empty.',
    'A foreign key points to the primary key of another table. That is how tables are linked.',
    'In SQL, WHERE filters rows. HAVING filters groups.',
    'SELECT … FROM … WHERE … ORDER BY: the order you write the clauses matters.',
    'A database reduces data redundancy: the same fact is stored only once.',
    'A flowchart diamond means a decision (yes / no).',
    'A trace table is the best way to dry-run an algorithm.',
    'Binary search only works on a sorted list. Each step halves the search area.',
    'Bubble sort keeps swapping neighbours that are in the wrong order.',
    'A variable is a named memory location whose value can change.',
    'Pseudocode loops: FOR repeats a known number of times, WHILE repeats until a condition fails.',
    'Always test with normal, boundary and erroneous data.',
    'Syntax error = broken grammar. Logic error = program runs but gives a wrong answer.',
    'In Python, range(1, 5) stops at 4.',
    'The first computer "bug" was a real moth, found in 1947.',
    'Check the marks: 2 marks usually means 2 points.',
    'Psst… try the Konami code, or type the word sudo on the desktop.'
  ];
  var bit = document.createElement('div');
  bit.id = 'bit';
  bit.innerHTML =
    '<div class="bit-bubble" role="status"></div>' +
    '<svg viewBox="0 0 80 90" width="72" height="81" aria-label="Bit the robot mascot">' +
    '<line x1="40" y1="6" x2="40" y2="18" stroke="#fff" stroke-width="3" stroke-linecap="round"/><circle class="bit-ant" cx="40" cy="6" r="5" fill="#fbbf24"/>' +
    '<rect x="10" y="18" width="60" height="46" rx="16" fill="#fff"/><rect x="16" y="26" width="48" height="30" rx="11" fill="#1e1b4b"/>' +
    '<g class="bit-eyes"><circle cx="31" cy="41" r="7" fill="#e0e7ff"/><circle class="bit-pupil" cx="31" cy="41" r="3.4" fill="#4f46e5"/>' +
    '<circle cx="49" cy="41" r="7" fill="#e0e7ff"/><circle class="bit-pupil" cx="49" cy="41" r="3.4" fill="#4f46e5"/></g>' +
    '<rect x="34" y="68" width="12" height="9" rx="3" fill="#c7d2fe"/><rect x="20" y="74" width="40" height="12" rx="6" fill="#fff"/>' +
    '<rect x="2" y="30" width="8" height="18" rx="4" fill="#c7d2fe"/><rect x="70" y="30" width="8" height="18" rx="4" fill="#c7d2fe"/></svg>';
  document.body.appendChild(bit);
  var bubble = bit.querySelector('.bit-bubble'), pupils = bit.querySelectorAll('.bit-pupil'), bt;
  function say(msg, ms) {
    bubble.textContent = msg; bubble.classList.add('on'); clearTimeout(bt);
    bt = setTimeout(function () { bubble.classList.remove('on'); }, ms || 4200);
  }
  var ti = (Math.random() * TIPS.length) | 0;
  function nextTip() { ti = (ti + 1) % TIPS.length; return TIPS[ti]; }
  bit.addEventListener('click', function () {
    bit.classList.remove('hop'); void bit.offsetWidth; bit.classList.add('hop');
    say(nextTip());
  });
  addEventListener('pointermove', function (e) {
    var r = bit.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height * .45;
    var dx = e.clientX - cx, dy = e.clientY - cy, d = Math.sqrt(dx * dx + dy * dy) || 1, m = Math.min(3, d / 40);
    pupils.forEach(function (p) { p.style.transform = 'translate(' + (dx / d * m) + 'px,' + (dy / d * m) + 'px)'; });
  });
  setTimeout(function () { say('Hi! I\'m Bit 👋 Click me for an ICT tip.', 5200); }, 2500);
  if (!reduce) setInterval(function () { if (!document.hidden) say(nextTip(), 6500); }, 26000);
  window.addEventListener('offline', function () { say('Offline? Your notes are still saved here 📝', 6000); });
})();
