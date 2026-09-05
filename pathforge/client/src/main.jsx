/**
 * Application Entry Point
 * 
 * Wraps the app with:
 * - React.StrictMode — catches common bugs in development
 * - QueryClientProvider — TanStack Query for server-state caching
 * - BrowserRouter — React Router for client-side navigation
 * 
 * WHY here and not in App.jsx?
 * Providers are infrastructure concerns. App.jsx focuses on
 * layout and routing. Keeping them separate makes testing easier
 * (you can wrap App with different providers in tests).
 */

import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import App from './App';
import './index.css';

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <App />
      </BrowserRouter>
    </QueryClientProvider>
  </React.StrictMode>
);
