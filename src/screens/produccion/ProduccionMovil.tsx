import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ayerIso, fechaCorta, hoyIso } from '../../calc/fechas';
import { cantidad, euros, numero, precioPorUnidad, raciones, redondeoFrase } from '../../calc/format';
import { s } from '../../ui/css';
import { IAtras, IBuscar, ICerrar, ICheck, ILapiz, IMas, IMenos, IPapelera, ISiguiente, ISinConexion } from '../../ui/iconos';
import { BotonFecha } from './BotonFecha';
import type { EstadoProduccion } from './borrador';

const NOMBRES_PASO = { 1: 'Plato y fecha', 2: 'Cantidades', 3: 'Resultado' } as const;
const cap = (t: string) => t.charAt(0).toUpperCase() + t.slice(1);

export function ProduccionMovil({ e, onGuardado, onCerrar, rutaCerrar }: {
  e: EstadoProduccion; onGuardado: () => void; onCerrar: () => void; rutaCerrar: string;
}) {
  const [anadiendo, setAnadiendo] = useState(false);
  const [buscar, setBuscar] = useState('');
  const b = e.b!;
  const corregir = !!e.original;
  const base = e.base;
  const byUnits = !e.enRaciones;
  const paso = b.paso;

  const opcionesFecha = [
    { id: 'hoy', label: 'Hoy', sub: fechaCorta(hoyIso()), f: hoyIso() },
    { id: 'ayer', label: 'Ayer', sub: fechaCorta(ayerIso()), f: ayerIso() },
    { id: 'otra', label: 'Otra', sub: e.fechaOpcion === 'otra' ? fechaCorta(b.fecha) : 'Elegir día', f: '' },
  ];
  const fechas = (grande: boolean) => opcionesFecha.map((o) => {
    const on = e.fechaOpcion === o.id;
    const st = s('min-height:68px;border-radius:18px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:2px;box-sizing:border-box;' +
      (on ? 'background:#14213D;color:#FFFFFF;border:2px solid #14213D' : 'background:#FFFFFF;color:#14213D;border:2px solid #DCE2EE'));
    const contenido = (
      <>
        <span style={s(`font-size: ${grande ? 17 : 16}px; font-weight: 800`)}>{o.label}</span>
        <span style={s(`font-size: ${grande ? 13 : 12}px; font-weight: 600`)}>{o.sub}</span>
      </>
    );
    if (o.id === 'otra') return <BotonFecha key={o.id} fecha={b.fecha} onFecha={e.setFecha} style={st} pressed={on}>{contenido}</BotonFecha>;
    return <button key={o.id} type="button" onClick={() => e.setFecha(o.f)} aria-pressed={on} style={st}>{contenido}</button>;
  });

  const q = buscar.trim().toLowerCase();
  const disponibles = e.disponibles.filter((p) => !q || p.nombre.toLowerCase().includes(q));
  const guardarTexto = corregir ? 'Guardar cambios' : e.sinConexion ? 'Guardar en el móvil' : 'Guardar producción';

  return (
    <div style={s("height: 100dvh; background: #EEF1F8; display: flex; flex-direction: column; overflow: hidden; position: relative; font-family: 'Figtree', system-ui, sans-serif; color: #14213D")}>
      <header style={s('display: flex; flex-direction: column; gap: 12px; padding: 20px 16px 10px')}>
        <div style={s('display: flex; align-items: center; gap: 12px')}>
          {corregir && paso <= 2 && (
            <Link to={rutaCerrar} onClick={onCerrar} aria-label="Volver al detalle sin guardar" style={s('width: 52px; height: 52px; border-radius: 16px; background: #FFFFFF; display: flex; align-items: center; justify-content: center; flex-shrink: 0')}>
              <ICerrar />
            </Link>
          )}
          {!corregir && paso === 1 && (
            <Link to={rutaCerrar} aria-label="Cerrar" style={s('width: 52px; height: 52px; border-radius: 16px; background: #FFFFFF; display: flex; align-items: center; justify-content: center; flex-shrink: 0')}>
              <ICerrar />
            </Link>
          )}
          {paso !== 1 && !(corregir && paso === 2) && (
            <button type="button" onClick={() => e.setPaso((paso - 1) as 1 | 2)} aria-label="Paso anterior" style={s('width: 52px; height: 52px; border-radius: 16px; border: none; background: #FFFFFF; display: flex; align-items: center; justify-content: center; flex-shrink: 0')}>
              <IAtras t={26} />
            </button>
          )}
          <div style={s('display: flex; flex-direction: column; gap: 2px; min-width: 0')}>
            <span style={s('font-size: 14px; font-weight: 700; color: #4A5672')}>Paso {paso} de 3 · {(corregir ? 'Corrigiendo · ' : '') + NOMBRES_PASO[paso]}</span>
            <h1 className="num" style={s('margin: 0; font-size: 22px; font-weight: 800; line-height: 1.15')}>{paso === 1 ? 'Nueva producción' : base?.nombre}</h1>
          </div>
        </div>
        <div aria-hidden="true" style={s('display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 6px')}>
          {[1, 2, 3].map((n) => <div key={n} style={s('height:6px;border-radius:3px;background:' + (n <= paso ? '#FF9F1C' : '#DCE2EE'))} />)}
        </div>
        {e.sinConexion && (
          <div role="status" style={s('display: flex; align-items: flex-start; gap: 10px; background: #FFE8C7; color: #5C2E00; border-radius: 16px; padding: 12px 14px')}>
            <ISinConexion t={22} style={s('flex-shrink: 0')} />
            <span style={s('display: flex; flex-direction: column; gap: 2px')}>
              <span style={s('font-size: 15px; font-weight: 800')}>Sin conexión</span>
              <span style={s('font-size: 14px; font-weight: 500; line-height: 1.35')}>Sigue cocinando. Todo se guarda en el móvil y se sube solo al volver la conexión.</span>
            </span>
          </div>
        )}
      </header>

      {paso === 1 && (
        <main style={s('flex: 1; overflow-y: auto; padding: 8px 20px 20px; display: flex; flex-direction: column; gap: 20px')}>
          <section role="group" aria-label="Fecha" style={s('display: flex; flex-direction: column; gap: 10px')}>
            <h2 style={s('margin: 0; font-size: 17px; font-weight: 700')}>¿Cuándo cocinas?</h2>
            <div style={s('display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px')}>{fechas(true)}</div>
          </section>
          <section role="group" aria-label="Plato" style={s('display: flex; flex-direction: column; gap: 10px')}>
            <h2 style={s('margin: 0; font-size: 17px; font-weight: 700')}>¿Qué plato?</h2>
            {e.platos.map((pl) => {
              const on = b.platoId === pl.id;
              const salen = pl.cuenta === 'raciones' ? 'Salen ' + numero(pl.salen) + ' raciones' : 'Salen ' + numero(pl.salen) + ' ' + pl.cuenta + ' · ' + numero(pl.porRacion) + ' por ración';
              return (
                <button key={pl.id} type="button" onClick={() => e.elegirPlato(pl)} aria-pressed={on}
                  style={s('display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:72px;padding:14px 16px 14px 18px;border-radius:20px;' +
                    (on ? 'background:#14213D;color:#FFFFFF;border:2px solid #14213D' : 'background:#FFFFFF;color:#14213D;border:2px solid #FFFFFF'))}>
                  <span style={s('display: flex; flex-direction: column; gap: 3px; text-align: left')}>
                    <span style={s('font-size: 17px; font-weight: 700; line-height: 1.25')}>{pl.nombre}</span>
                    <span style={s('font-size: 14px; font-weight: 500; opacity: 0.85')}>{salen}</span>
                  </span>
                  <span style={s('width:32px;height:32px;border-radius:50%;flex-shrink:0;display:flex;align-items:center;justify-content:center;' + (on ? 'background:#FF9F1C' : 'opacity:0'))}>
                    <ICheck t={18} sw={3} c="#14213D" />
                  </span>
                </button>
              );
            })}
            {!e.platos.length && (
              <Link to="/platos" style={s('background: #FFFFFF; border-radius: 20px; padding: 16px 18px; font-size: 16px; font-weight: 600; color: #4A5672; line-height: 1.45')}>
                Todavía no tienes platos. Guarda tu primera receta en Platos y vuelve aquí.
              </Link>
            )}
          </section>
        </main>
      )}

      {paso === 2 && base && (
        <main style={s('flex: 1; overflow-y: auto; padding: 8px 20px 20px; display: flex; flex-direction: column; gap: 10px')}>
          {corregir && (
            <section role="group" aria-label="Fecha de la producción" style={s('background: #FFFFFF; border: 2px solid #14213D; border-radius: 22px; padding: 14px; display: flex; flex-direction: column; gap: 10px; margin-bottom: 4px')}>
              <span style={s('display: flex; justify-content: space-between; align-items: baseline')}>
                <span style={s('font-size: 16px; font-weight: 700')}>Fecha</span>
                <span style={s('font-size: 14px; font-weight: 600; color: #4A5672')}>guardada: {fechaCorta(e.original!.fecha)}</span>
              </span>
              <div style={s('display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px')}>{fechas(false)}</div>
            </section>
          )}
          <span style={s('display: flex; align-items: center; gap: 8px; font-size: 15px; font-weight: 600; color: #4A5672')}>
            <ILapiz t={18} />
            Usa − y + o toca el número para escribirlo
          </span>
          {e.items.map((it) => {
            const cambiado = it.receta > 0 && Math.abs(it.cantidad - it.receta) > 1e-9;
            const nota = it.receta === 0 ? 'Añadido hoy' : cambiado ? 'Receta: ' + cantidad(it.receta, it.unidad) : 'Como en la receta';
            return (
              <div key={it.productoId} style={s('background: #FFFFFF; border-radius: 22px; padding: 14px 14px 14px 18px; display: flex; flex-direction: column; gap: 10px')}>
                <div style={s('display: flex; align-items: flex-start; justify-content: space-between; gap: 10px')}>
                  <span style={s('display: flex; flex-direction: column; gap: 2px; min-width: 0')}>
                    <span style={s('font-size: 17px; font-weight: 700')}>{it.nombre}</span>
                    <span style={s('font-size:13px;font-weight:700;color:' + (cambiado || it.receta === 0 ? '#9A4A00' : '#4A5672'))}>{nota}</span>
                  </span>
                  <span style={s('display: flex; align-items: center; gap: 6px; flex-shrink: 0')}>
                    <span className="num" style={s('font-size: 20px; font-weight: 800')}>{euros(it.coste)}</span>
                    <button type="button" onClick={() => e.quitar(it)} aria-label="Quitar ingrediente" style={s('width: 44px; height: 44px; border-radius: 14px; border: none; background: transparent; color: #4A5672; display: flex; align-items: center; justify-content: center')}>
                      <IPapelera t={20} />
                    </button>
                  </span>
                </div>
                {e.editando !== it.i ? (
                  <div style={s('display: flex; align-items: center; justify-content: space-between; gap: 10px; background: #EEF1F8; border-radius: 18px; padding: 6px')}>
                    <button type="button" onClick={() => e.menos(it)} aria-label="Menos" style={s('width: 60px; height: 56px; border-radius: 14px; border: none; background: #FFFFFF; display: flex; align-items: center; justify-content: center')}>
                      <IMenos t={26} />
                    </button>
                    <button type="button" onClick={() => e.empezarEdicion(it)} aria-label="Escribir cantidad" className="num" style={s('min-height: 52px; padding: 0 10px; border: none; background: transparent; font-size: 26px; font-weight: 800; text-decoration: underline dashed #9AA6C0; text-underline-offset: 6px; text-decoration-thickness: 2px')}>
                      {cantidad(it.cantidad, it.unidad)}
                    </button>
                    <button type="button" onClick={() => e.mas(it)} aria-label="Más" style={s('width: 60px; height: 56px; border-radius: 14px; border: none; background: #14213D; color: #FFFFFF; display: flex; align-items: center; justify-content: center')}>
                      <IMas t={26} sw={2.8} />
                    </button>
                  </div>
                ) : (
                  <form onSubmit={(ev) => { ev.preventDefault(); e.terminarEdicion(); }} style={s('display: flex; align-items: center; gap: 8px; background: #EEF1F8; border-radius: 18px; padding: 6px')}>
                    <label style={s('flex: 1; display: flex; align-items: center; gap: 8px; height: 56px; background: #FFFFFF; border-radius: 14px; padding: 0 14px; border: 2px solid #FF9F1C; min-width: 0')}>
                      <span className="sr">Cantidad de {it.nombre}</span>
                      <input type="text" inputMode="decimal" autoFocus value={e.texto} onChange={(ev) => e.setTexto(ev.target.value)} onFocus={(ev) => ev.target.select()} className="num" style={s('flex: 1; min-width: 0; border: none; outline: none; background: transparent; font-size: 24px; font-weight: 800')} />
                      <span style={s('font-size: 17px; font-weight: 700; color: #4A5672')}>{it.unidad === 'envase' ? 'env.' : it.unidad}</span>
                    </label>
                    <button type="submit" style={s('height: 56px; padding: 0 18px; border-radius: 14px; border: none; background: #14213D; color: #FFFFFF; font-size: 16px; font-weight: 800')}>Listo</button>
                  </form>
                )}
              </div>
            );
          })}

          <button type="button" onClick={() => { e.terminarEdicion(); setAnadiendo(true); }} style={s('min-height: 60px; border-radius: 20px; border: 2px dashed #9AA6C0; background: transparent; font-size: 17px; font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 8px')}>
            <IMas t={22} />
            Añadir ingrediente
          </button>

          <div style={s('background: #FFFFFF; border: 2px solid #FF9F1C; border-radius: 22px; padding: 16px 14px 14px 18px; display: flex; flex-direction: column; gap: 10px; margin-top: 6px')}>
            <span style={s('display: flex; flex-direction: column; gap: 2px')}>
              <span style={s('font-size: 17px; font-weight: 700')}>{byUnits ? cap(base.cuenta) + ' que han salido' : 'Raciones que han salido'}</span>
              <span style={s('font-size: 14px; font-weight: 500; color: #4A5672')}>{byUnits ? 'La receta da ' + numero(base.salen) + ' · van ' + numero(base.porRacion) + ' por ración' : 'La receta da ' + numero(base.salen)}</span>
            </span>
            <div style={s('display: flex; align-items: center; justify-content: space-between; gap: 10px; background: #EEF1F8; border-radius: 18px; padding: 6px')}>
              <button type="button" onClick={e.menosSalen} aria-label="Una menos" style={s('width: 60px; height: 56px; border-radius: 14px; border: none; background: #FFFFFF; display: flex; align-items: center; justify-content: center')}>
                <IMenos t={26} />
              </button>
              <span className="num" style={s('font-size: 30px; font-weight: 800')}>{numero(b.salen)}</span>
              <button type="button" onClick={e.masSalen} aria-label="Una más" style={s('width: 60px; height: 56px; border-radius: 14px; border: none; background: #14213D; color: #FFFFFF; display: flex; align-items: center; justify-content: center')}>
                <IMas t={26} sw={2.8} />
              </button>
            </div>
            {byUnits && (
              <div style={s('display: flex; justify-content: space-between; align-items: baseline; padding: 0 4px')}>
                <span style={s('font-size: 15px; font-weight: 600; color: #4A5672')}>Salen</span>
                <span className="num" style={s('font-size: 22px; font-weight: 800')}>{raciones(e.lote.raciones)}</span>
              </div>
            )}
          </div>
        </main>
      )}

      {paso === 3 && base && (
        <>
          <main style={s('flex: 1; overflow-y: auto; padding: 8px 20px 20px; display: flex; flex-direction: column; gap: 12px')}>
            <section style={s('background: #14213D; color: #FFFFFF; border-radius: 28px; padding: 28px 24px 24px; display: flex; flex-direction: column; align-items: center; gap: 4px; text-align: center')}>
              <span style={s('font-size: 17px; font-weight: 700; color: #C9D1E4')}>Cobra a tus amigos</span>
              <span className="num" style={s('font-size: 92px; font-weight: 800; line-height: 1; color: #FF9F1C')}>{euros(e.lote.precioCobrar)}</span>
              <span style={s('font-size: 18px; font-weight: 700')}>por ración</span>
              <span style={s('font-size: 13px; font-weight: 500; color: #C9D1E4; margin-top: 8px')}>Redondeado al alza a {redondeoFrase(e.redondeo)}</span>
            </section>
            <section style={s('display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px')}>
              <Dato t="Coste del lote" v={euros(e.lote.costeLote)} />
              <Dato t="Raciones" v={numero(e.lote.raciones)} />
              <Dato t="Coste por ración" v={euros(e.lote.costeRacion)} />
              {byUnits && (
                <div style={s('background: #FFE8C7; border-radius: 20px; padding: 14px 16px; display: flex; flex-direction: column; gap: 2px')}>
                  <span style={s('font-size: 14px; font-weight: 700; color: #7A3E00')}>Por {base.singular || 'unidad'}</span>
                  <span className="num" style={s('font-size: 28px; font-weight: 800')}>{euros(e.lote.costeUnidad ?? 0)}</span>
                </div>
              )}
            </section>
            <span style={s('font-size: 14px; font-weight: 600; color: #4A5672; text-align: center')}>
              {base.nombre} · {fechaCorta(b.fecha)} · {byUnits ? numero(b.salen) + ' ' + base.cuenta : numero(b.salen) + ' raciones'}
            </span>
          </main>
          <div style={s('padding: 12px 20px 28px; display: flex; flex-direction: column; gap: 10px')}>
            <button type="button" onClick={onGuardado} style={s('height: 64px; border: none; border-radius: 20px; background: #FF9F1C; color: #14213D; font-size: 19px; font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 10px; box-shadow: 0 8px 20px rgba(255,159,28,0.35)')}>
              <ICheck t={24} />
              {guardarTexto}
            </button>
            {e.sinConexion && <span style={s('font-size: 13px; font-weight: 600; color: #4A5672; text-align: center')}>Se subirá a la nube en cuanto vuelva la conexión</span>}
            <button type="button" onClick={() => e.setPaso(2)} style={s('height: 56px; border-radius: 18px; border: 2px solid #DCE2EE; background: #FFFFFF; font-size: 17px; font-weight: 700')}>Volver a ajustar</button>
          </div>
        </>
      )}

      {paso !== 3 && (
        <div aria-live="polite" style={s('background: #14213D; color: #FFFFFF; border-radius: 28px 28px 0 0; padding: 18px 20px max(26px, env(safe-area-inset-bottom)); display: flex; flex-direction: column; gap: 14px')}>
          <div style={s('display: flex; justify-content: space-between; align-items: flex-end')}>
            <span style={s('display: flex; flex-direction: column; gap: 2px')}>
              <span style={s('font-size: 13px; font-weight: 600; color: #C9D1E4')}>Coste del lote</span>
              <span className="num" style={s('font-size: 28px; font-weight: 800; line-height: 1')}>{euros(e.lote.costeLote)}</span>
            </span>
            <span style={s('display: flex; flex-direction: column; align-items: flex-end; gap: 2px')}>
              <span style={s('font-size: 13px; font-weight: 600; color: #C9D1E4')}>Por ración · {numero(e.lote.raciones)} rac.</span>
              <span className="num" style={s('font-size: 38px; font-weight: 800; line-height: 1; color: #FF9F1C')}>{euros(e.lote.costeRacion)}</span>
            </span>
          </div>
          <button type="button" disabled={!base} onClick={() => { e.terminarEdicion(); e.setPaso((paso + 1) as 2 | 3); }} style={s('height: 60px; border-radius: 18px; border: none; background: #FF9F1C; color: #14213D; font-size: 18px; font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 8px')}>
            {paso === 1 ? 'Ajustar cantidades' : 'Ver precio a cobrar'}
            <ISiguiente t={22} />
          </button>
        </div>
      )}

      {anadiendo && (
        <div onClick={(ev) => { if (ev.target === ev.currentTarget) { setAnadiendo(false); setBuscar(''); } }} style={s('position: absolute; inset: 0; background: rgba(20,33,61,0.55); display: flex; flex-direction: column; justify-content: flex-end; z-index: 10')}>
          <div role="dialog" aria-label="Añadir ingrediente" style={s('background: #FFFFFF; border-radius: 28px 28px 0 0; padding: 22px 20px 28px; display: flex; flex-direction: column; gap: 14px; height: 72%; box-sizing: border-box')}>
            <div style={s('display: flex; justify-content: space-between; align-items: center')}>
              <h2 className="num" style={s('margin: 0; font-size: 22px; font-weight: 800')}>Añadir ingrediente</h2>
              <button type="button" onClick={() => { setAnadiendo(false); setBuscar(''); }} aria-label="Cerrar" style={s('width: 48px; height: 48px; border-radius: 14px; border: none; background: #EEF1F8; display: flex; align-items: center; justify-content: center')}>
                <ICerrar t={22} />
              </button>
            </div>
            <label style={s('display: flex; align-items: center; gap: 10px; background: #EEF1F8; border-radius: 16px; padding: 0 14px; height: 52px; flex-shrink: 0')}>
              <IBuscar t={20} c="#4A5672" />
              <span className="sr">Buscar producto</span>
              <input type="search" placeholder="Buscar producto" value={buscar} onChange={(ev) => setBuscar(ev.target.value)} style={s('flex: 1; min-width: 0; border: none; outline: none; background: transparent; font-size: 17px; font-weight: 500')} />
            </label>
            <div style={s('overflow-y: auto; display: flex; flex-direction: column; gap: 8px')}>
              {disponibles.map((p) => (
                <button key={p.id} type="button" onClick={() => { e.anadir(p.id); setAnadiendo(false); setBuscar(''); }} style={s('display: flex; justify-content: space-between; align-items: center; gap: 12px; min-height: 60px; padding: 10px 16px; border-radius: 16px; border: 2px solid #DCE2EE; background: #FFFFFF; text-align: left; flex-shrink: 0')}>
                  <span style={s('display: flex; flex-direction: column; gap: 2px')}>
                    <span style={s('font-size: 16px; font-weight: 700')}>{p.nombre}</span>
                    <span style={s('font-size: 13px; font-weight: 500; color: #4A5672')}>{p.supermercado} · {precioPorUnidad(e.precioEnvase(p.id), p.contenido, p.unidad)}</span>
                  </span>
                  <IMas t={22} />
                </button>
              ))}
              {!disponibles.length && <span style={s('padding: 20px 8px; text-align: center; font-size: 15px; font-weight: 500; color: #4A5672')}>No hay productos con ese nombre.</span>}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function Dato({ t, v }: { t: string; v: string }) {
  return (
    <div style={s('background: #FFFFFF; border-radius: 20px; padding: 14px 16px; display: flex; flex-direction: column; gap: 2px')}>
      <span style={s('font-size: 14px; font-weight: 600; color: #4A5672')}>{t}</span>
      <span className="num" style={s('font-size: 28px; font-weight: 800')}>{v}</span>
    </div>
  );
}
