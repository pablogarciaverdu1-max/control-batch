/**
 * Mi cocina · API sobre esta hoja de Google.
 *
 * Todas las peticiones llegan por POST con Content-Type text/plain y este cuerpo:
 *   { "clave": "…", "accion": "…", "datos": { … } }
 * La clave se comprueba en cada petición contra la propiedad de script CLAVE.
 * Nunca viaja en la dirección.
 *
 * Acciones:
 *   comprobar        → { ok: true }
 *   leer             → { ok: true, datos: { productos, precios, platos, producciones, ajustes }, hora }
 *   guardar          → recibe { productos?, precios?, platos?, producciones?, ajustes? } y aplica
 *                      cada registro solo si es más reciente (updatedAt) que el guardado.
 *   cargarIniciales  → igual que guardar, pero solo si la hoja está vacía (primera vez).
 *   cambiarClave     → recibe { nueva } y sustituye la clave.
 */

var TABLAS = {
  Productos: [['id', 's'], ['nombre', 's'], ['supermercado', 's'], ['contenido', 'n'], ['unidad', 's'], ['paso', 'n'], ['updatedAt', 'n'], ['borrado', 'b']],
  Precios: [['id', 's'], ['productoId', 's'], ['fecha', 's'], ['precio', 'n'], ['creadoEn', 'n'], ['updatedAt', 'n'], ['borrado', 'b']],
  Platos: [['id', 's'], ['nombre', 's'], ['cuenta', 's'], ['singular', 's'], ['salen', 'n'], ['porRacion', 'n'], ['updatedAt', 'n'], ['borrado', 'b']],
  IngredientesPlato: [['platoId', 's'], ['orden', 'n'], ['productoId', 's'], ['cantidad', 'n']],
  Producciones: [['id', 's'], ['platoId', 's'], ['nombrePlato', 's'], ['fecha', 's'], ['salen', 'n'], ['cuenta', 's'], ['singular', 's'],
    ['porRacion', 'n'], ['raciones', 'n'], ['costeLote', 'n'], ['costeRacion', 'n'], ['costeUnidad', 'n?'], ['precioCobrar', 'n'],
    ['redondeo', 'n'], ['updatedAt', 'n'], ['borrado', 'b']],
  IngredientesProduccion: [['produccionId', 's'], ['orden', 'n'], ['productoId', 's'], ['nombreProducto', 's'], ['unidad', 's'],
    ['cantidad', 'n'], ['precioUnitario', 'n']],
  Ajustes: [['id', 's'], ['redondeo', 'n'], ['updatedAt', 'n']]
};

function doGet() {
  // Solo para comprobar que el script está publicado. No devuelve datos.
  return responder({ ok: true, mensaje: 'La API de Mi cocina funciona. Los datos se piden por POST.' });
}

function doPost(e) {
  var peticion;
  try {
    peticion = JSON.parse(e.postData.contents);
  } catch (err) {
    return responder({ ok: false, error: 'peticion', mensaje: 'La petición no es JSON válido.' });
  }
  var claveGuardada = PropertiesService.getScriptProperties().getProperty('CLAVE');
  if (!claveGuardada) {
    return responder({ ok: false, error: 'sinClave', mensaje: 'Falta poner la clave en las propiedades del script.' });
  }
  if (!peticion || peticion.clave !== claveGuardada) {
    return responder({ ok: false, error: 'clave', mensaje: 'Clave incorrecta.' });
  }
  var lock = LockService.getScriptLock();
  lock.waitLock(30000);
  try {
    prepararHoja();
    var datos = peticion.datos || {};
    switch (peticion.accion) {
      case 'comprobar':
        return responder({ ok: true });
      case 'leer':
        return responder({ ok: true, datos: leerTodo(), hora: Date.now() });
      case 'guardar':
        return responder({ ok: true, aplicados: guardar(datos), hora: Date.now() });
      case 'cargarIniciales':
        if (leerTabla('Ajustes').length > 0 || leerTabla('Productos').length > 0) {
          return responder({ ok: true, cargado: false });
        }
        guardar(datos);
        return responder({ ok: true, cargado: true });
      case 'cambiarClave':
        if (!datos.nueva || String(datos.nueva).length < 4) {
          return responder({ ok: false, error: 'peticion', mensaje: 'La clave nueva tiene que tener al menos 4 caracteres.' });
        }
        PropertiesService.getScriptProperties().setProperty('CLAVE', String(datos.nueva));
        return responder({ ok: true });
      default:
        return responder({ ok: false, error: 'peticion', mensaje: 'Acción desconocida: ' + peticion.accion });
    }
  } catch (err) {
    return responder({ ok: false, error: 'interno', mensaje: String(err && err.message || err) });
  } finally {
    lock.releaseLock();
  }
}

function responder(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}

/** Crea las pestañas que falten, con su fila de títulos. */
function prepararHoja() {
  var libro = SpreadsheetApp.getActiveSpreadsheet();
  Object.keys(TABLAS).forEach(function (nombre) {
    var hoja = libro.getSheetByName(nombre);
    if (!hoja) {
      hoja = libro.insertSheet(nombre);
      var cols = TABLAS[nombre].map(function (c) { return c[0]; });
      hoja.getRange(1, 1, 1, cols.length).setValues([cols]).setFontWeight('bold');
      hoja.setFrozenRows(1);
    }
  });
}

// ---------- Lectura y escritura de tablas ----------

