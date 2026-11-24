# Entreno

Registro de entrenamiento Upper/Lower para dos perfiles (Irving y novia), bloque de 10 semanas con periodización, columna ANTERIOR, sugerencia de progresión, temporizador de descanso, gráfica de 1RM estimado y respaldo en JSON/CSV. Funciona sin internet una vez instalada.

## Ponerla en tu iPhone

1. Publica esta carpeta con HTTPS:
   - **Netlify Drop** (lo más rápido): entra a https://app.netlify.com/drop desde la computadora y arrastra la carpeta `entreno-app`. Te da una URL.
   - **GitHub Pages**: sube la carpeta a un repo, Settings → Pages → Deploy from branch → `main` / root.
2. Abre la URL en **Safari** → botón Compartir → **Agregar a inicio**.
3. Ábrela desde el ícono: se ve a pantalla completa y funciona sin conexión.

Los datos se guardan en el teléfono. Exporta un respaldo cada semana (Perfil → Exportar respaldo).

## Seguir desarrollándola con Claude Code

Abre la carpeta con `claude` en la terminal. `CLAUDE.md` explica la estructura, las reglas y dónde cambiar la rutina (`data.js`).
