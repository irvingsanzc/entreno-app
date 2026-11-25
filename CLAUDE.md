# Entreno — PWA de registro de entrenamiento

App web instalable (PWA) para registrar rutinas por bloques de 10 semanas. Inspirada en Efort. Sin dependencias ni paso de build: HTML, CSS y JavaScript plano.

Hay **dos versiones** con el mismo código (`app.js`, `data.js`, `styles.css`):

- **Personal** (`/`, `index.html`): perfiles fijos de Irving y Yulieth. Su rutina sale en vivo de `data.js`. Clave de datos `entreno.v1`.
- **Pública** (`/publica/`, `publica/index.html` define `window.ENTRENO_MODO = 'publica'`): arranca sin perfiles; cada persona crea el suyo, elige una plantilla o empieza vacía y edita su rutina en la app. Clave de datos `entreno.pub.v1`, así que nunca se mezcla con la personal. Es el link que se comparte.

Los datos viven sólo en el teléfono de cada persona (localStorage); no hay servidor ni cuentas.

## Archivos

- `index.html` / `publica/index.html`: contenedores; cargan `data.js` y luego `app.js`. `publica/` tiene su propio `manifest.webmanifest`.
- `data.js`:
  - `PERFILES_PERSONALES`: perfiles fijos de la versión personal (`irving`, `novia` → se muestra como **Yulieth**; la clave `novia` se conserva para no perder registros).
  - `PLANTILLAS` (`irving`, `yulieth`) → `dias` → `ejercicios`. Los perfiles personales las usan en vivo; en la pública se **copian** al crear el perfil.
  - `PERIODIZACION` (10 semanas).
  - Campos de un ejercicio: `id` (estable, nunca lo reutilices: los registros se guardan por id), `n` nombre, `t` tipo (`C` compuesto, `A` aislamiento, `K` core), `s` series base, `r` rango de reps (`"8-12"`), `d` descanso en segundos, `nota` técnica, `alt` alternativa, `prio` opcional (1 = +1 serie en semanas 4-9; 2 = +1 serie en semanas 7-9).
- `app.js`: estado, vistas y router por hash (`#/`, `#/dia/<diaId>`, `#/progreso/<ejId>`, `#/perfil`, `#/nuevo`, `#/rutina`).
- `styles.css`: tema oscuro tipo Efort (acento `#5aa6b4`).
- `sw.js`: service worker en la raíz (cubre también `/publica/`). Red primero, caché sin conexión. **Sube `VERSION` cada vez que cambies un archivo.**
- `manifest.webmanifest`, `icons/`: instalación en la pantalla de inicio.

## Perfiles y rutinas (en `app.js`)

- `DEF()` devuelve la rutina del perfil: `p.rutina` (copia propia) o `PLANTILLAS[p.plantilla]` (en vivo).
- El editor (`#/rutina`) llama a `rutinaPropia()` antes del primer cambio: copia la plantilla al perfil, y desde ahí ese perfil ya no recibe cambios de `data.js`.
- Ejercicios y días nuevos usan ids generados (`nuevoId('x')`, `nuevoId('d')`). Borrar un ejercicio o día no borra sus registros.
- Los perfiles fijos de la versión personal no se pueden eliminar desde la app.

## Reglas de negocio (en `app.js`)

- `seriesSemana(ej, semana)`: semana 1 = base − 1 (mín. 2); semanas 6 y 10 = mitad (redondeo hacia arriba); 4-5 = +1 si `prio === 1`; 7-9 = +1 si tiene `prio`.
- `rirObjetivo`: compuestos usan `rirC`, el resto `rirA` de `PERIODIZACION`.
- `sugerencia`: si en la semana anterior todas las series llegaron al tope del rango → "sube el peso"; si no → "mismo peso, busca +1 rep" (progresión doble).
- "Día de regla" (perfiles con `regla: true`, se activa en Perfil): marca el registro, añade "+1" al RIR mostrado y quita 1 serie sin reps por ejercicio.
- Columna ANTERIOR: la serie con el mismo índice en la semana previa más cercana con datos. Tocarla copia peso y reps.
- Autollenado (`autollenar`): al abrir una sesión no guardada, cada ejercicio toma los pesos de la última sesión con datos del mismo ejercicio y la misma variante (`reg.alt`), buscando en el bloque actual y luego en los archivados. Se detiene (`reg.auto = false`) en cuanto la persona escribe o marca algo.
- "Guardar sesión" marca `terminado`. "Duplicar bloque" aparece en la semana 10 cuando todos sus días están guardados: archiva `logs` en `bloques` y empieza la semana 1 del bloque siguiente (el autollenado trae los pesos de la semana 10 / prueba de reps).
- Marcar una serie como hecha la autocompleta con el placeholder (valor anterior) si estaba vacía e inicia el descanso del ejercicio.

## Datos

- `localStorage` (`entreno.v1` personal, `entreno.pub.v1` pública): `{ perfil, perfiles: { <id>: { nombre, color, unidad, regla, plantilla, rutina, semana, alts, logs, bloque, bloques } } }`.
- `logs["w<semana>-<diaId>"] = { fecha, terminado, energia, regla, ej: { <ejId>: { sets: [{ w, r, rir, ok }], nota, alt, auto } } }`.
- `bloque`: número del bloque actual. `bloques = [{ n, fin, logs }]`: bloques archivados (mismo formato de `logs`).
- `alts[ejId] = true` cuando el ejercicio se cambió a su alternativa.
- `normalizar()` completa los campos que falten (datos viejos o respaldos importados) con `perfilBase()`; así los respaldos anteriores siguen cargando.
- Respaldo: Perfil → Exportar (.json, todos los perfiles del teléfono) / Importar; CSV por perfil.
- Si cambias la forma del estado de forma incompatible, migra en `normalizar()` y sube la clave (`entreno.v2`).

## Probar en local

```bash
python3 -m http.server 8080   # personal: http://localhost:8080/   pública: http://localhost:8080/publica/
```
Para tener las dos con datos totalmente separados en el navegador, sirve la pública en otro puerto (`python3 -m http.server 8081` → http://localhost:8081/publica/). En el teléfono: `http://<IP-de-tu-PC>:8080`.
El service worker sólo se registra con HTTPS (en producción) — en local la app funciona igual sin él.

## Publicar

GitHub Pages (Settings → Pages → rama `main`, carpeta raíz) o Netlify Drop (arrastrar la carpeta en app.netlify.com/drop). Comparte `<URL>/publica/`; la raíz queda como la versión personal. En el iPhone: abrir la URL en Safari → Compartir → "Agregar a inicio".

## Ideas siguientes

- Sincronizar entre teléfonos o cuentas en la nube (Supabase).
- Compartir una rutina con otra persona (exportar/importar sólo la rutina).
- Gráfica de volumen semanal por grupo muscular.
- Notificación al terminar el descanso con la app en segundo plano (requiere Web Push).
