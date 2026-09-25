import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { registerSW } from 'virtual:pwa-register';
import App from './App';
import { AuthProvider } from './contexts/AuthContext';
import { CountryProvider } from './contexts/CountryContext';
import { LanguageProvider } from './contexts/LanguageContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { ensureSupabaseConfigured } from './lib/supabase';
import './index.css';

registerSW({ immediate: true });

async function bootstrap() {
  // Resolve Vercel runtime config before AuthProvider and public-directory hooks mount.
  // This keeps developer auth working even when Vercel stores the public values as
  // SUPABASE_* / NEXT_PUBLIC_* instead of VITE_* build-time variables.
  await ensureSupabaseConfigured();

  ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <ThemeProvider>
        <LanguageProvider>
          <CountryProvider>
            <AuthProvider>
              <BrowserRouter>
                <App />
              </BrowserRouter>
            </AuthProvider>
          </CountryProvider>
        </LanguageProvider>
      </ThemeProvider>
    </React.StrictMode>,
  );
}

void bootstrap();
