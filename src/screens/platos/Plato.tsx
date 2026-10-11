import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { costeIngrediente, costePlato, ppuActual } from '../../calc/calc';
import { cantidad, euros, numero } from '../../calc/format';
import { almacen, useApp } from '../../data/almacen';
import { borrarPlato, duplicarPlato } from '../../data/operaciones';
import { avisoOk, borrarConDeshacer } from '../../ui/avisos';
import { ConfirmarBorrado, estiloBotonCabecera } from '../../ui/comunes';
import { s } from '../../ui/css';
import { IAtras, ICheck, IDuplicar, ILapiz2, IOlla, IPapelera } from '../../ui/iconos';
import { Pantalla } from '../../ui/marco';

export function Plato() {
  const { id } = useParams();
  const { d, todo, cat } = useApp();
  const nav = useNavigate();
  const [confirmar, setConfirmar] = useState(false);
  const pl = d.platos.find((x) => x.id === id);
  if (!pl) {
    return (
      <Pantalla seccion="platos">
        <header style={s('display: flex; align-items: center; gap: 12px; padding: 20px 16px 8px')}>
          <Link to="/platos" aria-label="Volver a Platos" style={s(estiloBotonCabecera)}><IAtras t={26} /></Link>
        </header>
        <main style={s('padding: 12px 20px; font-size: 16px; font-weight: 500; color: #4A5672')}>Este plato ya no existe.</main>
      </Pantalla>
    );
  }
  const l = costePlato(pl, cat, d.ajustes.redondeo);
  const porUnidades = pl.cuenta !== 'raciones';
  const ingredientes = pl.ingredientes.filter((i) => cat.productos.has(i.productoId));

  const duplicar = async () => {
    const c = duplicarPlato(todo, pl.id, Date.now());
    await almacen.guardar(c);
    avisoOk('Plato duplicado', 'Se ha creado «' + c.platos![0].nombre + '»');
  };
  const borrar = () => {
    setConfirmar(false);
    nav('/platos', { replace: true });
    borrarConDeshacer('Plato borrado', borrarPlato(todo, pl.id, Date.now()));
  };
  const caja = (t: string, v: string) => (
    <div style={s('background: rgba(255,255,255,0.08); border-radius: 16px; padding: 12px 14px; display: flex; flex-direction: column; gap: 2px; min-width: 0')}>
      <span style={s('font-size: 13px; font-weight: 600; color: #C9D1E4')}>{t}</span>
      {/* Las palabras largas (empanadillas…) bajan de tamaño para caber en el recuadro */}
      <span className="num" style={s(`font-size: ${v.length > 14 ? 18 : 22}px; font-weight: 800; overflow-wrap: anywhere`)}>{v}</span>
    </div>
  );

  return (
    <Pantalla conMenu={false} seccion="platos">
      <header style={s('display: flex; align-items: center; justify-content: space-between; gap: 8px; padding: 20px 16px 8px')}>
        <Link to="/platos" aria-label="Volver a Platos" style={s(estiloBotonCabecera)}><IAtras t={26} /></Link>
        <Link to={'/historial?plato=' + pl.id} style={s('height: 52px; padding: 0 16px; border-radius: 16px; background: #FFFFFF; display: flex; align-items: center; font-size: 16px; font-weight: 700')}>Historial</Link>
      </header>
      <main style={s('flex: 1; overflow-y: auto; padding: 8px 20px 24px; display: flex; flex-direction: column; gap: 16px')}>
        <h1 className="num" style={s('margin: 0; font-size: 30px; font-weight: 800; line-height: 1.1')}>{pl.nombre}</h1>
        <div style={s('display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px')}>
          <Link to={'/plato/' + pl.id + '/editar'} style={s('height: 52px; border-radius: 16px; background: #14213D; color: #FFFFFF; display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 15px; font-weight: 700')}>
            <ILapiz2 t={18} />
            Editar
          </Link>
          <button type="button" onClick={duplicar} style={s('height: 52px; border-radius: 16px; border: none; background: #FFFFFF; display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 15px; font-weight: 700')}>
            <IDuplicar t={18} />
            Duplicar
          </button>
          <button type="button" onClick={() => setConfirmar(true)} style={s('height: 52px; border-radius: 16px; border: none; background: #FFFFFF; color: #A1281E; display: flex; align-items: center; justify-content: center; gap: 8px; font-size: 15px; font-weight: 700')}>
            <IPapelera t={18} sw={2.2} />
            Borrar
          </button>
        </div>
        <section style={s('background: #14213D; color: #FFFFFF; border-radius: 24px; padding: 22px; display: flex; flex-direction: column; gap: 16px; flex-shrink: 0')}>
          <div style={s('display: flex; justify-content: space-between; align-items: flex-end; gap: 12px')}>
            <span style={s('display: flex; flex-direction: column; gap: 2px')}>
              <span style={s('font-size: 14px; font-weight: 600; color: #C9D1E4')}>Coste por ración</span>
              <span className="num" style={s('font-size: 56px; font-weight: 800; line-height: 1; color: #FF9F1C')}>{euros(l.costeRacion)}</span>
            </span>
            <span style={s('display: flex; flex-direction: column; align-items: flex-end; gap: 2px')}>
              <span style={s('font-size: 14px; font-weight: 600; color: #C9D1E4')}>Lote</span>
              <span className="num" style={s('font-size: 28px; font-weight: 800; line-height: 1')}>{euros(l.costeLote)}</span>
            </span>
          </div>
          {porUnidades ? (
            <div style={s('display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px')}>
              {caja('Salen del lote', numero(pl.salen) + ' ' + pl.cuenta)}
              {caja('Van por ración', numero(pl.porRacion) + ' ' + pl.cuenta)}
              {caja('Raciones', numero(l.raciones))}
              <div style={s('background: #FF9F1C; color: #14213D; border-radius: 16px; padding: 12px 14px; display: flex; flex-direction: column; gap: 2px')}>
                <span style={s('font-size: 13px; font-weight: 700')}>Por {pl.singular || 'unidad'}</span>
                <span className="num" style={s('font-size: 22px; font-weight: 800')}>{euros(l.costeUnidad ?? 0)}</span>
              </div>
            </div>
          ) : (
            <div style={s('display: grid; grid-template-columns: minmax(0, 1fr); gap: 10px')}>
              {caja('Salen del lote', numero(pl.salen) + ' raciones')}
            </div>
          )}
        </section>
        <section style={s('display: flex; flex-direction: column; gap: 10px')}>
          <h2 style={s('margin: 0; font-size: 19px; font-weight: 700')}>Ingredientes</h2>
          <ul style={s('list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 8px')}>
            {ingredientes.map((i) => {
              const p = cat.productos.get(i.productoId)!;
              return (
                <li key={i.productoId}>
                  <Link to={'/producto/' + p.id} style={s('display: flex; align-items: center; justify-content: space-between; gap: 12px; background: #FFFFFF; border-radius: 18px; padding: 14px 16px; min-height: 64px; box-sizing: border-box')}>
                    <span style={s('display: flex; flex-direction: column; gap: 2px; min-width: 0')}>
                      <span style={s('font-size: 16px; font-weight: 700')}>{p.nombre}</span>
                      <span style={s('font-size: 14px; font-weight: 500; color: #4A5672')}>{cantidad(i.cantidad, p.unidad)}</span>
                    </span>
                    <span className="num" style={s('font-size: 20px; font-weight: 800; flex-shrink: 0')}>{euros(costeIngrediente(i.cantidad, ppuActual(cat, p.id)))}</span>
                  </Link>
                </li>
              );
            })}
            {!ingredientes.length && <li style={s('background: #FFFFFF; border-radius: 18px; padding: 16px; font-size: 15px; font-weight: 500; color: #4A5672')}>Este plato todavía no tiene ingredientes.</li>}
          </ul>
        </section>
      </main>
      <div style={s('padding: 12px 20px max(28px, env(safe-area-inset-bottom))')}>
        <Link to={'/produccion/nueva?plato=' + pl.id} style={s('width: 100%; height: 64px; border-radius: 20px; background: #FF9F1C; color: #14213D; font-size: 19px; font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 10px; box-shadow: 0 8px 20px rgba(255,159,28,0.35)')}>
          <IOlla t={24} sw={2.2} />
          Cocinar este plato
        </Link>
      </div>
      {confirmar && (
        <ConfirmarBorrado etiqueta="Borrar plato" titulo={'¿Borrar ' + pl.nombre + '?'} boton="Borrar plato" onBorrar={borrar} onCancelar={() => setConfirmar(false)}>
          <p style={s('margin: 0; font-size: 16px; line-height: 1.45; font-weight: 500; color: #4A5672')}>
            Se borra la receta y {ingredientes.length === 1 ? 'su ingrediente' : 'sus ' + ingredientes.length + ' ingredientes'}.
          </p>
          <div style={s('display: flex; gap: 10px; align-items: flex-start; background: #E6F1E9; color: #1D5A31; border-radius: 14px; padding: 12px 14px')}>
            <ICheck t={20} sw={2.4} style={s('flex-shrink: 0; margin-top: 1px')} />
            <span style={s('font-size: 15px; line-height: 1.4; font-weight: 600')}>Sus producciones guardadas no se borran. Seguirás viéndolas en el Historial.</span>
          </div>
        </ConfirmarBorrado>
      )}
    </Pantalla>
  );
}
