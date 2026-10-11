# Prompt para Claude Code — App de costes de batch cooking

## Contexto
Soy Pablo y cocino en lotes (batch cooking) para mis amigos. Hasta ahora llevaba los costes en un Excel y quiero dejarlo. Necesito una app personal (solo la uso yo) que funcione en el móvil, en la cocina y en el supermercado, y también en el ordenador, **con los mismos datos en los dos sitios**.

En la carpeta `diseno/` tienes el diseño ya hecho, en archivos `.dc.html`. Cada archivo contiene el maquetado (HTML con estilos inline) y un bloque `<script type="text/x-dc">` con la lógica y los datos. Son **la referencia visual y de comportamiento**: recréalos fielmente como app real. No son código para reutilizar tal cual (dependen de un runtime que no tienes: `support.js`, `<x-dc>`, `<sc-for>`, `<sc-if>`, `<dc-import>`, `{{huecos}}`).

| Archivo | Pantalla |
|---|---|
| `Acceso.dc.html` | Entrada con clave (la primera vez en cada dispositivo) |
| `Main.dc.html` | Inicio (móvil), con indicador de guardado y acceso a Ajustes |
| `InicioVacio.dc.html` | Inicio sin producciones |
| `Compras.dc.html` | Lista de productos con buscador y filtro por supermercado |
| `ComprasVacia.dc.html` | Compras sin productos |
| `Producto.dc.html` | Ficha de producto + hoja "Registrar compra" |
| `ProductoForm.dc.html` | Formulario de producto |
| `Platos.dc.html` | Lista de platos con botón "Nuevo plato" |
| `Plato.dc.html` | Ficha de plato (ejemplo con lote contado en albóndigas) |
| `PlatoEditor.dc.html` | Editor de plato (móvil) |
| `PlatoEditorDesktop.dc.html` | Editor de plato (ordenador) |
| `Produccion.dc.html` | Nueva producción, 3 pasos (pantalla clave) |
| `ProduccionOffline.dc.html` | Nueva producción sin conexión (reutiliza `Produccion` con `offline` activado) |
| `Historial.dc.html` | Historial por plato |
| `Ajustes.dc.html` | Ajustes |
| `InicioDesktop.dc.html` | Inicio (ordenador) |
| `ProduccionDesktop.dc.html` | Nueva producción (ordenador) |
| `Avisos.dc.html` | Avisos: "Deshacer" tras borrar y confirmación tras guardar |
| `ComprasPrecio.dc.html` | Compras con una tarjeta cambiando el precio (reutiliza `Compras`) |
| `ProductoHistorial.dc.html` | Ficha de producto editando una entrada del historial (reutiliza `Producto`) |
| `ProductoBorrarSinUso.dc.html` | Confirmación al borrar un producto que no usa ningún plato |
| `ProductoBorrarUsado.dc.html` | Confirmación al borrar un producto usado en platos |
| `PlatoBorrar.dc.html` | Confirmación al borrar un plato |
| `ProduccionDetalle.dc.html` | Detalle de una producción guardada |
| `ProduccionBorrar.dc.html` | Confirmación al borrar una producción |
| `ProduccionCorregir.dc.html` | Corregir una producción (paso de cantidades con cambio de fecha) |

Algunos archivos solo montan otro con unas props distintas mediante `<dc-import>`. Míralos como estados de la misma pantalla.

## Tarea
Construye la app completa y funcional a partir de esos diseños, con los datos compartidos entre móvil y ordenador.

Objetivo de fondo: la misma libertad que en un Excel, pero con interfaz de app. Todo lo que se guarda (productos, precios, platos y producciones) se puede añadir, cambiar y borrar cuando quiera, en pocos toques, sin tablas ni celdas.

