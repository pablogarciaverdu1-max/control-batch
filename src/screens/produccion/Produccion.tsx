import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { euros } from '../../calc/format';
import { avisoOk } from '../../ui/avisos';
import { useEsOrdenador } from '../../ui/marco';
import { useProduccion } from './borrador';
import { ProduccionMovil } from './ProduccionMovil';
import { ProduccionOrdenador } from './ProduccionOrdenador';

/** Nueva producción (/produccion/nueva) y Corregir (/produccion/:id/corregir). */
export function Produccion() {
  const { id } = useParams();
  const [q] = useSearchParams();
  const ord = useEsOrdenador();
  const nav = useNavigate();
  const e = useProduccion({ platoInicial: q.get('plato'), corregirId: id });
  if (!e.b) return null;
  const rutaCerrar = id ? '/produccion/' + id : '/';
  const onCerrar = () => { if (id) e.descartar(); };
  const onGuardado = async () => {
    const p = await e.guardar();
    if (!p) return;
    if (id) {
      avisoOk('Cambios guardados', 'Cobra ' + euros(p.precioCobrar) + ' por ración');
      nav('/produccion/' + id, { replace: true });
    } else {
      avisoOk(e.sinConexion ? 'Guardada en el móvil' : 'Producción guardada', 'Cobra ' + euros(p.precioCobrar) + ' por ración');
      // En el móvil se ve en el Historial (como en el diseño); en el ordenador, en Inicio
      nav(ord ? '/' : '/historial?plato=' + p.platoId, { replace: true });
    }
  };
  const props = { e, onGuardado, onCerrar, rutaCerrar };
  return ord ? <ProduccionOrdenador {...props} /> : <ProduccionMovil {...props} />;
}
