import { Link } from 'react-router-dom';
import { ayerIso, fechaCorta, hoyIso } from '../../calc/fechas';
import { cantidad, euros, numero, raciones, redondeoFrase } from '../../calc/format';
import { s } from '../../ui/css';
import { IAtras, ICheck, IMas, IMenos, IPapelera, ISinConexion } from '../../ui/iconos';
import { BotonFecha } from './BotonFecha';
import type { EstadoProduccion } from './borrador';

const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);
const pastilla = (on: boolean) => 'min-height:48px;padding:0 18px;border-radius:16px;font-size:15px;font-weight:700;box-sizing:border-box;display:inline-flex;align-items:center;justify-content:center;' +
  (on ? 'background:#14213D;color:#FFFFFF;border:2px solid #14213D' : 'background:#FFFFFF;color:#14213D;border:2px solid #DCE2EE');

export function ProduccionOrdenador({ e, onGuardado, onCerrar, rutaCerrar }: {
  e: EstadoProduccion; onGuardado: () => void; onCerrar: () => void; rutaCerrar: string;
}) {
  const b = e.b!;
  const base = e.base;
  const corregir = !!e.original;
  const byUnits = !e.enRaciones;
  const guardarTexto = corregir ? 'Guardar cambios' : e.sinConexion ? 'Guardar en el ordenador' : 'Guardar producción';
  const fechas = [
    { id: 'hoy', label: 'Hoy', f: hoyIso() },
    { id: 'ayer', label: 'Ayer', f: ayerIso() },
    { id: 'otra', label: e.fechaOpcion === 'otra' ? fechaCorta(b.fecha) : 'Otra fecha', f: '' },
  ];

  return (
    <div style={s("min-height: 100dvh; background: #EEF1F8; font-family: 'Figtree', system-ui, sans-serif; color: #14213D; padding: 32px 40px 56px; box-sizing: border-box")}>
      <div style={s('max-width: 1200px; margin: 0 auto; display: flex; flex-direction: column; gap: 28px')}>
        <header style={s('display: flex; flex-wrap: wrap; align-items: center; gap: 16px')}>
          <Link to={rutaCerrar} onClick={onCerrar} aria-label={corregir ? 'Volver al detalle sin guardar' : 'Volver a Inicio'} style={s('width: 52px; height: 52px; border-radius: 16px; background: #FFFFFF; display: flex; align-items: center; justify-content: center')}>
            <IAtras t={26} />
          </Link>
          <h1 className="num" style={s('margin: 0; font-size: 38px; font-weight: 800')}>{corregir ? 'Corregir producción' : 'Nueva producción'}</h1>
        </header>
        {e.sinConexion && (
          <div role="status" style={s('display: flex; align-items: flex-start; gap: 10px; background: #FFE8C7; color: #5C2E00; border-radius: 16px; padding: 12px 14px')}>
            <ISinConexion t={22} style={s('flex-shrink: 0')} />
            <span style={s('display: flex; flex-direction: column; gap: 2px')}>
              <span style={s('font-size: 15px; font-weight: 800')}>Sin conexión</span>
              <span style={s('font-size: 14px; font-weight: 500; line-height: 1.35')}>Sigue cocinando. Todo se guarda en este ordenador y se sube solo al volver la conexión.</span>
            </span>
          </div>
        )}
        <div style={s('display: flex; flex-wrap: wrap; gap: 28px; align-items: flex-start')}>
          <div style={s('flex: 999 1 560px; min-width: 0; display: flex; flex-direction: column; gap: 24px')}>
            <section style={s('background: #FFFFFF; border-radius: 24px; padding: 24px; display: flex; flex-direction: column; gap: 18px')}>
              <div style={s('display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 12px')}>
                <h2 style={s('margin: 0; font-size: 20px; font-weight: 700')}><span className="num" style={s('color: #9A4A00')}>1</span> · Plato y fecha</h2>
                <div role="group" aria-label="Fecha" style={s('display: flex; gap: 8px; align-items: center')}>
                  {corregir && <span style={s('font-size: 14px; font-weight: 600; color: #4A5672; margin-right: 4px')}>guardada: {fechaCorta(e.original!.fecha)}</span>}
                  {fechas.map((f) => {
                    const on = e.fechaOpcion === f.id;
                    if (f.id === 'otra') return <BotonFecha key={f.id} fecha={b.fecha} onFecha={e.setFecha} style={s(pastilla(on))} pressed={on}>{f.label}</BotonFecha>;
                    return <button key={f.id} type="button" onClick={() => e.setFecha(f.f)} aria-pressed={on} style={s(pastilla(on))}>{f.label}</button>;
                  })}
                </div>
              </div>
              <div role="group" aria-label="Plato" style={s('display: flex; flex-wrap: wrap; gap: 10px')}>
                {corregir ? (
                  <span style={s(pastilla(true) + ';min-height:52px')}>{base?.nombre}</span>
                ) : e.platos.map((pl) => (
                  <button key={pl.id} type="button" onClick={() => e.elegirPlato(pl)} aria-pressed={b.platoId === pl.id} style={s(pastilla(b.platoId === pl.id) + ';min-height:52px')}>{pl.nombre}</button>
                ))}
                {!corregir && !e.platos.length && (
                  <Link to="/platos" style={s('font-size: 16px; font-weight: 600; color: #4A5672')}>Todavía no tienes platos. Guarda tu primera receta en Platos y vuelve aquí.</Link>
                )}
              </div>
            </section>
            {base && (
              <section style={s('display: flex; flex-direction: column; gap: 14px')}>
                <div style={s('display: flex; justify-content: space-between; align-items: baseline')}>
                  <span style={s('display: flex; flex-direction: column; gap: 2px')}>
                    <h2 style={s('margin: 0; font-size: 20px; font-weight: 700')}><span className="num" style={s('color: #9A4A00')}>2</span> · Lo que has usado de verdad</h2>
                    <span style={s('font-size: 14px; font-weight: 600; color: #4A5672')}>Usa − y + o haz clic en el número para escribirlo</span>
                  </span>
                  {e.plato && (
                    <button type="button" onClick={e.volverAReceta} style={s('height: 44px; padding: 0 14px; border-radius: 12px; border: none; background: transparent; font-size: 15px; font-weight: 700')}>Volver a la receta</button>
                  )}
                </div>
                <div style={s('display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 14px')}>
                  {e.items.map((it) => {
                    const cambiado = it.receta > 0 && Math.abs(it.cantidad - it.receta) > 1e-9;
                    const nota = it.receta === 0 ? 'Añadido hoy' : cambiado ? 'Receta: ' + cantidad(it.receta, it.unidad) : 'Como en la receta';
                    return (
                      <div key={it.productoId} style={s('background: #FFFFFF; border-radius: 22px; padding: 16px 16px 16px 20px; display: flex; flex-direction: column; gap: 12px')}>
                        <div style={s('display: flex; align-items: flex-start; justify-content: space-between; gap: 10px')}>
                          <span style={s('display: flex; flex-direction: column; gap: 2px; min-width: 0')}>
                            <span style={s('font-size: 17px; font-weight: 700')}>{it.nombre}</span>
                            <span style={s('font-size:13px;font-weight:700;color:' + (cambiado || it.receta === 0 ? '#9A4A00' : '#4A5672'))}>{nota}</span>
                          </span>
                          <span style={s('display: flex; align-items: center; gap: 4px; flex-shrink: 0')}>
                            <span className="num" style={s('font-size: 22px; font-weight: 800')}>{euros(it.coste)}</span>
                            <button type="button" onClick={() => e.quitar(it)} aria-label="Quitar ingrediente" style={s('width: 44px; height: 44px; border-radius: 12px; border: none; background: transparent; color: #4A5672; display: flex; align-items: center; justify-content: center')}>
                              <IPapelera t={20} />
                            </button>
                          </span>
                        </div>
                        {e.editando !== it.i ? (
                          <div style={s('display: flex; align-items: center; justify-content: space-between; gap: 10px; background: #EEF1F8; border-radius: 16px; padding: 6px')}>
                            <button type="button" onClick={() => e.menos(it)} aria-label="Menos" style={s('width: 56px; height: 52px; border-radius: 12px; border: none; background: #FFFFFF; display: flex; align-items: center; justify-content: center')}>
                              <IMenos />
                            </button>
                            <button type="button" onClick={() => e.empezarEdicion(it)} aria-label="Escribir cantidad" className="num" style={s('border: none; background: transparent; padding: 0 6px; min-height: 44px; font-size: 24px; font-weight: 800; text-decoration: underline dashed #9AA6C0; text-underline-offset: 6px; text-decoration-thickness: 2px')}>
                              {cantidad(it.cantidad, it.unidad)}
                            </button>
                            <button type="button" onClick={() => e.mas(it)} aria-label="Más" style={s('width: 56px; height: 52px; border-radius: 12px; border: none; background: #14213D; color: #FFFFFF; display: flex; align-items: center; justify-content: center')}>
                              <IMas sw={2.8} />
                            </button>
                          </div>
                        ) : (
                          <form onSubmit={(ev) => { ev.preventDefault(); e.terminarEdicion(); }} style={s('display: flex; align-items: center; gap: 8px; background: #EEF1F8; border-radius: 16px; padding: 6px')}>
                            <label style={s('flex: 1; display: flex; align-items: center; gap: 8px; height: 52px; background: #FFFFFF; border-radius: 12px; padding: 0 14px; border: 2px solid #FF9F1C; min-width: 0; box-sizing: border-box')}>
                              <span className="sr">Cantidad de {it.nombre}</span>
                              <input type="text" inputMode="decimal" autoFocus value={e.texto} onChange={(ev) => e.setTexto(ev.target.value)} onFocus={(ev) => ev.target.select()} className="num" style={s('flex: 1; min-width: 0; border: none; outline: none; background: transparent; font-size: 22px; font-weight: 800')} />
                              <span style={s('font-size: 16px; font-weight: 700; color: #4A5672')}>{it.unidad === 'envase' ? 'env.' : it.unidad}</span>
                            </label>
                            <button type="submit" style={s('height: 52px; padding: 0 16px; border-radius: 12px; border: none; background: #14213D; color: #FFFFFF; font-size: 15px; font-weight: 800')}>Listo</button>
                          </form>
                        )}
                      </div>
                    );
                  })}
                  <div style={s('border: 2px dashed #9AA6C0; border-radius: 22px; padding: 16px; display: flex; flex-direction: column; gap: 10px')}>
                    <span style={s('font-size: 16px; font-weight: 700')}>Añadir ingrediente</span>
                    <div style={s('display: flex; flex-wrap: wrap; gap: 8px')}>
                      {e.disponibles.map((p) => (
                        <button key={p.id} type="button" onClick={() => e.anadir(p.id)} style={s('height: 44px; padding: 0 14px; border-radius: 12px; border: 2px solid #DCE2EE; background: #FFFFFF; font-size: 14px; font-weight: 700')}>+ {p.nombre}</button>
                      ))}
                    </div>
                  </div>
                </div>
              </section>
            )}
          </div>
          <aside aria-live="polite" style={s('flex: 1 1 340px; min-width: 0; background: #14213D; color: #FFFFFF; border-radius: 28px; padding: 28px; display: flex; flex-direction: column; gap: 22px; position: sticky; top: 24px')}>
            <span style={s('display: flex; flex-direction: column; gap: 2px')}>
              <span style={s('font-size: 15px; font-weight: 600; color: #C9D1E4')}>{base?.nombre ?? 'Elige un plato'} · {fechaCorta(b.fecha)}</span>
              <span className="num" style={s('font-size: 20px; font-weight: 800')}><span style={s('color: #FF9F1C')}>3</span> · Resultado</span>
            </span>
            {base && (
              <div style={s('display: flex; flex-direction: column; gap: 10px; background: rgba(255,255,255,0.08); border-radius: 20px; padding: 16px')}>
                <span style={s('display: flex; flex-direction: column; gap: 2px')}>
                  <span style={s('font-size: 15px; font-weight: 700')}>{byUnits ? cap(base.cuenta) + ' que han salido' : 'Raciones que han salido'}</span>
                  <span style={s('font-size: 13px; font-weight: 500; color: #C9D1E4')}>{byUnits ? 'La receta da ' + numero(base.salen) + ' · van ' + numero(base.porRacion) + ' por ración' : 'La receta da ' + numero(base.salen)}</span>
                </span>
                <div style={s('display: flex; align-items: center; justify-content: space-between')}>
                  <button type="button" onClick={e.menosSalen} aria-label="Una menos" style={s('width: 56px; height: 52px; border-radius: 14px; border: none; background: #FFFFFF; color: #14213D; display: flex; align-items: center; justify-content: center')}>
                    <IMenos />
                  </button>
                  <span className="num" style={s('font-size: 34px; font-weight: 800')}>{numero(b.salen)}</span>
                  <button type="button" onClick={e.masSalen} aria-label="Una más" style={s('width: 56px; height: 52px; border-radius: 14px; border: none; background: #FF9F1C; color: #14213D; display: flex; align-items: center; justify-content: center')}>
                    <IMas sw={2.8} />
                  </button>
                </div>
                {byUnits && (
                  <div style={s('display: flex; justify-content: space-between; align-items: baseline; padding: 0 4px')}>
                    <span style={s('font-size: 14px; font-weight: 600; color: #C9D1E4')}>Salen</span>
                    <span className="num" style={s('font-size: 22px; font-weight: 800')}>{raciones(e.lote.raciones)}</span>
                  </div>
                )}
              </div>
            )}
            <div style={s('display: flex; flex-direction: column; align-items: center; gap: 4px; text-align: center; padding: 8px 0')}>
              <span style={s('font-size: 16px; font-weight: 700; color: #C9D1E4')}>Cobra a tus amigos</span>
              <span className="num" style={s('font-size: 104px; font-weight: 800; line-height: 1; color: #FF9F1C')}>{euros(e.lote.precioCobrar)}</span>
              <span style={s('font-size: 18px; font-weight: 700')}>por ración</span>
            </div>
            <div style={s('display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px')}>
              <DatoOscuro t="Coste del lote" v={euros(e.lote.costeLote)} />
              <DatoOscuro t="Coste por ración" v={euros(e.lote.costeRacion)} />
              {byUnits && (
                <>
                  <div style={s('background: #FFE8C7; color: #14213D; border-radius: 16px; padding: 14px; display: flex; flex-direction: column; gap: 2px')}>
                    <span style={s('font-size: 13px; font-weight: 700; color: #7A3E00')}>Por {base?.singular || 'unidad'}</span>
                    <span className="num" style={s('font-size: 26px; font-weight: 800')}>{euros(e.lote.costeUnidad ?? 0)}</span>
                  </div>
                  <DatoOscuro t="Raciones" v={numero(e.lote.raciones)} />
                </>
              )}
            </div>
            <span style={s('font-size: 13px; font-weight: 500; color: #C9D1E4; text-align: center')}>Redondeado al alza a {redondeoFrase(e.redondeo)}</span>
            <button type="button" disabled={!base} onClick={() => { e.terminarEdicion(); onGuardado(); }} style={s('height: 64px; border: none; border-radius: 20px; background: #FF9F1C; color: #14213D; font-size: 19px; font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 10px')}>
              <ICheck t={24} />
              {guardarTexto}
            </button>
          </aside>
        </div>
      </div>
    </div>
  );
}

function DatoOscuro({ t, v }: { t: string; v: string }) {
  return (
    <div style={s('background: rgba(255,255,255,0.08); border-radius: 16px; padding: 14px; display: flex; flex-direction: column; gap: 2px')}>
      <span style={s('font-size: 13px; font-weight: 600; color: #C9D1E4')}>{t}</span>
      <span className="num" style={s('font-size: 26px; font-weight: 800')}>{v}</span>
    </div>
  );
}
