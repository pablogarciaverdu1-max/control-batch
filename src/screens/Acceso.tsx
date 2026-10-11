import { useState } from 'react';
import { almacen, useApp } from '../data/almacen';
import { s } from '../ui/css';
import { IOjo, IOlla, ISiguiente } from '../ui/iconos';

/** Entrada con clave: solo la primera vez en cada dispositivo o tras cerrar sesión. */
export function Acceso() {
  const { errorClave } = useApp();
  const [clave, setClave] = useState('');
  const [ver, setVer] = useState(false);
  const [estado, setEstado] = useState<'' | 'clave' | 'red' | 'entrando'>(errorClave ? 'clave' : '');
  const error = estado === 'clave';

  const entrar = async () => {
    if (!clave.trim() || estado === 'entrando') return;
    setEstado('entrando');
    const r = await almacen.entrar(clave.trim());
    if (r !== 'ok') setEstado(r);
  };

  return (
    <div style={s("min-height: 100dvh; background: #14213D; color: #FFFFFF; display: flex; flex-direction: column; align-items: center; overflow: hidden; font-family: 'Figtree', system-ui, sans-serif")}>
      <div style={s('flex: 1; width: 100%; max-width: 480px; display: flex; flex-direction: column')}>
        <div style={s('flex: 1; display: flex; flex-direction: column; justify-content: center; gap: 36px; padding: 32px 24px')}>
          <div style={s('display: flex; flex-direction: column; align-items: flex-start; gap: 18px')}>
            <span style={s('width: 72px; height: 72px; border-radius: 22px; background: #FF9F1C; display: flex; align-items: center; justify-content: center')}>
              <IOlla t={40} c="#14213D" />
            </span>
            <h1 className="num" style={s('margin: 0; font-size: 40px; font-weight: 800; line-height: 1.05')}>Mi cocina</h1>
            <p style={s('margin: 0; font-size: 17px; line-height: 1.45; font-weight: 500; color: #C9D1E4')}>Escribe tu clave para ver tus compras, platos y producciones en este dispositivo.</p>
          </div>

          <form onSubmit={(e) => { e.preventDefault(); entrar(); }} style={s('display: flex; flex-direction: column; gap: 14px')}>
            <label style={s('display: flex; flex-direction: column; gap: 8px')}>
              <span style={s('font-size: 15px; font-weight: 700')}>Clave</span>
              <span style={s('display:flex;align-items:center;gap:8px;height:64px;border-radius:18px;background:#FFFFFF;padding:0 8px 0 18px;box-sizing:border-box;border:3px solid ' + (error ? '#FF9F1C' : '#FFFFFF'))}>
                <input id="clave" type={ver ? 'text' : 'password'} value={clave} autoComplete="current-password" autoFocus
                  onChange={(e) => { setClave(e.target.value); if (estado !== 'entrando') setEstado(''); }}
                  style={s('flex: 1; min-width: 0; border: none; outline: none; background: transparent; color: #14213D; font-size: 20px; font-weight: 700; letter-spacing: 0.06em')} />
                <button type="button" onClick={() => setVer(!ver)} aria-label={ver ? 'Ocultar clave' : 'Mostrar clave'} style={s('width: 48px; height: 48px; border: none; border-radius: 12px; background: #EEF1F8; color: #14213D; display: flex; align-items: center; justify-content: center; flex-shrink: 0')}>
                  <IOjo t={22} />
                </button>
              </span>
            </label>
            {error && (
              <span role="alert" style={s('display: flex; align-items: center; gap: 8px; background: #FFE8C7; color: #5C2E00; border-radius: 12px; padding: 10px 12px; font-size: 15px; font-weight: 700')}>Esa clave no es la buena. Prueba otra vez.</span>
            )}
            {estado === 'red' && (
              <span role="alert" style={s('display: flex; align-items: center; gap: 8px; background: #FFE8C7; color: #5C2E00; border-radius: 12px; padding: 10px 12px; font-size: 15px; font-weight: 700')}>No hay conexión. Para entrar la primera vez necesitas internet.</span>
            )}
            <button type="submit" style={s('height: 64px; border: none; border-radius: 20px; background: #FF9F1C; color: #14213D; font-size: 19px; font-weight: 800; display: flex; align-items: center; justify-content: center; gap: 10px')}>
              {estado === 'entrando' ? 'Entrando…' : 'Entrar'}
              <ISiguiente t={22} />
            </button>
          </form>
        </div>
        <p style={s('margin: 0; padding: 0 24px max(36px, env(safe-area-inset-bottom)); font-size: 14px; line-height: 1.45; font-weight: 500; color: #C9D1E4; text-align: center')}>Solo te la pedimos la primera vez en cada dispositivo.</p>
      </div>
    </div>
  );
}
