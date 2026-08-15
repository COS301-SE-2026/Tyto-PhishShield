import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import './index.css';

import App from './app.tsx';

import { ThemeProvider } from './context/theme-context';
import { AccessibilityProvider } from './context/accessibility-context';
import { AuthProvider } from './context/auth-context';
import { ToastProvider } from './context/toast-context';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <BrowserRouter basename={import.meta.env.BASE_URL || '/'}>
      <ThemeProvider>
        <AccessibilityProvider>
          <AuthProvider>
            <ToastProvider>
              <App />
            </ToastProvider>
          </AuthProvider>
        </AccessibilityProvider>
      </ThemeProvider>
    </BrowserRouter>
  </StrictMode>,
);