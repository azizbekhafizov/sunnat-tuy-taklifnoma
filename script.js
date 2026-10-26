/* =====================================================
   SCRIPT.JS - taklifnomaning HARAKATLARI
   (pardalar, musiqa, taymer, avtomatik siljish, taqvim, ulashish)
   ===================================================== */

/* ---------- SOZLAMALAR: faqat shu yerni o'zgartirasiz ---------- */

// TO'Y SANASI (taymer shunga qarab sanaydi). +05:00 = O'zbekiston vaqti.
const WEDDING_DATE = "2026-11-02T17:00:00+05:00";

// MUSIQA: fayl index.html dagi <audio id="bgm" src="..."> da ko'rsatiladi.
// Ovoz balandligi: 0 dan 1 gacha (0.7 = taxminan 70%)
const MUSIC_VOLUME = 0.7;

// AVTOMATIK PASTGA SURISH
// Pardalar ochilgandan necha soniya keyin sahifa pastga siljiy boshlaydi:
const AUTO_SCROLL_DELAY = 0;
// Siljish tezligi (piksel/soniya). 30 juda sekin, 60 o'rtacha, 100 tez.
const AUTO_SCROLL_SPEED = 40;

// TAQVIMGA QO'SHISH (vaqtlar UTC da: Toshkent vaqtidan 5 soat kam).
// 16:00 Toshkent = 11:00 UTC, 22:00 Toshkent = 17:00 UTC
const CAL = {
  title: "Sunnat to'yi (Ulug'bek, Nurmuhammad, Muhammadyusuf)",
  start: "20261102T110000Z",
  end:   "20261102T170000Z",
  place: "To'xta bobo restorani",
  note:  "Mehmonlar yig'ilishi 16:00 da, to'y 17:00 da boshlanadi."
};

// ULASHISH matni
const SHARE = { title: "Sunnat to’yiga taklif", text: "Sizni sunnat to’yimizga taklif qilamiz: 2-noyabr, soat 17:00" };

/* ---------- PASTDAGINI O'ZGARTIRISH SHART EMAS ---------- */