## Stack y guardado de datos
- PWA instalable en el móvil: React + TypeScript + Vite.
- **Los datos viven en una hoja de Google** (una pestaña por entidad: Productos, Precios, Platos, IngredientesPlato, Producciones, IngredientesProduccion, Ajustes). Accede a ella con un **Google Apps Script publicado como aplicación web** que hace de API (`doGet` para leer y `doPost` para crear, editar y borrar).
- **Clave de acceso**: el Apps Script comprueba en cada petición una clave guardada en sus propiedades de script (`PropertiesService`). La app la pide la primera vez en cada dispositivo (pantalla `Acceso`), la guarda en local y la manda en cada petición. Si la clave es incorrecta, la app vuelve a la pantalla de entrada con el mensaje de error del diseño. Cambiar la clave desde Ajustes obliga a los demás dispositivos a escribirla otra vez.
- **Formato de las peticiones al Apps Script**: todas van por `POST` con `Content-Type: text/plain` y el JSON dentro del cuerpo (`{ "clave": "…", "accion": "…", "datos": {…} }`). Así se evita la petición previa CORS, que Apps Script no admite. **La clave va siempre en el cuerpo, nunca en la dirección** (ni en la query string ni en la ruta). En el script, lee el cuerpo con `JSON.parse(e.postData.contents)` y responde JSON con `ContentService`.
- **Caché local y sin conexión**: guarda una copia de los datos en IndexedDB (Dexie) para que la app arranque rápido y funcione sin conexión. Los cambios que se hagan sin conexión van a una cola y se envían al volver la conexión. Si el mismo registro se ha cambiado en los dos dispositivos, gana el último cambio (por `updatedAt`).
- **Indicador de estado** en Inicio (móvil y ordenador): "Guardado", "Guardando…" y "Sin conexión, se guardará al volver", como en `Main.dc.html` (prop `sync`).
- **Nueva producción sin conexión** (`ProduccionOffline.dc.html`): aviso arriba, todo sigue funcionando y el botón final dice "Guardar en el móvil". El borrador de una producción a medias se guarda siempre en local y no se pierde.
- Incluye en el repositorio el código del Apps Script (`apps-script/Code.gs`) y unas instrucciones paso a paso para crear la hoja, pegar el script, poner la clave y publicarlo.
- **Publicación en GitHub Pages** desde mi repositorio, con despliegue automático en cada cambio a `main` mediante GitHub Actions (workflow con `actions/configure-pages`, `actions/upload-pages-artifact` y `actions/deploy-pages`). La app vive en una subcarpeta del tipo `usuario.github.io/nombre-repo/`: configura `base` en `vite.config.ts` con el nombre del repo y haz que el manifest de la PWA, el service worker y el enrutado respeten esa ruta base. Usa un enrutado que no rompa al recargar en GitHub Pages (`HashRouter`, o un `404.html` que redirija). La dirección del Apps Script va en una variable de entorno de Vite (`VITE_API_URL`) y se guarda como variable del repositorio en GitHub. Dame los pasos para activarlo: crear el repo, subir el código, poner Settings › Pages › Source en "GitHub Actions", añadir la variable y comprobar el primer despliegue.
- Responsive: los diseños de móvil se usan por debajo de 900 px y los de ordenador por encima. Las pantallas sin diseño de ordenador (Compras, Platos, fichas, Historial, Ajustes) se muestran en una columna centrada de máximo 720 px, con el menú lateral de `InicioDesktop`.

## Modelo de datos
- **Producto**: id, nombre, supermercado (Mercadona, Aldi u otro texto), contenido del envase, unidad (`g` | `ml` | `ud` | `envase`), updatedAt. El precio no se guarda aquí: sale del historial.
- **Entrada de precio** (historial): id, productoId, fecha, precio del envase, updatedAt.
  - **Cada cambio de precio crea una entrada nueva con su fecha**, venga de "Registrar compra", de tocar el precio en la lista de Compras o del formulario.
  - **El precio actual es el de la entrada más reciente** (por fecha y, si empatan, por hora de creación).
  - Cada entrada se puede editar (precio y fecha) y borrar. La última entrada que queda no se puede borrar, solo cambiar.
- **Plato**: id, nombre, **qué se cuenta del lote** (`raciones` o un texto en plural: albóndigas, croquetas…, con su singular para "por albóndiga"), **cuántas salen** del lote, **cuántas van por ración** (si se cuenta en raciones vale 1 y no se enseña), ingredientes [{productoId, cantidad}], updatedAt.
  - Raciones que resultan = cuántas salen / cuántas van por ración. Ejemplo: 30 albóndigas a 5 por ración = 6 raciones.
