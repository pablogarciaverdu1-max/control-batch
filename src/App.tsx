import { HashRouter, Route, Routes } from 'react-router-dom';
import { useApp } from './data/almacen';
import { Inicio } from './screens/Inicio';
import { Pendiente } from './screens/Pendiente';
import { Produccion } from './screens/produccion/Produccion';
import { Compras } from './screens/compras/Compras';
import { Producto } from './screens/compras/Producto';
import { ProductoForm } from './screens/compras/ProductoForm';
import { Avisos } from './ui/avisos';

export function App() {
  const { listo } = useApp();
  if (!listo) return null;
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Inicio />} />
        <Route path="/produccion/nueva" element={<Produccion />} />
        <Route path="/produccion/:id/corregir" element={<Produccion />} />
        <Route path="/produccion/:id" element={<Pendiente titulo="Producción" fase="e" seccion="historial" />} />
        <Route path="/compras" element={<Compras />} />
        <Route path="/compras/nuevo" element={<ProductoForm />} />
        <Route path="/producto/:id" element={<Producto />} />
        <Route path="/producto/:id/editar" element={<ProductoForm key="editar" />} />
        <Route path="/platos" element={<Pendiente titulo="Platos" fase="d" seccion="platos" />} />
        <Route path="/plato/*" element={<Pendiente titulo="Plato" fase="d" seccion="platos" />} />
        <Route path="/historial" element={<Pendiente titulo="Historial" fase="e" seccion="historial" />} />
        <Route path="/ajustes" element={<Pendiente titulo="Ajustes" fase="f" seccion="ajustes" />} />
        <Route path="*" element={<Inicio />} />
      </Routes>
      <Avisos />
    </HashRouter>
  );
}
