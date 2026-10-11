import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { almacen } from './data/almacen';

almacen.iniciar();
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
