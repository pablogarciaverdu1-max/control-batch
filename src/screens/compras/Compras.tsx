import { useState } from 'react';
import { Link } from 'react-router-dom';
import { platosQueUsan } from '../../calc/calc';
import { hoyIso } from '../../calc/fechas';
import { contenido, euros, leerNumero, platos, precioPorUnidad } from '../../calc/format';
import { almacen, useApp } from '../../data/almacen';
import { SUPERMERCADOS_FIJOS, type Producto } from '../../data/model';
import { cambiarPrecio } from '../../data/operaciones';
import { avisoOk } from '../../ui/avisos';
import { estiloSuper } from '../../ui/comunes';
import { s } from '../../ui/css';
import { IBuscar, ICarrito, IMas } from '../../ui/iconos';
import { Pantalla } from '../../ui/marco';

const FILTROS = ['Todos', 'Mercadona', 'Aldi', 'Otro'] as const;

export function esOtroSuper(sup: string) {
  return !(SUPERMERCADOS_FIJOS as readonly string[]).includes(sup);
}

/** Guarda un precio nuevo con fecha de hoy y enseña el aviso de confirmación. */
export async function guardarPrecioNuevo(p: Producto, precio: number) {
  const { d } = almacen.get();
  await almacen.guardar(cambiarPrecio(p.id, precio, hoyIso(), Date.now()));
  const n = platosQueUsan(p.id, d.platos).length;
  avisoOk('Precio actualizado', n === 0 ? 'Ningún plato usa este producto' : 'Cambia el coste de ' + platos(n));
}

export function Compras() {
  const { d } = useApp();
  if (!d.productos.length) return <ComprasVacia />;
  return <ComprasLista />;
}

