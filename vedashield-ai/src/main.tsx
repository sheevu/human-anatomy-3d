import React from 'react';
import ReactDOM from 'react-dom/client';
const App = React.lazy(() => import('./App'));
const AnatomyExplorer = React.lazy(() => import('./components/anatomy/AnatomyExplorer'));
import './index.css';
import './i18n/i18n';

ReactDOM.createRoot(document.getElementById('root') as HTMLElement).render(
  <React.StrictMode>
    <React.Suspense fallback={<div role="status" style={{ padding: 32 }}>Loading VedaShield...</div>}>
      {window.location.pathname.replace(/\/$/, '') === '/anatomy' ? <AnatomyExplorer /> : <App />}
    </React.Suspense>
  </React.StrictMode>
);