function leerTabla(nombre) {
  var hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(nombre);
  var cols = TABLAS[nombre];
  var filas = hoja.getLastRow() - 1;
  if (filas < 1) return [];
  var valores = hoja.getRange(2, 1, filas, cols.length).getValues();
  return valores.filter(function (fila) { return fila[0] !== '' && fila[0] !== null; }).map(function (fila) {
    var obj = {};
    cols.forEach(function (c, i) { obj[c[0]] = convertir(fila[i], c[1]); });
    return obj;
  });
}

function convertir(v, tipo) {
  if (tipo === 's') return v === null || v === undefined ? '' : String(v);
  if (tipo === 'b') return v === true || v === 'TRUE' || v === 'true' || v === 1;
  if (v === '' || v === null || v === undefined) return tipo === 'n?' ? null : 0;
  var n = typeof v === 'number' ? v : parseFloat(String(v).replace(',', '.'));
  return isNaN(n) ? (tipo === 'n?' ? null : 0) : n;
}

function escribirTabla(nombre, objetos) {
  var hoja = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(nombre);
  var cols = TABLAS[nombre];
  var viejas = hoja.getLastRow() - 1;
  if (viejas > 0) hoja.getRange(2, 1, viejas, cols.length).clearContent();
  if (!objetos.length) return;
  var valores = objetos.map(function (o) {
    return cols.map(function (c) {
      var v = o[c[0]];
      if (c[1] === 'b') return v ? true : false;
      if (c[1] === 's') return v === undefined || v === null ? '' : String(v);
      return v === undefined || v === null ? '' : Number(v);
    });
  });
  // Texto plano en las columnas de texto: así una fecha como 2026-10-11 no se convierte.
  var formatos = objetos.map(function () {
    return cols.map(function (c) { return c[1] === 's' ? '@' : 'General'; });
  });
  var rango = hoja.getRange(2, 1, valores.length, cols.length);
  rango.setNumberFormats(formatos);
  rango.setValues(valores);
}

// ---------- Datos completos ----------

function leerTodo() {
  var ingPlato = agrupar(leerTabla('IngredientesPlato'), 'platoId');
  var ingProd = agrupar(leerTabla('IngredientesProduccion'), 'produccionId');
  var ajustes = leerTabla('Ajustes');
  return {
    productos: leerTabla('Productos'),
    precios: leerTabla('Precios'),
    platos: leerTabla('Platos').map(function (p) {
      p.ingredientes = (ingPlato[p.id] || []).map(function (i) { return { productoId: i.productoId, cantidad: i.cantidad }; });
      return p;
    }),
    producciones: leerTabla('Producciones').map(function (p) {
      p.ingredientes = (ingProd[p.id] || []).map(function (i) {
        return { productoId: i.productoId, nombreProducto: i.nombreProducto, unidad: i.unidad, cantidad: i.cantidad, precioUnitario: i.precioUnitario };
      });
      return p;
    }),
    ajustes: ajustes.length ? ajustes[0] : null
  };
}

function agrupar(filas, campo) {
  var m = {};
  filas.sort(function (a, b) { return a.orden - b.orden; }).forEach(function (f) {
    (m[f[campo]] = m[f[campo]] || []).push(f);
  });
  return m;
}

/**
 * Aplica los registros recibidos. Gana el más reciente por updatedAt
 * (si empatan, gana el que llega). Devuelve cuántos se han aplicado.
 */
function guardar(c) {
  var aplicados = 0;
  aplicados += fusionar('Productos', c.productos);
  aplicados += fusionar('Precios', c.precios);
  aplicados += fusionar('Platos', c.platos, 'IngredientesPlato', 'platoId', function (i) {
    return { productoId: i.productoId, cantidad: i.cantidad };
  });
  aplicados += fusionar('Producciones', c.producciones, 'IngredientesProduccion', 'produccionId', function (i) {
    return { productoId: i.productoId, nombreProducto: i.nombreProducto, unidad: i.unidad, cantidad: i.cantidad, precioUnitario: i.precioUnitario };
  });
  if (c.ajustes) aplicados += fusionar('Ajustes', [c.ajustes]);
  return aplicados;
}

function fusionar(tabla, registros, tablaHijos, campoPadre, hijo) {
  if (!registros || !registros.length) return 0;
  var actuales = leerTabla(tabla);
  var porId = {};
  actuales.forEach(function (r, i) { porId[r.id] = i; });
  var hijos = tablaHijos ? leerTabla(tablaHijos) : null;
  var cambiados = {};
  var n = 0;
  registros.forEach(function (r) {
    if (!r || !r.id) return;
    var i = porId[r.id];
    if (i !== undefined && Number(actuales[i].updatedAt) > Number(r.updatedAt)) return; // gana el guardado
    if (i === undefined) { porId[r.id] = actuales.length; actuales.push(r); } else { actuales[i] = r; }
    cambiados[r.id] = r;
    n++;
  });
  escribirTabla(tabla, actuales);
  if (tablaHijos && n) {
    var quedan = hijos.filter(function (h) { return !cambiados[h[campoPadre]]; });
    Object.keys(cambiados).forEach(function (id) {
      (cambiados[id].ingredientes || []).forEach(function (ing, orden) {
        var fila = hijo(ing);
        fila[campoPadre] = id;
        fila.orden = orden;
        quedan.push(fila);
      });
    });
    escribirTabla(tablaHijos, quedan);
  }
  return n;
}
