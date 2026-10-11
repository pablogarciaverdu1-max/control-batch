import { Link } from 'react-router-dom';
import { costePlato } from '../calc/calc';
import { fechaCorta, fechaLarga, hoyIso } from '../calc/fechas';
import { euros, numero, precioPorUnidad, raciones } from '../calc/format';
import { useApp, type EstadoSync } from '../data/almacen';
import type { Produccion } from '../data/model';
import { s } from '../ui/css';
import { ICarrito, IEngranaje, IMas, IOlla, ISiguiente, ISinConexion } from '../ui/iconos';
import { MenuInferior, MenuLateral, useEsOrdenador } from '../ui/marco';

export function queSalio(p: { cuenta: string; salen: number }): string {
  return p.cuenta === 'raciones' ? raciones(p.salen) : numero(p.salen) + ' ' + p.cuenta;
}

export function ordenarProducciones(lista: Produccion[]): Produccion[] {
  return lista.slice().sort((a, b) => (a.fecha === b.fecha ? b.updatedAt - a.updatedAt : a.fecha < b.fecha ? 1 : -1));
}

const TEXTO_SYNC: Record<EstadoSync, string> = {
  guardado: 'Guardado', guardando: 'Guardando…', 'sin conexión': 'Sin conexión, se guardará al volver',
};

export function PildoraSync({ sync, ordenador = false }: { sync: EstadoSync; ordenador?: boolean }) {
  const off = sync === 'sin conexión';
  const base = ordenador
    ? 'display: inline-flex; align-items: center; gap: 8px; min-height: 30px; padding: 0 12px; border-radius: 15px; font-size: 13px; font-weight: 700;'
    : 'align-self:flex-start;display:inline-flex;align-items:center;gap:8px;min-height:32px;padding:0 12px;border-radius:16px;font-size:13px;font-weight:700;';
  return (
    <span role="status" style={s(base + (off ? 'background:#FFE8C7;color:#7A3E00' : 'background:#FFFFFF;color:#14213D'))}>
      {off ? <ISinConexion t={16} /> : <span style={s('width:8px;height:8px;border-radius:50%;background:' + (sync === 'guardado' ? '#2E8B57' : '#FF9F1C'))} />}
      {TEXTO_SYNC[sync]}
    </span>
  );
}

export function Inicio() {
  const ord = useEsOrdenador();
  const { d } = useApp();
  if (ord) return <InicioOrdenador />;
  return d.producciones.length ? <InicioMovil /> : <InicioVacio />;
}

function BotonAjustes() {
  return (
    <Link to="/ajustes" aria-label="Ajustes" style={s('width: 52px; height: 52px; border-radius: 16px; background: #FFFFFF; display: flex; align-items: center; justify-content: center; flex-shrink: 0')}>
      <IEngranaje />
    </Link>
  );
}

const marcoMovil = "height: 100dvh; background: #EEF1F8; display: flex; flex-direction: column; overflow: hidden; font-family: 'Figtree', system-ui, sans-serif; color: #14213D";

