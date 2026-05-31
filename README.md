<div align="center">

# 🐱 EVA Map — v3.0.0

### Plataforma de navegación inteligente y seguridad urbana para Medellín

[![React](https://img.shields.io/badge/React-19-61dafb?style=flat-square&logo=react)](https://react.dev)
[![MapLibre](https://img.shields.io/badge/MapLibre_GL-5.x-396CB2?style=flat-square)](https://maplibre.org)
[![Gemini AI](https://img.shields.io/badge/Gemini-AI-4285F4?style=flat-square&logo=google)](https://ai.google.dev)
[![Vite](https://img.shields.io/badge/Vite-8-646CFF?style=flat-square&logo=vite)](https://vitejs.dev)

</div>

---

## ¿Qué es EVA?

EVA es una aplicación web de navegación con conciencia de seguridad urbana, construida para Medellín. Combina GPS en tiempo real, datos oficiales de criminalidad, condiciones climáticas, tráfico en vivo y un asistente de inteligencia artificial para ayudarte a moverte por la ciudad de forma más segura e informada.

---

## Funcionalidades principales

### 🗺️ Navegación inteligente
- GPS en tiempo real con orientación por brújula y cono de visión
- Búsqueda de destinos por nombre o dirección usando geocodificación
- **Ruta rápida** (azul) y **ruta segura** (verde) calculadas simultáneamente
- Recálculo automático de ruta cuando el usuario se desvía
- Botón de recentrar cuando el mapa se desincroniza del GPS

### 🔴 Capas de seguridad con datos reales

| Capa                  | Fuente                    | Registros |
|-----------------------|---------------------------|-----------|
| Homicidios            | Datos abiertos Medellín   | ~18,000   |
| Accidentes viales     | Datos abiertos Medellín   | ~46,000   |
| Estaciones de policía | Datos abiertos Medellín   | 7         |

Los homicidios se visualizan como **heatmap nativo** de MapLibre — escala de densidad del amarillo al rojo. Al hacer clic en cualquier marcador aparece un popup con información de la zona.

### 🌦️ Clima en tiempo real
- Temperatura, velocidad del viento y estado del cielo
- Actualización automática basada en tu ubicación GPS
- Íconos dinámicos según el código meteorológico (despejado, lluvia, tormenta, etc.)
- Powered by **Open-Meteo** (sin API key requerida)

### 🚗 Tráfico en tiempo real
- Tiles de flujo vehicular de **TomTom** superpuestos sobre el mapa
- Verde = fluido · Naranja = moderado · Rojo = congestionado
- Activable/desactivable desde el panel de capas

### 🌧️ Radar de lluvia
- Animación de precipitación en tiempo real via **RainViewer**
- Datos actualizados cada ciclo con los últimos frames disponibles

### 🌙 Modo día / modo noche
- Cambio manual con un botón en la esquina superior derecha
- Activación automática entre las 7pm y las 7am
- El mapa cambia de estilo oscuro a claro adaptando todos los paneles con variables CSS

### 🤖 Asistente EVA (Gemini AI)
El chatbot flotante (ícono del gato 🐱) puede:
- **Navegar** → *"Llévame al Parque El Poblado"*
- **Controlar capas** → *"Activa homicidios"*, *"Muéstrame las policías"*
- **Consultar seguridad** → *"¿Qué tan peligroso es Manrique?"* (usa datos reales del CSV)
- **Informar del estado** → *"¿Cómo está el clima?"*, *"¿Qué capas tengo activas?"*

---

## Evolución del proyecto

```
v1.0.0  ── Mapa base con Leaflet, GPS y ruta simple
v1.2.0  ── Capa de homicidios oficiales de Medellín
v1.7.0  ── Clima, búsqueda de destino, botones de capas
v1.7.6  ── Fix de accidentes viales y estabilidad
   │
v2.0.0  ── Migración a MapLibre GL (WebGL, heatmaps, rotación)
v2.5.0  ── Capas de datos completamente funcionales
v2.8.0  ── Tráfico en tiempo real + Agente IA con Gemini
   │
v3.0.0  ── Modo día/noche, ruta rápida/segura, fix GPS móvil
```

---

## Stack tecnológico

| Categoría         | Tecnología                            |
|-------------------|---------------------------------------|
| Frontend          | React 19, Vite 8                      |
| Mapa              | MapLibre GL 5, react-map-gl 8         |
| Estilos de mapa   | MapTiler (dataviz-dark / dataviz)     |
| Geocodificación   | MapTiler Geocoding API                |
| Rutas             | OSRM (Open Source Routing Machine)    |
| Clima             | Open-Meteo (gratuito, sin key)        |
| Tráfico           | TomTom Traffic Flow API               |
| Radar lluvia      | RainViewer API                        |
| IA                | Google Gemini via `@google/genai`     |
| Backend proxy     | Express.js + CORS                     |
| Contenedores      | Docker + Docker Compose               |

---

## Instalación y uso

### Requisitos
- Node.js 18+
- npm 9+
- API keys (ver sección de configuración)

### 1. Clonar e instalar

```bash
git clone https://github.com/tu-usuario/eva-map.git
cd eva-map
npm install
```

### 2. Configurar variables de entorno

Crea un archivo `.env` en la raíz del proyecto:

```env
VITE_MAPTILER_KEY=tu_key_de_maptiler
VITE_TOMTOM_KEY=tu_key_de_tomtom
GEMINI_API_KEY=tu_key_de_gemini
```

| Variable              | Dónde obtenerla                                       | Gratis |
|-----------------------|-------------------------------------------------------|--------|
| `VITE_MAPTILER_KEY`   | [maptiler.com](https://maptiler.com)                  | ✅    |
| `VITE_TOMTOM_KEY`     | [developer.tomtom.com](https://developer.tomtom.com)  | ✅    |
| `GEMINI_API_KEY`      | [aistudio.google.com](https://aistudio.google.com)    | ✅    |


### 3. Correr el proyecto

Necesitas **dos terminales**:

```bash
# Terminal 1 — Servidor proxy del agente IA
node server.js

# Terminal 2 — Aplicación web
npm run dev
```

Abre `http://localhost:5173` en el navegador.

### 4. Probar en móvil (GPS real)

```bash
# En otra terminal — túnel HTTPS para GPS en Android
npx cloudflared tunnel --url http://localhost:5173
```

Abre la URL `https://xxxx.trycloudflare.com` en Chrome para Android. El GPS requiere HTTPS.

---

## Docker

```bash
# Construir y levantar
docker-compose up --build

# Solo la app
docker build -t eva-map .
docker run -p 5173:5173 eva-map
```

---

## Estructura del proyecto

```
src/
├── features/map/
│   ├── components/
│   │   ├── MapLibre.jsx                # Componente principal del mapa
│   │   ├── Agent.jsx                   # Chatbot EVA
│   │   ├── Hub.jsx                     # HUD de navegación
│   │   ├── SearchAddress.jsx           # Barra de búsqueda
│   │   └── RainLayer.jsx               # Capa de radar de lluvia
│   ├── hooks/
│   │   ├── useLocation.jsx             # GPS del usuario
│   │   ├── useHeading.jsx              # Orientación por brújula
│   │   ├── useRouting.jsx              # Cálculo de rutas
│   │   ├── useHomicidios.jsx           # Datos de homicidios
│   │   ├── useIncidentes.jsx           # Datos de accidentes viales
│   │   └── usePolicias.jsx             # Estaciones de policía
│   ├── services/
│   │   ├── getRoute.js                 # OSRM routing
│   │   ├── getWeather.js               # Open-Meteo
│   │   └── searchAddress.js            # Geocodificación MapTiler
│   └── config/
│       └── configGps.jsx               # Lógica de seguimiento GPS
├── style/css/Map/                      # CSS modular por componente
public/
└── data/
    ├── homicidio.csv                   # ~18k registros
    ├── total_incidentes_transito.csv   # ~46k registros
    └── policias.csv                    # Estaciones de policía
server.js                               # Proxy Gemini AI
```

---

## Datos utilizados

Los datos de criminalidad y seguridad provienen del portal de **Datos Abiertos de Medellín** ([medata.gov.co](https://medata.gov.co)):

- **Homicidios** — Registros históricos geocodificados por barrio
- **Incidentes de tránsito** — Accidentes con coordenadas y clasificación de gravedad
- **Infraestructura policial** — Ubicación de estaciones y subestaciones

Los datos se procesan en el cliente: se agrupan en clusters por cuadrícula (~300m) para optimizar el rendimiento sin perder precisión geográfica.

---

## Notas para la hackathon

- El proyecto funciona completamente en el frontend
- Todos los datos de seguridad son reales y oficiales, no simulados
- El sistema de rutas usa únicamente APIs gratuitas y open source (OSRM)
- Funciona en Android con GPS real vía Cloudflare Tunnel

---

<div align="center">

Hecho con 🐱 para Medellín

</div>