- **Producción**: id, platoId, **nombre del plato en ese momento**, fecha, ingredientes usados [{productoId, **nombreProducto**, **unidad**, cantidad, precioUnitarioEnEseMomento}], cuántas han salido de verdad, qué se contaba y cuántas iban por ración, raciones resultantes, coste del lote, coste por ración, coste por unidad (si no se cuenta en raciones), precio a cobrar y redondeo aplicado, updatedAt.
  - Guarda el precio unitario del momento para que **cambiar un precio no altere las producciones ya guardadas**.
  - **Cada ingrediente guarda el nombre y la unidad del producto en ese momento**, para que la producción se siga viendo bien aunque el producto se borre o se renombre.
  - **Borrar un plato no borra sus producciones.** Siguen en Historial e Inicio con el nombre guardado.
- **Ajustes**: redondeo del precio a cobrar (0,05 €, 0,10 € o 0,50 €; por defecto 0,10 €).

## Reglas de cálculo
- Precio por unidad = precio del envase / contenido. Se muestra en €/kg para `g`, €/l para `ml`, €/ud y €/envase.
- Coste de un ingrediente = cantidad × precio por unidad.
- Coste del lote = suma de los ingredientes.
- Coste por ración = coste del lote / raciones que resultan.
- Coste por unidad (solo si el lote no se cuenta en raciones) = coste del lote / cuántas han salido.
- Precio a cobrar = coste por ración **redondeado al alza** al múltiplo del redondeo elegido en Ajustes (`Math.ceil(x / r - 1e-9) * r`).
- Redondeo de céntimos en pantalla: `Math.round(x * 100 + 1e-6) / 100`. Así 0,475 € se muestra como 0,48 € y no como 0,47 €.
- Formato español en toda la app: coma decimal y euro detrás (`1,10 €`, `0,25 envase`, `300 g`). Usa `Intl.NumberFormat('es-ES')`. Acepta coma y punto al escribir números.

## Añadir, cambiar y borrar
1. **Cambiar un precio desde la lista de Compras** (`ComprasPrecio.dc.html`). El precio de cada tarjeta es un botón, subrayado con línea discontinua. Al tocarlo, la tarjeta se abre sin salir de la lista y enseña:
   - Un campo con el precio, con teclado decimal y el precio anterior al lado.
   - El precio por unidad que saldrá.
   - Cuántos platos lo usan.
   - Los botones Cancelar y "Guardar precio".

   Al guardar se crea una entrada en el historial con la fecha de hoy y aparece el aviso de confirmación "Precio actualizado · Cambia el coste de N platos" (o "Ningún plato usa este producto"). El nombre de la tarjeta sigue llevando a la ficha.
2. **Historial de precios editable** (`ProductoHistorial.dc.html`). Cada entrada tiene un lápiz (editar precio y fecha en la propia entrada) y una papelera. La papelera está desactivada si solo queda una entrada, y lo explica con un texto debajo.
3. **Borrar un producto**: botón "Borrar" junto a "Editar" en la ficha. Pide confirmación en una hoja inferior:
   - Si no lo usa ningún plato (`ProductoBorrarSinUso.dc.html`), dice que se borrará con su historial.
   - Si lo usan platos (`ProductoBorrarUsado.dc.html`), dice en cuáles y cuánto baja el coste de cada uno, avisa de que **se quitará de sus ingredientes** y aclara que las producciones guardadas no cambian. El botón dice "Borrar y quitar de N platos".
4. **Platos**: en la ficha, "Editar", "Duplicar" y "Borrar".
   - "Duplicar" crea «Nombre (copia)» con los mismos ingredientes y enseña un aviso de confirmación.
   - "Borrar" pide confirmación (`PlatoBorrar.dc.html`) y aclara que **sus producciones guardadas no se borran**.
