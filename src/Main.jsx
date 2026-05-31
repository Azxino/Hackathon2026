import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import "@/features/map/config/leafletIcon.js";
import App from './App.jsx'
import { registerSW } from "virtual:pwa-register";

registerSW({ immediate: true });

createRoot(document.getElementById('root')).render(
    <StrictMode>
        <App />
    </StrictMode>,
)