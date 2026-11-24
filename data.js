// Datos de la rutina: bloque de 10 semanas, Upper/Lower, lunes a jueves.
// Tipos: C = compuesto, A = aislamiento, K = core.
// prio: 1 = +1 serie en semanas 4-9; 2 = +1 serie en semanas 7-9.

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

window.PERFILES = {
  irving: {
    nombre: 'Irving',
    color: '#5aa6b4',
    unidad: 'kg',
    dias: [
      {
        id: 'd1', nombre: 'Pierna A', dia: 'Lunes',
        ejercicios: [
          { id: 'i11', n: 'Sentadilla libre con barra', t: 'C', s: 3, r: '6-8', d: 180, nota: 'Profundidad completa (cadera bajo la rodilla si tu movilidad lo permite). Antes: 2 series de aproximación (50% y 75%). Semana 1 con ~85 kg.', alt: 'Hack squat' },
          { id: 'i12', n: 'Peso muerto rumano en Smith', t: 'C', s: 3, r: '8-10', d: 150, nota: 'Cadera atrás hasta el máximo estiramiento de isquios con la columna neutra.', alt: 'RDL con barra o mancuernas' },
          { id: 'i13', n: 'Curl femoral sentado', t: 'A', s: 3, r: '10-12', d: 90, nota: 'Torso inclinado al frente para estirar más el isquio; 2 s en la bajada.', alt: 'Curl femoral acostado' },
          { id: 'i14', n: 'Extensión de cuádriceps', t: 'A', s: 3, r: '12-15', d: 90, nota: 'Respaldo reclinado: recto femoral más estirado.', alt: 'Sissy squat asistido' },
          { id: 'i15', n: 'Pantorrilla de pie', t: 'A', s: 3, r: '10-15', d: 90, nota: 'Pausa de 2 s abajo, en estiramiento total.', alt: 'Pantorrilla en prensa' },
          { id: 'i16', n: 'Elevación lateral en polea', t: 'A', s: 3, r: '12-20', d: 60, nota: 'Polea a la altura de la cadera, cable por detrás del cuerpo.', alt: 'Elevación lateral con mancuernas' },
          { id: 'i17', n: 'Crunch en polea', t: 'K', s: 3, r: '10-15', d: 60, nota: 'Flexiona la columna (costillas a la pelvis), no la cadera.', alt: 'Crunch en máquina' }
        ]
      },
      {
        id: 'd2', nombre: 'Torso A', dia: 'Martes',
        ejercicios: [
          { id: 'i21', n: 'Press banca con barra', t: 'C', s: 3, r: '6-8', d: 180, nota: 'Escápulas retraídas, toque controlado al pecho. Semana 1 con ~72.5 kg.', alt: 'Press de pecho en máquina' },
          { id: 'i22', n: 'Jalón al pecho agarre medio', t: 'C', s: 3, r: '8-10', d: 120, nota: 'Estira por completo arriba, codos hacia la cadera.', alt: 'Dominadas', prio: 2 },
          { id: 'i23', n: 'Press inclinado con mancuernas (30°)', t: 'C', s: 3, r: '8-12', d: 120, nota: 'Baja hasta sentir el pecho estirado.', alt: 'Press inclinado en Smith' },
          { id: 'i24', n: 'Remo T', t: 'C', s: 3, r: '8-12', d: 120, nota: 'Con apoyo de pecho si lo tiene. Codos a ~45°, estira al bajar.', alt: 'Remo en máquina / con mancuerna' },
          { id: 'i25', n: 'Elevación lateral con mancuernas', t: 'A', s: 3, r: '12-20', d: 60, nota: 'Ligera inclinación al frente, sin impulso.', alt: 'Elevación lateral en máquina', prio: 1 },
          { id: 'i26', n: 'Curl inclinado con mancuernas', t: 'A', s: 3, r: '10-12', d: 90, nota: 'Banco a 45-60°, brazos por detrás del torso (estiramiento).', alt: 'Curl bayesiano en polea' },
          { id: 'i27', n: 'Extensión de tríceps sobre la cabeza en polea', t: 'A', s: 3, r: '10-12', d: 90, nota: 'Cabeza larga estirada: ~40% más crecimiento del tríceps que en neutro.', alt: 'Extensión sobre la cabeza con mancuerna' },
          { id: 'i28', n: 'Pájaros en peck deck', t: 'A', s: 2, r: '15-20', d: 60, nota: 'De frente al respaldo, agarre neutro, brazos casi rectos.', alt: 'Face pull' }
        ]
      },
      {
        id: 'd3', nombre: 'Pierna B', dia: 'Miércoles',
        ejercicios: [
          { id: 'i31', n: 'Peso muerto rumano con barra', t: 'C', s: 3, r: '6-8', d: 180, nota: 'Semana 1 conservador (~70 kg) y sube cada semana; no al fallo.', alt: 'Peso muerto convencional' },
          { id: 'i32', n: 'Prensa de pierna', t: 'C', s: 3, r: '8-12', d: 150, nota: 'Lo más profundo posible sin despegar la pelvis.', alt: 'Hack squat' },
          { id: 'i33', n: 'Sentadilla búlgara', t: 'C', s: 2, r: '8-12', d: 120, nota: 'Por pierna. Torso erguido para más cuádriceps.', alt: 'Zancadas caminando' },
          { id: 'i34', n: 'Curl femoral acostado', t: 'A', s: 3, r: '10-12', d: 90, nota: 'Otra posición distinta a la del lunes.', alt: 'Curl femoral sentado unilateral' },
          { id: 'i35', n: 'Extensión de cuádriceps', t: 'A', s: 2, r: '12-15', d: 90, nota: 'Última serie al fallo en semanas 4-5 y 8-9.', alt: 'Sissy squat asistido' },
          { id: 'i36', n: 'Pantorrilla sentado', t: 'A', s: 3, r: '12-20', d: 60, nota: 'Rodilla flexionada (sóleo). Pausa abajo.', alt: 'Pantorrilla en prensa' },
          { id: 'i37', n: 'Elevación lateral en polea', t: 'A', s: 3, r: '12-20', d: 60, nota: 'Puedes alternar con la versión unilateral.', alt: 'Elevación lateral en máquina' },
          { id: 'i38', n: 'Rueda abdominal', t: 'K', s: 3, r: '8-12', d: 60, nota: 'Pelvis en retroversión, que la lumbar no se arquee.', alt: 'Plancha con peso / dead bug' }
        ]
      },
      {
        id: 'd4', nombre: 'Torso B', dia: 'Jueves',
        ejercicios: [
          { id: 'i41', n: 'Press militar con mancuernas sentado', t: 'C', s: 3, r: '6-10', d: 150, nota: 'Baja hasta la altura de las orejas.', alt: 'Press militar en máquina / Smith' },
          { id: 'i42', n: 'Dominadas', t: 'C', s: 3, r: '6-10', d: 150, nota: 'Cuelga completo abajo. Con lastre si haces más de 10.', alt: 'Jalón con agarre neutro' },
          { id: 'i43', n: 'Press de pecho en máquina o fondos', t: 'C', s: 3, r: '8-12', d: 120, nota: 'En fondos inclina el torso y baja sin dolor.', alt: 'Press plano con mancuernas' },
          { id: 'i44', n: 'Remo unilateral en polea o mancuerna', t: 'C', s: 3, r: '10-12', d: 90, nota: 'Deja que el hombro se vaya al frente para estirar el dorsal.', alt: 'Remo en máquina unilateral' },
          { id: 'i45', n: 'Elevación lateral en polea', t: 'A', s: 3, r: '12-20', d: 60, nota: 'Cuarta frecuencia de deltoides lateral.', alt: 'Elevación lateral en máquina', prio: 1 },
          { id: 'i46', n: 'Pullover en polea', t: 'A', s: 2, r: '12-15', d: 60, nota: 'Dorsal aislado y en estiramiento.', alt: 'Pullover con mancuerna' },
          { id: 'i47', n: 'Curl en banco predicador', t: 'A', s: 2, r: '10-12', d: 90, nota: 'Énfasis en la parte baja (codo casi extendido).', alt: 'Curl en polea' },
          { id: 'i48', n: 'Pushdown con cuerda', t: 'A', s: 2, r: '12-15', d: 60, nota: 'Cabezas lateral y medial.', alt: 'Pushdown con barra' },
          { id: 'i49', n: 'Face pull', t: 'A', s: 2, r: '15-20', d: 60, nota: 'Rotación externa al final.', alt: 'Pájaros en peck deck' }
        ]
      }
    ]
  },
  novia: {
    nombre: 'Novia',
    color: '#d07aa8',
    unidad: 'lb',
    dias: [
      {
        id: 'd1', nombre: 'Pierna A · Glúteo', dia: 'Lunes',
        ejercicios: [
          { id: 'n11', n: 'Hip thrust en Smith', t: 'C', s: 4, r: '8-12', d: 150, nota: 'Mentón abajo, tibias verticales arriba, pausa 1 s apretando sin arquear la lumbar.', alt: 'Hip thrust con barra / máquina', prio: 1 },
          { id: 'n12', n: 'Sentadilla búlgara (glúteo)', t: 'C', s: 3, r: '8-12', d: 120, nota: 'Por pierna. Paso largo, torso inclinado ~30°, baja profundo.', alt: 'Zancada reversa en Smith' },
          { id: 'n13', n: 'Peso muerto rumano en Smith', t: 'C', s: 3, r: '8-10', d: 120, nota: 'Cadera atrás hasta estirar isquios y glúteo; columna neutra.', alt: 'RDL con mancuernas' },
          { id: 'n14', n: 'Curl femoral sentado', t: 'A', s: 3, r: '10-12', d: 90, nota: 'Torso inclinado al frente.', alt: 'Curl femoral acostado' },
          { id: 'n15', n: 'Abductor inclinada al frente', t: 'A', s: 3, r: '15-20', d: 60, nota: 'Enfatiza glúteo medio/superior (zona de hip dips).', alt: 'Abducción en polea de pie', prio: 2 },
          { id: 'n16', n: 'Pallof press', t: 'K', s: 3, r: '10-12', d: 60, nota: 'Por lado. Anti-rotación: el torso no gira.', alt: 'Pallof con liga' }
        ]
      },
      {
        id: 'd2', nombre: 'Torso A', dia: 'Martes',
        ejercicios: [
          { id: 'n21', n: 'Jalón al pecho agarre medio', t: 'C', s: 3, r: '8-12', d: 120, nota: 'Espalda ancha = cintura que se ve más estrecha.', alt: 'Dominada asistida' },
          { id: 'n22', n: 'Press militar con mancuernas sentada', t: 'C', s: 3, r: '8-12', d: 120, nota: 'Sube a 25 lb cuando hagas 3×12 con 20 lb.', alt: 'Press en máquina' },
          { id: 'n23', n: 'Remo en polea sentada', t: 'C', s: 3, r: '10-12', d: 90, nota: 'Estira al frente, codos atrás pegados al cuerpo.', alt: 'Remo en máquina' },
          { id: 'n24', n: 'Press inclinado con mancuernas', t: 'C', s: 2, r: '8-12', d: 90, nota: 'Mantenimiento de pecho y tríceps.', alt: 'Press inclinado en máquina' },
          { id: 'n25', n: 'Elevación lateral con mancuernas', t: 'A', s: 3, r: '12-20', d: 60, nota: 'Hombros más anchos hacen ver la cintura más estrecha.', alt: 'Elevación lateral en polea' },
          { id: 'n26', n: 'Pushdown con cuerda', t: 'A', s: 2, r: '12-15', d: 60, nota: 'Codos pegados, rango sin dolor. Si molesta el hombro, usa la alternativa.', alt: 'Patada de tríceps en polea' },
          { id: 'n27', n: 'Curl con mancuernas', t: 'A', s: 2, r: '10-12', d: 60, nota: 'Mantenimiento.', alt: 'Curl en polea' },
          { id: 'n28', n: 'Patada de glúteo en polea', t: 'A', s: 3, r: '12-15', d: 60, nota: 'Por pierna. Extiende la cadera sin arquear la lumbar.', alt: 'Patada en máquina' }
        ]
      },
      {
        id: 'd3', nombre: 'Pierna B · Cuádriceps', dia: 'Miércoles',
        ejercicios: [
          { id: 'n31', n: 'Sentadilla hack', t: 'C', s: 3, r: '8-10', d: 150, nota: 'Pies un poco adelante, profundidad completa.', alt: 'Sentadilla en Smith / goblet' },
          { id: 'n32', n: 'Pull-through en polea', t: 'C', s: 3, r: '12-15', d: 90, nota: 'De espaldas a la polea baja: cadera atrás hasta estirar el glúteo y extiende apretando arriba.', alt: 'RDL unilateral con mancuerna' },
          { id: 'n33', n: 'Prensa pies altos y abiertos', t: 'C', s: 3, r: '10-12', d: 120, nota: 'Más flexión de cadera = más glúteo y aductor.', alt: 'Sentadilla sumo con mancuerna' },
          { id: 'n34', n: 'Extensión de cuádriceps', t: 'A', s: 3, r: '12-15', d: 90, nota: 'Respaldo reclinado. Forma del muslo visto de lado.', alt: 'Sissy squat asistido' },
          { id: 'n35', n: 'Curl femoral acostado', t: 'A', s: 3, r: '10-12', d: 90, nota: 'Otra posición distinta a la del lunes.', alt: 'Curl femoral sentado unilateral' },
          { id: 'n36', n: 'Abductor sentada erguida', t: 'A', s: 3, r: '15-20', d: 60, nota: 'Última serie al fallo en semanas 4-5 y 8-9.', alt: 'Abducción en polea de pie' },
          { id: 'n37', n: 'Dead bug con peso', t: 'K', s: 3, r: '8-12', d: 60, nota: 'Por lado. Lumbar pegada al piso todo el tiempo.', alt: 'Rueda abdominal' }
        ]
      },
      {
        id: 'd4', nombre: 'Torso B', dia: 'Jueves',
        ejercicios: [
          { id: 'n41', n: 'Jalón agarre neutro / dominada asistida', t: 'C', s: 3, r: '8-12', d: 120, nota: 'Cuelga completo arriba.', alt: 'Jalón unilateral en polea' },
          { id: 'n42', n: 'Remo T', t: 'C', s: 3, r: '10-12', d: 90, nota: 'Con apoyo de pecho si lo tiene.', alt: 'Remo con mancuerna' },
          { id: 'n43', n: 'Elevación lateral en polea', t: 'A', s: 3, r: '12-20', d: 60, nota: 'Cable por detrás del cuerpo.', alt: 'Elevación lateral en máquina' },
          { id: 'n44', n: 'Press de pecho en máquina', t: 'C', s: 2, r: '10-12', d: 90, nota: 'Mantenimiento.', alt: 'Lagartijas con peso' },
          { id: 'n45', n: 'Face pull', t: 'A', s: 2, r: '15-20', d: 60, nota: 'Salud del hombro.', alt: 'Pájaros en peck deck' },
          { id: 'n46', n: 'Hip thrust unilateral / patada en máquina', t: 'A', s: 3, r: '12-15', d: 60, nota: 'Por pierna. Cuarta frecuencia de glúteo.', alt: 'Patada de glúteo en polea' },
          { id: 'n47', n: 'Suitcase carry', t: 'K', s: 3, r: '30 m', d: 60, nota: 'Por lado. Camina erguida sin inclinarte.', alt: 'Plancha lateral' }
        ]
      }
    ]
  }
};
