import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { costeDeProductoEnPlato, ordenarPrecios, platosQueUsan, precioUnitario } from '../../calc/calc';
import { diaMes, fechaRelativa } from '../../calc/fechas';
import { cantidad, contenido, euros, eurosSinSimbolo, leerNumero, platos as textoPlatos } from '../../calc/format';
import { almacen, useApp } from '../../data/almacen';
import { borrarPrecio, borrarProducto } from '../../data/operaciones';
import { borrarConDeshacer } from '../../ui/avisos';
import { ConfirmarBorrado, estiloBotonCabecera, estiloSuper, HojaInferior } from '../../ui/comunes';
import { s } from '../../ui/css';
import { IAtras, ILapiz2, IMas, IMenos, IPapelera } from '../../ui/iconos';
import { Pantalla } from '../../ui/marco';
import { guardarPrecioNuevo } from './Compras';

export function Producto() {
  const { id } = useParams();
  const { d, todo, cat } = useApp();
  const nav = useNavigate();
  const [editando, setEditando] = useState('');
  const [txtPrecio, setTxtPrecio] = useState('');
  const [txtFecha, setTxtFecha] = useState('');
  const [hoja, setHoja] = useState(false);
  const [compra, setCompra] = useState(0);
  const [escribiendo, setEscribiendo] = useState(false);
  const [txtCompra, setTxtCompra] = useState('');
  const [confirmar, setConfirmar] = useState(false);

  const p = d.productos.find((x) => x.id === id);
  if (!p) {
    return (
      <Pantalla seccion="compras">
        <header style={s('display: flex; align-items: center; gap: 12px; padding: 20px 16px 8px')}>
          <Link to="/compras" aria-label="Volver a Compras" style={s(estiloBotonCabecera)}><IAtras t={26} /></Link>
        </header>
        <main style={s('padding: 12px 20px; font-size: 16px; font-weight: 500; color: #4A5672')}>Este producto ya no existe.</main>
      </Pantalla>
    );
  }
  const historial = ordenarPrecios(d.precios.filter((x) => x.productoId === p.id));
  const actual = historial[0]?.precio ?? 0;
  const ppu = precioUnitario(actual, p.contenido);
  const unico = historial.length <= 1;
  const usan = platosQueUsan(p.id, d.platos);
  const cajas: [string, string][] = p.unidad === 'g' ? [['Por kilo', euros(ppu * 1000)], ['Por 100 g', euros(ppu * 100)]]
    : p.unidad === 'ml' ? [['Por litro', euros(ppu * 1000)], ['Por 100 ml', euros(ppu * 100)]]
    : p.unidad === 'ud' && p.contenido !== 1 ? [['Por unidad', euros(ppu)]] : [];
  const valorEdit = leerNumero(txtPrecio);

  const guardarEdicion = async () => {
    const h = historial.find((x) => x.id === editando);
    if (!h || valorEdit === null || valorEdit <= 0) return;
    setEditando('');
    await almacen.guardar({ precios: [{ ...h, precio: valorEdit, fecha: txtFecha || h.fecha, updatedAt: Date.now() }] });
  };
  const borrarEntrada = (precioId: string) => {
    const c = borrarPrecio(todo, precioId, Date.now());
    if (c) { setEditando(''); borrarConDeshacer('Precio borrado del historial', c); }
  };
  const abrirCompra = () => { setCompra(actual); setEscribiendo(false); setHoja(true); };
  const cerrarEscritura = () => {
    const v = leerNumero(txtCompra);
    if (v !== null && v > 0) setCompra(Math.round(v * 100) / 100);
    setEscribiendo(false);
  };
  const guardarCompra = async () => {
    let v = compra;
    if (escribiendo) { const t = leerNumero(txtCompra); if (t !== null && t > 0) v = Math.round(t * 100) / 100; }
    if (v <= 0) return;
    setHoja(false);
    await guardarPrecioNuevo(p, v);
  };
  const borrar = () => {
    setConfirmar(false);
    nav('/compras', { replace: true });
    borrarConDeshacer('Producto borrado', borrarProducto(todo, p.id, Date.now()));
  };

  // Gráfica: evolución del precio (de más antiguo a más reciente, últimas 8 compras)
  const serie = historial.slice(0, 8).reverse();
  const max = Math.max(...serie.map((x) => x.precio)), min = Math.min(...serie.map((x) => x.precio));

  return (
    <Pantalla conMenu={false} seccion="compras">
      <header style={s('display: flex; align-items: center; justify-content: space-between; padding: 20px 16px 8px')}>
        <Link to="/compras" aria-label="Volver a Compras" style={s(estiloBotonCabecera)}><IAtras t={26} /></Link>
        <div style={s('display: flex; gap: 8px')}>
          <Link to={'/producto/' + p.id + '/editar'} style={s('height: 52px; padding: 0 16px; border-radius: 16px; background: #FFFFFF; display: flex; align-items: center; gap: 8px; font-size: 16px; font-weight: 700')}>
            <ILapiz2 t={18} />
            Editar
          </Link>
          <button type="button" onClick={() => setConfirmar(true)} style={s('height: 52px; padding: 0 16px; border-radius: 16px; border: none; background: #FFFFFF; color: #A1281E; display: flex; align-items: center; gap: 8px; font-size: 16px; font-weight: 700')}>
            <IPapelera t={18} sw={2.2} />
            Borrar
          </button>
        </div>
      </header>
      <main style={s('flex: 1; overflow-y: auto; padding: 8px 20px 24px; display: flex; flex-direction: column; gap: 18px')}>
        <div style={s('display: flex; flex-direction: column; gap: 8px')}>
          <span style={s('align-self: flex-start; border-radius: 8px; padding: 3px 10px; font-size: 13px; font-weight: 700;' + estiloSuper(p.supermercado))}>{p.supermercado}</span>
          <h1 className="num" style={s('margin: 0; font-size: 30px; font-weight: 800; line-height: 1.1')}>{p.nombre}</h1>
        </div>
        <section style={s('background: #14213D; color: #FFFFFF; border-radius: 24px; padding: 22px; display: flex; flex-direction: column; gap: 18px; flex-shrink: 0')}>
          <div style={s('display: flex; flex-direction: column; gap: 2px')}>
            <span style={s('font-size: 14px; font-weight: 600; color: #C9D1E4')}>Precio actual del envase · {contenido(p.contenido, p.unidad)}</span>
            <span className="num" style={s('font-size: 52px; font-weight: 800; line-height: 1')}>{euros(actual)}</span>
          </div>
          {cajas.length > 0 && (
            <div style={s('display: flex; gap: 10px')}>
              {cajas.map(([t, v]) => (
                <div key={t} style={s('flex: 1; background: rgba(255,255,255,0.08); border-radius: 16px; padding: 12px 14px; display: flex; flex-direction: column; gap: 2px')}>
                  <span style={s('font-size: 13px; font-weight: 600; color: #C9D1E4')}>{t}</span>
                  <span className="num" style={s('font-size: 22px; font-weight: 800; color: #FF9F1C')}>{v}</span>
                </div>
              ))}
            </div>
          )}
        </section>
        <section style={s('background: #FFFFFF; border-radius: 24px; padding: 18px 18px 8px; display: flex; flex-direction: column; gap: 4px; flex-shrink: 0')}>
          <h2 style={s('margin: 0 0 4px; font-size: 18px; font-weight: 700')}>Historial de precios</h2>
          {!unico && (
            <div aria-hidden="true" style={s('display: flex; align-items: flex-end; gap: 10px; height: 110px; padding: 6px 0 10px; border-bottom: 1px solid #EEF1F8')}>
              {serie.map((h, i) => (
                <div key={h.id} style={s('flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; gap: 6px; height: 100%; min-width: 0')}>
                  <span className="num" style={s('font-size: 13px; font-weight: 700')}>{eurosSinSimbolo(h.precio)}</span>
                  <div style={s('width:100%;max-width:48px;border-radius:10px 10px 4px 4px;background:' + (i === serie.length - 1 ? '#FF9F1C' : '#DCE2EE') +
                    ';height:' + Math.round(max === min ? 40 : 14 + ((h.precio - min) / (max - min)) * 40) + 'px')} />
                  <span style={s('font-size: 12px; font-weight: 600; color: #4A5672; white-space: nowrap')}>{diaMes(h.fecha)}</span>
                </div>
              ))}
            </div>
          )}
          {historial.map((h, i) => (
            <div key={h.id} style={s('border-bottom: 1px solid #EEF1F8; padding: 8px 0')}>
              {editando !== h.id ? (
                <div style={s('display: flex; align-items: center; gap: 6px')}>
                  <span style={s('display: flex; flex-direction: column; gap: 2px; flex: 1')}>
                    <span style={s('font-size: 16px; font-weight: 600')}>{fechaRelativa(h.fecha)}</span>
                    <span style={s('font-size: 13px; font-weight: 500; color: #4A5672')}>{i === 0 ? 'Precio actual' : 'Precio anterior'}</span>
                  </span>
                  <span className="num" style={s('font-size: 20px; font-weight: 800; margin-right: 4px')}>{euros(h.precio)}</span>
                  <button type="button" onClick={() => { setEditando(h.id); setTxtPrecio(h.precio.toFixed(2).replace('.', ',')); setTxtFecha(h.fecha); }} aria-label="Editar este precio" style={s('width: 44px; height: 44px; border-radius: 12px; border: none; background: #EEF1F8; display: flex; align-items: center; justify-content: center')}>
                    <ILapiz2 t={18} />
                  </button>
                  <button type="button" onClick={() => borrarEntrada(h.id)} disabled={unico} aria-label="Borrar este precio"
                    style={s('width:44px;height:44px;border-radius:12px;border:none;display:flex;align-items:center;justify-content:center;' + (unico ? 'background:#F4F5F8;color:#B5BCCB' : 'background:#FBE4E1;color:#A1281E'))}>
                    <IPapelera t={18} sw={2.2} />
                  </button>
                </div>
              ) : (
                <form onSubmit={(e) => { e.preventDefault(); guardarEdicion(); }} style={s('display: flex; flex-direction: column; gap: 10px; padding: 4px 0 8px')}>
                  <div style={s('display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 8px')}>
                    <label style={s('display: flex; flex-direction: column; gap: 6px')}>
                      <span style={s('font-size: 14px; font-weight: 700')}>Precio</span>
                      <span style={s('display: flex; align-items: center; height: 54px; border-radius: 14px; border: 3px solid #FF9F1C; padding: 0 12px; box-sizing: border-box')}>
                        <input type="text" inputMode="decimal" autoFocus value={txtPrecio} onChange={(e) => setTxtPrecio(e.target.value)} className="num" style={s('flex: 1; min-width: 0; border: none; outline: none; background: transparent; font-size: 22px; font-weight: 800')} />
                        <span className="num" style={s('font-size: 20px; font-weight: 800; color: #4A5672')}>€</span>
                      </span>
                    </label>
                    <label style={s('display: flex; flex-direction: column; gap: 6px')}>
                      <span style={s('font-size: 14px; font-weight: 700')}>Fecha</span>
                      <input type="date" value={txtFecha} onChange={(e) => setTxtFecha(e.target.value)} style={s('height: 54px; border-radius: 14px; border: 2px solid #DCE2EE; padding: 0 10px; font-size: 15px; font-weight: 600; box-sizing: border-box; min-width: 0; width: 100%; background: #FFFFFF')} />
                    </label>
                  </div>
                  <div style={s('display: flex; gap: 8px')}>
                    <button type="button" onClick={() => setEditando('')} style={s('flex: 1; height: 50px; border-radius: 14px; border: 2px solid #DCE2EE; background: #FFFFFF; font-size: 15px; font-weight: 700')}>Cancelar</button>
                    <button type="submit" style={s('flex: 2; height: 50px; border-radius: 14px; border: none; background: #14213D; color: #FFFFFF; font-size: 15px; font-weight: 800')}>Guardar cambios</button>
                  </div>
                </form>
              )}
            </div>
          ))}
          {unico && (
            <p style={s('margin: 6px 0 8px; font-size: 13px; line-height: 1.45; font-weight: 500; color: #4A5672')}>Es el único precio, así que no se puede borrar: cámbialo con el lápiz. Cuando registres más compras verás aquí cómo cambia.</p>
          )}
        </section>
        <section style={s('display: flex; flex-direction: column; gap: 8px')}>
          <h2 style={s('margin: 0; font-size: 18px; font-weight: 700')}>Lo usas en</h2>
          {usan.map((pl) => {
            const q = pl.ingredientes.filter((i) => i.productoId === p.id).reduce((a, i) => a + i.cantidad, 0);
            return (
              <Link key={pl.id} to={'/plato/' + pl.id} style={s('display: flex; justify-content: space-between; align-items: center; gap: 10px; background: #FFFFFF; border-radius: 18px; padding: 14px 16px; min-height: 60px; box-sizing: border-box; flex-shrink: 0')}>
                <span style={s('font-size: 16px; font-weight: 600')}>{pl.nombre}</span>
                <span style={s('font-size: 14px; font-weight: 600; color: #4A5672; white-space: nowrap')}>{cantidad(q, p.unidad)} · {euros(costeDeProductoEnPlato(p.id, pl, cat))}</span>
              </Link>
            );
          })}
          {!usan.length && <span style={s('background: #FFFFFF; border-radius: 18px; padding: 16px; font-size: 15px; font-weight: 500; color: #4A5672')}>Todavía no lo usa ningún plato.</span>}
        </section>
      </main>
      <div style={s('padding: 12px 20px max(28px, env(safe-area-inset-bottom)); background: #EEF1F8')}>
        <button type="button" onClick={abrirCompra} style={s('width: 100%; height: 64px; border: none; border-radius: 20px; background: #FF9F1C; color: #14213D; font-size: 19px; font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 10px; box-shadow: 0 8px 20px rgba(255,159,28,0.35)')}>
          <IMas t={24} />
          Registrar compra
        </button>
      </div>

      {hoja && (
        <HojaInferior etiqueta="Registrar compra" onCerrar={() => setHoja(false)}>
          <div style={s('display: flex; flex-direction: column; gap: 20px')}>
            <div style={s('display: flex; flex-direction: column; gap: 4px')}>
              <h2 className="num" style={s('margin: 0; font-size: 24px; font-weight: 800')}>Registrar compra</h2>
              <span style={s('font-size: 15px; font-weight: 500; color: #4A5672')}>{p.nombre} · {p.supermercado} · hoy</span>
            </div>
            <div style={s('display: flex; flex-direction: column; gap: 8px')}>
              <span style={s('font-size: 15px; font-weight: 700')}>Precio que has pagado</span>
              <div style={s('display: flex; align-items: center; justify-content: space-between; gap: 12px; background: #EEF1F8; border-radius: 22px; padding: 10px')}>
                <button type="button" onClick={() => { cerrarEscritura(); setCompra((c) => Math.max(0, Math.round((c - 0.01) * 100) / 100)); }} aria-label="Bajar 1 céntimo" style={s('width: 64px; height: 64px; border-radius: 18px; border: none; background: #FFFFFF; display: flex; align-items: center; justify-content: center; flex-shrink: 0')}>
                  <IMenos t={28} sw={2.6} />
                </button>
                {escribiendo ? (
                  <form onSubmit={(e) => { e.preventDefault(); cerrarEscritura(); }} style={s('flex: 1; min-width: 0; display: flex')}>
                    <label style={s('flex: 1; min-width: 0; display: flex; align-items: center; height: 64px; border-radius: 16px; border: 3px solid #FF9F1C; background: #FFFFFF; padding: 0 12px; box-sizing: border-box')}>
                      <span className="sr">Precio que has pagado</span>
                      <input type="text" inputMode="decimal" autoFocus value={txtCompra} onChange={(e) => setTxtCompra(e.target.value)} onFocus={(e) => e.target.select()} onBlur={cerrarEscritura} className="num" style={s('flex: 1; min-width: 0; width: 100%; border: none; outline: none; background: transparent; font-size: 34px; font-weight: 800; text-align: center')} />
                      <span className="num" style={s('font-size: 28px; font-weight: 800; color: #4A5672')}>€</span>
                    </label>
                  </form>
                ) : (
                  <button type="button" onClick={() => { setTxtCompra(compra.toFixed(2).replace('.', ',')); setEscribiendo(true); }} aria-label="Escribir el precio" className="num" style={s('border: none; background: transparent; padding: 0; font-size: 40px; font-weight: 800; border-bottom: 2px dashed #9AA6C0')}>
                    {euros(compra)}
                  </button>
                )}
                <button type="button" onClick={() => { cerrarEscritura(); setCompra((c) => Math.round((c + 0.01) * 100) / 100); }} aria-label="Subir 1 céntimo" style={s('width: 64px; height: 64px; border-radius: 18px; border: none; background: #14213D; color: #FFFFFF; display: flex; align-items: center; justify-content: center; flex-shrink: 0')}>
                  <IMas t={28} />
                </button>
              </div>
              <span style={s('font-size: 14px; font-weight: 600; color: #4A5672')}>Envase de {contenido(p.contenido, p.unidad)} · toca el precio para escribirlo</span>
            </div>
            <div style={s('display: flex; gap: 10px')}>
              <button type="button" onClick={() => setHoja(false)} style={s('flex: 1; height: 60px; border-radius: 18px; border: 2px solid #DCE2EE; background: #FFFFFF; font-size: 17px; font-weight: 700')}>Cancelar</button>
              <button type="button" onClick={guardarCompra} style={s('flex: 2; height: 60px; border-radius: 18px; border: none; background: #FF9F1C; color: #14213D; font-size: 17px; font-weight: 800')}>Guardar precio</button>
            </div>
          </div>
        </HojaInferior>
      )}

      {confirmar && (
        <ConfirmarBorrado etiqueta="Borrar producto" titulo={'¿Borrar ' + p.nombre + '?'} onCancelar={() => setConfirmar(false)} onBorrar={borrar}
          boton={usan.length ? 'Borrar y quitar de ' + textoPlatos(usan.length) : 'Borrar producto'}>
          {!usan.length ? (
            <p style={s('margin: 0; font-size: 16px; line-height: 1.45; font-weight: 500; color: #4A5672')}>No lo usa ningún plato. Se borrará junto con su historial de precios.</p>
          ) : (
            <>
              <p style={s('margin: 0; font-size: 16px; line-height: 1.45; font-weight: 500; color: #4A5672')}>Lo usas en {textoPlatos(usan.length)}. Si lo borras, <strong style={s('color: #14213D')}>se quitará de sus ingredientes</strong> y su coste bajará:</p>
              <ul style={s('list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 6px')}>
                {usan.map((pl) => (
                  <li key={pl.id} style={s('display: flex; justify-content: space-between; gap: 10px; background: #FFE8C7; border-radius: 12px; padding: 12px 14px; font-size: 15px; font-weight: 700')}>
                    <span>{pl.nombre}</span>
                    <span style={s('font-weight: 600; color: #5C2E00; white-space: nowrap')}>− {euros(costeDeProductoEnPlato(p.id, pl, cat))}</span>
                  </li>
                ))}
              </ul>
              <p style={s('margin: 0; font-size: 14px; font-weight: 500; color: #4A5672')}>Tus producciones guardadas no cambian.</p>
            </>
          )}
        </ConfirmarBorrado>
      )}
    </Pantalla>
  );
}
