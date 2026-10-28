/* =====================================================
   SCRIPT.JS - pardalar, musiqa, taymer, avtomatik siljish,
   mehmon ismi, chaqnoqlar
   ===================================================== */

/* ---------- SOZLAMALAR ---------- */
const WEDDING_DATE = "2026-11-02T17:00:00+05:00"; // taymer sanasi (+05:00 = O'zbekiston)
const MUSIC_VOLUME = 0.7;        // 0 dan 1 gacha
const AUTO_SCROLL_DELAY = 0;     // pardalar ochilgach necha soniya kutish
const AUTO_SCROLL_SPEED = 40;    // piksel/soniya (30 sekin, 60 o'rtacha, 100 tez)

/* ---------- PASTDAGINI O'ZGARTIRISH SHART EMAS ---------- */
(function () {
  var $ = function (id) { return document.getElementById(id); };
  var stage = $('stage'), mute = $('mute'), audio = $('bgm');
  var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var playing = false, wasPlaying = false;

  document.documentElement.classList.add('lock');
  audio.volume = MUSIC_VOLUME;

  /* ----- MEHMON ISMI: havola oxiriga ?ism=Aziz aka yozing ----- */
  var guest = (new URLSearchParams(location.search).get('ism') || '').trim().slice(0, 40);
  if (guest) {
    $('guest').textContent = guest;                 // textContent: xavfsiz
    $('coverGuest').textContent = 'Hurmatli ' + guest;
  }

  /* ----- MUSIQA ----- */
  function startMusic() {
    var p = audio.play();
    if (p && p.then) {
      p.then(function () { playing = true; mute.style.opacity = 1; })
       .catch(function () { playing = false; mute.style.opacity = .5; });
    } else { playing = true; }
  }
  mute.addEventListener('click', function () {
    if (playing) { audio.pause(); playing = false; mute.style.opacity = .5; } else startMusic();
  });
  document.addEventListener('visibilitychange', function () {
    if (document.hidden) { wasPlaying = playing; audio.pause(); }
    else if (wasPlaying) audio.play().catch(function () {});
  });

  /* ----- AVTOMATIK PASTGA SURISH (ekranga tegsangiz to'xtaydi) ----- */
  function startAutoScroll() {
    if (reduce) return;
    var pos = window.pageYOffset, last = null, active = true;
    function stop() { active = false; }
    ['touchstart', 'wheel', 'mousedown', 'keydown'].forEach(function (ev) {
      window.addEventListener(ev, stop, { passive: true, once: true });
    });
    function frame(t) {
      if (!active) return;
      if (last === null) last = t;
      pos += AUTO_SCROLL_SPEED * (t - last) / 1000; last = t;
      var max = document.documentElement.scrollHeight - window.innerHeight;
      if (pos >= max) { window.scrollTo(0, max); return; }
      window.scrollTo(0, pos);
      requestAnimationFrame(frame);
    }
    requestAnimationFrame(frame);
  }

  /* ----- "Taklifnomani ochish" ----- */
  $('openBtn').addEventListener('click', function () {
    startMusic();
    mute.classList.add('on');
    stage.classList.add('open');
    document.body.classList.add('shown');
    document.documentElement.classList.remove('lock');
    setTimeout(function () { stage.style.display = 'none'; }, 3400);
    setTimeout(startAutoScroll, 2800 + AUTO_SCROLL_DELAY * 1000);
  });

  /* ----- BO'LIMLAR SEKIN PAYDO BO'LISHI ----- */
  var els = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { threshold: 0.15 });
    els.forEach(function (el) { io.observe(el); });
  } else els.forEach(function (el) { el.classList.add('in'); });

  /* ----- YUQORIDAGI OLTIN PROGRESS CHIZIG'I ----- */
  var bar = $('bar'), busy = false;
  window.addEventListener('scroll', function () {
    if (busy) return; busy = true;
    requestAnimationFrame(function () {
      var m = document.documentElement.scrollHeight - window.innerHeight;
      bar.style.transform = 'scaleX(' + (m > 0 ? Math.min(1, window.pageYOffset / m) : 0) + ')';
      busy = false;
    });
  }, { passive: true });

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

  /* ----- ORQA FONDA OLTIN CHAQNOQLAR (yengil) ----- */
  (function () {
    var c = $('sparkles');
    if (!c || reduce) return;
    var x = c.getContext('2d'), W, H, P = [], N = 30, run = true;
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
      x.clearRect(0, 0, W, H); x.fillStyle = '#f0d9a0';
      for (var i = 0; i < P.length; i++) {
        var q = P[i]; q.y -= q.v; q.p += q.s;
        if (q.y < -10) P[i] = q = mk(false);
        x.globalAlpha = .25 + .55 * Math.abs(Math.sin(q.p));
        x.beginPath(); x.arc(q.x, q.y, q.r, 0, 6.283); x.fill();
      }
      requestAnimationFrame(draw);
    }
    size();
    for (var i = 0; i < N; i++) P.push(mk(true));
    window.addEventListener('resize', size);
    document.addEventListener('visibilitychange', function () { run = !document.hidden; if (run) draw(); });
    draw();
  })();
})();