5. **Producciones guardadas**: tocar una producción en Historial o en Inicio abre su detalle (`ProduccionDetalle.dc.html`). El detalle enseña:
   - La fecha.
   - Lo que salió.
   - El coste del lote, el coste por ración, el coste por unidad (si toca) y el precio cobrado.
   - Los ingredientes con cantidad y coste a precios de ese día.

   Tiene dos botones:
   - **"Corregir"** (`ProduccionCorregir.dc.html`) abre el paso de cantidades con los datos de esa producción y un bloque para cambiar la fecha. Guarda sobre la misma producción con "Guardar cambios".
   - **"Borrar"** pide confirmación (`ProduccionBorrar.dc.html`).
6. **Deshacer** (`Avisos.dc.html`): después de borrar cualquier cosa (producto, entrada de precio, plato o producción), aparece abajo, encima del menú, un aviso azul de unos 6 segundos con el botón naranja "Deshacer" y una barra que se va acortando.
   - Es el mismo componente en todos los casos.
   - Implementa el borrado como un borrado diferido: se oculta al momento y se envía al Apps Script cuando el aviso desaparece. "Deshacer" lo cancela y lo restaura tal cual. Al deshacer el borrado de un producto, también vuelve a los platos de los que se quitó.
   - Un aviso nuevo sustituye al anterior y confirma el borrado pendiente.
   - Los avisos de confirmación tras guardar usan la misma posición, sin botón, durante unos 4 segundos.

## Comportamiento por pantalla
1. **Entrada con clave**: logo, campo de clave con botón de mostrar u ocultar, "Entrar" y estado de error. Solo aparece la primera vez en cada dispositivo o tras cerrar sesión.
2. **Inicio**: indicador de guardado, botón de Ajustes, botón grande naranja "Nueva producción", últimas producciones (plato, fecha, qué salió y precio por ración en grande) y accesos a Compras y Platos. Si no hay producciones, muestra `InicioVacio`.
3. **Compras**: tarjetas (nada de tablas), buscador en vivo y filtro con chips (Todos, Mercadona, Aldi, Otro). "+" lleva al formulario. Si no hay productos, muestra `ComprasVacia`.
4. **Ficha de producto**: precio actual en grande, €/kg y €/100 g, historial de precios (con una sola compra se muestra el mensaje del diseño en vez de la gráfica) y "Lo usas en" con los platos que lo llevan. "Registrar compra" abre una hoja inferior con el precio, botones de ±1 céntimo y la posibilidad de tocar el número para escribirlo.
5. **Formulario de producto**: nombre, supermercado (chips + "Otro"), precio, contenido y unidad (g/ml/ud/envase). Una tarjeta azul enseña en vivo "Te sale a X €/kg". Valida que precio y contenido sean mayores que 0.
6. **Platos**: tarjetas con el coste por ración calculado con los precios actuales y, si el lote se cuenta en unidades, el coste por unidad. Botón "Nuevo plato".
7. **Ficha de plato**: coste por ración y del lote en grande, cuántas salen, cuántas van por ración, raciones y coste por unidad (solo si no se cuenta en raciones), ingredientes con su coste y los botones "Editar" y "Cocinar este plato". Este último abre Nueva producción con el plato ya elegido.
8. **Editor de plato** (móvil y ordenador): nombre; "Qué cuento del lote" (Raciones, Albóndigas, Croquetas u Otra cosa con campo de texto); "Cuántas salen" y "Cuántas van por ración" con más y menos, y debajo las raciones que resultan; ingredientes con cantidad en más y menos y botón de quitar; buscador de productos para añadir. El coste del lote, por ración y por unidad se ven en vivo. Sirve para crear y para editar.
9. **Nueva producción** (la pantalla clave: copia el comportamiento de `Produccion.dc.html` y `ProduccionDesktop.dc.html`):
   - Paso 1: fecha (Hoy, Ayer u Otra con selector) y plato.
   - Paso 2: cada ingrediente con la cantidad de la receta ya puesta y botones grandes de − y +. **Pasos: 0,25 para `ud` y `envase`**, 25 g por defecto para `g` y 10 ml para `ml`, configurable por producto (curry 5 g, salsa de soja 5 ml, caldos 50 ml). **Tocar el número abre un campo para escribirlo con teclado decimal y un botón "Listo"**. El número va subrayado con línea discontinua y arriba se lee "Usa − y + o toca el número para escribirlo". Si cambia la cantidad, se ve "Receta: X". También se pueden quitar ingredientes y añadir otros desde una hoja con buscador.
   - En el mismo paso se ajusta lo que ha salido de verdad: "Raciones que han salido" o, si el plato se cuenta en unidades, "Albóndigas que han salido" (por ejemplo 34), con las raciones que resultan debajo.
   - La barra inferior azul con el coste del lote y el precio por ración se ve siempre y se recalcula al momento.
   - Paso 3: precio a cobrar en muy grande, con el redondeo aplicado, el coste del lote, las raciones, el coste real por ración y, si toca, el coste por unidad. Botones "Guardar producción" y "Volver a ajustar".
   - En ordenador los 3 pasos están en una sola pantalla y el resultado se ve fijo en la columna derecha.