(function () {
  var $ = function (id) { return document.getElementById(id); };
  var stage = $('stage'), btn = $('openBtn'), mute = $('mute'), audio = $('bgm');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var playing = false;

  document.documentElement.classList.add('lock'); // pardalar ochilguncha sahifa aylanmaydi
  audio.volume = MUSIC_VOLUME;

  /* ----- MUSIQA ----- */
  function startMusic() {
    var p = audio.play();
    if (p && p.then) {
      p.then(function () { playing = true; mute.style.opacity = 1; })
       .catch(function () { playing = false; mute.style.opacity = .5; });
    } else { playing = true; mute.style.opacity = 1; }
  }
  function stopMusic() { audio.pause(); playing = false; mute.style.opacity = .5; }
  mute.addEventListener('click', function () { playing ? stopMusic() : startMusic(); });

  // Ekran o'chganda yoki boshqa ilovaga o'tilganda musiqa to'xtaydi, qaytganda davom etadi
  var wasPlaying = false;
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { wasPlaying = playing; audio.pause(); }
    else if (wasPlaying) { audio.play().catch(function () {}); }
  });

  /* ----- AVTOMATIK PASTGA SURISH ----- */
  function startAutoScroll() {
    if (reduce) return;
    var pos = window.pageYOffset, last = null, active = true;
    function stop() { active = false; }
    // Mehmon ekranga tegsa yoki aylantirsa, avtomatik siljish to'xtaydi
    ['touchstart', 'wheel', 'mousedown', 'keydown'].forEach(function (ev) {
      window.addEventListener(ev, stop, { passive: true, once: true });
    });
    function frame(t) {
      if (!active) return;
      if (last === null) last = t;
      pos += AUTO_SCROLL_SPEED * (t - last) / 1000;
      last = t;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      if (pos >= max) { window.scrollTo(0, max); return; }
      window.scrollTo(0, pos);
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  /* ----- "Taklifnomani ochish" bosilganda ----- */
  btn.addEventListener('click', function () {
    startMusic();
    mute.classList.add('on');
    stage.classList.add('open');
    document.body.classList.add('shown');
    document.documentElement.classList.remove('lock');
    setTimeout(function () { stage.style.display = 'none'; }, 3200);
    // Pardalar ochilishi 2.6 soniya davom etadi, undan keyin AUTO_SCROLL_DELAY soniya kutamiz
    setTimeout(startAutoScroll, 2600 + AUTO_SCROLL_DELAY * 1000);
  });

  /* ----- BO'LIMLAR SEKIN PAYDO BO'LISHI ----- */
  var els = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) {
        if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); }
      });
    }, { threshold: 0.15 });
    els.forEach(function (el) { io.observe(el); });
  } else {
    els.forEach(function (el) { el.classList.add('in'); });
  }

  /* ----- TAYMER ----- */
  var target = new Date(WEDDING_DATE).getTime();
  var E = { d: $('d'), h: $('h'), m: $('m'), s: $('s') };
  function pad(n) { return n < 10 ? '0' + n : '' + n; }
  function update() {
    var diff = target - Date.now();
    if (diff <= 0) {
      $('cd').style.display = 'none';
      $('cdnote').textContent = 'To’y boshlandi. Xush kelibsiz!';
      return;
    }
    var s = Math.floor(diff / 1000);
    E.d.textContent = Math.floor(s / 86400);
    E.h.textContent = pad(Math.floor(s % 86400 / 3600));
    E.m.textContent = pad(Math.floor(s % 3600 / 60));
    E.s.textContent = pad(s % 60);
  }
  update(); setInterval(update, 1000);

  /* ----- TAQVIMGA QO'SHISH (.ics fayl, eslatma 1 kun oldin) ----- */
  $('calBtn').addEventListener('click', function () {
    var ics = [
      'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Taklifnoma//UZ', 'BEGIN:VEVENT',
      'UID:' + CAL.start + '@taklifnoma',
      'DTSTAMP:' + CAL.start,
      'DTSTART:' + CAL.start, 'DTEND:' + CAL.end,
      'SUMMARY:' + CAL.title, 'LOCATION:' + CAL.place, 'DESCRIPTION:' + CAL.note,
      'BEGIN:VALARM', 'TRIGGER:-P1D', 'ACTION:DISPLAY', 'DESCRIPTION:Ertaga to\'y', 'END:VALARM',
      'END:VEVENT', 'END:VCALENDAR'
    ].join('\r\n');
    var a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([ics], { type: 'text/calendar;charset=utf-8' }));
    a.download = 'toy.ics';
    document.body.appendChild(a); a.click(); a.remove();
  });

  /* ----- ULASHISH ----- */
  $('shareBtn').addEventListener('click', function () {
    var b = this, data = { title: SHARE.title, text: SHARE.text, url: location.href };
    if (navigator.share) { navigator.share(data).catch(function () {}); return; }
    if (navigator.clipboard) {
      navigator.clipboard.writeText(location.href).then(function () {
        b.textContent = 'Havola nusxalandi';
        setTimeout(function () { b.textContent = 'Do’stlarga ulashish'; }, 2500);
      });
    }
  });

  /* ----- ORQA FONDA OLTIN CHAQNOQLAR (yengil, 26 ta nuqta) ----- */
  (function () {
    var c = $('sparkles');
    if (!c || reduce) return;
    var x = c.getContext('2d'), W, H, P = [], N = 26, run = true;
    var dpr = Math.min(window.devicePixelRatio || 1, 2);
    function size() {
      W = window.innerWidth; H = window.innerHeight;
      c.width = W * dpr; c.height = H * dpr; x.setTransform(dpr, 0, 0, dpr, 0, 0);
    }
    function mk(init) {
      return { x: Math.random() * W, y: init ? Math.random() * H : H + 10,
               r: Math.random() * 1.8 + .6, v: Math.random() * .25 + .08,
               p: Math.random() * 6.28, s: Math.random() * .02 + .01 };
    }
    function draw() {
      if (!run) return;
      x.clearRect(0, 0, W, H);
      x.fillStyle = '#f0d9a0';
      for (var i = 0; i < P.length; i++) {
        var q = P[i];
        q.y -= q.v; q.p += q.s;
        if (q.y < -10) P[i] = q = mk(false);
        x.globalAlpha = .25 + .55 * Math.abs(Math.sin(q.p));
        x.beginPath(); x.arc(q.x, q.y, q.r, 0, 6.283); x.fill();
      }
      requestAnimationFrame(draw);
    }
    size();
    for (var i = 0; i < N; i++) P.push(mk(true));
    window.addEventListener('resize', size);
    document.addEventListener('visibilitychange', function () {
      run = !document.hidden; if (run) draw();
    });
    draw();
  })();
})();