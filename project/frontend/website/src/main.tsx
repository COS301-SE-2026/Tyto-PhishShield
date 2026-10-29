import { Component, StrictMode, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';

import posthog from './lib/posthog';
import './index.css';

import App from './app.tsx';

import { ThemeProvider } from './context/theme-context';
import { AccessibilityProvider } from './context/accessibility-context';
import { AuthProvider } from './context/auth-context';
import { ToastProvider } from './context/toast-context';
import { NotificationProvider } from './context/notification-context';

class AppErrorBoundary extends Component<
  { children: ReactNode },
  { hasError: boolean }
> {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error: Error) {
    if (
      import.meta.env.VITE_POSTHOG_PROJECT_TOKEN &&
      import.meta.env.VITE_POSTHOG_HOST
    ) {
      posthog.captureException(error);
    }
  }

  render() {
    if (this.state.hasError) {
      return <p>Something went wrong. Please refresh the page and try again.</p>;
    }

    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <AppErrorBoundary>
      <BrowserRouter basename={import.meta.env.BASE_URL || '/'}>
        <ThemeProvider>
          <AccessibilityProvider>
            <AuthProvider>
              <NotificationProvider>
                <ToastProvider>
                  <App />
                </ToastProvider>
              </NotificationProvider>
            </AuthProvider>
          </AccessibilityProvider>
        </ThemeProvider>
      </BrowserRouter>
    </AppErrorBoundary>
  </StrictMode>,
);