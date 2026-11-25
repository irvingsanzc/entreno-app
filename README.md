# Entreno

Registro de entrenamiento por bloques de 10 semanas con periodización, columna ANTERIOR, pesos que se llenan solos con los de la sesión pasada, sugerencia de progresión, temporizador de descanso, gráfica de 1RM estimado por bloque y respaldo en JSON/CSV. Funciona sin internet una vez instalada.

Tiene dos versiones:

- **Personal** (`/`): perfiles de Irving y Yulieth con sus rutinas.
- **Pública** (`/publica/`): el link para compartir. Cada persona crea su perfil, elige una rutina de plantilla o arma la suya, y la edita desde la app. Sus registros se guardan sólo en su teléfono.

## Ponerla en tu iPhone

1. Publica esta carpeta con HTTPS:
   - **Netlify Drop** (lo más rápido): entra a https://app.netlify.com/drop desde la computadora y arrastra la carpeta `entreno-app`. Te da una URL.
   - **GitHub Pages**: Settings → Pages → Deploy from branch → `main` / root.
2. Abre la URL en **Safari** → botón Compartir → **Agregar a inicio**. Para otras personas, comparte la URL terminada en `/publica/`.
3. Ábrela desde el ícono: se ve a pantalla completa y funciona sin conexión.

Los datos se guardan en el teléfono. Exporta un respaldo cada semana (Perfil → Exportar respaldo).

## Seguir desarrollándola con Claude Code

Abre la carpeta con `claude` en la terminal. `CLAUDE.md` explica la estructura, las reglas y dónde cambiar las rutinas (`data.js`).
