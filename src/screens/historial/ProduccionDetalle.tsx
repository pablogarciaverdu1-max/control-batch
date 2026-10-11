import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { fechaLarga } from '../../calc/fechas';
import { cantidad, euros, numero, redondeoTexto } from '../../calc/format';
import { useApp } from '../../data/almacen';
import { borrarProduccion } from '../../data/operaciones';
import { borrarConDeshacer } from '../../ui/avisos';
import { ConfirmarBorrado, estiloBotonCabecera } from '../../ui/comunes';
import { s } from '../../ui/css';
import { IAtras, ICalendario, ILapiz2 } from '../../ui/iconos';
import { Pantalla } from '../../ui/marco';
import { fechaProduccion } from './Historial';

export function ProduccionDetalle() {
  const { id } = useParams();
  const { d, todo } = useApp();
  const nav = useNavigate();
  const [confirmar, setConfirmar] = useState(false);
  const p = d.producciones.find((x) => x.id === id);
  if (!p) {
    return (
      <Pantalla conMenu={false} seccion="historial">
        <header style={s('display: flex; align-items: center; gap: 12px; padding: 20px 16px 8px')}>
          <Link to="/historial" aria-label="Volver al Historial" style={s(estiloBotonCabecera)}><IAtras t={26} /></Link>
        </header>
        <main style={s('padding: 12px 20px; font-size: 16px; font-weight: 500; color: #4A5672')}>Esta producción ya no existe.</main>
      </Pantalla>
    );
  }
  const porUnidades = p.cuenta !== 'raciones';
  const volver = '/historial?plato=' + p.platoId;
  const caja = (t: string, v: string, extra?: string, ancho = false) => (
    <div style={s('background: rgba(255,255,255,0.08); border-radius: 16px; padding: 12px 14px; display: flex; flex-direction: column; gap: 2px; min-width: 0' + (ancho ? '; grid-column: 1 / -1' : ''))}>
      <span style={s('font-size: 13px; font-weight: 600; color: #C9D1E4')}>{t}</span>
      <span className="num" style={s(`font-size: ${v.length > 14 ? 18 : 22}px; font-weight: 800; overflow-wrap: anywhere`)}>{v}</span>
      {extra && <span style={s('font-size: 13px; font-weight: 600; color: #C9D1E4')}>{extra}</span>}
    </div>
  );
  const borrar = () => {
    setConfirmar(false);
    nav(volver, { replace: true });
    borrarConDeshacer('Producción borrada', borrarProduccion(todo, p.id, Date.now()));
  };

  return (
    <Pantalla conMenu={false} seccion="historial">
      <header style={s('display: flex; align-items: center; gap: 12px; padding: 20px 16px 8px')}>
        <Link to={volver} aria-label="Volver al Historial" style={s(estiloBotonCabecera)}><IAtras t={26} /></Link>
        <span style={s('display: flex; flex-direction: column; gap: 2px')}>
          <span style={s('font-size: 14px; font-weight: 700; color: #4A5672')}>Producción</span>
          <span style={s('display: flex; align-items: center; gap: 6px; font-size: 16px; font-weight: 700')}>
            <ICalendario t={18} />
            {fechaLarga(p.fecha)}
          </span>
        </span>
      </header>
      <main style={s('flex: 1; overflow-y: auto; padding: 8px 20px 20px; display: flex; flex-direction: column; gap: 16px')}>
        <h1 className="num" style={s('margin: 0; font-size: 28px; font-weight: 800; line-height: 1.1')}>{p.nombrePlato}</h1>
        <section style={s('background: #14213D; color: #FFFFFF; border-radius: 24px; padding: 22px; display: flex; flex-direction: column; gap: 16px; flex-shrink: 0')}>
          <div style={s('display: flex; justify-content: space-between; align-items: flex-end; gap: 12px')}>
            <span style={s('display: flex; flex-direction: column; gap: 2px')}>
              <span style={s('font-size: 14px; font-weight: 600; color: #C9D1E4')}>Cobrado por ración</span>
              <span className="num" style={s('font-size: 56px; font-weight: 800; line-height: 1; color: #FF9F1C')}>{euros(p.precioCobrar)}</span>
            </span>
            <span style={s('font-size: 13px; font-weight: 600; color: #C9D1E4; text-align: right')}>redondeo<br />{redondeoTexto(p.redondeo)} €</span>
          </div>
          <div style={s('display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px')}>
            {caja('Coste del lote', euros(p.costeLote))}
            {caja('Coste por ración', euros(p.costeRacion))}
            {porUnidades
              ? caja('Salieron', numero(p.salen) + ' ' + p.cuenta, numero(p.raciones) + ' raciones de ' + numero(p.porRacion))
              : caja('Salieron', numero(p.salen) + (p.salen === 1 ? ' ración' : ' raciones'), undefined, true)}
            {porUnidades && (
              <div style={s('background: #FF9F1C; color: #14213D; border-radius: 16px; padding: 12px 14px; display: flex; flex-direction: column; gap: 2px')}>
                <span style={s('font-size: 13px; font-weight: 700')}>Por {p.singular || 'unidad'}</span>
                <span className="num" style={s('font-size: 22px; font-weight: 800')}>{euros(p.costeUnidad ?? 0)}</span>
              </div>
            )}
          </div>
        </section>
        <section style={s('display: flex; flex-direction: column; gap: 8px')}>
          <h2 style={s('margin: 0; font-size: 18px; font-weight: 700')}>Lo que usaste</h2>
          <ul style={s('list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px')}>
            {p.ingredientes.map((i) => (
              <li key={i.productoId} style={s('display: flex; align-items: center; justify-content: space-between; gap: 12px; background: #FFFFFF; border-radius: 16px; padding: 12px 16px; min-height: 58px; box-sizing: border-box')}>
                <span style={s('display: flex; flex-direction: column; gap: 2px; min-width: 0')}>
                  <span style={s('font-size: 15px; font-weight: 700')}>{i.nombreProducto}</span>
                  <span style={s('font-size: 13px; font-weight: 500; color: #4A5672')}>{cantidad(i.cantidad, i.unidad)}</span>
                </span>
                <span className="num" style={s('font-size: 18px; font-weight: 800; flex-shrink: 0')}>{euros(i.cantidad * i.precioUnitario)}</span>
              </li>
            ))}
          </ul>
          <p style={s('margin: 0; font-size: 13px; line-height: 1.45; font-weight: 500; color: #4A5672')}>Con los precios que tenían los productos ese día.</p>
        </section>
      </main>
      <div style={s('padding: 12px 20px max(28px, env(safe-area-inset-bottom)); display: grid; grid-template-columns: 2fr 1fr; gap: 10px')}>
        <Link to={'/produccion/' + p.id + '/corregir'} style={s('height: 60px; border-radius: 18px; background: #14213D; color: #FFFFFF; font-size: 17px; font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 8px')}>
          <ILapiz2 t={20} />
          Corregir
        </Link>
        <button type="button" onClick={() => setConfirmar(true)} style={s('height: 60px; border-radius: 18px; border: 2px solid #DCE2EE; background: #FFFFFF; color: #A1281E; font-size: 17px; font-weight: 800')}>Borrar</button>
      </div>
      {confirmar && (
        <ConfirmarBorrado etiqueta="Borrar producción" titulo="¿Borrar esta producción?" boton="Borrar producción" onBorrar={borrar} onCancelar={() => setConfirmar(false)}>
          <p style={s('margin: 0; font-size: 16px; line-height: 1.45; font-weight: 500; color: #4A5672')}>
            {p.nombrePlato} · {fechaProduccion(p.fecha)}. Desaparecerá del Historial y de Inicio. El plato y sus productos no cambian.
          </p>
        </ConfirmarBorrado>
      )}
    </Pantalla>
  );
}
