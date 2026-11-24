/* Entreno · PWA de registro de entrenamiento (sin dependencias). */
(function () {
  'use strict';

  var STORE_KEY = 'entreno.v1';
  var TOTAL_SEMANAS = 10;
  var app = document.getElementById('app');

  // ---------- Estado ----------
  function estadoInicial() {
    return {
      perfil: null,
      perfiles: {
        irving: { unidad: PERFILES.irving.unidad, semana: 1, logs: {}, alts: {} },
        novia: { unidad: PERFILES.novia.unidad, semana: 1, logs: {}, alts: {} }
      }
    };
  }

  function cargar() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (!raw) return estadoInicial();
      var s = JSON.parse(raw);
      var base = estadoInicial();
      Object.keys(base.perfiles).forEach(function (k) {
        s.perfiles = s.perfiles || {};
        s.perfiles[k] = Object.assign({}, base.perfiles[k], s.perfiles[k] || {});
      });
      return s;
    } catch (e) {
      return estadoInicial();
    }
  }

  var S = cargar();

  function guardar() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(S));
    } catch (e) {
      toast('No se pudo guardar: exporta un respaldo.');
    }
  }

  function P() { return S.perfiles[S.perfil]; }
  function DEF() { return PERFILES[S.perfil]; }

  // ---------- Utilidades ----------
  function esc(t) {
    return String(t == null ? '' : t)
      .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }

  function rango(r) {
    var m = /^(\d+)\s*-\s*(\d+)/.exec(r);
    return m ? [parseInt(m[1], 10), parseInt(m[2], 10)] : null;
  }

  function seriesSemana(ej, semana) {
    var s = ej.s;
    if (semana === 1) return Math.max(2, s - 1);
    if (semana === 6 || semana === 10) return Math.ceil(s / 2);
    if (semana === 4 || semana === 5) return s + (ej.prio === 1 ? 1 : 0);
    if (semana >= 7 && semana <= 9) return s + (ej.prio ? 1 : 0);
    return s;
  }

  function rirObjetivo(ej, semana) {
    var p = PERIODIZACION[semana - 1];
    return ej.t === 'C' ? p.rirC : p.rirA;
  }

  function claveLog(semana, diaId) { return 'w' + semana + '-' + diaId; }

  function obtenerLog(semana, diaId, crear) {
    var k = claveLog(semana, diaId);
    var logs = P().logs;
    if (!logs[k] && crear) logs[k] = { fecha: null, terminado: false, energia: null, regla: false, ej: {} };
    return logs[k] || null;
  }

  function obtenerEj(log, ej, semana) {
    if (!log.ej[ej.id]) {
      var n = seriesSemana(ej, semana);
      var sets = [];
      for (var i = 0; i < n; i++) sets.push({ w: '', r: '', rir: '', ok: false });
      log.ej[ej.id] = { sets: sets, nota: '' };
    }
    return log.ej[ej.id];
  }

  // Registro anterior del mismo ejercicio (semana previa más cercana con datos).
  function anterior(ejId, diaId, semana) {
    for (var w = semana - 1; w >= 1; w--) {
      var l = P().logs[claveLog(w, diaId)];
      if (l && l.ej[ejId] && l.ej[ejId].sets.some(function (s) { return s.w !== '' || s.r !== ''; })) {
        return { semana: w, sets: l.ej[ejId].sets };
      }
    }
    return null;
  }

  function sugerencia(ej, prev) {
    var rg = rango(ej.r);
    if (!prev || !rg) return null;
    var hechas = prev.sets.filter(function (s) { return s.r !== ''; });
    if (!hechas.length) return null;
    var todas = hechas.every(function (s) { return parseFloat(s.r) >= rg[1]; });
    if (todas) return { tipo: 'sube', txt: 'Llegaste al tope en todas: sube el peso' };
    return { tipo: 'igual', txt: 'Mismo peso, busca +1 rep' };
  }

  function e1rm(w, r) {
    w = parseFloat(w); r = parseFloat(r);
    if (!w || !r) return 0;
    return w * (1 + r / 30);
  }

  function nombreEj(ej) {
    return P().alts[ej.id] ? ej.alt : ej.n;
  }

  function fechaCorta(iso) {
    if (!iso) return 'Sin fecha';
    var d = new Date(iso);
    return d.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short' });
  }

  function toast(msg) {
    var t = document.createElement('div');
    t.className = 'toast';
    t.textContent = msg;
    document.body.appendChild(t);
    setTimeout(function () { t.classList.add('show'); }, 10);
    setTimeout(function () { t.classList.remove('show'); setTimeout(function () { t.remove(); }, 300); }, 2200);
  }

  // ---------- Temporizador de descanso ----------
  var timer = { fin: 0, total: 0, id: null };
  var audioCtx = null;

  function beep() {
    try {
      if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      [0, 0.25, 0.5].forEach(function (t) {
        var o = audioCtx.createOscillator();
        var g = audioCtx.createGain();
        o.frequency.value = 880;
        g.gain.setValueAtTime(0.2, audioCtx.currentTime + t);
        g.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + t + 0.2);
        o.connect(g); g.connect(audioCtx.destination);
        o.start(audioCtx.currentTime + t); o.stop(audioCtx.currentTime + t + 0.2);
      });
    } catch (e) { /* sin audio */ }
    if (navigator.vibrate) navigator.vibrate([200, 100, 200]);
  }

  function iniciarTimer(seg) {
    // Crear el AudioContext dentro del gesto del usuario (requisito de iOS).
    try { if (!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)(); if (audioCtx.state === 'suspended') audioCtx.resume(); } catch (e) {}
    timer.total = seg;
    timer.fin = Date.now() + seg * 1000;
    if (timer.id) clearInterval(timer.id);
    timer.id = setInterval(tick, 250);
    tick();
  }

  function pararTimer() {
    if (timer.id) clearInterval(timer.id);
    timer.id = null; timer.fin = 0;
    var b = document.getElementById('timerbar');
    if (b) b.remove();
  }

  function tick() {
    var rest = Math.max(0, Math.round((timer.fin - Date.now()) / 1000));
    var b = document.getElementById('timerbar');
    if (!b) {
      b = document.createElement('div');
      b.id = 'timerbar';
      b.innerHTML = '<div class="tb-fill"></div><button class="tb-btn" data-t="-15">−15</button><span class="tb-txt"></span><button class="tb-btn" data-t="15">+15</button><button class="tb-btn tb-x" data-t="x">✕</button>';
      b.addEventListener('click', function (e) {
        var t = e.target.getAttribute('data-t');
        if (t === 'x') pararTimer();
        else if (t) { timer.fin += parseInt(t, 10) * 1000; timer.total = Math.max(timer.total + parseInt(t, 10), 1); tick(); }
      });
      document.body.appendChild(b);
    }
    var m = Math.floor(rest / 60), s = rest % 60;
    b.querySelector('.tb-txt').textContent = rest > 0 ? ('Descanso ' + m + ':' + (s < 10 ? '0' : '') + s) : '¡A darle!';
    b.querySelector('.tb-fill').style.width = (100 * (1 - rest / timer.total)) + '%';
    b.classList.toggle('listo', rest === 0);
    if (rest === 0 && timer.id) {
      clearInterval(timer.id); timer.id = null;
      beep();
      setTimeout(function () { if (!timer.id) pararTimer(); }, 6000);
    }
  }

  // ---------- Vistas ----------
  function nav(activo) {
    return '<nav class="tabbar">' +
      '<a href="#/" class="' + (activo === 'inicio' ? 'on' : '') + '" aria-label="Bloque">' + ICON.pesa + '</a>' +
      '<a href="#/progreso" class="' + (activo === 'progreso' ? 'on' : '') + '" aria-label="Progreso">' + ICON.grafica + '</a>' +
      '<a href="#/perfil" class="' + (activo === 'perfil' ? 'on' : '') + '" aria-label="Perfil">' + ICON.persona + '</a>' +
      '</nav>';
  }

  var ICON = {
    pesa: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><rect x="2" y="9" width="3" height="6" rx="1"/><rect x="5" y="7" width="3" height="10" rx="1"/><rect x="16" y="7" width="3" height="10" rx="1"/><rect x="19" y="9" width="3" height="6" rx="1"/><path d="M8 12h8"/></svg>',
    grafica: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 20h18"/><path d="M5 16l4-5 4 3 6-8"/></svg>',
    persona: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="8" r="4"/><path d="M4 21c1.5-4 4.5-6 8-6s6.5 2 8 6"/></svg>',
    reloj: '<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><circle cx="12" cy="13" r="8"/><path d="M12 9v4l2 2M9 2h6"/></svg>',
    atras: '<svg viewBox="0 0 24 24" width="26" height="26" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 5l-7 7 7 7"/></svg>',
    check: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12l5 5 9-10"/></svg>'
  };

  function vistaSelector() {
    app.innerHTML =
      '<main class="pad sel">' +
      '<h1>¿Quién entrena?</h1>' +
      '<p class="muted">Upper/Lower · 4 días · bloque de 10 semanas</p>' +
      Object.keys(PERFILES).map(function (k) {
        var p = PERFILES[k];
        return '<button class="card perfil-btn" data-p="' + k + '" style="--c:' + p.color + '"><span class="avatar">' + esc(p.nombre[0]) + '</span><span><b>' + esc(p.nombre) + '</b><small>Semana ' + S.perfiles[k].semana + ' de ' + TOTAL_SEMANAS + '</small></span></button>';
      }).join('') +
      '</main>';
    app.querySelectorAll('.perfil-btn').forEach(function (b) {
      b.onclick = function () { S.perfil = b.getAttribute('data-p'); guardar(); location.hash = '#/'; render(); };
    });
  }

  function vistaBloque() {
    var p = P(), def = DEF(), sem = p.semana, per = PERIODIZACION[sem - 1];
    var dots = '';
    for (var i = 1; i <= TOTAL_SEMANAS; i++) {
      var hechos = def.dias.filter(function (d) { var l = p.logs[claveLog(i, d.id)]; return l && l.terminado; }).length;
      var cls = i === sem ? 'act' : (hechos === def.dias.length ? 'full' : (hechos ? 'half' : ''));
      var fase = PERIODIZACION[i - 1].fase.indexOf('Descarga') === 0 ? ' deload' : '';
      dots += '<button class="dot ' + cls + fase + '" data-w="' + i + '" aria-label="Semana ' + i + '"></button>';
    }
    var opts = '';
    for (var j = 1; j <= TOTAL_SEMANAS; j++) opts += '<option value="' + j + '"' + (j === sem ? ' selected' : '') + '>Semana ' + j + '</option>';

    app.innerHTML =
      '<header class="top pad"><h1>' + esc(def.nombre) + '</h1><button class="chip-perfil" id="cambiar" style="--c:' + def.color + '">' + esc(def.nombre[0]) + '</button></header>' +
      '<main class="pad">' +
      '<p class="muted">Semana ' + sem + ' de ' + TOTAL_SEMANAS + '</p>' +
      '<div class="dots">' + dots + '</div>' +
      '<div class="row gap"><select id="semana" class="pill">' + opts + '</select></div>' +
      '<section class="fase card"><div class="fase-top"><b>' + esc(per.fase) + '</b><span class="tag">' + esc(per.series) + '</span></div>' +
      '<div class="rir"><span>RIR compuestos <b>' + per.rirC + '</b></span><span>RIR aislamiento <b>' + per.rirA + '</b></span></div>' +
      '<p class="muted small">' + esc(per.nota) + '</p></section>' +
      def.dias.map(function (d) {
        var l = p.logs[claveLog(sem, d.id)];
        var estado = l && l.terminado ? '<span class="ok">' + ICON.check + '</span>' : '';
        var sub = (l && l.fecha ? fechaCorta(l.fecha) : d.dia) + ' · ' + d.ejercicios.length + ' ejercicios';
        return '<a class="card dia" href="#/dia/' + d.id + '"><div><h2>' + esc(d.nombre.toUpperCase()) + '</h2><p class="muted">' + esc(sub) + '</p></div>' + estado + '</a>';
      }).join('') +
      '</main>' + nav('inicio');

    document.getElementById('semana').onchange = function (e) { p.semana = parseInt(e.target.value, 10); guardar(); render(); };
    app.querySelectorAll('.dot').forEach(function (b) {
      b.onclick = function () { p.semana = parseInt(b.getAttribute('data-w'), 10); guardar(); render(); };
    });
    document.getElementById('cambiar').onclick = function () { S.perfil = null; guardar(); render(); };
  }

  function vistaDia(diaId) {
    var p = P(), def = DEF(), sem = p.semana;
    var dia = def.dias.filter(function (d) { return d.id === diaId; })[0];
    if (!dia) { location.hash = '#/'; return; }
    var log = obtenerLog(sem, diaId, true);
    var unidad = p.unidad;
    var esNovia = S.perfil === 'novia';

    var html =
      '<header class="top pad"><a href="#/" class="icon-btn" aria-label="Volver">' + ICON.atras + '</a><h1 class="grow">' + esc(dia.nombre.toUpperCase()) + '</h1><button class="icon-btn" id="btn-timer" aria-label="Temporizador">' + ICON.reloj + '</button></header>' +
      '<main class="pad dia-main">' +
      '<p class="muted">Semana ' + sem + ' · ' + esc(PERIODIZACION[sem - 1].fase) + (log.fecha ? ' · ' + fechaCorta(log.fecha) : '') + '</p>' +
      (esNovia ? '<label class="toggle"><input type="checkbox" id="regla"' + (log.regla ? ' checked' : '') + '> Día de regla con poca energía <small>(+1 RIR y 1 serie menos)</small></label>' : '');

    dia.ejercicios.forEach(function (ej, idx) {
      var reg = obtenerEj(log, ej, sem);
      var prev = anterior(ej.id, diaId, sem);
      var sug = sugerencia(ej, prev);
      var rir = rirObjetivo(ej, sem);
      if (log.regla) rir = rir + ' +1';
      html += '<section class="ej" data-ej="' + ej.id + '">' +
        '<div class="ej-head"><span class="ej-num">' + (idx + 1) + '</span><div class="grow"><h3>' + esc(nombreEj(ej)) + '</h3>' +
        '<p class="meta">' + esc(ej.r) + ' reps · RIR ' + esc(rir) + ' · ' + Math.round(ej.d / 60 * 10) / 10 + ' min</p></div>' +
        '<button class="icon-btn mas" data-acc="menu" aria-label="Opciones">•••</button></div>' +
        (sug ? '<p class="sug ' + sug.tipo + '">' + esc(sug.txt) + '</p>' : '') +
        '<div class="sets"><div class="set-h"><span></span><span>ANTERIOR</span><span>' + unidad.toUpperCase() + '</span><span>REPS</span><span>RIR</span></div>';
      reg.sets.forEach(function (s, i) {
        var a = prev && prev.sets[i] ? prev.sets[i] : null;
        var aTxt = a && (a.w !== '' || a.r !== '') ? (a.w || '–') + ' × ' + (a.r || '–') : '–';
        html += '<div class="set' + (s.ok ? ' hecho' : '') + '" data-i="' + i + '">' +
          '<button class="chk" data-acc="ok" aria-label="Serie hecha">' + (s.ok ? ICON.check : (i + 1)) + '</button>' +
          '<button class="prev" data-acc="copiar" ' + (a ? '' : 'disabled') + '>' + esc(aTxt) + '</button>' +
          '<input inputmode="decimal" data-f="w" value="' + esc(s.w) + '" placeholder="' + esc(a && a.w ? a.w : '–') + '">' +
          '<input inputmode="numeric" data-f="r" value="' + esc(s.r) + '" placeholder="' + esc(a && a.r ? a.r : '–') + '">' +
          '<input inputmode="numeric" data-f="rir" value="' + esc(s.rir) + '" placeholder="' + esc(String(rir).split(' ')[0]) + '">' +
          '</div>';
      });
      html += '</div>' +
        '<div class="row between"><button class="link" data-acc="add">+ Añadir serie</button>' + (reg.sets.length > 1 ? '<button class="link muted" data-acc="del">− Quitar serie</button>' : '') + '</div>' +
        '<details class="tec"><summary>Técnica</summary><p>' + esc(ej.nota) + '</p><p class="muted small">Alternativa: ' + esc(P().alts[ej.id] ? ej.n : ej.alt) + '</p></details>' +
        '<textarea data-acc="nota" rows="1" placeholder="Añadir notas...">' + esc(reg.nota) + '</textarea>' +
        '</section>';
    });

    html += '<section class="card cierre"><p><b>Energía de hoy</b></p><div class="energia">' +
      [1, 2, 3, 4, 5].map(function (n) { return '<button data-e="' + n + '" class="' + (log.energia === n ? 'on' : '') + '">' + n + '</button>'; }).join('') +
      '</div><button class="btn-prim" id="terminar">' + (log.terminado ? 'Entrenamiento terminado ✓' : 'Terminar entrenamiento') + '</button></section>' +
      '</main>';

    app.innerHTML = html;

    document.getElementById('btn-timer').onclick = function () { iniciarTimer(90); };
    var regla = document.getElementById('regla');
    if (regla) regla.onchange = function () {
      log.regla = regla.checked;
      if (regla.checked) {
        // Quitar 1 serie vacía por ejercicio (mínimo 1).
        dia.ejercicios.forEach(function (ej) {
          var r = obtenerEj(log, ej, sem);
          var last = r.sets[r.sets.length - 1];
          if (r.sets.length > 1 && !last.ok && last.w === '' && last.r === '') r.sets.pop();
        });
      }
      guardar(); render();
    };

    app.querySelectorAll('.ej').forEach(function (sec) {
      var ej = dia.ejercicios.filter(function (e) { return e.id === sec.getAttribute('data-ej'); })[0];
      var reg = obtenerEj(log, ej, sem);

      sec.addEventListener('input', function (e) {
        var f = e.target.getAttribute('data-f');
        if (f) {
          var i = parseInt(e.target.closest('.set').getAttribute('data-i'), 10);
          reg.sets[i][f] = e.target.value.replace(',', '.');
          if (!log.fecha) log.fecha = new Date().toISOString();
          guardar();
        } else if (e.target.getAttribute('data-acc') === 'nota') {
          reg.nota = e.target.value; guardar();
        }
      });

      sec.addEventListener('click', function (e) {
        var b = e.target.closest('[data-acc]');
        if (!b) return;
        var acc = b.getAttribute('data-acc');
        var fila = b.closest('.set');
        var i = fila ? parseInt(fila.getAttribute('data-i'), 10) : -1;
        if (acc === 'ok') {
          var s = reg.sets[i];
          if (!s.ok) {
            // Completa con el valor anterior si se dejó vacío.
            var inW = fila.querySelector('[data-f="w"]'), inR = fila.querySelector('[data-f="r"]');
            if (s.w === '' && inW.placeholder !== '–') s.w = inW.placeholder;
            if (s.r === '' && inR.placeholder !== '–') s.r = inR.placeholder;
          }
          s.ok = !s.ok;
          if (!log.fecha) log.fecha = new Date().toISOString();
          guardar();
          var y = window.scrollY;
          render();
          window.scrollTo(0, y);
          if (s.ok) iniciarTimer(ej.d);
        } else if (acc === 'copiar') {
          var prev = anterior(ej.id, diaId, sem);
          if (prev && prev.sets[i]) { reg.sets[i].w = prev.sets[i].w; reg.sets[i].r = prev.sets[i].r; guardar(); var y2 = window.scrollY; render(); window.scrollTo(0, y2); }
        } else if (acc === 'add') {
          var ult = reg.sets[reg.sets.length - 1] || { w: '' };
          reg.sets.push({ w: ult.w, r: '', rir: '', ok: false }); guardar(); var y3 = window.scrollY; render(); window.scrollTo(0, y3);
        } else if (acc === 'del') {
          reg.sets.pop(); guardar(); var y4 = window.scrollY; render(); window.scrollTo(0, y4);
        } else if (acc === 'menu') {
          menuEjercicio(ej);
        }
      });
    });

    app.querySelectorAll('.energia button').forEach(function (b) {
      b.onclick = function () { log.energia = parseInt(b.getAttribute('data-e'), 10); guardar(); app.querySelectorAll('.energia button').forEach(function (x) { x.classList.toggle('on', x === b); }); };
    });
    document.getElementById('terminar').onclick = function () {
      log.terminado = !log.terminado;
      if (!log.fecha) log.fecha = new Date().toISOString();
      guardar();
      if (log.terminado) { pararTimer(); toast('¡Entrenamiento guardado!'); location.hash = '#/'; } else render();
    };
    app.querySelectorAll('textarea').forEach(autoalto);
  }

  function autoalto(t) {
    var f = function () { t.style.height = 'auto'; t.style.height = t.scrollHeight + 'px'; };
    t.addEventListener('input', f); f();
  }

  function menuEjercicio(ej) {
    var usaAlt = !!P().alts[ej.id];
    hoja([
      { txt: usaAlt ? 'Volver a: ' + ej.n : 'Cambiar a alternativa: ' + ej.alt, fn: function () { if (usaAlt) delete P().alts[ej.id]; else P().alts[ej.id] = true; guardar(); render(); } },
      { txt: 'Iniciar descanso (' + Math.round(ej.d / 60 * 10) / 10 + ' min)', fn: function () { iniciarTimer(ej.d); } },
      { txt: 'Ver progreso de este ejercicio', fn: function () { location.hash = '#/progreso/' + ej.id; } }
    ]);
  }

  function hoja(opciones) {
    var o = document.createElement('div');
    o.className = 'overlay';
    o.innerHTML = '<div class="sheet">' + opciones.map(function (op, i) { return '<button data-i="' + i + '">' + esc(op.txt) + '</button>'; }).join('') + '<button class="cancel">Cancelar</button></div>';
    o.onclick = function (e) {
      var b = e.target.closest('button');
      if (e.target === o || (b && b.classList.contains('cancel'))) { o.remove(); return; }
      if (b) { o.remove(); opciones[parseInt(b.getAttribute('data-i'), 10)].fn(); }
    };
    document.body.appendChild(o);
  }

  // Confirmación propia (confirm() no funciona en todos los contenedores).
  function confirmar(msg, accion, fn) {
    var o = document.createElement('div');
    o.className = 'overlay';
    o.innerHTML = '<div class="sheet"><p class="sheet-msg">' + esc(msg) + '</p><button class="peligro">' + esc(accion) + '</button><button class="cancel">Cancelar</button></div>';
    o.onclick = function (e) {
      if (e.target === o || e.target.classList.contains('cancel')) { o.remove(); return; }
      if (e.target.classList.contains('peligro')) { o.remove(); fn(); }
    };
    document.body.appendChild(o);
  }

  function todosLosEjercicios() {
    var lista = [];
    DEF().dias.forEach(function (d) { d.ejercicios.forEach(function (e) { lista.push({ ej: e, dia: d }); }); });
    return lista;
  }

  function historial(ejId, diaId) {
    var puntos = [];
    for (var w = 1; w <= TOTAL_SEMANAS; w++) {
      var l = P().logs[claveLog(w, diaId)];
      if (!l || !l.ej[ejId]) continue;
      var mejor = null, vol = 0;
      l.ej[ejId].sets.forEach(function (s) {
        var v = e1rm(s.w, s.r);
        vol += (parseFloat(s.w) || 0) * (parseFloat(s.r) || 0);
        if (v && (!mejor || v > mejor.e)) mejor = { e: v, w: s.w, r: s.r };
      });
      if (mejor) puntos.push({ w: w, e: mejor.e, set: mejor.w + ' × ' + mejor.r, vol: vol });
    }
    return puntos;
  }

  function grafica(puntos) {
    if (puntos.length < 1) return '<p class="muted">Aún no hay registros de este ejercicio.</p>';
    var W = 320, H = 160, pad = 28;
    var max = Math.max.apply(null, puntos.map(function (p) { return p.e; }));
    var min = Math.min.apply(null, puntos.map(function (p) { return p.e; }));
    if (max === min) { max += 1; min -= 1; }
    var holgura = (max - min) * 0.15; max += holgura; min -= holgura;
    var x = function (w) { return pad + (W - 2 * pad) * (w - 1) / (TOTAL_SEMANAS - 1); };
    var y = function (e) { return H - pad - (H - 2 * pad) * (e - min) / (max - min); };
    var path = puntos.map(function (p, i) { return (i ? 'L' : 'M') + x(p.w).toFixed(1) + ' ' + y(p.e).toFixed(1); }).join(' ');
    var ejes = '';
    for (var w = 1; w <= TOTAL_SEMANAS; w++) ejes += '<text x="' + x(w) + '" y="' + (H - 8) + '" text-anchor="middle">' + w + '</text>';
    return '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '">' +
      '<line x1="' + pad + '" y1="' + (H - pad) + '" x2="' + (W - pad) + '" y2="' + (H - pad) + '" class="axis"/>' + ejes +
      '<path d="' + path + '" class="line"/>' +
      puntos.map(function (p) { return '<circle cx="' + x(p.w) + '" cy="' + y(p.e) + '" r="4"/>'; }).join('') +
      '<text x="' + pad + '" y="14" class="lbl">' + Math.round(max) + '</text><text x="' + pad + '" y="' + (H - pad - 4) + '" class="lbl">' + Math.round(min) + '</text>' +
      '</svg>';
  }

  function vistaProgreso(ejSel) {
    var lista = todosLosEjercicios();
    var sel = lista.filter(function (x) { return x.ej.id === ejSel; })[0] || lista[0];
    var pts = historial(sel.ej.id, sel.dia.id);
    var u = P().unidad;
    var totalHechos = Object.keys(P().logs).filter(function (k) { return P().logs[k].terminado; }).length;

    app.innerHTML =
      '<header class="top pad"><h1>Progreso</h1></header>' +
      '<main class="pad">' +
      '<div class="stats"><div class="card"><b>' + totalHechos + '</b><small>entrenamientos</small></div><div class="card"><b>' + P().semana + '/' + TOTAL_SEMANAS + '</b><small>semana</small></div></div>' +
      '<select id="ejsel" class="pill full">' + DEF().dias.map(function (d) {
        return '<optgroup label="' + esc(d.nombre) + '">' + d.ejercicios.map(function (e) { return '<option value="' + e.id + '"' + (e.id === sel.ej.id ? ' selected' : '') + '>' + esc(nombreEj(e)) + '</option>'; }).join('') + '</optgroup>';
      }).join('') + '</select>' +
      '<section class="card"><p class="muted small">1RM estimado (' + u + ') por semana · fórmula de Epley</p>' + grafica(pts) + '</section>' +
      (pts.length ? '<section class="card"><table class="tabla"><thead><tr><th>Sem</th><th>Mejor serie</th><th>1RM est.</th><th>Volumen</th></tr></thead><tbody>' +
        pts.map(function (p) { return '<tr><td>' + p.w + '</td><td>' + esc(p.set) + '</td><td>' + Math.round(p.e) + '</td><td>' + Math.round(p.vol) + '</td></tr>'; }).join('') +
        '</tbody></table></section>' : '') +
      '</main>' + nav('progreso');

    document.getElementById('ejsel').onchange = function (e) { location.hash = '#/progreso/' + e.target.value; };
  }

  function vistaPerfil() {
    var p = P(), def = DEF();
    app.innerHTML =
      '<header class="top pad"><h1>Perfil</h1></header>' +
      '<main class="pad">' +
      '<section class="card"><p><b>' + esc(def.nombre) + '</b></p>' +
      '<div class="row between"><span>Unidad de peso</span><div class="seg"><button data-u="kg" class="' + (p.unidad === 'kg' ? 'on' : '') + '">kg</button><button data-u="lb" class="' + (p.unidad === 'lb' ? 'on' : '') + '">lb</button></div></div>' +
      '<p class="muted small">Cambiar la unidad sólo cambia la etiqueta; no convierte lo ya registrado.</p></section>' +
      '<button class="card btn-row" id="cambiar">Cambiar de perfil</button>' +
      '<section class="card"><p><b>Respaldo</b></p><p class="muted small">Los datos viven en este teléfono. Exporta un respaldo cada semana (por ejemplo, a Archivos o iCloud Drive).</p>' +
      '<button class="btn-sec" id="exp">Exportar respaldo (.json)</button>' +
      '<button class="btn-sec" id="csv">Exportar registro (.csv)</button>' +
      '<label class="btn-sec">Importar respaldo<input type="file" id="imp" accept=".json,application/json" hidden></label></section>' +
      '<section class="card"><p><b>Empezar un bloque nuevo</b></p><p class="muted small">Borra los registros de ' + esc(def.nombre) + ' y regresa a la semana 1. Exporta antes.</p><button class="btn-danger" id="reset">Reiniciar bloque</button></section>' +
      '</main>' + nav('perfil');

    app.querySelectorAll('.seg button').forEach(function (b) { b.onclick = function () { p.unidad = b.getAttribute('data-u'); guardar(); render(); }; });
    document.getElementById('cambiar').onclick = function () { S.perfil = null; guardar(); location.hash = '#/'; render(); };
    document.getElementById('exp').onclick = function () {
      descargar('entreno-respaldo-' + new Date().toISOString().slice(0, 10) + '.json', JSON.stringify(S, null, 2), 'application/json');
    };
    document.getElementById('csv').onclick = function () { descargar('entreno-' + S.perfil + '.csv', csv(), 'text/csv'); };
    document.getElementById('imp').onchange = function (e) {
      var f = e.target.files[0];
      if (!f) return;
      var rd = new FileReader();
      rd.onload = function () {
        try {
          var d = JSON.parse(rd.result);
          if (!d.perfiles) throw new Error('formato');
          confirmar('Esto reemplaza los datos actuales de los dos perfiles.', 'Importar', function () {
            var perfilActual = S.perfil;
            S = d; S.perfil = perfilActual; guardar(); toast('Respaldo importado'); render();
          });
        } catch (err) { toast('Archivo no válido'); }
      };
      rd.readAsText(f);
    };
    document.getElementById('reset').onclick = function () {
      confirmar('Se borran todos los registros de ' + def.nombre + '.', 'Borrar y reiniciar', function () {
        p.logs = {}; p.semana = 1; p.alts = {}; guardar(); toast('Bloque reiniciado'); location.hash = '#/';
      });
    };
  }

  function csv() {
    var filas = [['perfil', 'semana', 'dia', 'fecha', 'ejercicio', 'serie', 'peso', 'unidad', 'reps', 'rir', 'hecha', 'energia', 'regla', 'nota']];
    var p = P();
    DEF().dias.forEach(function (d) {
      for (var w = 1; w <= TOTAL_SEMANAS; w++) {
        var l = p.logs[claveLog(w, d.id)];
        if (!l) continue;
        d.ejercicios.forEach(function (e) {
          var r = l.ej[e.id];
          if (!r) return;
          r.sets.forEach(function (s, i) {
            filas.push([S.perfil, w, d.nombre, l.fecha ? l.fecha.slice(0, 10) : '', nombreEj(e), i + 1, s.w, p.unidad, s.r, s.rir, s.ok ? 1 : 0, l.energia || '', l.regla ? 1 : 0, i === 0 ? r.nota : '']);
          });
        });
      }
    });
    return filas.map(function (f) { return f.map(function (c) { c = String(c == null ? '' : c); return /[",\n]/.test(c) ? '"' + c.replace(/"/g, '""') + '"' : c; }).join(','); }).join('\n');
  }

  function descargar(nombre, contenido, tipo) {
    var blob = new Blob([contenido], { type: tipo });
    var f = new File([blob], nombre, { type: tipo });
    if (navigator.canShare && navigator.canShare({ files: [f] })) {
      navigator.share({ files: [f], title: nombre }).catch(function () {});
      return;
    }
    var a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = nombre;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(function () { URL.revokeObjectURL(a.href); }, 1000);
  }

  // ---------- Router ----------
  function render() {
    if (!S.perfil) { vistaSelector(); return; }
    var h = location.hash.replace(/^#/, '') || '/';
    var m;
    if ((m = /^\/dia\/(\w+)/.exec(h))) vistaDia(m[1]);
    else if ((m = /^\/progreso\/?(\w*)/.exec(h))) vistaProgreso(m[1]);
    else if (h === '/perfil') vistaPerfil();
    else vistaBloque();
  }

  window.addEventListener('hashchange', function () { render(); window.scrollTo(0, 0); });
  document.addEventListener('visibilitychange', function () { if (!document.hidden && timer.id) tick(); });
  render();

  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    navigator.serviceWorker.register('sw.js').catch(function () {});
  }
  // Pide almacenamiento persistente (evita que el navegador borre los datos).
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(function () {});
})();