function ComprasLista() {
  const { d, cat } = useApp();
  const [filtro, setFiltro] = useState<(typeof FILTROS)[number]>('Todos');
  const [buscar, setBuscar] = useState('');
  const [editando, setEditando] = useState('');
  const [texto, setTexto] = useState('');
  const q = buscar.trim().toLowerCase();
  const lista = d.productos
    .filter((p) => filtro === 'Todos' || (filtro === 'Otro' ? esOtroSuper(p.supermercado) : p.supermercado === filtro))
    .filter((p) => !q || p.nombre.toLowerCase().includes(q))
    .sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
  const actual = d.productos.find((p) => p.id === editando);
  const valor = leerNumero(texto);
  const valido = valor !== null && valor > 0 ? valor : null;

  const guardar = async () => {
    if (!actual || valido === null) return;
    setEditando('');
    if (Math.abs(valido - (cat.precio.get(actual.id) ?? 0)) < 1e-9) return;
    await guardarPrecioNuevo(actual, valido);
  };

  return (
    <Pantalla seccion="compras">
      <header style={s('padding: 28px 20px 12px; display: flex; flex-direction: column; gap: 14px')}>
        <div style={s('display: flex; align-items: center; justify-content: space-between')}>
          <h1 className="num" style={s('margin: 0; font-size: 34px; font-weight: 800')}>Compras</h1>
          <Link to="/compras/nuevo" aria-label="Añadir producto" style={s('width: 56px; height: 56px; border-radius: 18px; background: #FF9F1C; color: #14213D; display: flex; align-items: center; justify-content: center')}>
            <IMas t={28} />
          </Link>
        </div>
        <label style={s('display: flex; align-items: center; gap: 10px; background: #FFFFFF; border-radius: 18px; padding: 0 16px; height: 56px; border: 2px solid #DCE2EE')}>
          <IBuscar t={22} c="#4A5672" />
          <span className="sr">Buscar producto</span>
          <input type="search" placeholder="Buscar producto" value={buscar} onChange={(e) => setBuscar(e.target.value)} style={s('flex: 1; min-width: 0; border: none; outline: none; background: transparent; font-size: 17px; font-weight: 500; height: 100%')} />
        </label>
        <div role="group" aria-label="Filtrar por supermercado" style={s('display: flex; gap: 8px')}>
          {FILTROS.map((f) => (
            <button key={f} type="button" onClick={() => setFiltro(f)} aria-pressed={filtro === f}
              style={s('height:44px;padding:0 15px;border-radius:22px;font-size:15px;font-weight:700;' +
                (filtro === f ? 'background:#14213D;color:#FFFFFF;border:2px solid #14213D' : 'background:#FFFFFF;color:#14213D;border:2px solid #DCE2EE'))}>{f}</button>
          ))}
        </div>
      </header>
      <main style={s('flex: 1; overflow-y: auto; padding: 4px 20px 24px; display: flex; flex-direction: column; gap: 10px')}>
        <span style={s('font-size: 14px; font-weight: 600; color: #4A5672')}>{lista.length === 1 ? '1 producto' : lista.length + ' productos'} · toca un precio para cambiarlo</span>
        {lista.map((p) => {
          const precio = cat.precio.get(p.id) ?? 0;
          const on = editando === p.id;
          return (
            <div key={p.id} style={s('background:#FFFFFF;border-radius:20px;padding:12px 18px;box-sizing:border-box;flex-shrink:0;' +
              (on ? 'border:2px solid #14213D;box-shadow:0 10px 24px rgba(20,33,61,0.12)' : 'border:2px solid #FFFFFF'))}>
              <div style={s('display: flex; align-items: center; justify-content: space-between; gap: 10px')}>
                <Link to={'/producto/' + p.id} style={s('display: flex; flex-direction: column; gap: 6px; min-width: 0; flex: 1; padding: 4px 0')}>
                  <span style={s('font-size: 17px; font-weight: 700')}>{p.nombre}</span>
                  <span style={s('display: flex; align-items: center; gap: 8px; font-size: 14px; font-weight: 500; color: #4A5672')}>
                    <span style={s('border-radius:8px;padding:2px 8px;font-size:12px;font-weight:700;' + estiloSuper(p.supermercado))}>{p.supermercado}</span>{contenido(p.contenido, p.unidad)}
                  </span>
                </Link>
                {!on && (
                  <button type="button" onClick={() => { setEditando(p.id); setTexto(precio.toFixed(2).replace('.', ',')); }} aria-label={'Cambiar precio de ' + p.nombre}
                    style={s('display: flex; flex-direction: column; align-items: flex-end; gap: 2px; flex-shrink: 0; min-height: 56px; padding: 6px 8px; margin-right: -8px; border: none; border-radius: 14px; background: transparent')}>
                    <span className="num" style={s('display: flex; align-items: center; gap: 6px; font-size: 24px; font-weight: 800; line-height: 1; text-decoration: underline dashed #9AA6C0; text-underline-offset: 5px; text-decoration-thickness: 2px')}>{euros(precio)}</span>
                    <span style={s('font-size: 13px; font-weight: 600; color: #4A5672')}>{precioPorUnidad(precio, p.contenido, p.unidad)}</span>
                  </button>
                )}
              </div>
              {on && (
                <form onSubmit={(e) => { e.preventDefault(); guardar(); }} style={s('display: flex; flex-direction: column; gap: 10px; padding-top: 12px; margin-top: 12px; border-top: 1px solid #EEF1F8')}>
                  <label style={s('display: flex; flex-direction: column; gap: 6px')}>
                    <span style={s('display: flex; justify-content: space-between; font-size: 14px; font-weight: 700')}>Precio nuevo del envase <span style={s('font-weight: 600; color: #4A5672')}>antes {euros(precio)}</span></span>
                    <span style={s('display: flex; align-items: center; height: 60px; border-radius: 16px; border: 3px solid #FF9F1C; background: #FFFFFF; padding: 0 16px; box-sizing: border-box')}>
                      <input type="text" inputMode="decimal" autoFocus value={texto} onChange={(e) => setTexto(e.target.value)} onFocus={(e) => e.target.select()} className="num" style={s('flex: 1; min-width: 0; border: none; outline: none; background: transparent; font-size: 28px; font-weight: 800')} />
                      <span className="num" style={s('font-size: 24px; font-weight: 800; color: #4A5672')}>€</span>
                    </span>
                  </label>
                  <span style={s('font-size: 14px; font-weight: 600; color: #4A5672')}>
                    {valido !== null ? 'Te saldrá a ' + precioPorUnidad(valido, p.contenido, p.unidad) : 'Escribe el precio que has pagado'} · lo usan {platos(platosQueUsan(p.id, d.platos).length)}
                  </span>
                  <div style={s('display: flex; gap: 8px')}>
                    <button type="button" onClick={() => setEditando('')} style={s('flex: 1; height: 54px; border-radius: 16px; border: 2px solid #DCE2EE; background: #FFFFFF; font-size: 16px; font-weight: 700')}>Cancelar</button>
                    <button type="submit" disabled={valido === null} style={s('flex: 2; height: 54px; border-radius: 16px; border: none; background: #FF9F1C; color: #14213D; font-size: 16px; font-weight: 800' + (valido === null ? '; opacity: 0.5' : ''))}>Guardar precio</button>
                  </div>
                </form>
              )}
            </div>
          );
        })}
        {!lista.length && <div style={s('text-align: center; padding: 40px 12px; color: #4A5672; font-size: 16px; font-weight: 500')}>No hay productos con ese nombre.</div>}
      </main>
    </Pantalla>
  );
}

