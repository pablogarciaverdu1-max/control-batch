import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { hoyIso } from '../../calc/fechas';
import { euros, leerNumero } from '../../calc/format';
import { almacen, useApp } from '../../data/almacen';
import { pasoPorDefecto, type Producto, type Unidad } from '../../data/model';
import { cambiarPrecio, nuevoId, type Cambios } from '../../data/operaciones';
import { avisoOk } from '../../ui/avisos';
import { estiloBotonCabecera } from '../../ui/comunes';
import { s } from '../../ui/css';
import { ICerrar, ICheck } from '../../ui/iconos';
import { Pantalla } from '../../ui/marco';
import { esOtroSuper } from './Compras';

const UNIDADES: Unidad[] = ['g', 'ml', 'ud', 'envase'];
const aTexto = (n: number) => String(Math.round(n * 100) / 100).replace('.', ',');
const pastilla = (on: boolean) => 'height:52px;min-width:52px;padding:0 18px;border-radius:16px;font-size:16px;font-weight:700;cursor:pointer;box-sizing:border-box;' +
  (on ? 'background:#14213D;color:#FFFFFF;border:2px solid #14213D' : 'background:#FFFFFF;color:#14213D;border:2px solid #DCE2EE');
const campo = 'height: 58px; border-radius: 16px; border: 2px solid #DCE2EE; background: #FFFFFF; box-sizing: border-box; width: 100%';

