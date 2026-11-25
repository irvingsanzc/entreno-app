/* Entreno · PWA de registro de entrenamiento (sin dependencias). */
(function () {
  'use strict';

  // Modo: 'personal' (raíz, perfiles de Irving y Yulieth) o 'publica' (/publica, cada quien crea su perfil).
  var MODO = window.ENTRENO_MODO === 'publica' ? 'publica' : 'personal';
  var STORE_KEY = MODO === 'publica' ? 'entreno.pub.v1' : 'entreno.v1';
  var TOTAL_SEMANAS = 10;
  var COLORES = ['#5aa6b4', '#d07aa8', '#e0a458', '#7dbf6e', '#9b8fe0', '#e07a6e'];
  var app = document.getElementById('app');

  // ---------- Estado ----------
  function perfilBase(datos) {
    return Object.assign({
      nombre: 'Perfil', color: COLORES[0], unidad: 'kg', semana: 1, logs: {}, alts: {},
      bloque: 1, bloques: [], regla: false, plantilla: null, rutina: null
    }, datos || {});
  }

  function estadoInicial() {
    var perfiles = {};
    if (MODO === 'personal') {
      Object.keys(PERFILES_PERSONALES).forEach(function (k) { perfiles[k] = perfilBase(PERFILES_PERSONALES[k]); });
    }
    return { perfil: null, perfiles: perfiles };
  }

  // Completa campos que falten (datos viejos o respaldos importados).
  function normalizar(s) {
    var base = estadoInicial();
    s.perfiles = s.perfiles || {};
    Object.keys(base.perfiles).forEach(function (k) { if (!s.perfiles[k]) s.perfiles[k] = base.perfiles[k]; });
    Object.keys(s.perfiles).forEach(function (k) {
      var fijo = MODO === 'personal' ? PERFILES_PERSONALES[k] : null;
      s.perfiles[k] = Object.assign(perfilBase(fijo), s.perfiles[k]);
    });
    if (s.perfil && !s.perfiles[s.perfil]) s.perfil = null;
    return s;
  }

  function cargar() {
    try {
      var raw = localStorage.getItem(STORE_KEY);
      if (!raw) return estadoInicial();
      return normalizar(JSON.parse(raw));
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
  // Rutina del perfil: la propia (editada) o la plantilla en vivo.
  function DEF() {
    var p = P();
    return p.rutina || PLANTILLAS[p.plantilla] || { dias: [] };
  }

  function clonar(o) { return JSON.parse(JSON.stringify(o)); }
  function nuevoId(pre) { return pre + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); }

  // Antes de editar, la rutina del perfil se vuelve una copia propia.
  function rutinaPropia() {
    var p = P();
    if (!p.rutina) p.rutina = { dias: clonar(DEF().dias) };
    return p.rutina;
  }

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
      log.ej[ej.id] = { sets: sets, nota: '', alt: !!P().alts[ej.id], auto: true };
    }
    return log.ej[ej.id];
  }

  // Bloques en orden cronológico: los archivados y al final el actual.
  function bloquesTodos() {
    var p = P();
    return p.bloques.concat([{ n: p.bloque, logs: p.logs, actual: true }]);
  }

  // Registro anterior del mismo ejercicio: semana previa más cercana con datos,
  // en el bloque actual y luego en los bloques archivados (del más reciente al más viejo).
  function buscarPrev(ejId, diaId, semana, filtro) {
    var bs = bloquesTodos();
    for (var b = bs.length - 1; b >= 0; b--) {
      var desde = bs[b].actual ? semana - 1 : TOTAL_SEMANAS;
      for (var w = desde; w >= 1; w--) {
        var l = bs[b].logs[claveLog(w, diaId)];
        var r = l && l.ej[ejId];
        if (r && r.sets.some(function (s) { return s.w !== '' || s.r !== ''; }) && (!filtro || filtro(r))) {
          return { semana: w, bloque: bs[b].n, sets: r.sets };
        }
      }
    }
    return null;
  }

  function anterior(ejId, diaId, semana) { return buscarPrev(ejId, diaId, semana, null); }

  // Pone los pesos de la última sesión del mismo ejercicio (misma variante: normal o alternativa)
  // mientras la persona no haya escrito ni marcado nada en este ejercicio.
  function autollenar(reg, ej, diaId, semana) {
    if (reg.auto === false) return;
    if (reg.sets.some(function (s) { return s.ok || s.r !== ''; })) { reg.auto = false; return; }
    if (reg.auto !== true && reg.sets.some(function (s) { return s.w !== ''; })) { reg.auto = false; return; }
    var alt = !!P().alts[ej.id];
    reg.alt = alt;
    var prev = buscarPrev(ej.id, diaId, semana, function (r) { return !!r.alt === alt; });
    reg.auto = true;
    if (!prev) return;
    reg.sets.forEach(function (s, i) {
      var src = prev.sets[i] || prev.sets[prev.sets.length - 1];
      s.w = src && src.w !== '' ? src.w : s.w;
    });
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
    var claves = Object.keys(S.perfiles);
    app.innerHTML =
      '<main class="pad sel">' +
      '<h1>' + (claves.length ? '¿Quién entrena?' : 'Bienvenido a Entreno') + '</h1>' +
      '<p class="muted">' + (claves.length ? 'Bloques de 10 semanas con periodización' : 'Registra tus entrenamientos y mide tu progreso. Tus datos se guardan sólo en este teléfono.') + '</p>' +
      claves.map(function (k) {
        var p = S.perfiles[k];
        return '<button class="card perfil-btn" data-p="' + k + '" style="--c:' + esc(p.color) + '"><span class="avatar">' + esc((p.nombre || '?')[0].toUpperCase()) + '</span><span><b>' + esc(p.nombre) + '</b><small>Bloque ' + p.bloque + ' · Semana ' + p.semana + ' de ' + TOTAL_SEMANAS + '</small></span></button>';
      }).join('') +
      '<a class="card btn-row nuevo" href="#/nuevo">+ Crear perfil</a>' +
      '</main>';
    app.querySelectorAll('.perfil-btn').forEach(function (b) {
      b.onclick = function () { S.perfil = b.getAttribute('data-p'); guardar(); location.hash = '#/'; render(); };
    });
  }

  function vistaNuevo() {
    var claves = Object.keys(PLANTILLAS);
    app.innerHTML =
      '<header class="top pad"><a href="#/" class="icon-btn" aria-label="Volver">' + ICON.atras + '</a><h1 class="grow">Nuevo perfil</h1></header>' +
      '<main class="pad form">' +
      '<label class="campo">Nombre<input id="nf-nombre" maxlength="30" autocomplete="off" placeholder="Tu nombre"></label>' +
      '<div class="campo">Unidad de peso<div class="seg"><button data-u="kg" class="on">kg</button><button data-u="lb">lb</button></div></div>' +
      '<div class="campo">Rutina inicial' +
      claves.map(function (k, i) {
        return '<label class="opcion"><input type="radio" name="pl" value="' + k + '"' + (i === 0 ? ' checked' : '') + '><span><b>' + esc(PLANTILLAS[k].nombre) + '</b><small>' + esc(PLANTILLAS[k].desc || '') + '</small></span></label>';
      }).join('') +
      '<label class="opcion"><input type="radio" name="pl" value=""><span><b>Empezar vacía</b><small>Armas tus días y ejercicios desde cero.</small></span></label>' +
      '<p class="muted small">Después puedes editar cualquier día o ejercicio en Perfil → Editar rutina.</p></div>' +
      '<label class="toggle"><input type="checkbox" id="nf-regla"> Mostrar opción "Día de regla" <small>(+1 RIR y 1 serie menos ese día)</small></label>' +
      '<button class="btn-prim" id="nf-crear">Crear perfil</button>' +
      '</main>';
    var unidad = 'kg';
    app.querySelectorAll('.seg button').forEach(function (b) {
      b.onclick = function () { unidad = b.getAttribute('data-u'); app.querySelectorAll('.seg button').forEach(function (x) { x.classList.toggle('on', x === b); }); };
    });
    document.getElementById('nf-crear').onclick = function () {
      var nombre = document.getElementById('nf-nombre').value.trim();
      if (!nombre) { toast('Escribe un nombre'); return; }
      var pl = app.querySelector('input[name="pl"]:checked').value;
      var id = nuevoId('p');
      S.perfiles[id] = perfilBase({
        nombre: nombre, unidad: unidad,
        color: COLORES[Object.keys(S.perfiles).length % COLORES.length],
        regla: document.getElementById('nf-regla').checked,
        rutina: { dias: pl ? clonar(PLANTILLAS[pl].dias) : [{ id: nuevoId('d'), nombre: 'Día 1', dia: '', ejercicios: [] }] }
      });
      S.perfil = id; guardar();
      toast('Perfil creado');
      location.hash = pl ? '#/' : '#/rutina';
    };
  }

  // ---------- Editor de rutina ----------
  function vistaRutina() {
    var p = P(), dias = DEF().dias;
    var html =
      '<header class="top pad"><a href="#/perfil" class="icon-btn" aria-label="Volver">' + ICON.atras + '</a><h1 class="grow">Editar rutina</h1></header>' +
      '<main class="pad rutina">' +
      (p.rutina ? '' : '<p class="muted small">Esta rutina viene de una plantilla. Al hacer tu primer cambio se guarda una copia propia en este perfil.</p>') +
      '<p class="muted small">Los cambios aplican a las sesiones que aún no empiezas. Tus registros anteriores no se borran.</p>';
    dias.forEach(function (d, di) {
      html += '<section class="card dia-ed" data-di="' + di + '">' +
        '<div class="row gap"><input class="in-dia grow" data-f="nombre" value="' + esc(d.nombre) + '" placeholder="Nombre del día"><input class="in-dia corto" data-f="dia" value="' + esc(d.dia) + '" placeholder="Lunes"></div>' +
        '<ul class="lista-ej">' +
        d.ejercicios.map(function (e, ei) {
          return '<li data-ei="' + ei + '"><button class="ej-ed grow" data-acc="editar"><b>' + esc(e.n) + '</b><small>' + e.s + ' × ' + esc(e.r) + ' · ' + e.d + ' s' + (e.prio ? ' · prioridad ' + e.prio : '') + '</small></button>' +
            '<button class="mini" data-acc="subir" aria-label="Subir"' + (ei === 0 ? ' disabled' : '') + '>↑</button>' +
            '<button class="mini" data-acc="bajar" aria-label="Bajar"' + (ei === d.ejercicios.length - 1 ? ' disabled' : '') + '>↓</button></li>';
        }).join('') +
        '</ul>' +
        '<div class="row between"><button class="link" data-acc="agregar">+ Agregar ejercicio</button><button class="link peligro-txt" data-acc="borrar-dia">Eliminar día</button></div>' +
        '</section>';
    });
    html += '<button class="btn-sec" id="add-dia">+ Agregar día</button></main>';
    app.innerHTML = html;

    app.querySelectorAll('.dia-ed').forEach(function (sec) {
      var di = parseInt(sec.getAttribute('data-di'), 10);
      sec.querySelectorAll('.in-dia').forEach(function (inp) {
        inp.onchange = function () { rutinaPropia().dias[di][inp.getAttribute('data-f')] = inp.value.trim(); guardar(); };
      });
      sec.addEventListener('click', function (e) {
        var b = e.target.closest('[data-acc]');
        if (!b) return;
        var acc = b.getAttribute('data-acc');
        var li = b.closest('li');
        var ei = li ? parseInt(li.getAttribute('data-ei'), 10) : -1;
        var y = window.scrollY;
        var listo = function () { guardar(); render(); window.scrollTo(0, y); };
        if (acc === 'editar') {
          formEjercicio(DEF().dias[di].ejercicios[ei], function (datos) {
            var actual = rutinaPropia().dias[di].ejercicios[ei];
            delete actual.prio;
            Object.assign(actual, datos); listo();
          }, function () {
            rutinaPropia().dias[di].ejercicios.splice(ei, 1); listo();
          });
        } else if (acc === 'agregar') {
          formEjercicio(null, function (datos) {
            rutinaPropia().dias[di].ejercicios.push(Object.assign({ id: nuevoId('x') }, datos)); listo();
          });
        } else if (acc === 'subir' || acc === 'bajar') {
          var lista = rutinaPropia().dias[di].ejercicios, j = acc === 'subir' ? ei - 1 : ei + 1;
          var t = lista[ei]; lista[ei] = lista[j]; lista[j] = t; listo();
        } else if (acc === 'borrar-dia') {
          confirmar('Se quita "' + DEF().dias[di].nombre + '" de la rutina. Sus registros anteriores se conservan en el respaldo.', 'Eliminar día', function () {
            rutinaPropia().dias.splice(di, 1); listo();
          });
        }
      });
    });
    document.getElementById('add-dia').onclick = function () {
      var r = rutinaPropia();
      r.dias.push({ id: nuevoId('d'), nombre: 'Día ' + (r.dias.length + 1), dia: '', ejercicios: [] });
      guardar(); render(); window.scrollTo(0, document.body.scrollHeight);
    };
  }

  function formEjercicio(ej, alGuardar, alBorrar) {
    var e = ej || { n: '', t: 'A', s: 3, r: '8-12', d: 90, nota: '', alt: '' };
    var o = document.createElement('div');
    o.className = 'overlay';
    o.innerHTML = '<div class="sheet form">' +
      '<p class="sheet-msg"><b>' + (ej ? 'Editar ejercicio' : 'Nuevo ejercicio') + '</b></p>' +
      '<label class="campo">Nombre<input data-f="n" value="' + esc(e.n) + '" placeholder="Ej. Press banca con barra"></label>' +
      '<label class="campo">Tipo<select data-f="t">' +
      [['C', 'Compuesto'], ['A', 'Aislamiento'], ['K', 'Core']].map(function (t) { return '<option value="' + t[0] + '"' + (e.t === t[0] ? ' selected' : '') + '>' + t[1] + '</option>'; }).join('') +
      '</select></label>' +
      '<div class="row gap"><label class="campo grow">Series<input data-f="s" inputmode="numeric" value="' + esc(e.s) + '"></label>' +
      '<label class="campo grow">Reps<input data-f="r" value="' + esc(e.r) + '" placeholder="8-12"></label>' +
      '<label class="campo grow">Descanso (s)<input data-f="d" inputmode="numeric" value="' + esc(e.d) + '"></label></div>' +
      '<label class="campo">Prioridad<select data-f="prio">' +
      [['', 'Normal'], ['1', '+1 serie en semanas 4-9'], ['2', '+1 serie en semanas 7-9']].map(function (t) { return '<option value="' + t[0] + '"' + (String(e.prio || '') === t[0] ? ' selected' : '') + '>' + t[1] + '</option>'; }).join('') +
      '</select></label>' +
      '<label class="campo">Alternativa<input data-f="alt" value="' + esc(e.alt) + '" placeholder="Ejercicio para cambiar si no hay máquina"></label>' +
      '<label class="campo">Técnica<textarea data-f="nota" rows="2" placeholder="Notas de ejecución">' + esc(e.nota) + '</textarea></label>' +
      '<button class="btn-prim" data-x="ok">Guardar</button>' +
      (ej && alBorrar ? '<button class="peligro" data-x="borrar">Eliminar ejercicio</button>' : '') +
      '<button class="cancel" data-x="no">Cancelar</button></div>';
    var val = function (f) { return o.querySelector('[data-f="' + f + '"]').value.trim(); };
    o.onclick = function (ev) {
      var x = ev.target.getAttribute && ev.target.getAttribute('data-x');
      if (ev.target === o || x === 'no') { o.remove(); return; }
      if (x === 'borrar') { o.remove(); confirmar('Se quita "' + e.n + '" de la rutina. Sus registros anteriores se conservan.', 'Eliminar', alBorrar); return; }
      if (x !== 'ok') return;
      var datos = {
        n: val('n'), t: val('t'), s: Math.max(1, parseInt(val('s'), 10) || 0), r: val('r') || '8-12',
        d: Math.max(0, parseInt(val('d'), 10) || 0), alt: val('alt') || val('n'), nota: val('nota')
      };
      var prio = parseInt(val('prio'), 10);
      if (prio) datos.prio = prio; else datos.prio = undefined;
      if (!datos.n) { toast('Escribe el nombre del ejercicio'); return; }
      o.remove(); alGuardar(JSON.parse(JSON.stringify(datos)));
    };
    document.body.appendChild(o);
    if (!ej) o.querySelector('[data-f="n"]').focus();
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
    var bloqueListo = sem === TOTAL_SEMANAS && def.dias.length > 0 && def.dias.every(function (d) { var l = p.logs[claveLog(TOTAL_SEMANAS, d.id)]; return l && l.terminado; });
    var tarjetaBloque = bloqueListo
      ? '<section class="card"><p><b>¡Bloque ' + p.bloque + ' terminado!</b></p><p class="muted small">Empieza el bloque ' + (p.bloque + 1) + ' con la misma rutina. Cada ejercicio arranca con tus pesos de la semana 10 (prueba de reps del jueves). El bloque ' + p.bloque + ' queda en tu historial y en la gráfica de progreso.</p><button class="btn-prim" id="duplicar">Duplicar bloque</button></section>'
      : '';

    app.innerHTML =
      '<header class="top pad"><h1>' + esc(p.nombre) + '</h1><button class="chip-perfil" id="cambiar" style="--c:' + esc(p.color) + '">' + esc((p.nombre || '?')[0].toUpperCase()) + '</button></header>' +
      '<main class="pad">' +
      '<p class="muted">Bloque ' + p.bloque + ' · Semana ' + sem + ' de ' + TOTAL_SEMANAS + '</p>' +
      '<div class="dots">' + dots + '</div>' +
      tarjetaBloque +
      '<div class="row gap"><select id="semana" class="pill">' + opts + '</select></div>' +
      '<section class="fase card"><div class="fase-top"><b>' + esc(per.fase) + '</b><span class="tag">' + esc(per.series) + '</span></div>' +
      '<div class="rir"><span>RIR compuestos <b>' + per.rirC + '</b></span><span>RIR aislamiento <b>' + per.rirA + '</b></span></div>' +
      '<p class="muted small">' + esc(per.nota) + '</p></section>' +
      (def.dias.length ? '' : '<a class="card" href="#/rutina"><b>Tu rutina está vacía</b><p class="muted small">Agrega tus días y ejercicios →</p></a>') +
      def.dias.map(function (d) {
        var l = p.logs[claveLog(sem, d.id)];
        var estado = l && l.terminado ? '<span class="ok">' + ICON.check + '</span>' : '';
        var n = d.ejercicios.length;
        var sub = [l && l.fecha ? fechaCorta(l.fecha) : d.dia, n + (n === 1 ? ' ejercicio' : ' ejercicios')].filter(Boolean).join(' · ');
        return '<a class="card dia" href="#/dia/' + d.id + '"><div><h2>' + esc(d.nombre.toUpperCase()) + '</h2><p class="muted">' + esc(sub) + '</p></div>' + estado + '</a>';
      }).join('') +
      '</main>' + nav('inicio');

    document.getElementById('semana').onchange = function (e) { p.semana = parseInt(e.target.value, 10); guardar(); render(); };
    app.querySelectorAll('.dot').forEach(function (b) {
      b.onclick = function () { p.semana = parseInt(b.getAttribute('data-w'), 10); guardar(); render(); };
    });
    document.getElementById('cambiar').onclick = function () { S.perfil = null; guardar(); render(); };
    var dup = document.getElementById('duplicar');
    if (dup) dup.onclick = function () {
      confirmar('Se archiva el bloque ' + p.bloque + ' y empiezas el bloque ' + (p.bloque + 1) + ' en la semana 1 con tus últimos pesos.', 'Duplicar bloque', function () {
        p.bloques.push({ n: p.bloque, fin: new Date().toISOString(), logs: p.logs });
        p.bloque += 1; p.logs = {}; p.semana = 1;
        guardar(); toast('Bloque ' + p.bloque + ' listo'); render(); window.scrollTo(0, 0);
      });
    };
  }

  function vistaDia(diaId) {
    var p = P(), def = DEF(), sem = p.semana;
    var dia = def.dias.filter(function (d) { return d.id === diaId; })[0];
    if (!dia) { location.hash = '#/'; return; }
    var log = obtenerLog(sem, diaId, true);
    var unidad = p.unidad;
    var esNovia = !!p.regla;

    var html =
      '<header class="top pad"><a href="#/" class="icon-btn" aria-label="Volver">' + ICON.atras + '</a><h1 class="grow">' + esc(dia.nombre.toUpperCase()) + '</h1><button class="icon-btn" id="btn-timer" aria-label="Temporizador">' + ICON.reloj + '</button></header>' +
      '<main class="pad dia-main">' +
      '<p class="muted">Semana ' + sem + ' · ' + esc(PERIODIZACION[sem - 1].fase) + (log.fecha ? ' · ' + fechaCorta(log.fecha) : '') + '</p>' +
      (esNovia ? '<label class="toggle"><input type="checkbox" id="regla"' + (log.regla ? ' checked' : '') + '> Día de regla con poca energía <small>(+1 RIR y 1 serie menos)</small></label>' : '');

    dia.ejercicios.forEach(function (ej, idx) {
      var reg = obtenerEj(log, ej, sem);
      if (!log.terminado) autollenar(reg, ej, diaId, sem);
      var prev = anterior(ej.id, diaId, sem);
      var sug = sugerencia(ej, prev);
      var rir = rirObjetivo(ej, sem);
      if (log.regla) rir = rir + ' +1';
      html += '<section class="ej" data-ej="' + ej.id + '">' +
        '<div class="ej-head"><span class="ej-num">' + (idx + 1) + '</span><div class="grow"><h3>' + esc(nombreEj(ej)) + '</h3>' +
        '<p class="meta">' + esc(ej.r) + ' reps · RIR ' + esc(rir) + ' · ' + Math.round(ej.d / 60 * 10) / 10 + ' min' + (ej.ss ? ' · Superserie ' + esc(ej.ss) : '') + '</p>' +
        (ej.tec ? '<p class="meta tec-av">⚡ ' + esc(ej.tec) + (((sem >= 3 && sem <= 5) || (sem >= 7 && sem <= 9)) ? '' : ' · <i>no esta semana</i>') + '</p>' : '') + '</div>' +
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
      '</div><button class="btn-prim" id="terminar">' + (log.terminado ? 'Sesión guardada ✓ · tocar para editar' : 'Guardar sesión') + '</button>' +
      '<p class="muted small">La próxima vez que toque este día, cada ejercicio arranca con los pesos de hoy.</p></section>' +
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
          // El peso puede venir autollenado: una serie "vacía" es la que no tiene reps ni está hecha.
          if (r.sets.length > 1 && !last.ok && last.r === '') r.sets.pop();
        });
      } else {
        // Al desmarcar, devolver las series que quitó la regla (hasta las que toca esta semana).
        dia.ejercicios.forEach(function (ej) {
          var r = obtenerEj(log, ej, sem);
          var n = seriesSemana(ej, sem);
          while (r.sets.length < n) {
            var u = r.sets[r.sets.length - 1];
            r.sets.push({ w: u ? u.w : '', r: '', rir: '', ok: false });
          }
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
          reg.auto = false;
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
          menuEjercicio(ej, reg);
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
      if (log.terminado) { pararTimer(); toast('¡Sesión guardada!'); location.hash = '#/'; } else render();
    };
    app.querySelectorAll('textarea').forEach(autoalto);
  }

  function autoalto(t) {
    var f = function () { t.style.height = 'auto'; t.style.height = t.scrollHeight + 'px'; };
    t.addEventListener('input', f); f();
  }

  function menuEjercicio(ej, reg) {
    var usaAlt = !!P().alts[ej.id];
    hoja([
      { txt: usaAlt ? 'Volver a: ' + ej.n : 'Cambiar a alternativa: ' + ej.alt, fn: function () {
        if (usaAlt) delete P().alts[ej.id]; else P().alts[ej.id] = true;
        // Si aún no se ha tocado, vuelve a llenar con los pesos de la variante elegida.
        if (reg && reg.auto !== false) { reg.sets.forEach(function (s) { s.w = ''; }); reg.auto = true; }
        if (reg) reg.alt = !usaAlt;
        guardar(); render();
      } },
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
    bloquesTodos().forEach(function (b, bi) {
      for (var w = 1; w <= TOTAL_SEMANAS; w++) {
        var l = b.logs[claveLog(w, diaId)];
        if (!l || !l.ej[ejId]) continue;
        var mejor = null, vol = 0;
        l.ej[ejId].sets.forEach(function (s) {
          var v = e1rm(s.w, s.r);
          vol += (parseFloat(s.w) || 0) * (parseFloat(s.r) || 0);
          if (v && (!mejor || v > mejor.e)) mejor = { e: v, w: s.w, r: s.r };
        });
        if (mejor) puntos.push({ w: w, b: b.n, g: bi * TOTAL_SEMANAS + w, e: mejor.e, set: mejor.w + ' × ' + mejor.r, vol: vol });
      }
    });
    return puntos;
  }

  function grafica(puntos) {
    if (puntos.length < 1) return '<p class="muted">Aún no hay registros de este ejercicio.</p>';
    var nB = bloquesTodos().length, total = nB * TOTAL_SEMANAS;
    var W = 320, H = 160, pad = 28;
    var max = Math.max.apply(null, puntos.map(function (p) { return p.e; }));
    var min = Math.min.apply(null, puntos.map(function (p) { return p.e; }));
    if (max === min) { max += 1; min -= 1; }
    var holgura = (max - min) * 0.15; max += holgura; min -= holgura;
    var x = function (g) { return pad + (W - 2 * pad) * (g - 1) / (total - 1); };
    var y = function (e) { return H - pad - (H - 2 * pad) * (e - min) / (max - min); };
    var path = puntos.map(function (p, i) { return (i ? 'L' : 'M') + x(p.g).toFixed(1) + ' ' + y(p.e).toFixed(1); }).join(' ');
    var ejes = '';
    if (nB === 1) {
      for (var w = 1; w <= TOTAL_SEMANAS; w++) ejes += '<text x="' + x(w) + '" y="' + (H - 8) + '" text-anchor="middle">' + w + '</text>';
    } else {
      bloquesTodos().forEach(function (b, bi) { ejes += '<text x="' + x(bi * TOTAL_SEMANAS + 1) + '" y="' + (H - 8) + '" text-anchor="start">B' + b.n + '</text>'; });
    }
    return '<svg class="chart" viewBox="0 0 ' + W + ' ' + H + '">' +
      '<line x1="' + pad + '" y1="' + (H - pad) + '" x2="' + (W - pad) + '" y2="' + (H - pad) + '" class="axis"/>' + ejes +
      '<path d="' + path + '" class="line"/>' +
      puntos.map(function (p) { return '<circle cx="' + x(p.g) + '" cy="' + y(p.e) + '" r="4"/>'; }).join('') +
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
        pts.map(function (p) { return '<tr><td>' + (P().bloques.length ? 'B' + p.b + '·' + p.w : p.w) + '</td><td>' + esc(p.set) + '</td><td>' + Math.round(p.e) + '</td><td>' + Math.round(p.vol) + '</td></tr>'; }).join('') +
        '</tbody></table></section>' : '') +
      '</main>' + nav('progreso');

    document.getElementById('ejsel').onchange = function (e) { location.hash = '#/progreso/' + e.target.value; };
  }

  function vistaPerfil() {
    var p = P(), def = DEF();
    var esFijo = MODO === 'personal' && !!PERFILES_PERSONALES[S.perfil];
    app.innerHTML =
      '<header class="top pad"><h1>Perfil</h1></header>' +
      '<main class="pad">' +
      '<section class="card form"><label class="campo">Nombre<input id="pf-nombre" maxlength="30" value="' + esc(p.nombre) + '"></label>' +
      '<div class="row between"><span>Unidad de peso</span><div class="seg"><button data-u="kg" class="' + (p.unidad === 'kg' ? 'on' : '') + '">kg</button><button data-u="lb" class="' + (p.unidad === 'lb' ? 'on' : '') + '">lb</button></div></div>' +
      '<p class="muted small">Cambiar la unidad sólo cambia la etiqueta; no convierte lo ya registrado.</p>' +
      '<label class="toggle"><input type="checkbox" id="pf-regla"' + (p.regla ? ' checked' : '') + '> Mostrar opción "Día de regla"</label></section>' +
      '<a class="card btn-row" href="#/rutina">Editar rutina <small class="muted">· ' + def.dias.length + ' días</small></a>' +
      '<button class="card btn-row" id="cambiar">Cambiar de perfil</button>' +
      '<section class="card"><p><b>Respaldo</b></p><p class="muted small">Los datos viven en este teléfono. Exporta un respaldo cada semana (por ejemplo, a Archivos o iCloud Drive).</p>' +
      '<button class="btn-sec" id="exp">Exportar respaldo (.json)</button>' +
      '<button class="btn-sec" id="csv">Exportar registro (.csv)</button>' +
      '<label class="btn-sec">Importar respaldo<input type="file" id="imp" accept=".json,application/json" hidden></label></section>' +
      '<section class="card"><p><b>Empezar un bloque nuevo</b></p><p class="muted small">Borra los registros del bloque actual de ' + esc(p.nombre) + ' y regresa a la semana 1 (los bloques archivados se conservan). Exporta antes.</p><button class="btn-danger" id="reset">Reiniciar bloque</button></section>' +
      (esFijo ? '' : '<section class="card"><p><b>Eliminar perfil</b></p><p class="muted small">Borra el perfil de ' + esc(p.nombre) + ', su rutina y todos sus registros de este teléfono. Exporta antes.</p><button class="btn-danger" id="borrar-perfil">Eliminar perfil</button></section>') +
      '</main>' + nav('perfil');

    app.querySelectorAll('.seg button').forEach(function (b) { b.onclick = function () { p.unidad = b.getAttribute('data-u'); guardar(); render(); }; });
    document.getElementById('pf-nombre').onchange = function (e) { var n = e.target.value.trim(); if (n) { p.nombre = n; guardar(); toast('Nombre actualizado'); } };
    document.getElementById('pf-regla').onchange = function (e) { p.regla = e.target.checked; guardar(); };
    var bp = document.getElementById('borrar-perfil');
    if (bp) bp.onclick = function () {
      confirmar('Se borran ' + p.nombre + ', su rutina y todos sus registros. No se puede deshacer.', 'Eliminar perfil', function () {
        delete S.perfiles[S.perfil]; S.perfil = null; guardar(); toast('Perfil eliminado'); location.hash = '#/'; render();
      });
    };
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
            S = normalizar(d); S.perfil = S.perfiles[perfilActual] ? perfilActual : null; guardar(); toast('Respaldo importado'); render();
          });
        } catch (err) { toast('Archivo no válido'); }
      };
      rd.readAsText(f);
    };
    document.getElementById('reset').onclick = function () {
      confirmar('Se borran los registros del bloque actual de ' + p.nombre + '.', 'Borrar y reiniciar', function () {
        p.logs = {}; p.semana = 1; p.alts = {}; guardar(); toast('Bloque reiniciado'); location.hash = '#/';
      });
    };
  }

  function csv() {
    var filas = [['perfil', 'bloque', 'semana', 'dia', 'fecha', 'ejercicio', 'serie', 'peso', 'unidad', 'reps', 'rir', 'hecha', 'energia', 'regla', 'nota']];
    var p = P();
    bloquesTodos().forEach(function (b) { DEF().dias.forEach(function (d) {
      for (var w = 1; w <= TOTAL_SEMANAS; w++) {
        var l = b.logs[claveLog(w, d.id)];
        if (!l) continue;
        d.ejercicios.forEach(function (e) {
          var r = l.ej[e.id];
          if (!r) return;
          r.sets.forEach(function (s, i) {
            filas.push([S.perfil, b.n, w, d.nombre, l.fecha ? l.fecha.slice(0, 10) : '', nombreEj(e), i + 1, s.w, p.unidad, s.r, s.rir, s.ok ? 1 : 0, l.energia || '', l.regla ? 1 : 0, i === 0 ? r.nota : '']);
          });
        });
      }
    }); });
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
    var h = location.hash.replace(/^#/, '') || '/';
    if (h === '/nuevo') { vistaNuevo(); return; }
    if (!S.perfil) { vistaSelector(); return; }
    var m;
    if (h === '/rutina') vistaRutina();
    else if ((m = /^\/dia\/(\w+)/.exec(h))) vistaDia(m[1]);
    else if ((m = /^\/progreso\/?(\w*)/.exec(h))) vistaProgreso(m[1]);
    else if (h === '/perfil') vistaPerfil();
    else vistaBloque();
  }

  window.addEventListener('hashchange', function () { render(); window.scrollTo(0, 0); });
  document.addEventListener('visibilitychange', function () { if (!document.hidden && timer.id) tick(); });
  render();

  if ('serviceWorker' in navigator && location.protocol === 'https:') {
    navigator.serviceWorker.register(MODO === 'publica' ? '../sw.js' : 'sw.js').catch(function () {});
  }
  // Pide almacenamiento persistente (evita que el navegador borre los datos).
  if (navigator.storage && navigator.storage.persist) navigator.storage.persist().catch(function () {});
})();
