import '@fontsource-variable/inter';
import './index.css';
import { QueryClientProvider } from '@tanstack/react-query';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import { criarQueryClient } from './api/consultas.ts';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={criarQueryClient()}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
);
