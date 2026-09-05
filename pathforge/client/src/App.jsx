/**
 * Root Application Component
 * 
 * Initializes session authentication on mount and renders AppRouter.
 */

import React, { useEffect } from 'react';
import AppRouter from '@/routes/AppRouter';
import { useAuthStore } from '@/store/authStore';

function App() {
  const initializeAuth = useAuthStore((state) => state.initializeAuth);

  useEffect(() => {
    initializeAuth();
  }, [initializeAuth]);

  return <AppRouter />;
}

export default App;