10. **Historial**: chips por plato, coste por ración de la última vez, variación respecto a la anterior, barras con la evolución (solo con dos producciones o más) y la lista de producciones.
11. **Ajustes**: redondeo del precio a cobrar (0,05 € / 0,10 € / 0,50 €) con un ejemplo en vivo, estado de la nube, "Descargar una copia de mis datos" (JSON con todo), "Cambiar la clave" y "Cerrar sesión en este dispositivo" (borra la clave y la caché local, no los datos de la hoja).

## Diseño (respétalo)
- Colores: azul noche `#14213D`, naranja `#FF9F1C`, fondo gris azulado `#EEF1F8`, tarjetas blancas, texto secundario `#4A5672`, bordes `#DCE2EE`, avisos en `#FFE8C7` con texto `#5C2E00`/`#7A3E00`. Sobre naranja el texto va en azul noche, nunca en blanco.
- Tipografías (Google Fonts): **Bricolage Grotesque** para títulos y números (con `tabular-nums`) y **Figtree** para el resto.
- Nada que recuerde a una hoja de cálculo: sin tablas, celdas ni rejillas de datos.
- Usable con una mano y con los dedos manchados: zonas táctiles de 44 px como mínimo (los ± miden 52–64 px), acciones principales abajo y el número importante siempre visible.
- Menú inferior en móvil (Inicio, Compras, Platos, Historial) y menú lateral azul en ordenador (con Ajustes).
- Iconos SVG de trazo, como en los diseños. Nada de emojis.
- Textos en español, con tono cercano.

## Datos iniciales (reales, cárgalos tal cual; no inventes nada más)
Productos (supermercado, precio del envase, contenido):
- Espinazo de cerdo: Mercadona, 1,70 €, 1 envase
- Muslitos de pollo: Mercadona, 3,37 €, 5 ud
- Garbanzo pedrosillano: Mercadona, 0,90 €, 570 g
- Guisantes: Mercadona, 0,95 €, 1 envase
- Tomate triturado: Mercadona, 0,55 €, 1 envase
- Setas deshidratadas: Aldi, 3,00 €, 1 envase
- Preparado de verduras para caldo: Aldi, 2,00 €, 1 envase
- Pan bimbo sin corteza: Mercadona, 1,05 €, 18 ud
- Huevos: Mercadona, 1,80 €, 6 ud
- Cebolla tierna: Mercadona, 1,70 €, 3 ud
- Carne picada cerdo/ternera: Mercadona, 8,00 €, 1000 g
- Caldo de pollo: Mercadona, 0,75 €, 1000 ml
- Caldo de cocido: Mercadona, 0,90 €, 1000 ml
- Pimiento verde: Mercadona, 0,23 €, 1 ud
- Arroz redondo: Mercadona, 1,15 €, 1000 g
- Contramuslos de pollo deshuesados: Mercadona, 3,74 €, 550 g
- Zanahoria: Mercadona, 1,00 €, 1 ud
- Salsa de soja: Mercadona, 1,20 €, 250 ml
- Leche de coco: Mercadona, 1,30 €, 1 envase
- Patata: Mercadona, 0,37 €, 1 ud
- Pollo entero: Mercadona, 8,60 €, 1 ud
- Curry en especia: otro, 1,10 €, 57 g

