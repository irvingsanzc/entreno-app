// Datos de la rutina: bloque de 10 semanas, Upper/Lower, lunes a jueves.
// Tipos: C = compuesto, A = aislamiento, K = core.
// prio: 1 = +1 serie en semanas 4-9; 2 = +1 serie en semanas 7-9.
// tec: técnica avanzada (sólo última serie, semanas 3-5 y 7-9). ss: superserie ("6A"/"6B": descansa al terminar B).
// Basado en la investigación de evidencia (Pelland 2025, Refalo 2024, Maeo 2021/2023, Plotkin 2023, Kubo 2019, Singer 2024).

window.PERIODIZACION = [
  { semana: 1, fase: 'Reentrada', rirC: '3', rirA: '2-3', series: '1 menos por ejercicio (mín. 2)', nota: 'Cargas al ~85-90% de lo que movían antes de la pausa. Afinar técnica.' },
  { semana: 2, fase: 'Acumulación', rirC: '2', rirA: '1-2', series: 'Base', nota: 'Primer registro serio. Progresión doble activa.' },
  { semana: 3, fase: 'Acumulación', rirC: '2', rirA: '1', series: 'Base', nota: 'Sube peso donde llegaste al tope de reps en todas las series.' },
  { semana: 4, fase: 'Acumulación', rirC: '1-2', rirA: '0-1', series: '+1 en prioritario', nota: 'Ejercicio prioritario con una serie extra.' },
  { semana: 5, fase: 'Intensificación', rirC: '1', rirA: '0-1', series: '+1 en prioritario', nota: 'Última serie de aislamientos al fallo técnico. Nunca al fallo en sentadilla, peso muerto ni banca.' },
  { semana: 6, fase: 'Descarga', rirC: '3-4', rirA: '3', series: 'Mitad, mismo peso', nota: 'Recuperar fatiga. Ideal en semana de exámenes.' },
  { semana: 7, fase: 'Bloque 2 · Acumulación', rirC: '2', rirA: '1', series: '+1 en 2 prioritarios', nota: 'Puedes cambiar a la alternativa los ejercicios estancados.' },
  { semana: 8, fase: 'Acumulación', rirC: '1-2', rirA: '0-1', series: '+1 en 2 prioritarios', nota: 'Misma técnica que en la semana 1 para que el progreso sea real.' },
  { semana: 9, fase: 'Intensificación', rirC: '1', rirA: '0', series: '+1 en 2 prioritarios', nota: 'Última serie de aislamientos al fallo. Semana más dura.' },
  { semana: 10, fase: 'Descarga + prueba', rirC: '3', rirA: '2-3', series: 'Mitad', nota: 'Jueves: prueba de reps (RIR 1) en básicos para recalcular el siguiente bloque.' }
];

// Perfiles fijos de la versión personal (raíz). La clave `novia` se conserva
// para no perder los registros que ya existen en el teléfono.
window.PERFILES_PERSONALES = {
  irving: { nombre: 'Irving', color: '#5aa6b4', unidad: 'kg', plantilla: 'irving', regla: false },
  novia: { nombre: 'Yulieth', color: '#d07aa8', unidad: 'lb', plantilla: 'yulieth', regla: true }
};