function InicioMovil() {
  const { d, sync } = useApp();
  const recientes = ordenarProducciones(d.producciones).slice(0, 4);
  return (
    <div style={s(marcoMovil)}>
      <main style={s('flex: 1; overflow-y: auto; padding: 24px 20px 24px; display: flex; flex-direction: column; gap: 22px')}>
        <header style={s('display: flex; justify-content: space-between; align-items: flex-start; gap: 12px')}>
          <div style={s('display: flex; flex-direction: column; gap: 6px')}>
            <span style={s('font-size: 15px; font-weight: 600; color: #4A5672')}>{fechaLarga(hoyIso())}</span>
            <h1 className="num" style={s('margin: 0; font-size: 34px; font-weight: 800; line-height: 1.05')}>Mi cocina</h1>
            <PildoraSync sync={sync} />
          </div>
          <BotonAjustes />
        </header>
        <Link to="/produccion/nueva" style={s('display: flex; align-items: center; gap: 16px; background: #FF9F1C; color: #14213D; border-radius: 24px; padding: 22px 22px; min-height: 92px; box-sizing: border-box; box-shadow: 0 10px 24px rgba(255,159,28,0.35)')}>
          <span style={s('width: 56px; height: 56px; border-radius: 18px; background: #14213D; color: #FF9F1C; display: flex; align-items: center; justify-content: center; flex-shrink: 0')}>
            <IMas t={28} />
          </span>
          <span style={s('display: flex; flex-direction: column; gap: 2px')}>
            <span className="num" style={s('font-size: 24px; font-weight: 800')}>Nueva producción</span>
            <span style={s('font-size: 15px; font-weight: 600')}>Elige plato y ajusta cantidades</span>
          </span>
        </Link>
        <section style={s('display: flex; flex-direction: column; gap: 12px')}>
          <div style={s('display: flex; justify-content: space-between; align-items: baseline')}>
            <h2 style={s('margin: 0; font-size: 19px; font-weight: 700')}>Últimas producciones</h2>
            <Link to="/historial" style={s('font-size: 15px; font-weight: 700; color: #14213D; padding: 10px 0')}>Ver todas</Link>
          </div>
          {recientes.map((p) => (
            <Link key={p.id} to={'/produccion/' + p.id} style={s('display: flex; align-items: center; justify-content: space-between; gap: 12px; background: #FFFFFF; border-radius: 20px; padding: 16px 18px; min-height: 76px; box-sizing: border-box')}>
              <span style={s('display: flex; flex-direction: column; gap: 4px; min-width: 0')}>
                <span style={s('font-size: 17px; font-weight: 700; line-height: 1.25')}>{p.nombrePlato}</span>
                <span style={s('font-size: 14px; font-weight: 500; color: #4A5672')}>{fechaCorta(p.fecha)} · {queSalio(p)}</span>
              </span>
              <span style={s('display: flex; flex-direction: column; align-items: flex-end; flex-shrink: 0')}>
                <span className="num" style={s('font-size: 26px; font-weight: 800; line-height: 1')}>{euros(p.precioCobrar)}</span>
                <span style={s('font-size: 12px; font-weight: 600; color: #4A5672')}>por ración</span>
              </span>
            </Link>
          ))}
        </section>
        <section style={s('display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 12px')}>
          <Link to="/compras" style={s('display: flex; flex-direction: column; gap: 14px; background: #14213D; color: #FFFFFF; border-radius: 22px; padding: 18px; min-height: 128px; box-sizing: border-box')}>
            <ICarrito t={28} c="#FF9F1C" />
            <span style={s('display: flex; flex-direction: column; gap: 2px')}>
              <span className="num" style={s('font-size: 22px; font-weight: 800')}>Compras</span>
              <span style={s('font-size: 14px; font-weight: 500; color: #C9D1E4')}>{d.productos.length === 1 ? '1 producto' : d.productos.length + ' productos'}</span>
            </span>
          </Link>
          <Link to="/platos" style={s('display: flex; flex-direction: column; gap: 14px; background: #14213D; color: #FFFFFF; border-radius: 22px; padding: 18px; min-height: 128px; box-sizing: border-box')}>
            <IOlla t={28} c="#FF9F1C" />
            <span style={s('display: flex; flex-direction: column; gap: 2px')}>
              <span className="num" style={s('font-size: 22px; font-weight: 800')}>Platos</span>
              <span style={s('font-size: 14px; font-weight: 500; color: #C9D1E4')}>{d.platos.length === 1 ? '1 receta' : d.platos.length + ' recetas'}</span>
            </span>
          </Link>
        </section>
      </main>
      <MenuInferior actual="inicio" />
    </div>
  );
}

function PasoInicial({ n, naranja, titulo, sub, to }: { n: number; naranja?: boolean; titulo: string; sub: string; to: string }) {
  return (
    <Link to={to} style={s('display: flex; align-items: center; gap: 14px; background: #FFFFFF; border-radius: 20px; padding: 14px 16px; min-height: 72px; box-sizing: border-box')}>
      <span className="num" style={s('width: 40px; height: 40px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 18px; font-weight: 800; flex-shrink: 0; ' +
        (naranja ? 'background: #FF9F1C; color: #14213D' : 'background: #14213D; color: #FFFFFF'))}>{n}</span>
      <span style={s('display: flex; flex-direction: column; gap: 2px; flex: 1')}>
        <span style={s('font-size: 16px; font-weight: 700')}>{titulo}</span>
        <span style={s('font-size: 14px; font-weight: 500; color: #4A5672')}>{sub}</span>
      </span>
      <ISiguiente t={22} sw={2.4} c="#4A5672" />
    </Link>
  );
}

