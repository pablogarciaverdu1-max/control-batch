import { useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { deIso, diaMes, fechaCorta } from '../../calc/fechas';
import { euros, eurosSinSimbolo, numero } from '../../calc/format';
import { useApp } from '../../data/almacen';
import type { Produccion } from '../../data/model';
import { s } from '../../ui/css';
import { IReloj, ISiguiente } from '../../ui/iconos';
import { Pantalla } from '../../ui/marco';
import { ordenarProducciones } from '../Inicio';

/** "Dom 11 oct" (y el año si no es el actual) */
export function fechaProduccion(f: string): string {
  const anio = deIso(f).getFullYear();
  return fechaCorta(f) + (anio !== new Date().getFullYear() ? ' ' + anio : '');
}

export function Historial() {
  const { d } = useApp();
  const [q] = useSearchParams();
  // Platos que se pueden elegir: los que existen y los borrados que tienen producciones
  const opciones = new Map<string, string>();
  for (const pl of d.platos) opciones.set(pl.id, pl.nombre);
  for (const p of ordenarProducciones(d.producciones)) if (!opciones.has(p.platoId)) opciones.set(p.platoId, p.nombrePlato);
  const masReciente = ordenarProducciones(d.producciones)[0]?.platoId;
  const [elegido, setElegido] = useState<string>(() => {
    const pedido = q.get('plato');
    return pedido && opciones.has(pedido) ? pedido : masReciente ?? [...opciones.keys()][0] ?? '';
  });
  const actual = opciones.has(elegido) ? elegido : [...opciones.keys()][0] ?? '';
  const lista: Produccion[] = ordenarProducciones(d.producciones.filter((p) => p.platoId === actual)).reverse(); // de más antigua a más reciente
  const nombre = opciones.get(actual) ?? '';
  const ult = lista[lista.length - 1];
  const serie = lista.slice(-6);
  const max = Math.max(...serie.map((x) => x.costeRacion)), min = Math.min(...serie.map((x) => x.costeRacion));

  let tendencia = 'Primera vez';
  let estiloTendencia = 'background:rgba(255,255,255,0.12);border-radius:12px;padding:8px 12px;font-size:14px;font-weight:700;flex-shrink:0';
  if (lista.length > 1) {
    const dif = lista[lista.length - 1].costeRacion - lista[lista.length - 2].costeRacion;
    tendencia = (dif >= 0 ? '+' : '−') + eurosSinSimbolo(Math.abs(dif)) + ' € vs. anterior';
    estiloTendencia = 'border-radius:12px;padding:8px 12px;font-size:14px;font-weight:700;flex-shrink:0;' + (dif > 0 ? 'background:#FF9F1C;color:#14213D' : 'background:#CFEAD8;color:#14213D');
  }

  return (
    <Pantalla seccion="historial">
      <header style={s('padding: 28px 0 10px; display: flex; flex-direction: column; gap: 14px')}>
        <h1 className="num" style={s('margin: 0; padding: 0 20px; font-size: 34px; font-weight: 800')}>Historial</h1>
        {opciones.size > 0 && (
          <div role="group" aria-label="Elegir plato" style={s('display: flex; gap: 8px; overflow-x: auto; padding: 0 20px 4px; scrollbar-width: none')}>
            {[...opciones].map(([id, n]) => (
              <button key={id} type="button" onClick={() => setElegido(id)} aria-pressed={actual === id}
                style={s('height:44px;padding:0 16px;border-radius:22px;font-size:15px;font-weight:700;white-space:nowrap;flex-shrink:0;' +
                  (actual === id ? 'background:#14213D;color:#FFFFFF;border:2px solid #14213D' : 'background:#FFFFFF;color:#14213D;border:2px solid #DCE2EE'))}>{n}</button>
            ))}
          </div>
        )}
      </header>
      <main style={s('flex: 1; overflow-y: auto; padding: 6px 20px 24px; display: flex; flex-direction: column; gap: 14px')}>
        {!d.producciones.length ? (
          <section style={s('background: #FFFFFF; border-radius: 28px; padding: 28px 22px; display: flex; flex-direction: column; align-items: center; gap: 12px; text-align: center')}>
            <span style={s('width: 96px; height: 96px; border-radius: 32px; background: #EEF1F8; display: flex; align-items: center; justify-content: center')}>
              <IReloj t={52} sw={1.6} c="#14213D" />
            </span>
            <h2 className="num" style={s('margin: 0; font-size: 24px; font-weight: 800')}>Todavía no hay producciones</h2>
            <p style={s('margin: 0; font-size: 16px; line-height: 1.45; font-weight: 500; color: #4A5672')}>Cada vez que guardes un lote aparecerá aquí, con lo que te costó y lo que cobraste.</p>
            <Link to="/produccion/nueva" style={s('margin-top: 8px; align-self: stretch; height: 64px; border-radius: 20px; background: #FF9F1C; color: #14213D; font-size: 19px; font-weight: 800; display: flex; align-items: center; justify-content: center')}>Nueva producción</Link>
          </section>
        ) : !lista.length ? (
          <section style={s('background: #FFFFFF; border-radius: 24px; padding: 20px; display: flex; flex-direction: column; gap: 12px')}>
            <span style={s('font-size: 16px; font-weight: 600; color: #4A5672; line-height: 1.45')}>Todavía no has cocinado {nombre}. Cuando lo hagas, verás aquí cómo cambia el coste de una vez a otra.</span>
            <Link to={'/produccion/nueva?plato=' + actual} style={s('height: 56px; border-radius: 18px; background: #FF9F1C; color: #14213D; font-size: 17px; font-weight: 800; display: flex; align-items: center; justify-content: center')}>Cocinar este plato</Link>
          </section>
        ) : (
          <>
            <section style={s('background: #14213D; color: #FFFFFF; border-radius: 24px; padding: 20px; display: flex; flex-direction: column; gap: 16px; flex-shrink: 0')}>
              <div style={s('display: flex; justify-content: space-between; align-items: flex-end; gap: 12px')}>
                <span style={s('display: flex; flex-direction: column; gap: 2px; min-width: 0')}>
                  <span style={s('font-size: 14px; font-weight: 600; color: #C9D1E4')}>{nombre}</span>
                  <span style={s('font-size: 13px; font-weight: 500; color: #C9D1E4')}>Coste por ración, última vez</span>
                  <span className="num" style={s('font-size: 48px; font-weight: 800; line-height: 1; color: #FF9F1C')}>{euros(ult.costeRacion)}</span>
                </span>
                <span style={s(estiloTendencia)}>{tendencia}</span>
              </div>
              {lista.length > 1 ? (
                <div aria-hidden="true" style={s('display: flex; align-items: flex-end; gap: 10px; height: 110px')}>
                  {serie.map((x, i) => (
                    <div key={x.id} style={s('flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; gap: 6px; height: 100%; min-width: 0')}>
                      <span className="num" style={s('font-size: 13px; font-weight: 700')}>{eurosSinSimbolo(x.costeRacion)}</span>
                      <div style={s('width:100%;max-width:48px;border-radius:10px 10px 4px 4px;background:' + (i === serie.length - 1 ? '#FF9F1C' : 'rgba(255,255,255,0.28)') +
                        ';height:' + Math.round(max === min ? 56 : 24 + ((x.costeRacion - min) / (max - min)) * 44) + 'px')} />
                      <span style={s('font-size: 12px; font-weight: 600; color: #C9D1E4; white-space: nowrap')}>{diaMes(x.fecha)}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p style={s('margin: 0; font-size: 14px; line-height: 1.45; font-weight: 500; color: #C9D1E4')}>La próxima vez que lo cocines verás aquí cómo cambia el coste de una vez a otra.</p>
              )}
            </section>
            <h2 style={s('margin: 4px 0 0; font-size: 18px; font-weight: 700')}>{lista.length === 1 ? '1 producción' : lista.length + ' producciones'}</h2>
            {lista.slice().reverse().map((x) => {
              const porUnidades = x.cuenta !== 'raciones';
              return (
                <Link key={x.id} to={'/produccion/' + x.id} style={s('background: #FFFFFF; border-radius: 20px; padding: 16px 18px; display: flex; flex-direction: column; gap: 12px; flex-shrink: 0')}>
                  <div style={s('display: flex; justify-content: space-between; align-items: baseline')}>
                    <span style={s('font-size: 17px; font-weight: 700')}>{fechaProduccion(x.fecha)}</span>
                    <span style={s('display: flex; align-items: baseline; gap: 4px')}>
                      <span className="num" style={s('font-size: 26px; font-weight: 800')}>{euros(x.precioCobrar)}</span>
                      <span style={s('font-size: 13px; font-weight: 600; color: #4A5672')}>cobrado</span>
                    </span>
                  </div>
                  <div style={s('display: flex; gap: 8px; flex-wrap: wrap')}>
                    <span style={s('background: #EEF1F8; border-radius: 10px; padding: 6px 10px; font-size: 14px; font-weight: 600')}>Lote {euros(x.costeLote)}</span>
                    <span style={s('background: #EEF1F8; border-radius: 10px; padding: 6px 10px; font-size: 14px; font-weight: 600')}>
                      {porUnidades ? numero(x.salen) + ' ' + x.cuenta + ' · ' + numero(x.raciones) + ' raciones' : numero(x.salen) + ' raciones'}
                    </span>
                    <span style={s('background: #EEF1F8; border-radius: 10px; padding: 6px 10px; font-size: 14px; font-weight: 600')}>{euros(x.costeRacion)}/ración</span>
                    {porUnidades && (
                      <span style={s('background: #FFE8C7; color: #7A3E00; border-radius: 10px; padding: 6px 10px; font-size: 14px; font-weight: 700')}>{euros(x.costeUnidad ?? 0)} por {x.singular || 'unidad'}</span>
                    )}
                  </div>
                  <span style={s('display: flex; align-items: center; gap: 4px; font-size: 14px; font-weight: 700; color: #4A5672')}>Ver detalle, corregir o borrar
                    <ISiguiente t={16} sw={2.4} />
                  </span>
                </Link>
              );
            })}
          </>
        )}
      </main>
    </Pantalla>
  );
}
