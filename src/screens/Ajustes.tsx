import { useState } from 'react';
import { Link } from 'react-router-dom';
import { costePlato, precioACobrar } from '../calc/calc';
import { hoyIso } from '../calc/fechas';
import { euros, redondeoTexto } from '../calc/format';
import { almacen, useApp } from '../data/almacen';
import { ID_AJUSTES, type Redondeo } from '../data/model';
import { avisoOk } from '../ui/avisos';
import { estiloBotonCabecera } from '../ui/comunes';
import { s } from '../ui/css';
import { IAtras, IDescargar, ILlave, INube, ISiguiente, ISinConexion } from '../ui/iconos';
import { Pantalla } from '../ui/marco';

const REDONDEOS: Redondeo[] = [0.05, 0.1, 0.5];

/** Descarga un JSON con todos los datos (lo que hay ahora en la app). */
function descargarCopia() {
  const { d } = almacen.get();
  const copia = { exportado: new Date().toISOString(), ...d };
  const url = URL.createObjectURL(new Blob([JSON.stringify(copia, null, 2)], { type: 'application/json' }));
  const a = document.createElement('a');
  a.href = url;
  a.download = 'mi-cocina-' + hoyIso() + '.json';
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export function Ajustes() {
  const { d, cat, sync, clave } = useApp();
  const [abierta, setAbierta] = useState(false);
  const [actual, setActual] = useState('');
  const [nueva, setNueva] = useState('');
  const [errorClave, setErrorClave] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [aviso, setAviso] = useState<'' | 'pendientes'>('');
  const r = d.ajustes.redondeo;
  const ejemplo = d.platos[0];
  const costeEjemplo = ejemplo ? costePlato(ejemplo, cat, r).costeRacion : 1.02;

  const elegir = (v: Redondeo) => {
    if (v !== r) almacen.guardar({ ajustes: { id: ID_AJUSTES, redondeo: v, updatedAt: Date.now() } });
  };
  const guardarClave = async () => {
    if (actual !== clave) return setErrorClave('La clave actual no es la buena.');
    if (nueva.trim().length < 4) return setErrorClave('La clave nueva tiene que tener al menos 4 caracteres.');
    setGuardando(true);
    const res = await almacen.cambiarClave(nueva.trim());
    setGuardando(false);
    if (res === 'red') return setErrorClave('Necesitas conexión para cambiar la clave.');
    if (res === 'error') return setErrorClave('No se ha podido cambiar la clave. Prueba otra vez.');
    setAbierta(false); setActual(''); setNueva(''); setErrorClave('');
    avisoOk('Clave cambiada', 'Los demás dispositivos te pedirán la nueva');
  };
  const cerrarSesion = async (forzar = false) => {
    if (!forzar) {
      await almacen.sincronizar();
      if (await almacen.pendientes()) return setAviso('pendientes');
    }
    await almacen.cerrarSesion();
  };

  const nube = sync === 'sin conexión'
    ? { fondo: 'background: #FFE8C7; color: #7A3E00', icono: <ISinConexion t={22} />, t: 'Sin conexión', sub: 'Lo que cambies se guardará en la nube al volver' }
    : sync === 'guardando'
      ? { fondo: 'background: #FFE8C7; color: #7A3E00', icono: <INube t={22} />, t: 'Guardando en la nube…', sub: 'Tus últimos cambios se están subiendo' }
      : { fondo: 'background: #E6F1E9; color: #1D5A31', icono: <INube t={22} />, t: 'Tus datos están en la nube', sub: 'Los ves igual en el móvil y en el ordenador' };

  return (
    <Pantalla conMenu={false} seccion="ajustes">
      <header style={s('display: flex; align-items: center; gap: 12px; padding: 20px 16px 8px')}>
        <Link to="/" aria-label="Volver a Inicio" style={s(estiloBotonCabecera)}><IAtras t={26} /></Link>
        <h1 className="num" style={s('margin: 0; font-size: 30px; font-weight: 800')}>Ajustes</h1>
      </header>
      <main style={s('flex: 1; overflow-y: auto; padding: 12px 20px max(28px, env(safe-area-inset-bottom)); display: flex; flex-direction: column; gap: 18px')}>
        <section style={s('background: #FFFFFF; border-radius: 22px; padding: 18px; display: flex; flex-direction: column; gap: 14px; flex-shrink: 0')}>
          <div style={s('display: flex; flex-direction: column; gap: 4px')}>
            <h2 style={s('margin: 0; font-size: 18px; font-weight: 700')}>Redondeo del precio a cobrar</h2>
            <span style={s('font-size: 14px; font-weight: 500; color: #4A5672')}>Siempre hacia arriba, para no perder dinero.</span>
          </div>
          <div role="group" aria-label="Redondeo" style={s('display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 8px')}>
            {REDONDEOS.map((v) => (
              <button key={v} type="button" onClick={() => elegir(v)} aria-pressed={r === v} className="num"
                style={s('height:56px;border-radius:16px;font-size:19px;font-weight:800;' + (r === v ? 'background:#14213D;color:#FFFFFF;border:2px solid #14213D' : 'background:#FFFFFF;color:#14213D;border:2px solid #DCE2EE'))}>
                {redondeoTexto(v)} €
              </button>
            ))}
          </div>
          <div style={s('display: flex; justify-content: space-between; align-items: center; background: #EEF1F8; border-radius: 14px; padding: 12px 14px; gap: 10px')}>
            <span style={s('font-size: 14px; font-weight: 600; color: #4A5672')}>{ejemplo ? ejemplo.nombre : 'Ejemplo'}: {euros(costeEjemplo)} por ración</span>
            <span style={s('display: flex; align-items: baseline; gap: 6px; flex-shrink: 0')}>
              <span style={s('font-size: 14px; font-weight: 600; color: #4A5672')}>cobras</span>
              <span className="num" style={s('font-size: 24px; font-weight: 800')}>{euros(precioACobrar(costeEjemplo, r))}</span>
            </span>
          </div>
        </section>
        <section style={s('background: #FFFFFF; border-radius: 22px; padding: 6px 18px; display: flex; flex-direction: column; flex-shrink: 0')}>
          <div role="status" style={s('display: flex; align-items: center; gap: 14px; min-height: 72px; border-bottom: 1px solid #EEF1F8')}>
            <span style={s('width: 40px; height: 40px; border-radius: 12px; display: flex; align-items: center; justify-content: center; flex-shrink: 0;' + nube.fondo)}>{nube.icono}</span>
            <span style={s('display: flex; flex-direction: column; gap: 2px')}>
              <span style={s('font-size: 16px; font-weight: 700')}>{nube.t}</span>
              <span style={s('font-size: 14px; font-weight: 500; color: #4A5672')}>{nube.sub}</span>
            </span>
          </div>
          <button type="button" onClick={descargarCopia} style={s('display: flex; align-items: center; gap: 14px; min-height: 72px; border: none; background: transparent; padding: 0; text-align: left')}>
            <span style={s('width: 40px; height: 40px; border-radius: 12px; background: #EEF1F8; display: flex; align-items: center; justify-content: center; flex-shrink: 0')}><IDescargar t={22} /></span>
            <span style={s('display: flex; flex-direction: column; gap: 2px; flex: 1')}>
              <span style={s('font-size: 16px; font-weight: 700')}>Descargar una copia de mis datos</span>
              <span style={s('font-size: 14px; font-weight: 500; color: #4A5672')}>Compras, platos y producciones en un archivo</span>
            </span>
          </button>
        </section>
        <section style={s('background: #FFFFFF; border-radius: 22px; padding: 6px 18px; display: flex; flex-direction: column; flex-shrink: 0')}>
          <button type="button" onClick={() => { setAbierta(!abierta); setErrorClave(''); }} aria-expanded={abierta} style={s('display: flex; align-items: center; gap: 14px; min-height: 72px; border: none; background: transparent; padding: 0; text-align: left')}>
            <span style={s('width: 40px; height: 40px; border-radius: 12px; background: #EEF1F8; display: flex; align-items: center; justify-content: center; flex-shrink: 0')}><ILlave t={22} /></span>
            <span style={s('font-size: 16px; font-weight: 700; flex: 1')}>Cambiar la clave</span>
            <ISiguiente t={22} sw={2.4} c="#4A5672" style={s('flex-shrink:0;transition:transform .15s;transform:rotate(' + (abierta ? '90deg' : '0deg') + ')')} />
          </button>
          {abierta && (
            <form onSubmit={(e) => { e.preventDefault(); guardarClave(); }} style={s('display: flex; flex-direction: column; gap: 10px; padding: 0 0 16px')}>
              <label style={s('display: flex; flex-direction: column; gap: 6px')}>
                <span style={s('font-size: 14px; font-weight: 700')}>Clave actual</span>
                <input id="clave-actual" type="password" autoComplete="current-password" value={actual} onChange={(e) => { setActual(e.target.value); setErrorClave(''); }} style={s('height: 52px; border-radius: 14px; border: 2px solid #DCE2EE; padding: 0 14px; font-size: 18px; box-sizing: border-box; background: #FFFFFF')} />
              </label>
              <label style={s('display: flex; flex-direction: column; gap: 6px')}>
                <span style={s('font-size: 14px; font-weight: 700')}>Clave nueva</span>
                <input id="clave-nueva" type="password" autoComplete="new-password" value={nueva} onChange={(e) => { setNueva(e.target.value); setErrorClave(''); }} style={s('height: 52px; border-radius: 14px; border: 2px solid #DCE2EE; padding: 0 14px; font-size: 18px; box-sizing: border-box; background: #FFFFFF')} />
              </label>
              {errorClave && <span role="alert" style={s('background: #FFE8C7; color: #5C2E00; border-radius: 12px; padding: 10px 12px; font-size: 15px; font-weight: 700')}>{errorClave}</span>}
              <button type="submit" style={s('height: 54px; border-radius: 16px; border: none; background: #14213D; color: #FFFFFF; font-size: 16px; font-weight: 800')}>{guardando ? 'Guardando…' : 'Guardar clave nueva'}</button>
              <span style={s('font-size: 13px; font-weight: 500; color: #4A5672')}>Los demás dispositivos te pedirán la clave nueva.</span>
            </form>
          )}
        </section>
        {aviso === 'pendientes' ? (
          <section role="alert" style={s('display: flex; flex-direction: column; gap: 10px; padding: 16px; border-radius: 20px; background: #FFE8C7; color: #5C2E00; flex-shrink: 0')}>
            <span style={s('font-size: 15px; font-weight: 700; line-height: 1.4')}>Hay cambios en este dispositivo que todavía no se han subido. Si cierras sesión ahora, se perderán.</span>
            <div style={s('display: flex; gap: 8px')}>
              <button type="button" onClick={() => setAviso('')} style={s('flex: 1; height: 50px; border-radius: 14px; border: 2px solid #DCE2EE; background: #FFFFFF; color: #14213D; font-size: 15px; font-weight: 700')}>Esperar</button>
              <button type="button" onClick={() => cerrarSesion(true)} style={s('flex: 1; height: 50px; border-radius: 14px; border: none; background: #A1281E; color: #FFFFFF; font-size: 15px; font-weight: 800')}>Cerrar igualmente</button>
            </div>
          </section>
        ) : (
          <button type="button" onClick={() => cerrarSesion()} style={s('display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 16px; border-radius: 20px; border: 2px solid #DCE2EE; background: #FFFFFF; text-align: center; flex-shrink: 0')}>
            <span style={s('font-size: 17px; font-weight: 800; color: #9A4A00')}>Cerrar sesión en este dispositivo</span>
            <span style={s('font-size: 13px; font-weight: 500; color: #4A5672')}>Tus datos no se borran. Te pedirá la clave al volver.</span>
          </button>
        )}
      </main>
    </Pantalla>
  );
}
