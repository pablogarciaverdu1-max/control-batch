import { useState, type ReactNode } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { calcularLote, ppuActual } from '../../calc/calc';
import { cantidad, euros, leerNumero, numero, precioPorUnidad, raciones } from '../../calc/format';
import { almacen, useApp } from '../../data/almacen';
import { pasoPorDefecto, type IngredientePlato, type Plato } from '../../data/model';
import { nuevoId } from '../../data/operaciones';
import { avisoOk } from '../../ui/avisos';
import { estiloBotonCabecera } from '../../ui/comunes';
import { s } from '../../ui/css';
import { IAtras, IBuscar, ICerrar, ICheck, IMas, IMenos, IPapelera } from '../../ui/iconos';
import { useEsOrdenador } from '../../ui/marco';

type Tipo = 'raciones' | 'albóndigas' | 'croquetas' | 'otra';
const TIPOS: [Tipo, string][] = [['raciones', 'Raciones'], ['albóndigas', 'Albóndigas'], ['croquetas', 'Croquetas'], ['otra', 'Otra cosa']];
const SINGULAR: Record<string, string> = { 'albóndigas': 'albóndiga', croquetas: 'croqueta' };
/** Singular aproximado de un plural escrito a mano: empanadillas → empanadilla. */
const singularDe = (pl: string) => pl.replace(/s$/i, '');

