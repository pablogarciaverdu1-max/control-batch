# Mi cocina

App personal para llevar los costes del batch cooking: lo que compras y a qué precio, tus platos con su coste por ración y cada lote que cocinas con lo que hay que cobrar.

Funciona en el móvil (se instala como una app) y en el ordenador, con los mismos datos en los dos sitios. Los datos se guardan en una hoja de Google y cada dispositivo tiene una copia para seguir funcionando sin conexión.

- **La app:** https://pablogarciaverdu1-max.github.io/control-batch/
- **El diseño y la especificación:** carpeta [`diseno/`](diseno/) (pantallas `.dc.html` y `PROMPT.md`).

---

## 1. La hoja de Google y el script

Está explicado paso a paso en [`apps-script/INSTRUCCIONES.md`](apps-script/INSTRUCCIONES.md): crear la hoja, pegar el script, poner la clave y publicarlo.

La dirección del script ya está puesta en el archivo `.env.production`. Si algún día publicas el script en otra dirección, cámbiala allí o en la variable del repositorio (paso 2.3).

> **Importante sobre la clave.** El repositorio es público y la dirección del script va dentro de la app, así que lo único que protege tus datos es la clave. Si usas una palabra fácil, cámbiala por otra más larga desde **Ajustes › Cambiar la clave** la primera vez que entres.

## 2. Publicar la app en GitHub Pages

La app se publica sola cada vez que hay un cambio en la rama `main`, con el archivo `.github/workflows/deploy.yml`. Hay que activarlo una vez, siguiendo estos pasos.

### 2.1 Poner `main` como rama principal

1. Entra en https://github.com/pablogarciaverdu1-max/control-batch
2. Pulsa **Settings** (arriba a la derecha, con un engranaje).
3. En el menú de la izquierda, en **General**, busca **Default branch**.
4. Pulsa el botón de las dos flechas (⇄), elige **main** y pulsa **Update**.
5. Confirma con **I understand, update the default branch**.

GitHub Pages solo deja publicar desde la rama principal, por eso hace falta este paso.

### 2.2 Decirle a GitHub Pages que publique con GitHub Actions

1. En **Settings**, en el menú de la izquierda, pulsa **Pages**.
2. En **Build and deployment › Source**, elige **GitHub Actions**.

### 2.3 (Opcional) La dirección del script como variable del repositorio

No hace falta para que funcione, porque ya está en `.env.production`. Pero si quieres cambiarla sin tocar código:

1. En **Settings**, en el menú de la izquierda, pulsa **Secrets and variables › Actions**.
2. Abre la pestaña **Variables** y pulsa **New repository variable**.
3. En **Name** escribe `VITE_API_URL`.
4. En **Value** pega la dirección que acaba en `/exec`.
5. Pulsa **Add variable**.

Si existe esta variable, la publicación usa la variable en lugar del archivo.

### 2.4 Comprobar la publicación

1. Entra en la pestaña **Actions** del repositorio.
2. Verás **Publicar en GitHub Pages**. Si la última ejecución salió en rojo (pasa si se lanzó antes de los pasos 2.1 y 2.2), ábrela y pulsa **Re-run all jobs**. También puedes lanzarla tú: elige **Publicar en GitHub Pages** a la izquierda y pulsa **Run workflow**.
3. Espera a que salga en verde (un par de minutos).
4. Abre https://pablogarciaverdu1-max.github.io/control-batch/ y escribe tu clave.

## 3. Instalar la app en el móvil

**Android (Chrome)**

1. Abre https://pablogarciaverdu1-max.github.io/control-batch/ en Chrome.
2. Escribe tu clave.
3. Pulsa el menú **⋮** (arriba a la derecha) y elige **Instalar aplicación** o **Añadir a pantalla de inicio**.
4. Confirma. Aparece el icono naranja de "Mi cocina" junto a tus apps.

**iPhone (Safari)**

1. Abre la dirección en **Safari** (en otros navegadores del iPhone no sale la opción).
2. Escribe tu clave.
3. Pulsa el botón **Compartir** (el cuadrado con una flecha hacia arriba).
4. Baja y elige **Añadir a pantalla de inicio**, y luego **Añadir**.

La clave se pide solo la primera vez en cada dispositivo.

## 4. Arrancarla en el ordenador para hacer cambios (para programadores)

Hace falta [Node.js](https://nodejs.org) 20 o posterior.

```bash
npm install
npm run dev
```

Se abre en http://localhost:5173/control-batch/. Sin la variable `VITE_API_URL`, `npm run dev` usa un **simulador del script** (el mismo `Code.gs` con una hoja falsa en memoria) y entra solo con la clave `1234`. Para conectarla a tu hoja de verdad, crea un archivo `.env.local` con `VITE_API_URL=https://…/exec`.

Otros comandos:

- `npm test`: tests de cálculos, formato, criterios de aceptación y del Apps Script.
- `npm run build`: compila la app en `dist/`.
- `npm run build:demo`: versión de prueba con el script simulado dentro del navegador.

## 5. Cómo funciona por dentro

- **React + TypeScript + Vite**, app instalable (PWA) con `vite-plugin-pwa`.
- **Datos:** hoja de Google con las pestañas Productos, Precios, Platos, IngredientesPlato, Producciones, IngredientesProduccion y Ajustes. El Apps Script (`apps-script/Code.gs`) hace de API. Todas las peticiones van por `POST` con `text/plain` y la clave dentro del cuerpo, nunca en la dirección.
- **Copia local y sin conexión:** IndexedDB (Dexie). Cada cambio se guarda al momento en el dispositivo y entra en una cola que se sube cuando hay conexión. Si el mismo dato cambia en dos dispositivos, gana el cambio más reciente.
- **Borrados:** no se eliminan filas, se marcan como borradas para que el otro dispositivo se entere. Tras borrar hay 6 segundos para "Deshacer"; después se envía.
- **Producciones:** guardan el nombre, la unidad y el precio de cada ingrediente de ese día, así que cambiar precios, renombrar o borrar productos no las altera.

### Carpetas

```
apps-script/      Code.gs, instrucciones y simulador para tests
diseno/           pantallas .dc.html y PROMPT.md (la especificación)
public/           iconos de la app
src/calc/         cálculos, redondeos, fechas y formato español
src/data/         modelo, datos iniciales, operaciones, copia local y sincronización
src/screens/      una carpeta o archivo por pantalla
src/ui/           piezas comunes: menús, avisos, hojas inferiores, iconos
tests/            tests con Vitest
tools/            capturas del diseño, comparación con la app, iconos, versión de prueba
```