function ComprasVacia() {
  return (
    <Pantalla seccion="compras">
      <header style={s('padding: 28px 20px 12px')}>
        <h1 className="num" style={s('margin: 0; font-size: 34px; font-weight: 800')}>Compras</h1>
      </header>
      <main style={s('flex: 1; overflow-y: auto; padding: 8px 20px 24px; display: flex; flex-direction: column; justify-content: center; gap: 24px')}>
        <section style={s('display: flex; flex-direction: column; align-items: center; gap: 14px; text-align: center; padding: 0 8px')}>
          <span style={s('width: 112px; height: 112px; border-radius: 36px; background: #FFFFFF; display: flex; align-items: center; justify-content: center')}>
            <ICarrito t={56} sw={1.6} c="#14213D" extra="#FF9F1C" />
          </span>
          <h2 className="num" style={s('margin: 0; font-size: 26px; font-weight: 800')}>Tu despensa está vacía</h2>
          <p style={s('margin: 0; font-size: 16px; line-height: 1.45; font-weight: 500; color: #4A5672')}>Apunta lo que compras y a qué precio. Con eso la app calcula sola lo que cuesta cada plato.</p>
        </section>
        <section style={s('background: #FFFFFF; border-radius: 22px; padding: 18px; display: flex; flex-direction: column; gap: 12px')}>
          <span style={s('font-size: 14px; font-weight: 700; color: #4A5672')}>Así se verá cada producto</span>
          <div style={s('display: flex; align-items: center; justify-content: space-between; gap: 12px; border: 2px dashed #C9D1E4; border-radius: 18px; padding: 14px 16px')}>
            <span style={s('display: flex; flex-direction: column; gap: 6px')}>
              <span style={s('font-size: 16px; font-weight: 700')}>Leche de coco</span>
              <span style={s('display: flex; align-items: center; gap: 8px; font-size: 13px; font-weight: 500; color: #4A5672')}><span style={s('background: #E6F1E9; color: #1D5A31; border-radius: 8px; padding: 2px 8px; font-size: 12px; font-weight: 700')}>Mercadona</span>1 envase</span>
            </span>
            <span className="num" style={s('font-size: 22px; font-weight: 800')}>1,30 €</span>
          </div>
        </section>
        <Link to="/compras/nuevo" style={s('height: 64px; border-radius: 20px; background: #FF9F1C; color: #14213D; font-size: 19px; font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 10px; box-shadow: 0 8px 20px rgba(255,159,28,0.35); flex-shrink: 0')}>
          <IMas t={24} />
          Añadir mi primer producto
        </Link>
      </main>
    </Pantalla>
  );
}
