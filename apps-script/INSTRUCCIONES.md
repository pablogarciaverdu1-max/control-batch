# Cómo crear la hoja de Google y publicar el script

Esto se hace una sola vez y se tarda unos 10 minutos. Necesitas un ordenador y tu cuenta de Google.

Al terminar tendrás una **dirección web que acaba en `/exec`**. La app la usa para leer y guardar tus datos en la hoja.

---

## Paso 1 · Crear la hoja

1. Entra en <https://sheets.google.com> con tu cuenta de Google.
2. Pulsa el recuadro **"En blanco"** (una hoja nueva).
3. Arriba a la izquierda pone "Hoja de cálculo sin título". Haz clic ahí y escribe **Mi cocina**. Pulsa Intro.

No hace falta crear pestañas ni títulos. El script las crea solo la primera vez (Productos, Precios, Platos, etc.).

## Paso 2 · Abrir el editor de scripts

1. En el menú de arriba de la hoja, pulsa **Extensiones → Apps Script**.
2. Se abre una pestaña nueva con un editor. A la izquierda verás un archivo llamado **Código.gs** (o `Code.gs`), con unas líneas como `function myFunction() { }`.
3. Arriba a la izquierda pone "Proyecto sin título". Haz clic ahí, escribe **Mi cocina API** y pulsa **Cambiar nombre**.

## Paso 3 · Pegar el script

1. En este repositorio, abre el archivo `apps-script/Code.gs`. En GitHub, pulsa el botón **"Copy raw file"** (dos cuadraditos, arriba a la derecha del archivo) para copiarlo entero.
2. Vuelve al editor de Apps Script. Haz clic dentro del texto de `Código.gs` y pulsa **Ctrl+A** (en Mac, **Cmd+A**) para seleccionarlo todo.
3. Pulsa **Ctrl+V** (en Mac, **Cmd+V**) para sustituirlo por lo que has copiado.
4. Pulsa el icono del **disquete** (Guardar proyecto), o **Ctrl+S**.

## Paso 4 · Poner tu clave

La clave es lo que te pedirá la app la primera vez en cada dispositivo. Elige una que recuerdes, de al menos 4 caracteres.

1. En la barra de la izquierda del editor, pulsa el **engranaje** (⚙ "Configuración del proyecto").
2. Baja hasta el final, hasta **Propiedades del script**.
3. Pulsa **Añadir propiedad del script**.
4. En **Propiedad** escribe exactamente `CLAVE` (en mayúsculas).
5. En **Valor** escribe tu clave.
6. Pulsa **Guardar propiedades del script**.

## Paso 5 · Publicar como aplicación web

1. Arriba a la derecha, pulsa el botón azul **Implementar → Nueva implementación**.
2. Al lado de "Seleccionar tipo" pulsa el **engranaje** y elige **Aplicación web**.
3. Rellena:
   - **Descripción:** `Mi cocina`
   - **Ejecutar como:** **Yo** (tu correo)
   - **Quién tiene acceso:** **Cualquier usuario**
4. Pulsa **Implementar**.
5. Google te pide permiso. Pulsa **Autorizar acceso** y elige tu cuenta.
6. Saldrá un aviso: "Google no ha verificado esta aplicación". Es normal, porque el script es tuyo:
   - pulsa **Configuración avanzada** (o "Avanzado");
   - pulsa **Ir a Mi cocina API (no seguro)**;
   - pulsa **Permitir**.
7. Aparece una ventana con la **URL de la aplicación web**, que acaba en `/exec`. Pulsa **Copiar** y guárdala en una nota. La necesitarás en la fase de publicación.

> **¿Es seguro "Cualquier usuario"?** Sí. La dirección es larga e imposible de adivinar y, además, el script rechaza cualquier petición que no lleve tu clave. Sin la clave no se puede leer ni cambiar nada.

## Paso 6 · Comprobar que funciona

1. Pega la dirección `/exec` en una pestaña nueva del navegador y pulsa Intro.
2. Tiene que salir este texto: `{"ok":true,"mensaje":"La API de Mi cocina funciona. Los datos se piden por POST."}`

Si sale eso, ya está. Tus productos y platos se cargan solos en la hoja la primera vez que entres en la app con tu clave.

---

## Si algún día cambias el script

Si te paso una versión nueva de `Code.gs`:

1. Pégala igual que en el paso 3 y guarda.
2. Pulsa **Implementar → Gestionar implementaciones**.
3. Pulsa el **lápiz** (Editar).
4. En **Versión** elige **Nueva versión**.
5. Pulsa **Implementar**.

La dirección `/exec` no cambia.

## Cosas que no conviene hacer en la hoja

- No cambies los nombres de las pestañas ni los títulos de la primera fila.
- No borres filas a mano. Si borras algo en la app, la fila se queda marcada como `borrado`: así el otro dispositivo también se entera.
- Mirar la hoja sí puedes, todo lo que quieras.

## Si olvidas la clave

Vuelve al paso 4 y cambia el **Valor** de `CLAVE`. Después, en cada dispositivo, escribe la nueva clave cuando la app te la pida.
