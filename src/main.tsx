import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { App } from './App';
import { almacen } from './data/almacen';
import { ErrorPantalla } from './ui/ErrorPantalla';

almacen.iniciar().catch((e) => console.error(e));
createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorPantalla>
      <App />
    </ErrorPantalla>
  </StrictMode>,
);