export function ProductoForm() {
  const { id } = useParams();
  const { d, cat } = useApp();
  const nav = useNavigate();
  const original = id ? d.productos.find((p) => p.id === id) : undefined;
  const precioOriginal = original ? cat.precio.get(original.id) ?? 0 : 0;
  const [nombre, setNombre] = useState(original?.nombre ?? '');
  const [superm, setSuperm] = useState(original ? (esOtroSuper(original.supermercado) ? '+ Otro' : original.supermercado) : 'Mercadona');
  const [otroSuper, setOtroSuper] = useState(original && esOtroSuper(original.supermercado) && original.supermercado !== 'Otro' ? original.supermercado : '');
  const [precio, setPrecio] = useState(original ? precioOriginal.toFixed(2).replace('.', ',') : '');
  const [contenido, setContenido] = useState(original ? aTexto(original.contenido) : '');
  const [unidad, setUnidad] = useState<Unidad>(original?.unidad ?? 'g');
  const [paso, setPaso] = useState(original ? aTexto(original.paso) : aTexto(pasoPorDefecto('g')));
  const [pasoTocado, setPasoTocado] = useState(false);
  const [error, setError] = useState('');

  const pr = leerNumero(precio) ?? 0, ct = leerNumero(contenido) ?? 0;
  let unitPrice = '—', resumen = 'Rellena precio y contenido';
  if (pr > 0 && ct > 0) {
    if (unidad === 'g') { unitPrice = euros(pr / ct * 1000) + '/kg'; resumen = euros(pr / ct * 100) + ' cada 100 g'; }
    else if (unidad === 'ml') { unitPrice = euros(pr / ct * 1000) + '/l'; resumen = euros(pr / ct * 100) + ' cada 100 ml'; }
    else if (unidad === 'ud') { unitPrice = euros(pr / ct) + '/ud'; resumen = aTexto(ct) + ' ud en el envase'; }
    else { unitPrice = euros(pr / ct) + '/env.'; resumen = 'Lo usarás por envases'; }
  }

  const elegirUnidad = (u: Unidad) => {
    setUnidad(u);
    if (u === 'ud' || u === 'envase') setContenido('1');
    if (!pasoTocado) setPaso(aTexto(pasoPorDefecto(u)));
  };

  const guardar = async () => {
    const pasoN = leerNumero(paso);
    if (!nombre.trim()) return setError('Escribe el nombre del producto.');
    if (!(pr > 0)) return setError('El precio tiene que ser mayor que 0.');
    if (!(ct > 0)) return setError('El contenido tiene que ser mayor que 0.');
    if (pasoN === null || pasoN <= 0) return setError('Lo que suma cada − y + tiene que ser mayor que 0.');
    const ahora = Date.now();
    const sup = superm === '+ Otro' ? otroSuper.trim() || 'Otro' : superm;
    const prod: Producto = { id: original?.id ?? nuevoId('p'), nombre: nombre.trim(), supermercado: sup, contenido: ct, unidad, paso: pasoN, updatedAt: ahora };
    const cambios: Cambios = { productos: [prod] };
    // Cada cambio de precio crea una entrada nueva en el historial
    if (!original || Math.abs(pr - precioOriginal) > 1e-9) cambios.precios = cambiarPrecio(prod.id, pr, hoyIso(), ahora).precios;
    await almacen.guardar(cambios);
    if (original) {
      avisoOk('Producto guardado', cambios.precios ? 'Precio actualizado con fecha de hoy' : undefined);
      nav('/producto/' + prod.id, { replace: true });
    } else {
      avisoOk('Producto guardado', 'Ya puedes usarlo en tus platos');
      nav('/compras', { replace: true });
    }
  };

  return (
    <Pantalla conMenu={false} seccion="compras">
      <header style={s('display: flex; align-items: center; gap: 12px; padding: 20px 16px 8px')}>
        <Link to={original ? '/producto/' + original.id : '/compras'} aria-label="Cerrar" style={s(estiloBotonCabecera)}><ICerrar /></Link>
        <h1 className="num" style={s('margin: 0; font-size: 26px; font-weight: 800')}>{original ? 'Editar producto' : 'Nuevo producto'}</h1>
      </header>
      <form id="form-producto" onSubmit={(e) => { e.preventDefault(); guardar(); }} style={s('flex: 1; overflow-y: auto; padding: 12px 20px 20px; display: flex; flex-direction: column; gap: 20px')}>
        <label style={s('display: flex; flex-direction: column; gap: 8px')}>
          <span style={s('font-size: 15px; font-weight: 700')}>Nombre</span>
          <input id="nombre" type="text" value={nombre} onChange={(e) => { setNombre(e.target.value); setError(''); }} placeholder="Ej. Leche de coco" style={s(campo + '; padding: 0 16px; font-size: 18px; font-weight: 600')} />
        </label>
        <div role="group" aria-label="Supermercado" style={s('display: flex; flex-direction: column; gap: 8px')}>
          <span style={s('font-size: 15px; font-weight: 700')}>Supermercado</span>
          <div style={s('display: flex; gap: 8px; flex-wrap: wrap')}>
            {['Mercadona', 'Aldi', '+ Otro'].map((x) => (
              <button key={x} type="button" onClick={() => setSuperm(x)} aria-pressed={superm === x} style={s(pastilla(superm === x))}>{x}</button>
            ))}
          </div>
          {superm === '+ Otro' && (
            <label style={s('display: flex; flex-direction: column; gap: 6px')}>
              <span style={s('font-size: 14px; font-weight: 600; color: #4A5672')}>¿Dónde lo compras?</span>
              <input id="otro-super" type="text" value={otroSuper} onChange={(e) => setOtroSuper(e.target.value)} placeholder="Ej. Lidl" style={s('height: 52px; border-radius: 14px; border: 2px solid #DCE2EE; background: #FFFFFF; padding: 0 14px; font-size: 17px; font-weight: 600; box-sizing: border-box')} />
            </label>
          )}
        </div>
        <div style={s('display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px')}>
          <label style={s('display: flex; flex-direction: column; gap: 8px')}>
            <span style={s('font-size: 15px; font-weight: 700')}>Precio del envase</span>
            <span style={s('display: flex; align-items: center; height: 58px; border-radius: 16px; border: 2px solid #DCE2EE; background: #FFFFFF; padding: 0 14px; box-sizing: border-box')}>
              <input id="precio" type="text" inputMode="decimal" value={precio} onChange={(e) => { setPrecio(e.target.value); setError(''); }} style={s("width: 100%; min-width: 0; border: none; background: transparent; font-size: 22px; font-weight: 700; font-family: 'Bricolage Grotesque', sans-serif; outline: none")} />
              <span style={s('font-size: 20px; font-weight: 700; color: #4A5672')}>€</span>
            </span>
          </label>
          <label style={s('display: flex; flex-direction: column; gap: 8px')}>
            <span style={s('font-size: 15px; font-weight: 700')}>Contenido</span>
            <input id="contenido" type="text" inputMode="decimal" value={contenido} onChange={(e) => { setContenido(e.target.value); setError(''); }} style={s(campo + "; padding: 0 14px; font-size: 22px; font-weight: 700; font-family: 'Bricolage Grotesque', sans-serif")} />
          </label>
        </div>
        <div role="group" aria-label="Unidad" style={s('display: flex; flex-direction: column; gap: 8px')}>
          <span style={s('font-size: 15px; font-weight: 700')}>Unidad</span>
          <div style={s('display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 8px')}>
            {UNIDADES.map((u) => (
              <button key={u} type="button" onClick={() => elegirUnidad(u)} aria-pressed={unidad === u} style={s(pastilla(unidad === u) + ';padding:0 4px')}>{u}</button>
            ))}
          </div>
        </div>
        <label style={s('display: flex; flex-direction: column; gap: 8px')}>
          <span style={s('font-size: 15px; font-weight: 700')}>Cada − y + suma</span>
          <span style={s('display: flex; align-items: center; height: 58px; border-radius: 16px; border: 2px solid #DCE2EE; background: #FFFFFF; padding: 0 14px; box-sizing: border-box')}>
            <input id="paso" type="text" inputMode="decimal" value={paso} onChange={(e) => { setPaso(e.target.value); setPasoTocado(true); setError(''); }} style={s("width: 100%; min-width: 0; border: none; background: transparent; font-size: 22px; font-weight: 700; font-family: 'Bricolage Grotesque', sans-serif; outline: none")} />
            <span style={s('font-size: 18px; font-weight: 700; color: #4A5672')}>{unidad}</span>
          </span>
          <span style={s('font-size: 14px; font-weight: 500; color: #4A5672')}>Al ajustar las cantidades de una producción</span>
        </label>
        {error && (
          <span role="alert" style={s('display: flex; align-items: center; gap: 8px; background: #FFE8C7; color: #5C2E00; border-radius: 12px; padding: 10px 12px; font-size: 15px; font-weight: 700')}>{error}</span>
        )}
        <section aria-live="polite" style={s('background: #14213D; color: #FFFFFF; border-radius: 22px; padding: 18px 20px; display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-shrink: 0')}>
          <span style={s('display: flex; flex-direction: column; gap: 2px')}>
            <span style={s('font-size: 14px; font-weight: 600; color: #C9D1E4')}>Te sale a</span>
            <span style={s('font-size: 13px; font-weight: 500; color: #C9D1E4')}>{resumen}</span>
          </span>
          <span className="num" style={s('font-size: 30px; font-weight: 800; color: #FF9F1C; white-space: nowrap')}>{unitPrice}</span>
        </section>
      </form>
      <div style={s('padding: 12px 20px max(28px, env(safe-area-inset-bottom))')}>
        <button type="submit" form="form-producto" style={s('width: 100%; height: 64px; border: none; border-radius: 20px; background: #FF9F1C; color: #14213D; font-size: 19px; font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 10px; box-shadow: 0 8px 20px rgba(255,159,28,0.35)')}>
          <ICheck t={24} />
          Guardar producto
        </button>
      </div>
    </Pantalla>
  );
}
