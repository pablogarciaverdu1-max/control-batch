import { Link } from 'react-router-dom';
import { costePlato } from '../../calc/calc';
import { euros, numero, raciones } from '../../calc/format';
import { useApp } from '../../data/almacen';
import type { Plato } from '../../data/model';
import { s } from '../../ui/css';
import { IMas, IOlla, ISiguiente } from '../../ui/iconos';
import { Pantalla } from '../../ui/marco';

/** "4 raciones" o "30 albóndigas (6 raciones)" */
export function salenTexto(pl: Plato): string {
  if (pl.cuenta === 'raciones') return raciones(pl.salen);
  return numero(pl.salen) + ' ' + pl.cuenta + ' (' + raciones(pl.salen / (pl.porRacion || 1)) + ')';
}

export function Platos() {
  const { d, cat } = useApp();
  const r = d.ajustes.redondeo;
  return (
    <Pantalla seccion="platos">
      <header style={s('padding: 28px 20px 12px; display: flex; align-items: center; justify-content: space-between')}>
        <div style={s('display: flex; flex-direction: column; gap: 2px')}>
          <h1 className="num" style={s('margin: 0; font-size: 34px; font-weight: 800')}>Platos</h1>
          <span style={s('font-size: 15px; font-weight: 500; color: #4A5672')}>Coste por ración con los precios de hoy</span>
        </div>
        <Link to="/plato/nuevo" style={s('height: 56px; padding: 0 16px 0 12px; border-radius: 18px; background: #FF9F1C; color: #14213D; display: flex; align-items: center; gap: 6px; flex-shrink: 0; font-size: 16px; font-weight: 800')}>
          <IMas t={24} />
          Nuevo plato
        </Link>
      </header>
      <main style={s('flex: 1; overflow-y: auto; padding: 8px 20px 24px; display: flex; flex-direction: column; gap: 12px')}>
        {d.platos.map((pl) => {
          const l = costePlato(pl, cat, r);
          const n = pl.ingredientes.filter((i) => cat.productos.has(i.productoId)).length;
          return (
            <Link key={pl.id} to={'/plato/' + pl.id} style={s('display: flex; flex-direction: column; gap: 14px; background: #FFFFFF; border-radius: 22px; padding: 18px; box-sizing: border-box; flex-shrink: 0')}>
              <span style={s('display: flex; justify-content: space-between; align-items: flex-start; gap: 12px')}>
                <span style={s('font-size: 19px; font-weight: 700; line-height: 1.25')}>{pl.nombre}</span>
                <ISiguiente t={22} sw={2.4} c="#4A5672" style={s('flex-shrink: 0; margin-top: 2px')} />
              </span>
              <span style={s('display: flex; justify-content: space-between; align-items: flex-end; gap: 12px')}>
                <span style={s('display: flex; flex-direction: column; gap: 4px; font-size: 14px; font-weight: 500; color: #4A5672')}>
                  <span>{n === 1 ? '1 ingrediente' : n + ' ingredientes'} · salen {salenTexto(pl)}</span>
                  {l.costeUnidad !== null && (
                    <span style={s('align-self: flex-start; background: #FFE8C7; color: #7A3E00; border-radius: 8px; padding: 3px 8px; font-size: 13px; font-weight: 700')}>{euros(l.costeUnidad)} por {pl.singular || 'unidad'}</span>
                  )}
                </span>
                <span style={s('display: flex; flex-direction: column; align-items: flex-end')}>
                  <span className="num" style={s('font-size: 30px; font-weight: 800; line-height: 1')}>{euros(l.costeRacion)}</span>
                  <span style={s('font-size: 12px; font-weight: 600; color: #4A5672')}>coste por ración</span>
                </span>
              </span>
            </Link>
          );
        })}
        {!d.platos.length && (
          <section style={s('background: #FFFFFF; border-radius: 28px; padding: 28px 22px; display: flex; flex-direction: column; align-items: center; gap: 12px; text-align: center')}>
            <span style={s('width: 96px; height: 96px; border-radius: 32px; background: #EEF1F8; display: flex; align-items: center; justify-content: center')}>
              <IOlla t={52} sw={1.6} c="#14213D" vapor="#FF9F1C" />
            </span>
            <h2 className="num" style={s('margin: 0; font-size: 24px; font-weight: 800')}>Todavía no tienes platos</h2>
            <p style={s('margin: 0; font-size: 16px; line-height: 1.45; font-weight: 500; color: #4A5672')}>Guarda tus recetas con sus ingredientes y verás al momento cuánto cuesta cada ración.</p>
          </section>
        )}
      </main>
    </Pantalla>
  );
}