Platos:
- **Pollo al curry**, 4 raciones: 300 g contramuslos, 1 leche de coco, 0,5 tomate triturado, 10 g curry, 0,5 cebolla tierna.
- **Albóndigas en salsa con guisantes**, 30 albóndigas a 5 por ración: 500 g carne picada, 2 cebollas tiernas, 0,5 guisantes, 1 rebanada de pan bimbo (1 ud), 1 preparado de verduras, 1 espinazo de cerdo, 1 huevo, 0,5 tomate triturado.
- **Guiso de garbanzos con pollo**, 4 raciones: 570 g garbanzos, 5 muslitos, 0,5 tomate triturado, 1 setas, 0,5 cebolla tierna, 0,5 pimiento verde, 1 espinazo de cerdo, 1 preparado de verduras.
- **Arroz con pollo y verduras**, 4 raciones: 150 g contramuslos, 1 huevo, 0,25 guisantes, 0,5 zanahoria, 0,5 cebolla tierna, 30 ml salsa de soja.
- **Pollo al horno con patatas**, 4 raciones: 0,4 pollo entero, 2 patatas, 1 cebolla tierna, 1 zanahoria.

No cargues producciones ni historial de precios inventados: empiezan vacíos. Las fechas `[fecha]` de los diseños son huecos de ejemplo.

## Criterios de aceptación (tests con Vitest)
Con redondeo de 0,10 €, los datos iniciales tienen que dar exactamente:

| Plato | Lote | Ración | A cobrar | Extra |
|---|---|---|---|---|
| Pollo al curry | 4,09 € | 1,02 € | 1,10 € | |
| Albóndigas en salsa con guisantes | 9,94 € | 1,66 € | 1,70 € | 6 raciones · 0,33 € por albóndiga |
| Guiso de garbanzos con pollo | 11,64 € | 2,91 € | 3,00 € | |
| Arroz con pollo y verduras | 2,48 € | 0,62 € | 0,70 € | |
| Pollo al horno con patatas | 5,75 € | 1,44 € | 1,50 € | |

Además:
- Con 34 albóndigas a 5 por ración salen 6,8 raciones.
- Cambiar el precio de un producto actualiza el coste de los platos, pero no cambia las producciones ya guardadas.
- **Cambiar un precio desde la lista de Compras**: tocar el precio del tomate triturado, escribir 0,60 y guardar. Tiene que crear una entrada nueva en su historial con la fecha de hoy, poner 0,60 € como precio actual, enseñar el aviso "Cambia el coste de 3 platos" y recalcular Pollo al curry, Albóndigas y Guiso de garbanzos, sin tocar ninguna producción guardada.
- **Borrar un producto usado en un plato**: borrar los contramuslos de pollo deshuesados. La confirmación tiene que nombrar Pollo al curry y Arroz con pollo y verduras. Al confirmar, desaparecen de sus ingredientes y su coste baja en 2,04 € y 1,02 €. Las producciones que los usaban se siguen viendo con su nombre y su unidad. "Deshacer" lo deja todo como estaba.
- Borrar un plato deja sus producciones en el Historial.
- Corregir una producción cambia esa misma producción (no crea otra) y permite cambiar su fecha.
- Un cambio hecho en el móvil aparece en el ordenador al recargar.
- Sin conexión se puede hacer una producción completa, y al volver la conexión se sube sola.
- A 390 px de ancho no hay scroll horizontal y cada pantalla se parece a su `.dc.html`.
- Tests unitarios de las funciones de cálculo, redondeo y formato de euros y cantidades.

## Cómo trabajar
1. Lee todos los `.dc.html` antes de nada.
2. **Enséñame el plan y pregúntame antes de programar**: estructura de carpetas, modelo de datos, cómo será la hoja de Google y el Apps Script, cómo funcionará la sincronización y cualquier duda que tengas.
3. Cuando te dé el visto bueno, construye primero la lógica de cálculo con sus tests y el Apps Script. Después Nueva producción, que es lo más importante, y luego el resto.
4. Al final dime:
   - Cómo arrancarla (`npm run dev`).
   - Cómo publicar el Apps Script.
   - Los pasos para activar GitHub Pages con el despliegue automático.
   - Cómo instalar la app en el móvil.
   - Qué ha quedado pendiente.
