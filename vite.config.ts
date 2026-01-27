import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  return {
    plugins: [react()],
    define: {
      // Jika env.API_KEY tidak ada, isi dengan string kosong agar tidak undefined
      'process.env.API_KEY': JSON.stringify(env.API_KEY || '')
    }
  };
});