function InicioVacio() {
  const { sync } = useApp();
  return (
    <div style={s(marcoMovil)}>
      <main style={s('flex: 1; overflow-y: auto; padding: 28px 20px 24px; display: flex; flex-direction: column; gap: 22px')}>
        <header style={s('display: flex; justify-content: space-between; align-items: flex-start; gap: 12px')}>
          <div style={s('display: flex; flex-direction: column; gap: 4px')}>
            <span style={s('font-size: 15px; font-weight: 600; color: #4A5672')}>{fechaLarga(hoyIso())}</span>
            <h1 className="num" style={s('margin: 0; font-size: 34px; font-weight: 800; line-height: 1.05')}>Mi cocina</h1>
            <span style={s('margin-top: 2px; display: flex')}><PildoraSync sync={sync} /></span>
          </div>
          <BotonAjustes />
        </header>
        <section style={s('background: #FFFFFF; border-radius: 28px; padding: 28px 22px; display: flex; flex-direction: column; align-items: center; gap: 12px; text-align: center')}>
          <span style={s('width: 96px; height: 96px; border-radius: 32px; background: #EEF1F8; display: flex; align-items: center; justify-content: center')}>
            <IOlla t={52} sw={1.6} c="#14213D" vapor="#FF9F1C" />
          </span>
          <h2 className="num" style={s('margin: 0; font-size: 24px; font-weight: 800')}>Todavía no has cocinado nada</h2>
          <p style={s('margin: 0; font-size: 16px; line-height: 1.45; font-weight: 500; color: #4A5672')}>Cuando hagas tu primer lote, aquí verás cuánto te ha costado y cuánto cobrar por ración.</p>
          <Link to="/produccion/nueva" style={s('margin-top: 8px; align-self: stretch; height: 64px; border-radius: 20px; background: #FF9F1C; color: #14213D; font-size: 19px; font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 10px')}>
            <IMas t={24} />
            Nueva producción
          </Link>
        </section>
        <section style={s('display: flex; flex-direction: column; gap: 10px')}>
          <h2 style={s('margin: 0; font-size: 18px; font-weight: 700')}>Para empezar</h2>
          <PasoInicial n={1} titulo="Apunta lo que compras" sub="Producto, súper y precio" to="/compras" />
          <PasoInicial n={2} titulo="Guarda tus platos" sub="Ingredientes y raciones" to="/platos" />
          <PasoInicial n={3} naranja titulo="Cocina y mira el precio" sub="Ajusta lo que usas de verdad" to="/produccion/nueva" />
        </section>
      </main>
      <MenuInferior actual="inicio" />
    </div>
  );
}

