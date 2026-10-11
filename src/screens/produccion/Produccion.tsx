import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
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
    if (id) nav('/produccion/' + id, { replace: true });
    else nav('/', { replace: true });
  };
  const props = { e, onGuardado, onCerrar, rutaCerrar };
  return ord ? <ProduccionOrdenador {...props} /> : <ProduccionMovil {...props} />;
}