export function PlatoEditor() {
  const { id } = useParams();
  const { d, cat } = useApp();
  const nav = useNavigate();
  const ord = useEsOrdenador();
  const original = id ? d.platos.find((p) => p.id === id) : undefined;
  const tipoInicial: Tipo = !original ? 'raciones' : (['raciones', 'albóndigas', 'croquetas'].includes(original.cuenta) ? (original.cuenta as Tipo) : 'otra');
  const [nombre, setNombre] = useState(original?.nombre ?? '');
  const [tipo, setTipo] = useState<Tipo>(tipoInicial);
  const [plural, setPlural] = useState(tipoInicial === 'otra' ? original!.cuenta : '');
  const [singular, setSingular] = useState(tipoInicial === 'otra' ? original!.singular : '');
  const [salen, setSalen] = useState(original?.salen ?? 4);
  const [porRacion, setPorRacion] = useState(original && original.cuenta !== 'raciones' ? original.porRacion : 5);
  const [items, setItems] = useState<IngredientePlato[]>(original?.ingredientes.filter((i) => cat.productos.has(i.productoId)) ?? []);
  const [buscar, setBuscar] = useState('');
  const [editando, setEditando] = useState(-1);
  const [texto, setTexto] = useState('');
  const [error, setError] = useState('');

  const porUnidades = tipo !== 'raciones';
  const cuenta = tipo === 'otra' ? plural.trim() || 'unidades' : tipo;
  const uno = tipo === 'otra' ? singular.trim() || (plural.trim() ? singularDe(plural.trim()) : 'unidad') : SINGULAR[tipo] ?? '';
  const per = porUnidades ? porRacion : 1;
  const lote = calcularLote(items.map((i) => ({ cantidad: i.cantidad, precioUnitario: ppuActual(cat, i.productoId) })), salen, per, !porUnidades, d.ajustes.redondeo);

  const q = buscar.trim().toLowerCase();
  const resultados = !q ? [] : d.productos.filter((p) => !items.some((i) => i.productoId === p.id) && p.nombre.toLowerCase().includes(q)).slice(0, ord ? 6 : 5);
  const setCantidad = (idx: number, v: number) => setItems((a) => a.map((x, i) => (i === idx ? { ...x, cantidad: Math.max(0, Math.round(v * 100) / 100) } : x)));
  const terminar = () => {
    const v = leerNumero(texto);
    if (v !== null && editando >= 0) setCantidad(editando, v);
    setEditando(-1);
  };
  const anadir = (pid: string) => {
    const p = cat.productos.get(pid)!;
    setItems((a) => a.concat([{ productoId: pid, cantidad: p.unidad === 'g' || p.unidad === 'ml' ? 100 : 1 }]));
    setBuscar('');
  };

  const guardar = async () => {
    if (!nombre.trim()) return setError('Escribe el nombre del plato.');
    let finales = items;
    const v = editando >= 0 ? leerNumero(texto) : null;
    if (v !== null) finales = items.map((x, i) => (i === editando ? { ...x, cantidad: Math.max(0, v) } : x));
    const plato: Plato = {
      id: original?.id ?? nuevoId('pl'), nombre: nombre.trim(), cuenta: porUnidades ? cuenta : 'raciones', singular: porUnidades ? uno : '',
      salen, porRacion: per, ingredientes: finales, updatedAt: Date.now(),
    };
    await almacen.guardar({ platos: [plato] });
    avisoOk('Plato guardado', 'Coste por ración: ' + euros(lote.costeRacion));
    nav('/plato/' + plato.id, { replace: true });
  };

  const titulo = original ? 'Editar plato' : 'Nuevo plato';
  const volver = original ? '/plato/' + original.id : '/platos';
  const madeTitle = porUnidades ? 'Cuántas ' + cuenta + ' salen' : 'Cuántas raciones salen';

  const tipos = (pill: string) => TIPOS.map(([t, label]) => (
    <button key={t} type="button" onClick={() => setTipo(t)} aria-pressed={tipo === t}
      style={s(pill + (tipo === t ? 'background:#14213D;color:#FFFFFF;border:2px solid #14213D' : 'background:#FFFFFF;color:#14213D;border:2px solid #DCE2EE'))}>{label}</button>
  ));
  const stepper = (valor: number, menos: () => void, mas: () => void, grande: boolean, etiqueta: string) => (
    <div style={s('display: flex; align-items: center; justify-content: space-between; background: #EEF1F8; border-radius: 16px; padding: 6px')}>
      <button type="button" onClick={menos} aria-label={'Menos ' + etiqueta} style={s(`width: ${grande ? 56 : 52}px; height: ${grande ? 52 : 48}px; border-radius: 12px; border: none; background: #FFFFFF; display: flex; align-items: center; justify-content: center`)}><IMenos t={grande ? 24 : 22} /></button>
      <span className="num" style={s(`font-size: ${grande ? 26 : 24}px; font-weight: 800`)}>{numero(valor)}</span>
      <button type="button" onClick={mas} aria-label={'Más ' + etiqueta} style={s(`width: ${grande ? 56 : 52}px; height: ${grande ? 52 : 48}px; border-radius: 12px; border: none; background: #14213D; color: #FFFFFF; display: flex; align-items: center; justify-content: center`)}><IMas t={grande ? 24 : 22} sw={2.8} /></button>
    </div>
  );
  const ingrediente = (it: IngredientePlato, idx: number, movil: boolean) => {
    const p = cat.productos.get(it.productoId);
    if (!p) return null;
    const paso = p.paso || pasoPorDefecto(p.unidad);
    return (
      <div key={it.productoId} style={s(movil ? 'background: #FFFFFF; border-radius: 20px; padding: 12px 12px 12px 16px; display: flex; flex-direction: column; gap: 8px' : 'background: #FFFFFF; border-radius: 22px; padding: 14px 14px 14px 18px; display: flex; flex-direction: column; gap: 10px')}>
        <div style={s('display: flex; align-items: ' + (movil ? 'center' : 'flex-start') + '; justify-content: space-between; gap: 8px')}>
          <span style={s('font-size: 16px; font-weight: 700; min-width: 0')}>{p.nombre}</span>
          <span style={s('display: flex; align-items: center; gap: 2px; flex-shrink: 0')}>
            <span className="num" style={s(`font-size: ${movil ? 18 : 20}px; font-weight: 800`)}>{euros(it.cantidad * ppuActual(cat, p.id))}</span>
            <button type="button" onClick={() => { setEditando(-1); setItems((a) => a.filter((_, i) => i !== idx)); }} aria-label="Quitar ingrediente" style={s('width: 44px; height: 44px; border-radius: 12px; border: none; background: transparent; color: #4A5672; display: flex; align-items: center; justify-content: center')}><IPapelera t={20} /></button>
          </span>
        </div>
        {editando === idx ? (
          <form onSubmit={(e) => { e.preventDefault(); terminar(); }} style={s('display: flex; align-items: center; gap: 8px; background: #EEF1F8; border-radius: 14px; padding: 5px')}>
            <label style={s('flex: 1; min-width: 0; display: flex; align-items: center; gap: 8px; height: 48px; background: #FFFFFF; border-radius: 10px; padding: 0 12px; border: 2px solid #FF9F1C; box-sizing: border-box')}>
              <span className="sr">Cantidad de {p.nombre}</span>
              <input type="text" inputMode="decimal" autoFocus value={texto} onChange={(e) => setTexto(e.target.value)} onFocus={(e) => e.target.select()} className="num" style={s('flex: 1; min-width: 0; border: none; outline: none; background: transparent; font-size: 22px; font-weight: 800')} />
              <span style={s('font-size: 16px; font-weight: 700; color: #4A5672')}>{p.unidad === 'envase' ? 'env.' : p.unidad}</span>
            </label>
            <button type="submit" style={s('height: 48px; padding: 0 16px; border-radius: 10px; border: none; background: #14213D; color: #FFFFFF; font-size: 15px; font-weight: 800')}>Listo</button>
          </form>
        ) : (
          <div style={s('display: flex; align-items: center; justify-content: space-between; background: #EEF1F8; border-radius: 14px; padding: 5px')}>
            <button type="button" onClick={() => setCantidad(idx, it.cantidad - paso)} aria-label="Menos" style={s('width: 52px; height: 48px; border-radius: 10px; border: none; background: #FFFFFF; display: flex; align-items: center; justify-content: center')}><IMenos t={22} /></button>
            <button type="button" onClick={() => { setEditando(idx); setTexto(String(it.cantidad).replace('.', ',')); }} aria-label="Escribir cantidad" className="num" style={s('border: none; background: transparent; padding: 0 6px; min-height: 44px; font-size: 22px; font-weight: 800; text-decoration: underline dashed #9AA6C0; text-underline-offset: 5px; text-decoration-thickness: 2px')}>{cantidad(it.cantidad, p.unidad)}</button>
            <button type="button" onClick={() => setCantidad(idx, it.cantidad + paso)} aria-label="Más" style={s('width: 52px; height: 48px; border-radius: 10px; border: none; background: #14213D; color: #FFFFFF; display: flex; align-items: center; justify-content: center')}><IMas t={22} sw={2.8} /></button>
          </div>
        )}
      </div>
    );
  };
  const resultado = (r: (typeof resultados)[number], fondo: string) => (
    <button key={r.id} type="button" onClick={() => anadir(r.id)} style={s(`display: flex; justify-content: space-between; align-items: center; gap: 10px; min-height: 52px; padding: 8px 12px; border-radius: 12px; border: none; background: ${fondo}; text-align: left`)}>
      <span style={s('display: flex; flex-direction: column; gap: 1px')}>
        <span style={s('font-size: 15px; font-weight: 700')}>{r.nombre}</span>
        <span style={s('font-size: 13px; font-weight: 500; color: #4A5672')}>{r.supermercado} · {precioPorUnidad(cat.precio.get(r.id) ?? 0, r.contenido, r.unidad)}</span>
      </span>
      <IMas t={20} />
    </button>
  );
  const otraCosa = (movil: boolean): ReactNode => tipo === 'otra' && (
    movil ? (
      <>
        <label style={s('display: flex; flex-direction: column; gap: 6px')}>
          <span style={s('font-size: 14px; font-weight: 600; color: #4A5672')}>¿Qué cuentas? (en plural)</span>
          <input id="plural" type="text" value={plural} onChange={(e) => setPlural(e.target.value)} placeholder="Ej. empanadillas" style={s('height: 52px; border-radius: 14px; border: 2px solid #DCE2EE; background: #FFFFFF; padding: 0 14px; font-size: 17px; font-weight: 600; box-sizing: border-box')} />
        </label>
        <label style={s('display: flex; flex-direction: column; gap: 6px')}>
          <span style={s('font-size: 14px; font-weight: 600; color: #4A5672')}>¿Y una sola? (para "por empanadilla")</span>
          <input id="singular" type="text" value={singular} onChange={(e) => setSingular(e.target.value)} placeholder={plural.trim() ? 'Ej. ' + singularDe(plural.trim()) : 'Ej. empanadilla'} style={s('height: 52px; border-radius: 14px; border: 2px solid #DCE2EE; background: #FFFFFF; padding: 0 14px; font-size: 17px; font-weight: 600; box-sizing: border-box')} />
        </label>
      </>
    ) : (
      <>
        <label style={s('display: flex; align-items: center; gap: 8px')}>
          <span className="sr">Qué cuentas, en plural</span>
          <input id="plural" type="text" value={plural} onChange={(e) => setPlural(e.target.value)} placeholder="Ej. empanadillas" style={s('height: 48px; width: 200px; border-radius: 14px; border: 2px solid #DCE2EE; padding: 0 14px; font-size: 16px; font-weight: 600; box-sizing: border-box')} />
        </label>
        <label style={s('display: flex; align-items: center; gap: 8px')}>
          <span className="sr">Y una sola, en singular</span>
          <input id="singular" type="text" value={singular} onChange={(e) => setSingular(e.target.value)} placeholder={'Una sola: ' + (plural.trim() ? singularDe(plural.trim()) : 'empanadilla')} style={s('height: 48px; width: 200px; border-radius: 14px; border: 2px solid #DCE2EE; padding: 0 14px; font-size: 16px; font-weight: 600; box-sizing: border-box')} />
        </label>
      </>
    )
  );
  const avisoError = error && <span role="alert" style={s('display: flex; align-items: center; gap: 8px; background: #FFE8C7; color: #5C2E00; border-radius: 12px; padding: 10px 12px; font-size: 15px; font-weight: 700')}>{error}</span>;

  if (ord) {
    return (
      <div style={s("min-height: 100dvh; background: #EEF1F8; font-family: 'Figtree', system-ui, sans-serif; color: #14213D; padding: 32px 40px 56px; box-sizing: border-box")}>
        <div style={s('max-width: 1200px; margin: 0 auto; display: flex; flex-direction: column; gap: 28px')}>
          <header style={s('display: flex; flex-wrap: wrap; align-items: center; gap: 16px')}>
            <Link to={volver} aria-label="Volver" style={s('width: 52px; height: 52px; border-radius: 16px; background: #FFFFFF; display: flex; align-items: center; justify-content: center')}><IAtras t={26} /></Link>
            <h1 className="num" style={s('margin: 0; font-size: 38px; font-weight: 800')}>{titulo}</h1>
          </header>
          <div style={s('display: flex; flex-wrap: wrap; gap: 28px; align-items: flex-start')}>
            <div style={s('flex: 999 1 560px; min-width: 0; display: flex; flex-direction: column; gap: 24px')}>
              <section style={s('background: #FFFFFF; border-radius: 24px; padding: 24px; display: flex; flex-direction: column; gap: 20px')}>
                <label style={s('display: flex; flex-direction: column; gap: 8px')}>
                  <span style={s('font-size: 15px; font-weight: 700')}>Nombre</span>
                  <input id="nombre" type="text" value={nombre} onChange={(e) => { setNombre(e.target.value); setError(''); }} placeholder="Ej. Lentejas con chorizo" style={s('height: 58px; border-radius: 16px; border: 2px solid #DCE2EE; background: #FFFFFF; padding: 0 16px; font-size: 20px; font-weight: 600; box-sizing: border-box')} />
                </label>
                <div role="group" aria-label="Qué cuento del lote" style={s('display: flex; flex-direction: column; gap: 8px')}>
                  <span style={s('font-size: 15px; font-weight: 700')}>Qué cuento del lote</span>
                  <div style={s('display: flex; flex-wrap: wrap; gap: 8px; align-items: center')}>
                    {tipos('min-height:48px;padding:0 18px;border-radius:14px;font-size:15px;font-weight:700;')}
                    {otraCosa(false)}
                  </div>
                </div>
                <div style={s('display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 14px; align-items: end')}>
                  <div style={s('display: flex; flex-direction: column; gap: 6px')}>
                    <span style={s('font-size: 15px; font-weight: 700')}>{madeTitle}</span>
                    {stepper(salen, () => setSalen(Math.max(1, salen - 1)), () => setSalen(salen + 1), false, 'salen')}
                  </div>
                  {porUnidades && (
                    <>
                      <div style={s('display: flex; flex-direction: column; gap: 6px')}>
                        <span style={s('font-size: 15px; font-weight: 700')}>Cuántas van por ración</span>
                        {stepper(porRacion, () => setPorRacion(Math.max(1, porRacion - 1)), () => setPorRacion(porRacion + 1), false, 'por ración')}
                      </div>
                      <div style={s('display: flex; justify-content: space-between; align-items: center; background: #FFE8C7; border-radius: 16px; padding: 0 16px; height: 60px')}>
                        <span style={s('font-size: 15px; font-weight: 700; color: #5C2E00')}>Salen</span>
                        <span className="num" style={s('font-size: 24px; font-weight: 800')}>{raciones(lote.raciones)}</span>
                      </div>
                    </>
                  )}
                </div>
                {avisoError}
              </section>
              <section style={s('display: flex; flex-direction: column; gap: 14px')}>
                <div style={s('display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 12px')}>
                  <h2 style={s('margin: 0; font-size: 20px; font-weight: 700')}>Ingredientes · {items.length}</h2>
                  <div style={s('position: relative; flex: 0 1 380px')}>
                    <label style={s('display: flex; align-items: center; gap: 10px; background: #FFFFFF; border: 2px solid #DCE2EE; border-radius: 16px; padding: 0 14px; height: 52px')}>
                      <IBuscar t={20} c="#4A5672" />
                      <span className="sr">Buscar producto para añadir</span>
                      <input type="search" placeholder="Añadir: busca un producto" value={buscar} onChange={(e) => setBuscar(e.target.value)} style={s('flex: 1; min-width: 0; border: none; outline: none; background: transparent; font-size: 16px; font-weight: 600')} />
                    </label>
                    {resultados.length > 0 && (
                      <div style={s('position: absolute; top: 58px; left: 0; right: 0; z-index: 2; background: #FFFFFF; border-radius: 16px; box-shadow: 0 16px 40px rgba(20,33,61,0.18); padding: 8px; display: flex; flex-direction: column; gap: 4px')}>
                        {resultados.map((r) => resultado(r, '#EEF1F8'))}
                      </div>
                    )}
                  </div>
                </div>
                <div style={s('display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 14px')}>
                  {items.map((it, i) => ingrediente(it, i, false))}
                </div>
              </section>
            </div>
            <aside aria-live="polite" style={s('flex: 1 1 320px; min-width: 0; background: #14213D; color: #FFFFFF; border-radius: 28px; padding: 28px; display: flex; flex-direction: column; gap: 20px; position: sticky; top: 24px')}>
              <span style={s('font-size: 15px; font-weight: 600; color: #C9D1E4')}>{nombre || titulo}</span>
              <div style={s('display: flex; flex-direction: column; gap: 2px')}>
                <span style={s('font-size: 15px; font-weight: 700; color: #C9D1E4')}>Coste por ración</span>
                <span className="num" style={s('font-size: 72px; font-weight: 800; line-height: 1; color: #FF9F1C')}>{euros(lote.costeRacion)}</span>
              </div>
              <div style={s('display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px')}>
                <div style={s('background: rgba(255,255,255,0.08); border-radius: 16px; padding: 14px; display: flex; flex-direction: column; gap: 2px')}>
                  <span style={s('font-size: 13px; font-weight: 600; color: #C9D1E4')}>Coste del lote</span>
                  <span className="num" style={s('font-size: 26px; font-weight: 800')}>{euros(lote.costeLote)}</span>
                </div>
                <div style={s('background: rgba(255,255,255,0.08); border-radius: 16px; padding: 14px; display: flex; flex-direction: column; gap: 2px')}>
                  <span style={s('font-size: 13px; font-weight: 600; color: #C9D1E4')}>Raciones</span>
                  <span className="num" style={s('font-size: 26px; font-weight: 800')}>{numero(lote.raciones)}</span>
                </div>
                {porUnidades && (
                  <div style={s('background: #FFE8C7; color: #14213D; border-radius: 16px; padding: 14px; display: flex; flex-direction: column; gap: 2px')}>
                    <span style={s('font-size: 13px; font-weight: 700; color: #7A3E00')}>Por {uno}</span>
                    <span className="num" style={s('font-size: 26px; font-weight: 800')}>{euros(lote.costeUnidad ?? 0)}</span>
                  </div>
                )}
              </div>
              <button type="button" onClick={guardar} style={s('height: 62px; border: none; border-radius: 20px; background: #FF9F1C; color: #14213D; font-size: 19px; font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 10px')}>
                <ICheck t={22} />
                Guardar plato
              </button>
            </aside>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div style={s("height: 100dvh; background: #EEF1F8; display: flex; flex-direction: column; overflow: hidden; font-family: 'Figtree', system-ui, sans-serif; color: #14213D")}>
      <header style={s('display: flex; align-items: center; gap: 12px; padding: 20px 16px 8px')}>
        <Link to={volver} aria-label="Cerrar sin guardar" style={s(estiloBotonCabecera)}><ICerrar /></Link>
        <h1 className="num" style={s('margin: 0; font-size: 26px; font-weight: 800')}>{titulo}</h1>
      </header>
      <main style={s('flex: 1; overflow-y: auto; padding: 12px 20px 20px; display: flex; flex-direction: column; gap: 20px')}>
        <label style={s('display: flex; flex-direction: column; gap: 8px')}>
          <span style={s('font-size: 15px; font-weight: 700')}>Nombre</span>
          <input id="nombre" type="text" value={nombre} onChange={(e) => { setNombre(e.target.value); setError(''); }} placeholder="Ej. Lentejas con chorizo" style={s('height: 58px; border-radius: 16px; border: 2px solid #DCE2EE; background: #FFFFFF; padding: 0 16px; font-size: 18px; font-weight: 600; box-sizing: border-box')} />
        </label>
        {avisoError}
        <section style={s('background: #FFFFFF; border-radius: 22px; padding: 18px; display: flex; flex-direction: column; gap: 14px')}>
          <div role="group" aria-label="Qué cuento del lote" style={s('display: flex; flex-direction: column; gap: 8px')}>
            <span style={s('font-size: 15px; font-weight: 700')}>Qué cuento del lote</span>
            <div style={s('display: flex; flex-wrap: wrap; gap: 8px')}>
              {tipos('min-height:48px;padding:0 16px;border-radius:14px;font-size:15px;font-weight:700;')}
            </div>
            {otraCosa(true)}
          </div>
          <div style={s('display: flex; flex-direction: column; gap: 6px')}>
            <span style={s('font-size: 15px; font-weight: 700')}>{madeTitle}</span>
            {stepper(salen, () => setSalen(Math.max(1, salen - 1)), () => setSalen(salen + 1), true, 'salen')}
          </div>
          {porUnidades && (
            <>
              <div style={s('display: flex; flex-direction: column; gap: 6px')}>
                <span style={s('font-size: 15px; font-weight: 700')}>Cuántas van por ración</span>
                {stepper(porRacion, () => setPorRacion(Math.max(1, porRacion - 1)), () => setPorRacion(porRacion + 1), true, 'por ración')}
              </div>
              <div style={s('display: flex; justify-content: space-between; align-items: baseline; background: #FFE8C7; border-radius: 14px; padding: 12px 14px')}>
                <span style={s('font-size: 15px; font-weight: 700; color: #5C2E00')}>Salen</span>
                <span className="num" style={s('font-size: 22px; font-weight: 800')}>{raciones(lote.raciones)}</span>
              </div>
            </>
          )}
        </section>
        <section style={s('display: flex; flex-direction: column; gap: 10px')}>
          <h2 style={s('margin: 0; font-size: 18px; font-weight: 700')}>Ingredientes · {items.length}</h2>
          {items.map((it, i) => ingrediente(it, i, true))}
          <div style={s('background: #FFFFFF; border: 2px dashed #9AA6C0; border-radius: 20px; padding: 12px; display: flex; flex-direction: column; gap: 8px')}>
            <label style={s('display: flex; align-items: center; gap: 10px; background: #EEF1F8; border-radius: 14px; padding: 0 14px; height: 52px')}>
              <IBuscar t={20} c="#4A5672" />
              <span className="sr">Buscar producto para añadir</span>
              <input type="search" placeholder="Añadir: busca un producto" value={buscar} onChange={(e) => setBuscar(e.target.value)} style={s('flex: 1; min-width: 0; border: none; outline: none; background: transparent; font-size: 16px; font-weight: 600')} />
            </label>
            {resultados.map((r) => resultado(r, '#FFFFFF'))}
          </div>
        </section>
      </main>
      <div aria-live="polite" style={s('background: #14213D; color: #FFFFFF; border-radius: 28px 28px 0 0; padding: 16px 20px max(26px, env(safe-area-inset-bottom)); display: flex; flex-direction: column; gap: 12px')}>
        <div style={s('display: flex; justify-content: space-between; align-items: flex-end; gap: 8px')}>
          <span style={s('display: flex; flex-direction: column; gap: 2px')}>
            <span style={s('font-size: 13px; font-weight: 600; color: #C9D1E4')}>Coste del lote</span>
            <span className="num" style={s('font-size: 26px; font-weight: 800; line-height: 1')}>{euros(lote.costeLote)}</span>
          </span>
          {porUnidades && (
            <span style={s('display: flex; flex-direction: column; gap: 2px; align-items: center')}>
              <span style={s('font-size: 13px; font-weight: 600; color: #C9D1E4')}>Por {uno}</span>
              <span className="num" style={s('font-size: 22px; font-weight: 800; line-height: 1')}>{euros(lote.costeUnidad ?? 0)}</span>
            </span>
          )}
          <span style={s('display: flex; flex-direction: column; align-items: flex-end; gap: 2px')}>
            <span style={s('font-size: 13px; font-weight: 600; color: #C9D1E4')}>Por ración</span>
            <span className="num" style={s('font-size: 36px; font-weight: 800; line-height: 1; color: #FF9F1C')}>{euros(lote.costeRacion)}</span>
          </span>
        </div>
        <button type="button" onClick={guardar} style={s('height: 58px; border: none; border-radius: 18px; background: #FF9F1C; color: #14213D; font-size: 18px; font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 8px')}>
          <ICheck t={22} />
          Guardar plato
        </button>
      </div>
    </div>
  );
}