function InicioOrdenador() {
  const { d, cat, sync } = useApp();
  const r = d.ajustes.redondeo;
  const recientes = ordenarProducciones(d.producciones).slice(0, 4);
  const platos = d.platos.map((p) => ({ p, coste: costePlato(p, cat, r).costeRacion })).sort((a, b) => a.coste - b.coste).slice(0, 6);
  const ultimoPrecio = new Map<string, number>();
  for (const pr of d.precios) ultimoPrecio.set(pr.productoId, Math.max(ultimoPrecio.get(pr.productoId) ?? 0, pr.creadoEn));
  const productos = d.productos.slice().sort((a, b) => (ultimoPrecio.get(b.id) ?? 0) - (ultimoPrecio.get(a.id) ?? 0)).slice(0, 5);
  return (
    <div style={s("min-height: 100dvh; background: #EEF1F8; display: flex; font-family: 'Figtree', system-ui, sans-serif; color: #14213D")}>
      <MenuLateral actual="inicio" />
      <main style={s('flex: 999 1 560px; min-width: 0; padding: 40px 48px 56px; box-sizing: border-box')}>
        <div style={s('max-width: 1040px; margin: 0 auto; display: flex; flex-direction: column; gap: 32px')}>
          <header style={s('display: flex; flex-wrap: wrap; align-items: flex-end; justify-content: space-between; gap: 20px')}>
            <div style={s('display: flex; flex-direction: column; gap: 4px')}>
              <span style={s('display: flex; flex-wrap: wrap; align-items: center; gap: 12px')}>
                <span style={s('font-size: 16px; font-weight: 600; color: #4A5672')}>{fechaLarga(hoyIso())}</span>
                <PildoraSync sync={sync} ordenador />
              </span>
              <h1 className="num" style={s('margin: 0; font-size: 44px; font-weight: 800; line-height: 1.05')}>Hola, ¿qué cocinas hoy?</h1>
            </div>
            <Link to="/produccion/nueva" style={s('display: flex; align-items: center; gap: 12px; height: 64px; padding: 0 28px 0 20px; border-radius: 20px; background: #FF9F1C; color: #14213D; font-size: 20px; font-weight: 800; box-shadow: 0 10px 24px rgba(255,159,28,0.35)')}>
              <span style={s('width: 40px; height: 40px; border-radius: 12px; background: #14213D; color: #FF9F1C; display: flex; align-items: center; justify-content: center')}>
                <IMas t={22} sw={2.8} />
              </span>
              Nueva producción
            </Link>
          </header>
          <section style={s('display: flex; flex-direction: column; gap: 14px')}>
            <div style={s('display: flex; justify-content: space-between; align-items: baseline')}>
              <h2 style={s('margin: 0; font-size: 22px; font-weight: 700')}>Últimas producciones</h2>
              <Link to="/historial" style={s('font-size: 16px; font-weight: 700')}>Ver historial</Link>
            </div>
            {recientes.length ? (
              <div style={s('display: grid; grid-template-columns: repeat(auto-fill, minmax(230px, 1fr)); gap: 16px')}>
                {recientes.map((p, i) => {
                  const sub = s('font-size:14px;font-weight:500;color:' + (i === 0 ? '#C9D1E4' : '#4A5672'));
                  return (
                    <Link key={p.id} to={'/produccion/' + p.id} style={s('display:flex;flex-direction:column;justify-content:space-between;gap:24px;min-height:180px;border-radius:24px;padding:22px;box-sizing:border-box;' +
                      (i === 0 ? 'background:#14213D;color:#FFFFFF' : 'background:#FFFFFF;color:#14213D'))}>
                      <span style={s('display: flex; flex-direction: column; gap: 4px')}>
                        <span style={s('font-size: 17px; font-weight: 700; line-height: 1.3')}>{p.nombrePlato}</span>
                        <span style={sub}>{fechaCorta(p.fecha)} · {queSalio(p)}</span>
                      </span>
                      <span style={s('display: flex; flex-direction: column; gap: 2px')}>
                        <span className="num" style={s('font-size:44px;font-weight:800;line-height:1;color:' + (i === 0 ? '#FF9F1C' : '#14213D'))}>{euros(p.precioCobrar)}</span>
                        <span style={sub}>por ración · lote {euros(p.costeLote)}</span>
                      </span>
                    </Link>
                  );
                })}
              </div>
            ) : (
              <div style={s('background: #FFFFFF; border-radius: 24px; padding: 24px; font-size: 16px; line-height: 1.45; font-weight: 500; color: #4A5672')}>
                Todavía no has cocinado nada. Cuando hagas tu primer lote, aquí verás cuánto te ha costado y cuánto cobrar por ración.
              </div>
            )}
          </section>
          <div style={s('display: grid; grid-template-columns: repeat(auto-fit, minmax(300px, 1fr)); gap: 16px')}>
            <section style={s('background: #FFFFFF; border-radius: 24px; padding: 24px; display: flex; flex-direction: column; gap: 14px')}>
              <div style={s('display: flex; justify-content: space-between; align-items: baseline')}>
                <h2 style={s('margin: 0; font-size: 20px; font-weight: 700')}>Platos</h2>
                <Link to="/platos" style={s('font-size: 15px; font-weight: 700')}>Ver todos</Link>
              </div>
              <ul style={s('list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column')}>
                {platos.map(({ p, coste }) => (
                  <li key={p.id} style={s('border-bottom: 1px solid #EEF1F8')}>
                    <Link to={'/plato/' + p.id} style={s('display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 12px 0')}>
                      <span style={s('font-size: 16px; font-weight: 600')}>{p.nombre}</span>
                      <span className="num" style={s('font-size: 20px; font-weight: 800; white-space: nowrap')}>{euros(coste)}</span>
                    </Link>
                  </li>
                ))}
              </ul>
              <span style={s('font-size: 13px; font-weight: 600; color: #4A5672')}>Coste por ración con los precios de hoy</span>
            </section>
            <section style={s('background: #FFFFFF; border-radius: 24px; padding: 24px; display: flex; flex-direction: column; gap: 14px')}>
              <div style={s('display: flex; justify-content: space-between; align-items: baseline')}>
                <h2 style={s('margin: 0; font-size: 20px; font-weight: 700')}>Productos</h2>
                <Link to="/compras" style={s('font-size: 15px; font-weight: 700')}>Ver los {d.productos.length}</Link>
              </div>
              <ul style={s('list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column')}>
                {productos.map((p) => {
                  const precio = cat.precio.get(p.id) ?? 0;
                  return (
                    <li key={p.id} style={s('border-bottom: 1px solid #EEF1F8')}>
                      <Link to={'/producto/' + p.id} style={s('display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 12px 0')}>
                        <span style={s('display: flex; flex-direction: column; gap: 2px')}>
                          <span style={s('font-size: 16px; font-weight: 600')}>{p.nombre}</span>
                          <span style={s('font-size: 13px; font-weight: 500; color: #4A5672')}>{p.supermercado} · {precioPorUnidad(precio, p.contenido, p.unidad)}</span>
                        </span>
                        <span className="num" style={s('font-size: 20px; font-weight: 800; white-space: nowrap')}>{euros(precio)}</span>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
}
