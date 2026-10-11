import { Link } from 'react-router-dom';
import { s } from '../ui/css';
import { IAtras } from '../ui/iconos';
import { Pantalla, type Seccion } from '../ui/marco';

/** Pantalla provisional mientras se construyen las demás fases. */
export function Pendiente({ titulo, fase, seccion }: { titulo: string; fase: string; seccion?: Seccion }) {
  return (
    <Pantalla seccion={seccion}>
      <header style={s('display: flex; align-items: center; gap: 12px; padding: 20px 16px 8px')}>
        <Link to="/" aria-label="Volver a Inicio" style={s('width: 52px; height: 52px; border-radius: 16px; background: #FFFFFF; display: flex; align-items: center; justify-content: center; flex-shrink: 0')}>
          <IAtras t={26} />
        </Link>
        <h1 className="num" style={s('margin: 0; font-size: 30px; font-weight: 800')}>{titulo}</h1>
      </header>
      <main style={s('flex: 1; padding: 12px 20px; font-size: 16px; font-weight: 500; color: #4A5672; line-height: 1.45')}>
        Esta pantalla llega en la fase {fase}.
      </main>
    </Pantalla>
  );
}
