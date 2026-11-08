/* ICT Portal - the wallpaper: a painted world map. Each DSE book owns a landmark; the map starts dim and lights up
   as the student completes that book's missions (see tour.js). Also holds the rotating quotes. */
(function () {
  'use strict';
  var F = window.ICTFun || { toast: function () {}, reduce: false };
  var reduce = F.reduce;
  var store = {
    get: function (k, d) { try { var v = localStorage.getItem(k); return v === null ? d : v; } catch (e) { return d; } },
    set: function (k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };

  /* ---------------- helpers ---------------- */
  function mul(a) { return function () { a |= 0; a = a + 0x6D2B79F5 | 0; var t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
  function lg(c, x0, y0, x1, y1, st) { var g = c.createLinearGradient(x0, y0, x1, y1); st.forEach(function (s) { g.addColorStop(s[0], s[1]); }); return g; }
  function rg(c, x, y, r0, r1, st) { var g = c.createRadialGradient(x, y, r0, x, y, r1); st.forEach(function (s) { g.addColorStop(s[0], s[1]); }); return g; }
  function mk(W, H) { var c = document.createElement('canvas'); c.width = W; c.height = H; return c; }
  function blob(c, x, y, r, col0, col1) { c.fillStyle = rg(c, x, y, 0, r, [[0, col0], [1, col1 || 'rgba(255,255,255,0)']]); c.beginPath(); c.arc(x, y, r, 0, 7); c.fill(); }
  function cloudSprite(w, h, seed, shade) {
    var c = mk(w, h), x = c.getContext('2d'), r = mul(seed), n = 18, i;
    for (i = 0; i < n; i++) {
      var t = i / (n - 1), s = Math.sin(t * Math.PI);
      var cx = w * (.12 + .76 * t), cy = h * (.66 - .36 * s * (.55 + r() * .45)), rad = h * (.2 + .2 * s + r() * .1);
      blob(x, cx, cy, rad, 'rgba(255,255,255,.96)', 'rgba(255,255,255,0)');
    }
    x.globalCompositeOperation = 'source-atop';
    x.fillStyle = lg(x, 0, 0, 0, h, [[0, 'rgba(255,255,255,0)'], [.5, 'rgba(255,255,255,0)'], [1, shade || 'rgba(105,135,200,.6)']]);
    x.fillRect(0, 0, w, h);
    return c;
  }
  /* ---------- World tour: a painted world map, famous landmarks, tiny people walking ---------- */
  var WORLD = [
    /* North America */ [[-168,66],[-156,71],[-141,70],[-125,70],[-110,68],[-95,70],[-85,69],[-82,63],[-93,59],[-94,52],[-80,52],[-78,60],[-70,60],[-62,58],[-56,52],[-66,45],[-70,42],[-75,38],[-76,34],[-81,31],[-80,26],[-82,28],[-85,30],[-90,29],[-95,29],[-97,25],[-97,21],[-92,19],[-90,21],[-87,21],[-88,16],[-84,15],[-83,10],[-79,9],[-83,8],[-86,11],[-90,14],[-95,16],[-105,20],[-110,24],[-115,30],[-117,33],[-121,35],[-124,40],[-124,47],[-130,54],[-138,59],[-148,61],[-152,58],[-160,56],[-165,60]],
    /* Greenland */ [[-55,60],[-45,60],[-40,65],[-22,70],[-20,78],[-30,83],[-55,82],[-68,78],[-58,70]],
    /* South America */ [[-77,8],[-72,12],[-62,10],[-52,5],[-50,0],[-44,-2],[-35,-6],[-39,-14],[-41,-22],[-48,-26],[-54,-34],[-58,-38],[-65,-41],[-66,-47],[-70,-52],[-68,-55],[-74,-50],[-73,-40],[-71,-30],[-70,-18],[-76,-14],[-81,-6],[-80,-1],[-78,2]],
    /* Europe + Asia */ [[-9,37],[-9,43],[-2,43.5],[-1,46],[-4,48],[2,51],[5,53],[8,54],[9,57],[11,56],[14,54],[20,55],[22,58],[24,60],[29,60],[22,65],[25,65.5],[18,63],[17,60],[13,55.5],[10,59],[5,58],[5,62],[14,67],[20,70],[28,71],[40,67],[44,68],[60,69],[70,73],[80,73],[100,77],[112,74],[130,71],[150,71],[170,70],[180,68],[180,65],[172,64],[163,60],[156,52],[155,59],[142,59],[137,54],[141,52],[140,48],[132,43],[129,41],[128,36],[126,38],[125,40],[121,40],[122,37],[119,35],[122,30],[120,26],[117,23],[110,21],[108,17],[109,12],[105,9],[101,13],[100,8],[103,1.5],[98,8],[98,16],[94,17],[92,22],[88,22],[85,20],[80,15],[78,8],[76,10],[73,17],[72,21],[68,23],[66,25],[57,26],[56,27],[51,28],[48,30],[50,26],[54,24],[56,25],[59,22],[57,18],[52,16],[44,12],[43,16],[39,22],[35,28],[34,31],[36,36],[30,36],[27,37],[26,40],[29,41],[34,42],[41,41],[40,44],[37,45],[34,46],[30,46],[28,44],[28,41],[24,40],[22,37],[20,40],[19,42],[14,45],[12,44],[16,40],[16,38],[12,38],[10,44],[7,43],[3,43],[0,39],[-2,37],[-6,36]],
    /* Africa */ [[-17,21],[-16,28],[-10,31],[-6,36],[10,37],[11,33],[20,31],[32,31],[34,28],[39,20],[43,12],[51,12],[48,5],[41,-2],[40,-10],[35,-20],[33,-26],[28,-33],[20,-35],[18,-32],[12,-18],[13,-10],[9,-1],[9,4],[4,6],[-5,5],[-12,7],[-17,14]],
    /* Australia */ [[114,-22],[122,-18],[130,-12],[137,-12],[142,-11],[146,-19],[153,-26],[150,-37],[141,-38],[135,-34],[130,-32],[116,-35],[115,-30]],
    /* UK */ [[-5,50],[1,51],[2,53],[-2,56],[-2,58],[-5,58],[-6,56],[-3,54],[-5,52]],
    /* Ireland */ [[-10,52],[-6,52],[-6,55],[-9,54.5]],
    /* Japan */ [[130,31],[135,34],[140,36],[142,40],[141,45],[144,43],[140,41],[139,38],[136,36],[132,35]],
    /* Sumatra */ [[95,5],[104,-5],[106,-6],[98,2]],
    /* Borneo */ [[109,1],[117,7],[119,1],[116,-4],[110,-3]],
    /* Java */ [[105,-6.5],[114,-8],[107,-7.5]],
    /* New Guinea */ [[131,-1],[141,-3],[150,-10],[141,-9]],
    /* NZ N */ [[172,-34],[178,-38],[174,-41]], /* NZ S */ [[172,-41],[174,-42],[170,-46],[167,-46]],
    /* Madagascar */ [[44,-25],[49,-15],[50,-13],[47,-25]], /* Iceland */ [[-24,65],[-14,66],[-14,64],[-22,63.5]],
    /* Taiwan/Philippines/SriLanka */ [[120,22],[122,25],[121,22]], [[120,18],[124,13],[126,8],[122,10]], [[80,9],[82,7],[80,6]],
    /* Antarctica (last!) */ [[-118,-72],[-100,-69],[-80,-72],[-62,-63.5],[-58,-66],[-65,-70],[-62,-75],[-48,-77],[-30,-72],[0,-69],[30,-68],[60,-67],[90,-66],[110,-66],[135,-66],[160,-70],[182,-72],[182,-84],[-118,-84]]
  ];
  var ANT = WORLD.length - 1;
  var MOUNTS = [[[-125,55],[-115,48],[-108,40],[-106,33]], [[-72,8],[-77,-5],[-71,-18],[-70,-33],[-72,-45]], [[6,45],[10,46.5],[14,47]], [[70,36],[80,31],[90,28],[100,27]], [[60,68],[59,57],[58,51]], [[-8,32],[0,35],[8,35]], [[36,10],[38,3],[34,-3]]];
  var LMS = [
    { n: 'Statue of Liberty', ch: 'a1-1', ll: [-74, 40.7], pos: [-76, 41], k: 'liberty', f: 'The Statue of Liberty was a gift from France, dedicated in 1886.' },
    { n: 'Golden Gate Bridge', ch: 'a1-2', ll: [-122.5, 37.8], pos: [-116, 48], k: '~🌉', f: 'The Golden Gate Bridge opened in 1937 and is painted “International Orange”.' },
    { n: 'Grand Canyon', ch: 'a1-3', ll: [-112, 36], pos: [-110, 34], k: '~🏜️', f: 'The Grand Canyon is up to 1.8 km deep and 446 km long.' },
    { n: 'Niagara Falls', ch: 'a2-4', ll: [-79, 43], pos: [-88, 53], k: '~💦', f: 'Niagara Falls moves about 168,000 m³ of water every minute.' },
    { n: 'Chichén Itzá', ch: 'a2-5', ll: [-88.6, 20.7], pos: [-90, 22], k: '~🛕', f: 'The pyramid El Castillo at Chichén Itzá casts a snake-shaped shadow at the equinox.' },
    { n: 'Great Wall & Beijing', ch: 'b-1', ll: [116.4, 40.4], pos: [110, 45], k: 'pagoda', f: 'The Great Wall stretches over 20,000 km in total.' },
    { n: 'Taj Mahal', ch: 'b-2', ll: [78, 27.2], pos: [78, 24], k: 'taj', f: 'The Taj Mahal was completed around 1653.' },
    { n: 'Mount Fuji', ch: 'b-3', ll: [138.7, 35.4], pos: [148, 34], k: 'fuji', f: 'Mount Fuji is 3,776 m, Japan’s highest mountain.' },
    { n: 'Eiffel Tower', ch: 'c1-1', ll: [2.3, 48.9], pos: [4, 49], k: 'eiffel', f: 'The Eiffel Tower was finished in 1889 for the World’s Fair.' },
    { n: 'Big Ben', ch: 'c1-2', ll: [-0.1, 51.5], pos: [-8, 58], k: 'bigben', f: 'Big Ben is really the nickname of the great bell in the Elizabeth Tower.' },
    { n: 'Sagrada Família', ch: 'c1-3', ll: [2.2, 41.4], pos: [-6, 38], k: '~⛪', f: 'Sagrada Família in Barcelona has been under construction since 1882.' },
    { n: 'Colosseum', ch: 'c2-4', ll: [12.5, 41.9], pos: [16, 40], k: 'colosseum', f: 'The Colosseum opened in AD 80 and held tens of thousands of people.' },
    { n: 'Neuschwanstein Castle', ch: 'c2-5', ll: [10.7, 47.6], pos: [24, 53], k: '~🏰', f: 'Neuschwanstein Castle inspired the fairy-tale castles of many films.' },
    { n: 'Parthenon', ch: 'c2-6', ll: [23.7, 38], pos: [32, 39], k: '~🏛️', f: 'The Parthenon in Athens is about 2,450 years old.' },
    { n: 'Sydney Opera House', ch: 'd-1', ll: [151.2, -33.9], pos: [153, -31], k: 'opera', f: 'The Sydney Opera House opened in 1973.' },
    { n: 'Uluru', ch: 'd-2', ll: [131, -25.3], pos: [131, -24], k: '~🪨', f: 'Uluru is a sacred sandstone monolith, 348 m high.' },
    { n: 'Great Barrier Reef', ch: 'd-3', ll: [146, -18], pos: [149, -16], k: '~🐠', f: 'The Great Barrier Reef is the largest coral reef system on Earth.' },
    { n: 'Milford Sound', ch: 'd-6', ll: [167.9, -44.6], pos: [170, -41], k: '~🏔️', f: 'Milford Sound in New Zealand is a fjord carved by glaciers.' },
    { n: 'Pyramids of Giza', ch: 'e-1', ll: [31.1, 30], pos: [31, 26], k: 'pyramids', f: 'The Great Pyramid is about 4,500 years old.' },
    { n: 'Serengeti', ch: 'e-2', ll: [35, -2.3], pos: [35, -4], k: '~🦁', f: 'Every year over 1.5 million wildebeest migrate across the Serengeti.' },
    { n: 'Table Mountain', ch: 'e-3', ll: [18.4, -34], pos: [21, -30], k: '~⛰️', f: 'Table Mountain in Cape Town is about 260 million years old.' },
    { n: 'Galápagos Islands', ch: 'ea-1', ll: [-90.5, -0.7], pos: [-88, 3], k: '~🐢', f: 'Darwin’s studies on the Galápagos helped him develop the theory of evolution.' },
    { n: 'Amazon Rainforest', ch: 'ea-2', ll: [-60, -3], pos: [-62, -4], k: '~🌳', f: 'The Amazon rainforest produces a big share of the world’s oxygen cycle.' },
    { n: 'Machu Picchu', ch: 'ea-3', ll: [-72.5, -13.2], pos: [-75, -14], k: '~🏛️', f: 'Machu Picchu was built by the Inca around 1450.' },
    { n: 'Christ the Redeemer', ch: 'ea-4', ll: [-43.2, -22.9], pos: [-40, -24], k: 'christ', f: 'Christ the Redeemer was completed in 1931 on Corcovado mountain.' },
    { n: 'Iguazú Falls', ch: 'ea-5', ll: [-54.4, -25.7], pos: [-56, -33], k: '~💧', f: 'Iguazú Falls has about 275 separate waterfalls.' },
    { n: 'Vinson Massif', ch: 'ec-1', ll: [-85, -78.5], pos: [-98, -77], k: '~🏔️', f: 'Vinson Massif (4,892 m) is the highest mountain in Antarctica.' },
    { n: 'Deception Island', ch: 'ec-2', ll: [-60.6, -63], pos: [-60, -71], k: '~🌋', f: 'Deception Island is a flooded volcano crater you can sail into.' },
    { n: 'Paradise Bay', ch: 'ec-3', ll: [-62.9, -64.9], pos: [-22, -77], k: '~🧊', f: 'Paradise Bay is surrounded by glaciers and floating ice.' },
    { n: 'Lemaire Channel', ch: 'ec-4', ll: [-63, -65.1], pos: [16, -71], k: '~🚢', f: 'The Lemaire Channel is a narrow, spectacular passage nicknamed “Kodak Gap”.' },
    { n: 'South Pole', ch: 'ec-5', ll: [0, -90], pos: [54, -77], k: '~🚩', f: 'At the South Pole the sun rises and sets only once a year.' },
    { n: 'Emperor Penguins', ch: 'ec-6', ll: [-20, -77], pos: [92, -71], k: '~🐧', f: 'Emperor penguins breed in the Antarctic winter at −40 °C.' },
    { n: 'Ross Ice Shelf', ch: 'ec-7', ll: [-175, -80], pos: [130, -77], k: '~❄️', f: 'The Ross Ice Shelf is about the size of France.' },
    { n: 'Mount Erebus', ch: 'ec-8', ll: [167.2, -77.5], pos: [168, -71], k: '~🌋', f: 'Mount Erebus is the southernmost active volcano on Earth.' }
  ];
  var CREG = [
    { id: 'na', n: 'NORTH AMERICA', sub: 'Book A1 + A2', lab: [-126, 63], poly: [[-172, 86], [-12, 86], [-12, 14], [-60, 14], [-76, 12], [-77.8, 8.4], [-85, 4], [-172, 4]] },
    { id: 'sa', n: 'SOUTH AMERICA', sub: 'Elective A', lab: [-58, -46], poly: [[-86, 4], [-77.8, 8.4], [-76, 12], [-60, 14], [-25, 14], [-25, -60], [-90, -60]] },
    { id: 'eu', n: 'EUROPE', sub: 'Book C1 + C2', lab: [44, 64], poly: [[-30, 36.1], [-30, 80], [62, 80], [62, 52], [52, 47], [40, 43], [29.5, 41.5], [26, 40.5], [26, 34], [12, 36.3], [-5.3, 36.1]] },
    { id: 'as', n: 'ASIA', sub: 'Book B', lab: [92, 56], poly: [[62, 80], [190, 80], [190, -0.8], [130, -0.8], [130, -12], [60, -12], [60, 5], [53, 12.5], [44, 11], [43, 12.6], [34.2, 26], [34.2, 31], [26, 34], [26, 40.5], [29.5, 41.5], [40, 43], [52, 47], [62, 52]] },
    { id: 'af', n: 'AFRICA', sub: 'Book E', lab: [14, 9], poly: [[-26, 35.95], [-5.5, 35.95], [-5.5, 37.5], [11.5, 37.8], [11.5, 34], [30, 33], [34.2, 33], [34.2, 26], [43, 12.6], [44, 11], [53, 12.5], [53, -45], [-26, -45]] },
    { id: 'oc', n: 'OCEANIA', sub: 'Book D1 + D2', lab: [140, -39], poly: [[130, -0.8], [190, -0.8], [190, -62], [105, -62], [105, -12], [130, -12]] },
    { id: 'an', n: 'ANTARCTICA', sub: 'Elective C', lab: [-5, -83], poly: [[-190, -62.5], [190, -62.5], [190, -90], [-190, -90]] }
  ];
  var worldSpot = { i: -1, t: 0 }, PV = false;
  var ICONS = {
    eiffel: function (c, s) { c.fillStyle = '#7a5640'; c.beginPath(); c.moveTo(-.3 * s, 0); c.lineTo(-.07 * s, -.6 * s); c.lineTo(-.02 * s, -1 * s); c.lineTo(.02 * s, -1 * s); c.lineTo(.07 * s, -.6 * s); c.lineTo(.3 * s, 0); c.lineTo(.19 * s, 0); c.quadraticCurveTo(0, -.34 * s, -.19 * s, 0); c.fill(); c.fillStyle = '#a87a5c'; c.fillRect(-.11 * s, -.62 * s, .22 * s, .045 * s); c.fillRect(-.19 * s, -.3 * s, .38 * s, .035 * s); },
    bigben: function (c, s) { c.fillStyle = '#b89560'; c.fillRect(-.22 * s, -.14 * s, .62 * s, .14 * s); c.fillStyle = '#d6b27a'; c.fillRect(-.1 * s, -.8 * s, .2 * s, .8 * s); c.fillStyle = '#7b5e3a'; c.beginPath(); c.moveTo(-.12 * s, -.8 * s); c.lineTo(0, -1.02 * s); c.lineTo(.12 * s, -.8 * s); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.arc(0, -.64 * s, .075 * s, 0, 7); c.fill(); c.strokeStyle = '#444'; c.lineWidth = 1; c.beginPath(); c.moveTo(0, -.64 * s); c.lineTo(0, -.69 * s); c.moveTo(0, -.64 * s); c.lineTo(.03 * s, -.64 * s); c.stroke(); },
    liberty: function (c, s) { c.fillStyle = '#b9b3a2'; c.fillRect(-.15 * s, -.3 * s, .3 * s, .3 * s); c.fillStyle = '#6dbd9f'; c.beginPath(); c.moveTo(-.1 * s, -.3 * s); c.lineTo(-.06 * s, -.78 * s); c.lineTo(.06 * s, -.78 * s); c.lineTo(.1 * s, -.3 * s); c.fill(); c.strokeStyle = '#6dbd9f'; c.lineWidth = Math.max(2, .06 * s); c.lineCap = 'round'; c.beginPath(); c.moveTo(.04 * s, -.74 * s); c.lineTo(.12 * s, -1.0 * s); c.stroke(); c.fillStyle = '#ffd34d'; c.beginPath(); c.arc(.12 * s, -1.05 * s, .06 * s, 0, 7); c.fill(); c.fillStyle = '#6dbd9f'; c.beginPath(); c.arc(0, -.84 * s, .07 * s, 0, 7); c.fill(); },
    pyramids: function (c, s) { [[-.34, .5, '#e6b86a'], [.05, .66, '#d9a553'], [.4, .34, '#e6b86a']].forEach(function (p) { c.fillStyle = p[2]; c.beginPath(); c.moveTo((p[0] - p[1] * .5) * s, 0); c.lineTo(p[0] * s, -p[1] * s); c.lineTo((p[0] + p[1] * .5) * s, 0); c.fill(); c.fillStyle = 'rgba(120,70,20,.25)'; c.beginPath(); c.moveTo(p[0] * s, -p[1] * s); c.lineTo((p[0] + p[1] * .5) * s, 0); c.lineTo(p[0] * s, 0); c.fill(); }); },
    taj: function (c, s) { c.fillStyle = '#f5f0e6'; c.fillRect(-.4 * s, -.1 * s, .8 * s, .1 * s); c.fillRect(-.16 * s, -.34 * s, .32 * s, .24 * s); c.beginPath(); c.arc(0, -.44 * s, .16 * s, Math.PI, 0); c.fill(); c.fillRect(-.012 * s, -.72 * s, .024 * s, .12 * s); [-.34, .34].forEach(function (x) { c.fillRect((x - .025) * s, -.58 * s, .05 * s, .48 * s); c.beginPath(); c.arc(x * s, -.58 * s, .035 * s, Math.PI, 0); c.fill(); }); [-.2, .2].forEach(function (x) { c.beginPath(); c.arc(x * s, -.3 * s, .06 * s, Math.PI, 0); c.fill(); }); c.fillStyle = 'rgba(90,110,160,.35)'; c.fillRect(-.05 * s, -.26 * s, .1 * s, .16 * s); },
    pagoda: function (c, s) { c.fillStyle = '#b7413a'; c.fillRect(-.2 * s, -.22 * s, .4 * s, .22 * s); [[.5, .5], [.36, .34], [.22, .18]].forEach(function (t, i) { var y = -(.22 + i * .2) * s; c.fillStyle = '#c9a04a'; c.beginPath(); c.moveTo(-t[0] * s * .6, y); c.quadraticCurveTo(-t[0] * s * .3, y - .02 * s, -t[1] * .3 * s, y - .17 * s); c.lineTo(t[1] * .3 * s, y - .17 * s); c.quadraticCurveTo(t[0] * s * .3, y - .02 * s, t[0] * s * .6, y); c.fill(); c.fillStyle = '#b7413a'; c.fillRect(-t[1] * .17 * s, y, t[1] * .34 * s, .03 * s); }); c.fillStyle = '#ffd34d'; c.fillRect(-.012 * s, -.95 * s, .024 * s, .1 * s); },
    fuji: function (c, s) { c.fillStyle = '#6f86d6'; c.beginPath(); c.moveTo(-.55 * s, 0); c.lineTo(-.08 * s, -.82 * s); c.lineTo(.08 * s, -.82 * s); c.lineTo(.55 * s, 0); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.moveTo(-.12 * s, -.72 * s); c.lineTo(-.08 * s, -.82 * s); c.lineTo(.08 * s, -.82 * s); c.lineTo(.13 * s, -.7 * s); c.lineTo(.07 * s, -.64 * s); c.lineTo(.02 * s, -.7 * s); c.lineTo(-.04 * s, -.62 * s); c.lineTo(-.08 * s, -.68 * s); c.fill(); c.fillStyle = '#e85a5a'; c.beginPath(); c.arc(.42 * s, -.7 * s, .08 * s, 0, 7); c.fill(); },
    opera: function (c, s) { c.fillStyle = '#9aa7c2'; c.fillRect(-.45 * s, -.08 * s, .9 * s, .08 * s); [[-.3, .2, .5], [-.1, .22, .6], [.12, .2, .5], [.3, .14, .32], [-.38, .13, .3]].forEach(function (p) { c.fillStyle = '#fbfbff'; c.strokeStyle = '#b4bdd6'; c.lineWidth = 1; c.beginPath(); c.ellipse(p[0] * s, -.08 * s, p[1] * s, p[2] * s, 0, Math.PI, 2 * Math.PI); c.fill(); c.stroke(); }); },
    christ: function (c, s) { c.fillStyle = '#4e9e68'; c.beginPath(); c.moveTo(-.5 * s, 0); c.quadraticCurveTo(0, -.7 * s, .5 * s, 0); c.fill(); c.fillStyle = '#f2f2ee'; c.fillRect(-.03 * s, -.78 * s, .06 * s, .46 * s); c.fillRect(-.23 * s, -.72 * s, .46 * s, .05 * s); c.beginPath(); c.arc(0, -.82 * s, .045 * s, 0, 7); c.fill(); c.fillStyle = '#d6d6cf'; c.fillRect(-.07 * s, -.34 * s, .14 * s, .1 * s); },
    colosseum: function (c, s) { c.fillStyle = '#d9b98a'; c.beginPath(); c.moveTo(-.4 * s, 0); c.lineTo(-.4 * s, -.3 * s); c.quadraticCurveTo(0, -.46 * s, .4 * s, -.3 * s); c.lineTo(.4 * s, 0); c.fill(); c.fillStyle = 'rgba(90,60,30,.55)'; for (var r = 0; r < 3; r++) for (var i = 0; i < 8; i++) { var x = (-.34 + i * .097) * s, y = -(.07 + r * .085) * s; c.beginPath(); c.arc(x, y, .028 * s, Math.PI, 0); c.lineTo(x + .028 * s, y + .045 * s); c.lineTo(x - .028 * s, y + .045 * s); c.fill(); } },
    burj: function (c, s) { var st = [[.09, 0], [.075, .3], [.06, .55], [.045, .78], [.03, .92], [.012, 1.0]]; c.fillStyle = '#cfe3f5'; c.beginPath(); c.moveTo(-st[0][0] * s, 0); st.forEach(function (p) { c.lineTo(-p[0] * s, -p[1] * s); }); c.lineTo(0, -1.12 * s); for (var i = st.length - 1; i >= 0; i--) c.lineTo(st[i][0] * s, -st[i][1] * s); c.lineTo(st[0][0] * s, 0); c.fill(); c.fillStyle = 'rgba(70,110,170,.35)'; c.fillRect(0, -.9 * s, .05 * s, .9 * s); },
    angkor: function (c, s) { c.fillStyle = '#a9895b'; c.fillRect(-.42 * s, -.1 * s, .84 * s, .1 * s); c.fillRect(-.34 * s, -.2 * s, .68 * s, .1 * s); [[-.24, .55], [.24, .55], [0, .85], [-.12, .65], [.12, .65]].forEach(function (p) { c.fillStyle = '#b89a6a'; c.beginPath(); c.moveTo((p[0] - .06) * s, -.2 * s); c.quadraticCurveTo((p[0] - .08) * s, -p[1] * s * .7, p[0] * s, -p[1] * s); c.quadraticCurveTo((p[0] + .08) * s, -p[1] * s * .7, (p[0] + .06) * s, -.2 * s); c.fill(); }); },
    hk: function (c, s) { c.fillStyle = '#5a78b8'; [[-.4, .3, .45], [-.28, .12, .62], [-.14, .16, .5], [0, .1, 1.0], [.12, .14, .7], [.24, .12, .52], [.35, .1, .35]].forEach(function (b, i) { c.fillStyle = i % 2 ? '#6d8bcb' : '#4c69a8'; c.fillRect(b[0] * s, -b[2] * s * .8, b[1] * s, b[2] * s * .8); c.fillStyle = 'rgba(255,230,150,.7)'; for (var y = 0; y < b[2] * .8 * 10; y += 2) c.fillRect(b[0] * s + 2, -b[2] * s * .8 + y * s * .1 + 2, 2, 2); }); c.fillStyle = '#6d8bcb'; c.beginPath(); c.moveTo(-.28 * s, -.5 * s); c.lineTo(-.22 * s, -.66 * s); c.lineTo(-.16 * s, -.5 * s); c.fill(); c.strokeStyle = 'rgba(255,255,255,.8)'; c.lineWidth = 1.5; c.beginPath(); for (var x = -.45; x <= .45; x += .05) c.lineTo(x * s, (.04 + Math.sin(x * 30) * .015) * s); c.stroke(); }
  };

  function buildWorld(W, H) {
    var bg = mk(W, H), c = bg.getContext('2d'), r = mul(77), i, j, k;
    /* fit the whole map (New York to Sydney) on any screen: width decides the scale, height gets at most a mild stretch */
    var LON0 = -128, LON1 = 176, LAT0 = 66, LAT1 = -84, lonMin = LON0, TBH = 58;
    var LP = W >= 700 ? 96 : 8, TOPM = 48, availH = H - TBH - 14 - TOPM, xpd = (W - LP - 12) / (LON1 - LON0), ypd = Math.min(availH / (LAT0 - LAT1), xpd * (W < H * .9 ? 2.2 : 1.4));
    var top = TOPM + (availH - ypd * (LAT0 - LAT1)) / 2;
    function P(lon, lat) { return [LP + (lon - lonMin) * xpd, top + (LAT0 - lat) * ypd]; }
    var S = Math.max(30, Math.min(44, Math.min(xpd * 9.5, ypd * 8.5)));
    c.fillStyle = rg(c, W * .5, H * .45, 0, Math.max(W, H) * .85, [[0, '#4fc9f2'], [.55, '#2189d6'], [1, '#12509c']]); c.fillRect(0, 0, W, H);
    /* sea sparkle + waves */
    for (i = 0; i < 160; i++) { var wx = r() * W, wy = r() * H; c.strokeStyle = 'rgba(255,255,255,' + (.06 + r() * .1) + ')'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(wx, wy); c.quadraticCurveTo(wx + 6, wy - 4, wx + 12, wy); c.quadraticCurveTo(wx + 18, wy + 4, wx + 24, wy); c.stroke(); }
    c.strokeStyle = 'rgba(255,255,255,.12)'; c.lineWidth = 1;
    for (i = -180; i <= 180; i += 20) { var gx = P(i, 0)[0]; c.beginPath(); c.moveTo(gx, 0); c.lineTo(gx, H); c.stroke(); }
    for (i = -80; i <= 80; i += 20) { var gy = P(0, i)[1]; c.beginPath(); c.setLineDash(i === 0 ? [8, 6] : []); c.moveTo(0, gy); c.lineTo(W, gy); c.stroke(); } c.setLineDash([]);
    /* continents */
    var paths = WORLD.map(function (poly) {
      var pts = poly.map(function (q) { return P(q[0], q[1]); }), n = pts.length, p = new Path2D(), m = [(pts[n - 1][0] + pts[0][0]) / 2, (pts[n - 1][1] + pts[0][1]) / 2];
      p.moveTo(m[0], m[1]); for (var a = 0; a < n; a++) { var q0 = pts[a], q1 = pts[(a + 1) % n]; p.quadraticCurveTo(q0[0], q0[1], (q0[0] + q1[0]) / 2, (q0[1] + q1[1]) / 2); } p.closePath(); return p;
    });
    c.save(); c.shadowColor = 'rgba(0,25,70,.55)'; c.shadowBlur = 22; c.shadowOffsetY = 9; c.fillStyle = '#9ad08a'; paths.forEach(function (p) { c.fill(p); }); c.restore();
    var landG = lg(c, 0, P(0, 62)[1], 0, P(0, -42)[1], [[0, '#eef6dc'], [.18, '#b9dd9a'], [.42, '#8fd087'], [.58, '#e6d490'], [.74, '#84c97a'], [1, '#aedc9d']]);
    c.fillStyle = landG; paths.forEach(function (p) { c.fill(p); });
    var landAll = new Path2D(); paths.forEach(function (p) { landAll.addPath(p); });
    c.save(); c.clip(landAll);
    /* deserts + texture */
    [[15, 23, 24, 8, 'rgba(240,206,120,.75)'], [45, 24, 10, 7, 'rgba(240,206,120,.7)'], [100, 42, 14, 5, 'rgba(235,210,140,.6)'], [133, -25, 14, 8, 'rgba(236,190,110,.65)'], [-110, 35, 8, 5, 'rgba(236,200,120,.5)']].forEach(function (d) { var q = P(d[0], d[1]); c.save(); c.filter = 'blur(10px)'; c.fillStyle = d[4]; c.beginPath(); c.ellipse(q[0], q[1], d[2] * xpd, d[3] * ypd, 0, 0, 7); c.fill(); c.restore(); });
    for (i = 0; i < 3200; i++) { c.fillStyle = 'rgba(30,110,60,' + (.1 + r() * .2) + ')'; c.beginPath(); c.arc(r() * W, r() * H, .8 + r() * 1.8, 0, 7); c.fill(); }
    c.restore();
    c.fillStyle = lg(c, 0, P(0, -64)[1], 0, P(0, -84)[1], [[0, '#e9f4fb'], [1, '#ffffff']]); c.fill(paths[ANT]);
    c.lineJoin = 'round'; paths.forEach(function (p) { c.strokeStyle = 'rgba(140,235,255,.35)'; c.lineWidth = 7; c.stroke(p); c.strokeStyle = 'rgba(255,255,255,.85)'; c.lineWidth = 1.8; c.stroke(p); });
    /* mountains */
    MOUNTS.forEach(function (ch) { for (i = 0; i < ch.length - 1; i++) { var a = P(ch[i][0], ch[i][1]), b = P(ch[i + 1][0], ch[i + 1][1]), d = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(2, d / 9 | 0); for (j = 0; j < n; j++) { var u = j / n, x = a[0] + (b[0] - a[0]) * u + (r() - .5) * 6, y = a[1] + (b[1] - a[1]) * u + (r() - .5) * 6, h = 6 + r() * 6; c.fillStyle = '#7d8b72'; c.beginPath(); c.moveTo(x - h * .7, y + h * .4); c.lineTo(x, y - h * .6); c.lineTo(x + h * .7, y + h * .4); c.fill(); c.fillStyle = '#fff'; c.beginPath(); c.moveTo(x - h * .22, y - h * .25); c.lineTo(x, y - h * .6); c.lineTo(x + h * .22, y - h * .25); c.fill(); } } });
    /* continent names */
    CREG.forEach(function (g) { var q = P(g.lab[0], g.lab[1]); c.save(); c.textAlign = 'center'; c.textBaseline = 'middle'; c.shadowColor = 'rgba(0,30,70,.45)'; c.shadowBlur = 6; c.fillStyle = 'rgba(255,255,255,.62)'; c.font = '800 ' + Math.max(11, S * .36 | 0) + 'px system-ui,sans-serif'; c.fillText(g.n, q[0], q[1]); c.font = '700 ' + Math.max(9, S * .24 | 0) + 'px system-ui,sans-serif'; c.fillStyle = 'rgba(255,255,255,.5)'; c.fillText(g.sub, q[0], q[1] + S * .36); c.restore(); });
    /* landmarks */
    var pins = LMS.map(function (m) {
      var pl = P(m.ll[0], m.ll[1]), pp = P(m.pos[0], m.pos[1]);
      c.strokeStyle = 'rgba(255,255,255,.75)'; c.lineWidth = 1.2; c.setLineDash([3, 3]); c.beginPath(); c.moveTo(pp[0], pp[1]); c.lineTo(pl[0], pl[1]); c.stroke(); c.setLineDash([]);
      c.fillStyle = '#ff4d6d'; c.strokeStyle = '#fff'; c.lineWidth = 2; c.beginPath(); c.arc(pl[0], pl[1], 3.4, 0, 7); c.fill(); c.stroke();
      c.save(); c.translate(pp[0], pp[1]); c.fillStyle = 'rgba(0,30,70,.28)'; c.beginPath(); c.ellipse(0, 1, S * .42, S * .09, 0, 0, 7); c.fill(); c.shadowColor = 'rgba(0,20,60,.45)'; c.shadowBlur = 6; c.shadowOffsetY = 2; if (m.k.charAt(0) === '~') { c.font = Math.round(S * .82) + 'px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif'; c.textAlign = 'center'; c.textBaseline = 'alphabetic'; c.fillStyle = '#000'; c.fillText(m.k.slice(1), 0, -S * .04); } else ICONS[m.k](c, S); c.restore();
      c.font = '700 ' + Math.max(8, S * .18 | 0) + 'px system-ui,sans-serif'; var tw = c.measureText(m.n).width + 10, ty = pp[1] + 4;
      c.fillStyle = 'rgba(10,25,60,.62)'; c.beginPath(); c.roundRect ? c.roundRect(pp[0] - tw / 2, ty, tw, S * .3, 8) : c.rect(pp[0] - tw / 2, ty, tw, S * .3); c.fill();
      c.fillStyle = '#fff'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(m.n, pp[0], ty + S * .15);
      return { pl: pl, pp: pp, m: m };
    });
    /* people */
    var COL = ['#ef4444', '#3b82f6', '#f59e0b', '#10b981', '#a855f7', '#ec4899', '#14b8a6', '#f97316', '#fafafa'], SKIN = ['#f1c9a5', '#d9a273', '#a86f47', '#7a4a2d', '#f6d7bd'];
    var walkers = [], hh = Math.max(9, S * .24);
    function addW(x, y, range) { walkers.push({ x: x, y: y, rg: range, sp: .00025 + r() * .0004, ph: r() * 6.28, lp: r() * 6.28, col: COL[(r() * COL.length) | 0], sk: SKIN[(r() * SKIN.length) | 0], hat: r() < .35, bag: r() < .4, h: hh * (.85 + r() * .3) }); }
    pins.forEach(function (p) { var n = 2 + (r() * 2 | 0); for (i = 0; i < n; i++) addW(p.pl[0] + (r() - .5) * S * .9, p.pl[1] + 4 + r() * S * .45, S * (.25 + r() * .5)); });
    var onLand = function (x, y) { for (var a = 0; a < paths.length; a++) if (c.isPointInPath(paths[a], x, y)) return true; return false; };
    var tries = 0; while (walkers.length < 150 && tries++ < 5000) { var rx = r() * W, ry = top + r() * (LAT0 - LAT1) * ypd; if (onLand(rx, ry)) addW(rx, ry, 14 + r() * 40); }
    var idx = function (n) { for (var z = 0; z < LMS.length; z++) if (LMS[z].n === n) return z; return 0; };
    var planes = [['Statue of Liberty', 'Big Ben'], ['Eiffel Tower', 'Taj Mahal'], ['Colosseum', 'Pyramids of Giza'], ['Mount Fuji', 'Sydney Opera House'], ['Golden Gate Bridge', 'Mount Fuji'], ['Pyramids of Giza', 'Table Mountain'], ['Statue of Liberty', 'Christ the Redeemer']].map(function (nm) { return [idx(nm[0]), idx(nm[1])]; }).map(function (q, ix) { return { ia: q[0], ib: q[1], a: pins[q[0]].pp, b: pins[q[1]].pp, v: .00005 + ix * .000012, o: r() }; });
    var boats = [[-35, 30], [78, -22], [-30, 8], [128, 12]].map(function (q) { var p = P(q[0], q[1]); return { x: p[0], y: p[1], ph: r() * 6 }; });
    var cs = [cloudSprite(420, 150, 3, 'rgba(120,150,210,.4)'), cloudSprite(360, 130, 6, 'rgba(120,150,210,.4)')], cld = []; for (i = 0; i < 7; i++) cld.push({ s: cs[i % 2], x: r() * W, y: r() * H * .85, sc: .5 + r() * .5, v: 5 + r() * 8 });
    var emo = ['📸', '👋', '✈️', '🗺️', '😀', '🎒', '🍜', '🥐'], bub = { w: null, t: 0, e: '' }, nextB = 1500;
    function person(c, w, t) {
      var s = Math.sin(t * w.sp * 2 + w.ph), x = w.x + s * w.rg, y = w.y, dir = Math.cos(t * w.sp * 2 + w.ph) >= 0 ? 1 : -1;
      var h = w.h, sw = Math.sin(t * .011 + w.lp);
      c.save(); c.translate(x, y); c.scale(dir, 1);
      c.fillStyle = 'rgba(0,20,40,.22)'; c.beginPath(); c.ellipse(0, 0, h * .2, h * .05, 0, 0, 7); c.fill();
      c.strokeStyle = '#2b3550'; c.lineWidth = Math.max(1.2, h * .11); c.lineCap = 'round'; c.beginPath(); c.moveTo(0, -h * .42); c.lineTo(sw * h * .2, 0); c.moveTo(0, -h * .42); c.lineTo(-sw * h * .2, 0); c.stroke();
      if (w.bag) { c.fillStyle = '#374151'; c.fillRect(-h * .22, -h * .74, h * .12, h * .26); }
      c.fillStyle = w.col; c.beginPath(); c.moveTo(-h * .12, -h * .8); c.lineTo(h * .12, -h * .8); c.lineTo(h * .15, -h * .4); c.lineTo(-h * .15, -h * .4); c.fill();
      c.strokeStyle = w.sk; c.lineWidth = Math.max(1, h * .08); c.beginPath(); c.moveTo(0, -h * .72); c.lineTo(-sw * h * .18, -h * .5); c.stroke();
      c.fillStyle = w.sk; c.beginPath(); c.arc(h * .02, -h * .92, h * .13, 0, 7); c.fill();
      if (w.hat) { c.fillStyle = w.col === '#ef4444' ? '#fafafa' : '#ef4444'; c.beginPath(); c.arc(h * .02, -h * .95, h * .14, Math.PI, 0); c.fill(); c.fillRect(h * .02, -h * .96, h * .2, h * .04); }
      c.restore();
    }
    /* dim 'unexplored' copy of the map */
    var wlit = 0, dim = mk(W, H), dc = dim.getContext('2d'); dc.drawImage(bg, 0, 0); dc.globalCompositeOperation = 'saturation'; dc.fillStyle = '#7d8696'; dc.fillRect(0, 0, W, H);
    dc.globalCompositeOperation = 'source-over'; dc.fillStyle = 'rgba(8,16,42,.62)'; dc.fillRect(0, 0, W, H);
    var spots = pins.map(function (p) {
      var cx = (p.pl[0] + p.pp[0]) / 2, cy = (p.pl[1] + p.pp[1]) / 2 - S * .25, half = Math.hypot(p.pl[0] - p.pp[0], p.pl[1] - p.pp[1]) / 2;
      return { p: p, cx: cx, cy: cy, full: Math.max(half + S * .9, S * 1.25) * 1.05, cur: 0, cache: null, cR: 0, pulse: 0 };
    });
    var land = new Path2D(); paths.forEach(function (p) { land.addPath(p); });
    var regs = CREG.map(function (g) { var pa = new Path2D(); g.poly.forEach(function (q, ix) { var z = P(q[0], q[1]); if (ix) pa.lineTo(z[0], z[1]); else pa.moveTo(z[0], z[1]); }); pa.closePath(); return { g: g, path: pa, a: 0 }; });
    function ctgt(rg0) { if (PV) return 1; var T = window.ICTTour; return T && T.contPct ? Math.max(0, (T.contPct(rg0.g.id) - .35) / .65) : 0; }
    function inLitCont(x, y) { for (var a = 0; a < regs.length; a++) if (regs[a].a > .5 && dc.isPointInPath(regs[a].path, x, y)) return true; return false; }
    function tgt(sp) { var T = window.ICTTour; if (PV) return 1; return T ? T.chapterPct(sp.p.m.ch) : 0; }
    function radius(sp) { return sp.cur <= .002 ? 0 : sp.full * (.28 + .72 * Math.sqrt(sp.cur)); }
    function litAt(x, y) { if (inLitCont(x, y)) return true; for (var a = 0; a < spots.length; a++) { var R = radius(spots[a]); if (R && Math.hypot(x - spots[a].cx, y - spots[a].cy) < R * .92) return true; } return false; }
    function spotCanvas(sp, R) {
      var d2 = Math.ceil(R * 2) + 4, cv2 = mk(d2, d2), x = cv2.getContext('2d');
      x.drawImage(bg, sp.cx - R - 2, sp.cy - R - 2, d2, d2, 0, 0, d2, d2);
      x.globalCompositeOperation = 'destination-in'; x.fillStyle = rg(x, d2 / 2, d2 / 2, 0, R, [[0, 'rgba(0,0,0,1)'], [.78, 'rgba(0,0,0,1)'], [1, 'rgba(0,0,0,0)']]); x.fillRect(0, 0, d2, d2); return cv2;
    }
    function tagW() { return Math.max(58, S * 1.5); }
    function tag(c, sp, t) {
      var m = sp.p.m, T = window.ICTTour, ci = T && T.chapInfo ? T.chapInfo(m.ch) : null, soon = ci && ci.locked && !PV, p = sp.cur;
      var label = ci ? ci.code : m.ch, w = tagW(), h = S * .3, x = sp.p.pp[0] - w / 2, y = sp.p.pp[1] - S * 1.15 + (sp.tdy || 0);
      c.fillStyle = soon ? 'rgba(30,40,70,.7)' : p >= .999 ? 'rgba(250,204,21,.95)' : 'rgba(10,22,52,.8)'; c.beginPath(); c.roundRect ? c.roundRect(x, y, w, h, h / 2) : c.rect(x, y, w, h); c.fill();
      c.strokeStyle = 'rgba(255,255,255,.35)'; c.lineWidth = 1; c.stroke();
      if (!soon && p > 0 && p < .999) { c.fillStyle = 'rgba(255,215,90,.9)'; c.beginPath(); c.roundRect ? c.roundRect(x + 3, y + h - 4, (w - 6) * p, 2.5, 1) : c.rect(x + 3, y + h - 4, (w - 6) * p, 2.5); c.fill(); }
      c.font = '800 ' + Math.max(8, S * .2 | 0) + 'px system-ui,sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillStyle = p >= .999 ? '#4a3200' : soon ? 'rgba(255,255,255,.65)' : '#fff';
      c.fillText(soon ? '🔒 ' + label : p >= .999 ? '★ ' + label : label + (p > 0 ? ' · ' + Math.round(p * 100) + '%' : ''), sp.p.pp[0], y + h / 2 - 1);
    }
    (function () { /* keep tag pills from overlapping each other */
      var w = tagW(), h = S * .3, placed = [];
      spots.slice().sort(function (a, b) { return a.p.pp[0] - b.p.pp[0]; }).forEach(function (sp) {
        var x = sp.p.pp[0] - w / 2, y = sp.p.pp[1] - S * 1.15, n = 0, hit;
        do { hit = placed.filter(function (q) { return Math.abs(q.x - x) < w + 2 && Math.abs(q.y - y) < h + 2; }).length; if (hit) y -= h + 3; } while (hit && ++n < 5);
        sp.tdy = y - (sp.p.pp[1] - S * 1.15); placed.push({ x: x, y: y });
      });
    })();
    return {
      bg: dim, draw: function (c, t, dt) {
        var T0 = window.ICTTour, wt = PV ? 1 : T0 && T0.worldLit ? T0.worldLit() : 0; wlit += (wt - wlit) * Math.min(1, dt * .0015); if (Math.abs(wt - wlit) < .002) wlit = wt;
        regs.forEach(function (g) { var tg = ctgt(g); g.a += (tg - g.a) * Math.min(1, dt * .002); if (Math.abs(tg - g.a) < .003) g.a = tg; if (g.a > .004) { c.save(); c.clip(land); c.clip(g.path); c.globalAlpha = g.a; c.drawImage(bg, 0, 0, W, H); c.restore(); } });
        var wa = Math.max(0, (wlit - .6) / .4); if (wa > .003) { c.globalAlpha = wa; c.drawImage(bg, 0, 0, W, H); c.globalAlpha = 1; }
        spots.forEach(function (sp) { var g = tgt(sp); sp.cur += (g - sp.cur) * Math.min(1, dt * .003); if (Math.abs(g - sp.cur) < .001) sp.cur = g; });
        spots.forEach(function (sp) {
          var R = radius(sp); if (!R) return;
          if (!sp.cache || Math.abs(sp.cR - R) > .8) { sp.cache = spotCanvas(sp, R); sp.cR = R; }
          c.drawImage(sp.cache, sp.cx - sp.cR - 2, sp.cy - sp.cR - 2);
          var a = .22 + .1 * Math.sin(t * .002 + sp.cx); c.strokeStyle = 'rgba(255,236,160,' + a + ')'; c.lineWidth = 2; c.beginPath(); c.arc(sp.cx, sp.cy, sp.cR * .96, 0, 7); c.stroke();
        });
        cld.forEach(function (o) { c.globalAlpha = .32; c.drawImage(o.s, ((o.x + t * o.v / 1000) % (W + 500)) - 250, o.y, o.s.width * o.sc, o.s.height * o.sc); }); c.globalAlpha = 1;
        boats.forEach(function (b) { if (!litAt(b.x, b.y)) return; var x = b.x + Math.sin(t * .0002 + b.ph) * 40, y = b.y + Math.sin(t * .0015 + b.ph) * 2; c.fillStyle = '#fff'; c.beginPath(); c.moveTo(x, y - 12); c.lineTo(x + 8, y - 2); c.lineTo(x, y - 2); c.fill(); c.fillStyle = '#e8edf7'; c.beginPath(); c.moveTo(x - 1, y - 10); c.lineTo(x - 7, y - 2); c.lineTo(x - 1, y - 2); c.fill(); c.fillStyle = '#7a4b2a'; c.fillRect(x - 8, y - 2, 17, 3); });
        planes.forEach(function (p) {
          if (spots[p.ia].cur < .5 || spots[p.ib].cur < .5) return;
          var u = (t * p.v + p.o) % 1, mx = (p.a[0] + p.b[0]) / 2, my = (p.a[1] + p.b[1]) / 2 - Math.hypot(p.b[0] - p.a[0], p.b[1] - p.a[1]) * .28;
          function q(u) { return [(1 - u) * (1 - u) * p.a[0] + 2 * u * (1 - u) * mx + u * u * p.b[0], (1 - u) * (1 - u) * p.a[1] + 2 * u * (1 - u) * my + u * u * p.b[1]]; }
          c.fillStyle = 'rgba(255,255,255,.7)'; for (var a = 1; a < 14; a++) { var z = q(Math.max(0, u - a * .012)); c.globalAlpha = .55 - a * .04; c.fillRect(z[0] - 1, z[1] - 1, 2.4, 2.4); } c.globalAlpha = 1;
          var z0 = q(u), z1 = q(Math.min(1, u + .01)), ang = Math.atan2(z1[1] - z0[1], z1[0] - z0[0]); c.save(); c.translate(z0[0], z0[1]); c.rotate(ang); c.fillStyle = '#fff'; c.shadowColor = 'rgba(0,0,0,.35)'; c.shadowBlur = 4; c.beginPath(); c.moveTo(8, 0); c.lineTo(-5, -3.5); c.lineTo(-3, 0); c.lineTo(-5, 3.5); c.fill(); c.restore();
        });
        pins.forEach(function (p, ix) { if (spots[ix].cur < .3) return; var ph = (t * .0007 + ix * .37) % 1; c.strokeStyle = 'rgba(255,255,255,' + (.55 * (1 - ph)) + ')'; c.lineWidth = 1.6; c.beginPath(); c.arc(p.pl[0], p.pl[1], 4 + ph * 16, 0, 7); c.stroke(); });
        walkers.slice().sort(function (a, b) { return a.y - b.y; }).forEach(function (w) { if (litAt(w.x, w.y)) person(c, w, t); });
        spots.forEach(function (sp) { tag(c, sp, t); });
        nextB -= dt; if (nextB < 0) { bub.w = walkers[(Math.random() * walkers.length) | 0]; bub.e = emo[(Math.random() * emo.length) | 0]; bub.t = 2200; nextB = 1800 + Math.random() * 1800; }
        if (bub.t > 0 && bub.w) { bub.t -= dt; var wx = bub.w.x + Math.sin(t * bub.w.sp * 2 + bub.w.ph) * bub.w.rg; c.globalAlpha = Math.min(1, bub.t / 400); c.font = Math.round(hh * 1.1) + 'px serif'; c.textAlign = 'center'; c.textBaseline = 'alphabetic'; c.fillText(bub.e, wx, bub.w.y - bub.w.h * 1.2 - 3 + Math.sin(t * .004) * 2); c.globalAlpha = 1; }
        if (worldSpot.i >= 0) {
          var sp = pins[worldSpot.i]; worldSpot.t -= dt; if (worldSpot.t <= 0) worldSpot.i = -1;
          else { var a2 = Math.min(1, worldSpot.t / 600); for (var g = 0; g < 3; g++) { var ph2 = ((t * .0009) + g / 3) % 1; c.strokeStyle = 'rgba(255,226,120,' + (a2 * (1 - ph2)) + ')'; c.lineWidth = 3; c.beginPath(); c.arc(sp.pl[0], sp.pl[1], 6 + ph2 * 46, 0, 7); c.stroke(); } c.globalAlpha = a2; c.fillStyle = '#ffe27a'; c.font = '800 ' + Math.max(12, S * .26 | 0) + 'px system-ui,sans-serif'; c.textAlign = 'center'; c.textBaseline = 'alphabetic'; c.shadowColor = 'rgba(0,0,0,.6)'; c.shadowBlur = 6; c.fillText('★ ' + sp.m.n, sp.pp[0], sp.pp[1] - S * 1.2); c.shadowBlur = 0; c.globalAlpha = 1; }
        }
      }
    };
  }

  /* ---------------- canvas + loop ---------------- */
  var build = { world: null }, quotesOn = true;
  var sky = document.querySelector('.fun-sky');
  var cv = document.createElement('canvas');
  cv.id = 'scene-cv'; cv.setAttribute('aria-hidden', 'true');
  var scrim = document.createElement('div'); scrim.className = 'scene-scrim';
  if (sky && sky.parentNode) { sky.parentNode.insertBefore(cv, sky.nextSibling); sky.parentNode.insertBefore(scrim, cv.nextSibling); }
  else { document.body.prepend(scrim); document.body.prepend(cv); }
  var ctx = cv.getContext('2d');
  var W = 0, H = 0, DPR = 1, inst = null, raf = 0, last = 0, t0 = performance.now();
  var css = document.createElement('style');
  css.textContent =
    '#scene-cv,.scene-scrim{position:fixed;inset:0;pointer-events:none}#scene-cv{z-index:-3}' +
    '.scene-scrim{z-index:-3;background:radial-gradient(ellipse at 50% 40%,rgba(8,10,34,0),rgba(8,10,34,.3))}' +
    'html .fun-shapes,html .fun-aurora{display:none!important}#theme-btn{display:none!important}' +
    'html.map-preview #desktop,html.map-preview #bit,html.map-preview #quote-card{display:none!important}#map-pv{position:fixed;top:12px;left:50%;transform:translateX(-50%);z-index:100;display:flex;gap:10px;align-items:center;flex-wrap:wrap;justify-content:center;padding:10px 16px;border-radius:16px;background:rgba(10,20,50,.88);color:#fff;border:1px solid rgba(255,215,90,.55);box-shadow:0 10px 30px rgba(0,0,0,.4);max-width:min(620px,calc(100vw - 24px));font:12px system-ui,sans-serif}#map-pv b{font-size:14px}#map-pv button{border:0;cursor:pointer;color:#1b1400;background:linear-gradient(90deg,#fbbf24,#f97316);padding:6px 14px;border-radius:99px;font-weight:800;font-size:12px}' +
    '#quote-card{position:fixed;left:50%;bottom:max(14px,env(safe-area-inset-bottom));transform:translateX(-50%);z-index:60;width:min(640px,calc(100vw - 150px));padding:10px 18px;border-radius:16px;text-align:center;cursor:pointer;color:#fff;background:rgba(10,14,40,.4);backdrop-filter:blur(8px);-webkit-backdrop-filter:blur(8px);border:1px solid rgba(255,255,255,.18);text-shadow:0 1px 8px rgba(0,0,0,.45);transition:opacity .7s ease;font-family:system-ui,sans-serif}' +
    '#quote-card.out{opacity:0}#quote-card q{display:block;quotes:none;font-size:14px;font-weight:700;line-height:1.45}#quote-card small{display:block;margin-top:3px;font-size:11px;opacity:.75;letter-spacing:.06em}' +
    'html.gate-on #quote-card{display:none}@media(max-width:640px){#quote-card{width:calc(100vw - 24px);bottom:76px;padding:8px 12px}#quote-card q{font-size:12.5px}}@media print{#quote-card{display:none}}';
  document.head.appendChild(css);

  function size() { DPR = Math.min(window.devicePixelRatio || 1, 1.5); W = innerWidth; H = innerHeight; cv.width = Math.round(W * DPR); cv.height = Math.round(H * DPR); cv.style.width = W + 'px'; cv.style.height = H + 'px'; }
  function frame(now) {
    raf = 0; if (document.hidden || !inst) return;
    var dt = Math.min(100, now - last); if (now - last < 30 && !reduce) { raf = requestAnimationFrame(frame); return; }
    last = now;
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0); ctx.clearRect(0, 0, W, H);
    ctx.drawImage(inst.bg, 0, 0, W, H); inst.draw(ctx, now - t0 + 5000, dt);
    if (!reduce) raf = requestAnimationFrame(frame);
  }
  function start() { if (!raf && inst) { last = 0; raf = requestAnimationFrame(frame); } }
  function boot() { size(); inst = build.world(W, H); start(); }
  document.addEventListener('visibilitychange', function () { if (!document.hidden) start(); });
  var rz; addEventListener('resize', function () { clearTimeout(rz); rz = setTimeout(boot, 200); });
  addEventListener('ict:tour', function () { if (reduce) start(); });


  /* in-page "what the fully lit world looks like" preview */
  var pvBar = null;
  function preview(on) {
    PV = on !== false; document.documentElement.classList.toggle('map-preview', PV);
    if (PV && !pvBar) {
      pvBar = document.createElement('div'); pvBar.id = 'map-pv';
      pvBar.innerHTML = '<b>🌍 Preview: the fully lit world</b><span>This is what the map looks like once a student has lit all 34 tourist spots on the 7 continents.</span><button type="button">✕ Close preview</button>';
      pvBar.querySelector('button').addEventListener('click', function () { preview(false); });
      document.body.appendChild(pvBar);
    }
    if (pvBar) pvBar.style.display = PV ? '' : 'none';
    if (reduce) start();
  }
  addEventListener('keydown', function (e) { if (e.key === 'Escape' && PV) preview(false); });
  window.ICTScenes = {
    preview: preview,
    spot: function (n) { var T = window.ICTTour, i = LMS.map(function (m) { return m.n; }).indexOf(n); if (i < 0) { var cr = CREG.filter(function (g) { return g.id === (T && T.conts ? (T.conts.filter(function (c) { return c.name === n; })[0] || {}).id : '') })[0]; if (cr && T) { i = LMS.map(function (m) { return T.chapInfo(m.ch).cont; }).indexOf(cr.id); } } if (i < 0) return; worldSpot.i = i; worldSpot.t = 7000; if (reduce) start(); },
    landmarks: LMS, next: nextQuote, current: function () { return 'world'; }, set: function () {}, toggle: function () {}, list: []
  };

  /* ---------------- quotes (attributions checked; sayings marked as such) ---------------- */
  var Q = [
    ['千里之行，始於足下。', '老子《道德經》'],
    ['不積跬步，無以至千里。', '荀子《勸學》'],
    ['學而不思則罔，思而不學則殆。', '孔子《論語·為政》'],
    ['知之者不如好之者，好之者不如樂之者。', '孔子《論語·雍也》'],
    ['山重水複疑無路，柳暗花明又一村。', '陸游《遊山西村》'],
    ['書山有路勤為徑，學海無涯苦作舟。', '韓愈（傳）'],
    ['Not all those who wander are lost.', 'J. R. R. Tolkien'],
    ['Education is the most powerful weapon which you can use to change the world.', 'Nelson Mandela'],
    ['Courage is not the absence of fear, but the triumph over it.', 'Nelson Mandela'],
    ['Imagination is more important than knowledge.', 'Albert Einstein'],
    ['Genius is one percent inspiration and ninety-nine percent perspiration.', 'Thomas Edison'],
    ['The only thing we have to fear is fear itself.', 'Franklin D. Roosevelt'],
    ['Well done is better than well said.', 'Benjamin Franklin'],
    ['The unexamined life is not worth living.', 'Socrates'],
    ['The best way out is always through.', 'Robert Frost'],
    ['We are what we repeatedly do. Excellence, then, is not an act, but a habit.', 'Will Durant, on Aristotle'],
    ['Fall seven times, stand up eight.', 'Japanese proverb'],
    ['A smooth sea never made a skilled sailor.', 'English proverb'],
    ['Rome was not built in a day.', 'Proverb'],
    ['A journey of a thousand miles begins with a single step.', 'Laozi']
  ];
  var qi = (Math.random() * Q.length) | 0, qEl = document.createElement('div');
  qEl.id = 'quote-card'; qEl.title = 'Click for another quote';
  document.documentElement.setAttribute('data-quotes', quotesOn ? '1' : '0');
  document.body.appendChild(qEl);
  function showQ() { var q = Q[qi]; qEl.innerHTML = '<q></q><small></small>'; qEl.firstChild.textContent = '“' + q[0] + '”'; qEl.lastChild.textContent = '— ' + q[1]; qEl.classList.remove('out'); }
  function nextQuote() { qEl.classList.add('out'); setTimeout(function () { qi = (qi + 1) % Q.length; showQ(); }, 600); }
  qEl.addEventListener('click', nextQuote);
  showQ(); setInterval(function () { if (!document.hidden && quotesOn) nextQuote(); }, 16000);


  /* ---------------- go ---------------- */
  build.world = buildWorld; boot();
})();
