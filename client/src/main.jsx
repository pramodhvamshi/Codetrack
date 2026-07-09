import React from 'react';
import ReactDOM from 'react-dom/client';
import { App } from './App';
import { Analytics } from '@vercel/analytics/react';

import { ErrorBoundary } from './components/ErrorBoundary';

import { ThemeProvider } from './components/ThemeProvider';

ReactDOM.createRoot(document.getElementById('app')).render(
  <React.StrictMode>
    <ThemeProvider>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </ThemeProvider>
    <Analytics />
  </React.StrictMode>
);

