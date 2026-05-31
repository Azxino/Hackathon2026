/**
 * @file main.jsx
 * @description Archivo de inicio de la aplicación.
 * Realiza el montaje del árbol de componentes de React en el contenedor raíz
 * del documento HTML.
 */

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

/**
 * createRoot permite habilitar las características concurrentes de React 18+.
 * StrictMode es una herramienta para detectar problemas potenciales en la aplicación
 * durante el desarrollo (como efectos secundarios inesperados).
 */

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)