// Plantillas de rutina. Los perfiles personales las usan en vivo (editar aquí cambia su rutina);
// en la versión pública se copian al crear un perfil y cada persona puede editarlas.
window.PLANTILLAS = {
  irving: {
    nombre: "Upper/Lower · forma de V",
    desc: "4 días: Torso A, Pierna A, Torso B, Pierna B (deltoide lateral 3×/sem)",
    dias: [
      {
        id: "u1", nombre: "Torso A", dia: "Lunes",
        ejercicios: [
          { id: "i22", n: "Jalón al pecho agarre neutro", t: "C", s: 3, r: "8-12", d: 150, nota: "Estira por completo arriba, pecho alto, codos hacia la cadera. Prioridad V.", alt: "Dominadas", prio: 1 },
          { id: "i23", n: "Press inclinado con mancuernas (30°)", t: "C", s: 3, r: "6-10", d: 180, nota: "Baja hasta estiramiento profundo del pecho.", alt: "Press inclinado en Smith" },
          { id: "i24", n: "Remo T", t: "C", s: 3, r: "8-12", d: 150, nota: "Con apoyo de pecho si lo tiene. Codos a ~45°, estira al bajar.", alt: "Remo en máquina / con mancuerna" },
          { id: "i51", n: "Peck deck", t: "A", s: 2, r: "10-15", d: 90, nota: "Pausa 1 s abierto (estiramiento).", alt: "Aperturas en polea", tec: "Parciales alargadas al fallo (última serie)" },
          { id: "i16", n: "Elevación lateral en polea", t: "A", s: 4, r: "10-15", d: 90, nota: "Polea baja, cable por detrás del cuerpo. Prioridad V.", alt: "Elevación lateral con mancuernas", tec: "Myo-reps (última serie)", prio: 2 },
          { id: "i26", n: "Curl inclinado con mancuernas", t: "A", s: 3, r: "8-12", d: 0, nota: "Banco 45-60°, brazos por detrás del torso (hombro extendido). Superserie antagonista: haz A y sin descanso B; descansa al terminar B.", alt: "Curl bayesiano en polea", ss: "6A" },
          { id: "i27", n: "Extensión de tríceps sobre la cabeza en polea", t: "A", s: 3, r: "8-12", d: 90, nota: "Cabeza larga estirada (+19,9% vs pushdown, Maeo 2023). Superserie antagonista: haz A y sin descanso B; descansa al terminar B.", alt: "Extensión sobre la cabeza con mancuerna", ss: "6B" },
          { id: "i52", n: "Cruce inverso en polea (pájaro en cable)", t: "A", s: 2, r: "12-20", d: 60, nota: "Sustituye a la máquina de pájaros. Brazos casi rectos, tensión todo el arco.", alt: "Face pull" }
        ]
      },
      {
        id: "l1", nombre: "Pierna A", dia: "Martes",
        ejercicios: [
          { id: "i53", n: "Hack squat profundo", t: "C", s: 3, r: "6-10", d: 180, nota: "Profundidad máxima con control. Antes: 2-3 series de aproximación.", alt: "Sentadilla libre con barra" },
          { id: "i31", n: "Peso muerto rumano con barra", t: "C", s: 3, r: "6-10", d: 180, nota: "Pausa 1 s abajo, sin rebote. No al fallo (RIR 2).", alt: "RDL en Smith" },
          { id: "i13", n: "Curl femoral sentado", t: "A", s: 3, r: "10-12", d: 90, nota: "Torso inclinado al frente para estirar más el isquio (+14% vs acostado, Maeo 2021).", alt: "Curl femoral acostado" },
          { id: "i14", n: "Extensión de cuádriceps", t: "A", s: 2, r: "10-15", d: 90, nota: "Respaldo reclinado: recto femoral más estirado.", alt: "Sissy squat asistido", tec: "Parciales alargadas al fallo (última serie)" },
          { id: "i54", n: "Pantorrilla de pie", t: "A", s: 3, r: "8-12", d: 90, nota: "Rodilla extendida (gemelo). Pausa 2 s abajo en estiramiento.", alt: "Pantorrilla de pie en Smith", tec: "Parciales alargadas al fallo (última serie)" },
          { id: "i17", n: "Crunch en polea", t: "K", s: 3, r: "10-15", d: 60, nota: "Flexiona la columna (costillas a la pelvis), no la cadera.", alt: "Crunch en máquina" }
        ]
      },
      {
        id: "u2", nombre: "Torso B", dia: "Miércoles",
        ejercicios: [
          { id: "i42", n: "Dominadas", t: "C", s: 3, r: "6-10", d: 180, nota: "Cuelga completo abajo. Con lastre si haces más de 12.", alt: "Jalón pesado agarre neutro", prio: 2 },
          { id: "i21", n: "Press banca con barra", t: "C", s: 3, r: "6-10", d: 180, nota: "Escápulas retraídas, toque controlado al pecho.", alt: "Press de pecho en máquina" },
          { id: "i44", n: "Remo unilateral en polea baja", t: "C", s: 3, r: "10-12", d: 120, nota: "Deja que el hombro se vaya al frente para estirar el dorsal.", alt: "Remo con mancuerna" },
          { id: "i55", n: "Press inclinado en máquina o Smith (30°)", t: "C", s: 2, r: "8-12", d: 120, nota: "Segunda dosis de pecho superior; no más de 5 series/semana.", alt: "Press inclinado con mancuernas" },
          { id: "i25", n: "Elevación lateral con mancuernas", t: "A", s: 4, r: "12-20", d: 90, nota: "Ligera inclinación al frente, sin impulso. Prioridad V.", alt: "Elevación lateral en polea", tec: "Drop set (última serie)", prio: 1 },
          { id: "i56", n: "Pájaro con mancuernas, pecho apoyado en banco inclinado", t: "A", s: 2, r: "12-20", d: 60, nota: "Sustituye a la máquina de pájaros.", alt: "Cruce inverso en polea" },
          { id: "i57", n: "Curl bayesiano en polea", t: "A", s: 3, r: "10-15", d: 0, nota: "De espaldas a la polea, brazo por detrás del torso. Superserie antagonista: haz A y sin descanso B; descansa al terminar B.", alt: "Curl inclinado con mancuernas", ss: "7A" },
          { id: "i58", n: "Press francés con barra EZ (detrás de la cabeza)", t: "A", s: 3, r: "10-15", d: 90, nota: "Baja la barra detrás de la cabeza para estirar la cabeza larga. Superserie antagonista: haz A y sin descanso B; descansa al terminar B.", alt: "Extensión sobre la cabeza en polea", ss: "7B" }
        ]
      },
      {
        id: "l2", nombre: "Pierna B", dia: "Jueves",
        ejercicios: [
          { id: "i32", n: "Prensa de pierna profunda", t: "C", s: 3, r: "8-12", d: 150, nota: "Lo más profundo posible sin despegar la pelvis.", alt: "Hack squat" },
          { id: "i59", n: "Hip thrust con barra", t: "C", s: 3, r: "8-12", d: 120, nota: "Mentón abajo, tibias verticales arriba, pausa 1 s.", alt: "Hip thrust en máquina / Smith" },
          { id: "i33", n: "Sentadilla búlgara", t: "C", s: 2, r: "8-12", d: 90, nota: "Por pierna.", alt: "Zancadas caminando" },
          { id: "i60", n: "Curl femoral sentado", t: "A", s: 3, r: "8-12", d: 90, nota: "Torso inclinado al frente.", alt: "Curl femoral acostado", tec: "Parciales alargadas al fallo (última serie)" },
          { id: "i61", n: "Aductores en máquina", t: "A", s: 2, r: "12-15", d: 60, nota: "Abre hasta el estiramiento máximo controlado.", alt: "Sentadilla sumo con mancuerna" },
          { id: "i15", n: "Pantorrilla en prensa", t: "A", s: 3, r: "10-15", d: 60, nota: "Rodilla extendida. Pausa 2 s abajo.", alt: "Pantorrilla de pie" },
          { id: "i45", n: "Elevación lateral en polea", t: "A", s: 2, r: "12-20", d: 60, nota: "Tercera exposición de deltoide lateral (V).", alt: "Elevación lateral con mancuernas" },
          { id: "i62", n: "Elevación de piernas colgado", t: "K", s: 2, r: "10-15", d: 60, nota: "Retroversión de pelvis arriba, sin balanceo.", alt: "Elevación de rodillas en paralelas" }
        ]
      }
    ]
  },
  yulieth: {
    nombre: "Upper/Lower · énfasis en glúteo",
    desc: "4 días: Torso A, Pierna A, Torso B, Pierna B (glúteo 3-4×/sem)",
    dias: [
      {
        id: "u1", nombre: "Torso A", dia: "Lunes",
        ejercicios: [
          { id: "n21", n: "Jalón al pecho agarre neutro", t: "C", s: 3, r: "8-12", d: 120, nota: "Espalda ancha = cintura que se ve más estrecha.", alt: "Dominada asistida" },
          { id: "n24", n: "Press inclinado con mancuernas (30°)", t: "C", s: 3, r: "8-12", d: 120, nota: "Baja hasta estirar el pecho.", alt: "Press inclinado en máquina" },
          { id: "n42", n: "Remo T", t: "C", s: 3, r: "8-12", d: 120, nota: "Con apoyo de pecho si lo tiene.", alt: "Remo con mancuerna" },
          { id: "n43", n: "Elevación lateral en polea", t: "A", s: 3, r: "12-15", d: 60, nota: "Cable por detrás del cuerpo.", alt: "Elevación lateral con mancuernas" },
          { id: "n51", n: "Curl inclinado con mancuernas", t: "A", s: 2, r: "10-15", d: 0, nota: "Brazos por detrás del torso. Superserie antagonista: haz A y sin descanso B; descansa al terminar B.", alt: "Curl en polea", ss: "5A" },
          { id: "n52", n: "Extensión de tríceps sobre la cabeza en polea", t: "A", s: 2, r: "10-15", d: 60, nota: "Cabeza larga estirada. Superserie antagonista: haz A y sin descanso B; descansa al terminar B.", alt: "Extensión sobre la cabeza con mancuerna", ss: "5B" },
          { id: "n53", n: "Abductor inclinada al frente", t: "A", s: 2, r: "15-25", d: 60, nota: "Exposición extra de glúteo medio/superior.", alt: "Abducción en polea de pie" }
        ]
      },
      {
        id: "l1", nombre: "Pierna A · Glúteo", dia: "Martes",
        ejercicios: [
          { id: "n11", n: "Hip thrust con barra", t: "C", s: 4, r: "8-12", d: 150, nota: "Mentón abajo, tibias verticales arriba, pausa 1 s apretando sin arquear la lumbar.", alt: "Hip thrust en Smith / máquina", prio: 1 },
          { id: "n31", n: "Hack squat profundo (pies medios-altos)", t: "C", s: 3, r: "8-12", d: 150, nota: "Profundidad completa = más glúteo y aductor (Kubo 2019).", alt: "Sentadilla en Smith / goblet" },
          { id: "n13", n: "Peso muerto rumano", t: "C", s: 3, r: "8-12", d: 150, nota: "Pausa 1 s abajo; columna neutra. RIR 2.", alt: "RDL con mancuernas" },
          { id: "n14", n: "Curl femoral sentado", t: "A", s: 3, r: "10-15", d: 90, nota: "Torso inclinado al frente.", alt: "Curl femoral acostado", tec: "Parciales alargadas al fallo (última serie)" },
          { id: "n15", n: "Abductor inclinada al frente", t: "A", s: 3, r: "15-20", d: 60, nota: "Glúteo medio/superior.", alt: "Abducción en polea de pie", tec: "Myo-reps (última serie)" },
          { id: "n54", n: "Pantorrilla de pie", t: "A", s: 2, r: "10-15", d: 60, nota: "Pausa 2 s abajo en estiramiento.", alt: "Pantorrilla en prensa", tec: "Parciales alargadas al fallo (última serie)" }
        ]
      },
      {
        id: "u2", nombre: "Torso B", dia: "Miércoles",
        ejercicios: [
          { id: "n23", n: "Remo unilateral en polea baja", t: "C", s: 3, r: "10-12", d: 120, nota: "Deja que el hombro se vaya al frente.", alt: "Remo en polea sentada" },
          { id: "n44", n: "Press de pecho en máquina", t: "C", s: 3, r: "8-12", d: 120, nota: "Mantenimiento.", alt: "Lagartijas con peso" },
          { id: "n22", n: "Press militar con mancuernas sentada", t: "C", s: 2, r: "8-12", d: 120, nota: "Baja a la altura de las orejas.", alt: "Press en máquina" },
          { id: "n55", n: "Cruce inverso en polea (pájaro en cable)", t: "A", s: 2, r: "12-20", d: 60, nota: "Sustituye a la máquina de pájaros.", alt: "Face pull" },
          { id: "n56", n: "Curl bayesiano en polea", t: "A", s: 2, r: "10-15", d: 0, nota: "Superserie antagonista: haz A y sin descanso B; descansa al terminar B.", alt: "Curl con mancuernas", ss: "5A" },
          { id: "n57", n: "Press francés con barra EZ", t: "A", s: 2, r: "10-15", d: 60, nota: "Superserie antagonista: haz A y sin descanso B; descansa al terminar B.", alt: "Pushdown con cuerda", ss: "5B" },
          { id: "n58", n: "Hip thrust en máquina o Smith", t: "A", s: 2, r: "12-15", d: 90, nota: "Tercera exposición de glúteo; ligero-moderado.", alt: "Hip thrust unilateral" }
        ]
      },
      {
        id: "l2", nombre: "Pierna B · Glúteo/cuádriceps", dia: "Jueves",
        ejercicios: [
          { id: "n12", n: "Sentadilla búlgara (glúteo)", t: "C", s: 3, r: "8-12", d: 90, nota: "Por pierna. Paso largo, torso inclinado ~30°, baja profundo.", alt: "Zancada reversa en Smith", prio: 2 },
          { id: "n33", n: "Prensa pies altos y abiertos (profunda)", t: "C", s: 3, r: "10-15", d: 120, nota: "Más flexión de cadera = más glúteo y aductor.", alt: "Sentadilla sumo con mancuerna" },
          { id: "n32", n: "Pull-through en polea", t: "C", s: 3, r: "12-15", d: 90, nota: "Sustituye a la hiperextensión 45°. Cadera atrás hasta estirar el glúteo y aprieta arriba.", alt: "RDL B-stance con mancuerna" },
          { id: "n59", n: "Curl femoral sentado", t: "A", s: 3, r: "10-15", d: 90, nota: "Torso inclinado al frente.", alt: "Curl femoral acostado" },
          { id: "n34", n: "Extensión de cuádriceps", t: "A", s: 2, r: "12-15", d: 60, nota: "Respaldo reclinado.", alt: "Sissy squat asistido", tec: "Parciales alargadas al fallo (última serie)" },
          { id: "n60", n: "Aductores en máquina", t: "A", s: 2, r: "12-20", d: 60, nota: "Estiramiento máximo controlado.", alt: "Sentadilla sumo con mancuerna" },
          { id: "n36", n: "Abductor sentada erguida", t: "A", s: 2, r: "15-25", d: 60, nota: "Glúteo medio.", alt: "Abducción en polea de pie", tec: "Drop set (última serie)" },
          { id: "n61", n: "Pantorrilla de pie", t: "A", s: 2, r: "10-15", d: 60, nota: "Pausa 2 s abajo.", alt: "Pantorrilla en prensa" }
        ]
      }
    ]
  }
};
