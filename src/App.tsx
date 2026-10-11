import { HashRouter, Route, Routes } from 'react-router-dom';
import { useApp } from './data/almacen';
import { Inicio } from './screens/Inicio';
import { Pendiente } from './screens/Pendiente';
import { Produccion } from './screens/produccion/Produccion';
import { Compras } from './screens/compras/Compras';
import { Producto } from './screens/compras/Producto';
import { ProductoForm } from './screens/compras/ProductoForm';
import { Avisos } from './ui/avisos';
import { Platos } from './screens/platos/Platos';
import { Plato } from './screens/platos/Plato';
import { PlatoEditor } from './screens/platos/PlatoEditor';
import { Historial } from './screens/historial/Historial';
import { ProduccionDetalle } from './screens/historial/ProduccionDetalle';

export function App() {
  const { listo } = useApp();
  if (!listo) return null;
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/produccion/nueva" element={<Produccion />} />
        <Route path="/produccion/:id/corregir" element={<Produccion />} />
        <Route path="/produccion/:id" element={<ProduccionDetalle />} />
        <Route path="/compras" element={<Compras />} />
        <Route path="/compras/nuevo" element={<ProductoForm />} />
        <Route path="/producto/:id" element={<Producto />} />
        <Route path="/producto/:id/editar" element={<ProductoForm key="editar" />} />
        <Route path="/platos" element={<Platos />} />
        <Route path="/plato/nuevo" element={<PlatoEditor key="nuevo" />} />
        <Route path="/plato/:id" element={<Plato />} />
        <Route path="/plato/:id/editar" element={<PlatoEditor key="editar" />} />
        <Route path="/historial" element={<Historial />} />
        <Route path="/ajustes" element={<Pendiente titulo="Ajustes" fase="f" seccion="ajustes" />} />
        <Route path="*" element={<Inicio />} />
      </Routes>
      <Avisos />
    </HashRouter>
  );
}
