import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import path from "path";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
  
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@/": path.resolve(__dirname, "./src") + "/"
    },
  },

  server: {
    host: "0.0.0.0",
<<<<<<< HEAD
    allowedHosts: true,
=======
<<<<<<< HEAD
    allowedHosts: true,
=======
    port: 5173,
    allowedHosts: true,
    proxy: {
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true
      }
    }
>>>>>>> cd387a5 (Update a v3.0.5: Mejoras en navegación e integración IA)
>>>>>>> d82ac0b (Preparando sincronización de versión 3.1.2)
  },
})
