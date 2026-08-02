import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import { AuthProvider } from './presentation/context/AuthContext';
import { registerServiceWorker } from './pwaRegister';
import './index.css';

window.addEventListener('error', (event) => {
  fetch('/api/log-error', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: event.message, stack: event.error?.stack })
  }).catch(console.error);
});

window.addEventListener('unhandledrejection', (event) => {
  fetch('/api/log-error', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ message: event.reason?.message || 'Unhandled Rejection', stack: event.reason?.stack })
  }).catch(console.error);
});

// Initialize PWA Service Worker
registerServiceWorker();

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AuthProvider>
      <App />
    </AuthProvider>
  </StrictMode>,
);

