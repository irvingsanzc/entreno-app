# Entreno — PWA de registro de entrenamiento

App web instalable (PWA) para registrar la rutina Upper/Lower de Irving y su novia en un solo teléfono, con dos perfiles. Inspirada en Efort. Sin dependencias ni paso de build: HTML, CSS y JavaScript plano.

## Archivos

- `index.html`: contenedor; carga `data.js` y luego `app.js`.
- `data.js`: **la rutina**. `PERFILES` (irving, novia) → `dias` → `ejercicios`, y `PERIODIZACION` (10 semanas). Para cambiar ejercicios, series, reps o descansos, edita sólo este archivo.
  - Campos de un ejercicio: `id` (estable, nunca lo reutilices: los registros se guardan por id), `n` nombre, `t` tipo (`C` compuesto, `A` aislamiento, `K` core), `s` series base, `r` rango de reps (`"8-12"`), `d` descanso en segundos, `nota` técnica, `alt` alternativa, `prio` opcional (1 = +1 serie en semanas 4-9; 2 = +1 serie en semanas 7-9).
- `app.js`: estado, vistas y router por hash (`#/`, `#/dia/d1`, `#/progreso/<ejId>`, `#/perfil`).
- `styles.css`: tema oscuro tipo Efort (acento `#5aa6b4`).
- `sw.js`: service worker (red primero, caché sin conexión). **Sube `VERSION` cada vez que cambies un archivo.**
- `manifest.webmanifest`, `icons/`: instalación en la pantalla de inicio.

## Reglas de negocio (en `app.js`)

- `seriesSemana(ej, semana)`: semana 1 = base − 1 (mín. 2); semanas 6 y 10 = mitad (redondeo hacia arriba); 4-5 = +1 si `prio === 1`; 7-9 = +1 si tiene `prio`.
- `rirObjetivo`: compuestos usan `rirC`, el resto `rirA` de `PERIODIZACION`.
- `sugerencia`: si en la semana anterior todas las series llegaron al tope del rango → "sube el peso"; si no → "mismo peso, busca +1 rep" (progresión doble).
- "Día de regla" (sólo perfil novia): marca el registro, añade "+1" al RIR mostrado y quita 1 serie vacía por ejercicio.
- Columna ANTERIOR: la serie con el mismo índice en la semana previa más cercana con datos. Tocarla copia peso y reps.
- Marcar una serie como hecha la autocompleta con el placeholder (valor anterior) si estaba vacía e inicia el descanso del ejercicio.

## Datos

- `localStorage`, clave `entreno.v1`: `{ perfil, perfiles: { irving|novia: { unidad, semana, alts, logs } } }`.
- `logs["w<semana>-<diaId>"] = { fecha, terminado, energia, regla, ej: { <ejId>: { sets: [{ w, r, rir, ok }], nota } } }`.
- `alts[ejId] = true` cuando el ejercicio se cambió a su alternativa.
- Respaldo: Perfil → Exportar (.json, ambos perfiles) / Importar; CSV por perfil.
- Si cambias la forma del estado, migra en `cargar()` y sube la clave (`entreno.v2`).

## Probar en local

```bash
python3 -m http.server 8000   # abre http://localhost:8000 (en el teléfono: http://<IP-de-tu-PC>:8000)
```
El service worker sólo se registra con HTTPS (en producción) — en local la app funciona igual sin él.

## Publicar

GitHub Pages (Settings → Pages → rama `main`, carpeta raíz) o Netlify Drop (arrastrar la carpeta en app.netlify.com/drop). En el iPhone: abrir la URL en Safari → Compartir → "Agregar a inicio".

## Ideas siguientes

- Sincronizar entre dos teléfonos (Supabase) si dejan de compartir uno.
- Gráfica de volumen semanal por grupo muscular.
- Notificación al terminar el descanso con la app en segundo plano (requiere Web Push).
- Duplicar el bloque al terminar la semana 10 con los pesos de la prueba de reps.
