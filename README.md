src/
├── assets/          # Imágenes, iconos del mapa, fuentes
├── components/      # Componentes UI reutilizables (Botones, Inputs, Modales)
├── config/          # Configuraciones (API keys, constantes, temas)
├── features/        # Módulos principales (la lógica de la App)
│   ├── map/         # Módulo central de visualización
│   │   ├── components/ # Componentes exclusivos del mapa (MapControls, Legend)
│   │   ├── hooks/      # useMapData, useTrafficFlow (lógica de datos)
│   │   ├── services/   # Consumo de APIs (Mapbox, SIATA, Waze)
│   │   └── types/      # Interfaces de TypeScript para datos geoespaciales
│   ├── mobility/    # Módulo de análisis de tráfico y rutas
│   └── alerts/      # Módulo de notificaciones de lluvia/inundaciones
├── hooks/           # Hooks globales (ej: useAuth, useViewport)
├── layouts/         # Contenedores de página (SidebarLayout, MainLayout)
├── services/        # Clientes HTTP (Axios, WebSockets)
├── store/           # Estado global (Zustand)
├── utils/           # Funciones puras (cálculo de distancias, formateo de fechas)
├── App.jsx
└── main.jsx

src/
└── features/
    └── map/
        ├── components/
        │   ├── Map.jsx
        │   ├── UserMarker.jsx
        │   └── RoutingMachine.jsx
        │
        ├── hooks/
        │   └── useLocation.jsx
        │
        └── services/
            └── routeService.js

Porque:

components/ → Cosas que renderizan JSX.
hooks/ → Funciones personalizadas que usan hooks (useState, useEffect, etc.).
services/ → Llamadas a APIs, cálculo de rutas, peticiones HTTP, etc.

npx cloudflared tunnel --url http://localhost:5173

npx ngrok http 5173