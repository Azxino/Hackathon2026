/**
 * @file MapMapLibre.jsx
 * @description Componente contenedor principal que orquesta la aplicación de mapas.
 * Gestiona el ciclo de vida de la geolocalización, la carga de capas de datos (homicidios,
 * incidentes, policía, clima), el cálculo de rutas y la interacción del usuario con el mapa.
 */
import { useState, useEffect, useRef, useCallback } from "react";
import Map, { Marker, Source, Layer, Popup } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";

// Importación de estilos y componentes de interfaz
import "@/style/css/Map/Map.css";
import "@/style/css/Map/button.css";
import "@/style/css/Map/Weather.css";
import "@/style/css/Map/Hub.css";
import "@/style/css/Map/SearchBar.css";
import "@/style/css/Map/Agent.css";

import SearchAddress from "./SearchAddress";
import RainLayer from "./RainLayer";
import HUD from "./Hub";
import Agent from "./Agent";

// Importación de servicios y hooks de lógica de negocio
import useLocation from "../hooks/useLocation";
import useHeading from "../hooks/useHeading";
import useRouteProgress from "../hooks/useRouteProgress";
import useHomicidios from "../hooks/useHomicidios";
import useIncidentes from "../hooks/useIncidentes";
import usePolicias from "../hooks/usePolicias";

import configGps from "../config/configGps";
import getVisionCone from "../utils/getVisionCone";
import getWeather from "../services/getWeather";
import getRoute from "../services/getRoute";

// Constantes de configuración de APIs
const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY;
const TOMTOM_KEY   = import.meta.env.VITE_TOMTOM_KEY;

const MAP_STYLES = {
    dark:  `https://api.maptiler.com/maps/dataviz-dark/style.json?key=${MAPTILER_KEY}`,
    light: `https://api.maptiler.com/maps/dataviz/style.json?key=${MAPTILER_KEY}`,
};

/**
 * Función helper para mapear códigos de clima a iconos visuales.
 */
function getWeatherIcon(code) {
    if (code === 0) return "☀️";
    if (code <= 3) return "🌤️";
    if (code <= 48) return "🌫️";
    if (code <= 67) return "🌧️";
    if (code <= 77) return "❄️";
    if (code <= 82) return "🌦️";
    if (code <= 99) return "⛈️";
    return "🌍";
}

/**
 * Reporta la ubicación actual a un servidor backend local.
 */
async function reportLocation(ubicacion) {
    try {
        await fetch("http://localhost:3001/api/location", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ lat: ubicacion[0], lng: ubicacion[1], ts: Date.now() }),
        });
    } catch (_) { /* server puede no estar corriendo, ignorar */ }
}

export default function MapMapLibre() {
    // Estados de visibilidad de capas
    const [showRadar,      setShowRadar]      = useState(false);
    const [showHomicidios, setShowHomicidios] = useState(false);
    const [showIncidentes, setShowIncidentes] = useState(false);
    const [showPolicias,   setShowPolicias]   = useState(false);
    const [showTraffic,    setShowTraffic]    = useState(false);

    // Estado global de la UI
    const [darkMode, setDarkMode] = useState(true);
    const [userMoved, setUserMoved] = useState(false);
    const [following, setFollowing] = useState(true); // botón de recentrar

    // Estados de datos dinámicos
    const [weather,     setWeather]     = useState(null);
    const [destination, setDestination] = useState(null);
    const [cone,        setCone]        = useState(null);
    const [desviacion,  setDesviacion]  = useState(false);
    const [popup,       setPopup]       = useState(null);

    // Estados de rutas
    const [routeFast,    setRouteFast]    = useState(null);
    const [routeSafe,    setRouteSafe]    = useState(null);
    const [routeInfo,    setRouteInfo]    = useState(null);
    const [routeType,    setRouteType]    = useState("fast");
    const [routeLoading, setRouteLoading] = useState(false);

    const [viewState, setViewState] = useState({ longitude: -75.5636, latitude: 6.2518, zoom: 13 });
    
    // Refs para control de flujo
    const mapRef = useRef(null);
    const fetchingRoute = useRef(false);
    const locationReportRef = useRef(null);

    // Inicialización de hooks de datos
    const { ubicacion, cargando } = useLocation();
    const heading = useHeading();
    const { clusters: homClusters, total: homTotal, loading: homLoading } = useHomicidios();
    const { clusters: incClusters, total: incTotal, loading: incLoading } = useIncidentes();
    const { policias, loading: polLoading } = usePolicias();

    // Lógica de progreso de ruta
    const activeRoute  = routeType === "fast" ? routeFast : routeSafe;
    const routeCoords  = activeRoute?.coordinates?.map(([lng, lat]) => [lat, lng]);
    const { desviacion: nuevaDesviacion } = useRouteProgress(ubicacion, routeCoords);
    
    useEffect(() => { setDesviacion(nuevaDesviacion); }, [nuevaDesviacion]);

    // Configuración de modo oscuro según la hora local
    useEffect(() => {
        const h = new Date().getHours();
        setDarkMode(h >= 19 || h < 7);
    }, []);

    // Efectos para actualización de datos según ubicación
    useEffect(() => {
        if (!ubicacion) return;
        getWeather(ubicacion[0], ubicacion[1], setWeather);
    }, [ubicacion]);

    useEffect(() => {
        if (!ubicacion) return;
        setCone(getVisionCone(ubicacion, heading || 0));
    }, [ubicacion, heading]);

    // Reporte periódico de ubicación
    useEffect(() => {
        if (!ubicacion) return;
        reportLocation(ubicacion); // inmediato
        clearInterval(locationReportRef.current);
        locationReportRef.current = setInterval(() => reportLocation(ubicacion), 15000);
        return () => clearInterval(locationReportRef.current);
    }, [ubicacion]);

    // Cálculo de rutas (Rápida vs Segura)
    useEffect(() => {
        if (!ubicacion || !destination) {
            setRouteFast(null); setRouteSafe(null); setRouteInfo(null);
            return;
        }
        if (fetchingRoute.current) return;
        fetchingRoute.current = true;
        setRouteLoading(true);

        async function fetchBothRoutes() {
            try {
                const fast = await getRoute(ubicacion, destination);
                setRouteFast(fast.geometry);
                setRouteInfo({ distance: fast.distance, duration: fast.duration });

                // Lógica simple para simular una ruta "segura" mediante un punto intermedio
                const midLat = (ubicacion[0] + destination[0]) / 2 + 0.005;
                const midLng = (ubicacion[1] + destination[1]) / 2 + 0.005;
                const leg1 = await getRoute(ubicacion, [midLat, midLng]);
                const leg2 = await getRoute([midLat, midLng], destination);
                setRouteSafe({ type: "LineString", coordinates: [...(leg1.geometry.coordinates || []), ...(leg2.geometry.coordinates || [])] });
            } catch (err) {
                console.error("Error calculando rutas:", err);
            } finally {
                setRouteLoading(false);
                fetchingRoute.current = false;
            }
        }
        fetchBothRoutes();
    }, [ubicacion, destination]);

    // Recalcular si hay desviación
    useEffect(() => {
        if (!desviacion || !ubicacion || !destination) return;
        setDestination(d => d ? [...d] : d);
    }, [desviacion]);

    // Handlers de UI e interacción con el mapa
    const handleSelectDestino = useCallback((pos) => {
        setDestination(pos);
        if (!pos) { setRouteFast(null); setRouteSafe(null); setRouteInfo(null); setDesviacion(false); }
    }, []);

    // Bug móvil fix: detectar cuando el usuario mueve el mapa manualmente
    const handleMoveStart = useCallback((evt) => {
        // Si el evento viene de input del usuario (no programático), marcar como movido
        if (evt.originalEvent) {
            setUserMoved(true);
            setFollowing(false);
        }
    }, []);

    // Botón recentrar: volver a seguir GPS
    const handleRecenter = useCallback(() => {
        if (!ubicacion) return;
        setUserMoved(false);
        setFollowing(true);
        setViewState(prev => ({ ...prev, longitude: ubicacion[1], latitude: ubicacion[0], zoom: 15 }));
    }, [ubicacion]);

    // Reconectar seguimiento GPS
    configGps({ ubicacion, setViewState, userMoved });

    // Lógica para detectar clics en capas dinámicas (POIs)
    const handleMapClick = useCallback((e) => {
        if (!mapRef.current) return;
        const map = mapRef.current.getMap();
        const layers = ["pol-circles", "inc-circles"];
        for (const layer of layers) {
            if (!map.getLayer(layer)) continue;
            const features = map.queryRenderedFeatures(e.point, { layers: [layer] });
            if (!features.length) continue;
            const f = features[0];
            const [lng, lat] = f.geometry.coordinates;
            const p = f.properties;
            if (layer === "pol-circles") {
                setPopup({ lng, lat, title: "🚔 Estación de policía", body: [p.nombre && `<b>${p.nombre}</b>`, p.direccion && `📍 ${p.direccion}`].filter(Boolean).join("<br/>") });
            } else {
                setPopup({ lng, lat, title: "🚗 Accidente vial", body: `Casos en la zona: <b>${p.count}</b>` });
            }
            return;
        }
        setPopup(null);
    }, []);

    const handleMouseEnter = useCallback(() => { if (mapRef.current) mapRef.current.getMap().getCanvas().style.cursor = "pointer"; }, []);
    const handleMouseLeave = useCallback(() => { if (mapRef.current) mapRef.current.getMap().getCanvas().style.cursor = ""; }, []);

    // Preparación de datos para fuentes GeoJSON
    const homGeojson = { type: "FeatureCollection", features: homClusters.map(c => ({ type: "Feature", geometry: { type: "Point", coordinates: [c.lng, c.lat] }, properties: { count: c.count, barrio: c.barrio } })) };
    const incGeojson = { type: "FeatureCollection", features: incClusters.map(c => ({ type: "Feature", geometry: { type: "Point", coordinates: [c.lng, c.lat] }, properties: { count: c.count } })) };
    const polGeojson = { type: "FeatureCollection", features: policias.map(p => ({ type: "Feature", geometry: { type: "Point", coordinates: [p.lng, p.lat] }, properties: { nombre: p.nombre, direccion: p.direccion } })) };

    // Renderizado del árbol de componentes del mapa
    return (
        <div className={`Map ${darkMode ? "theme-dark" : "theme-light"}`}>
            <SearchAddress onSelect={handleSelectDestino} />

            {/* Controles top-right: modo + recentrar */}
            <div className="map-controls">
                <button className="map-ctrl-btn" onClick={() => setDarkMode(v => !v)} title="Cambiar tema">
                    {darkMode ? "☀️" : "🌙"}
                </button>
                {!following && ubicacion && (
                    <button className="map-ctrl-btn map-ctrl-btn--pulse" onClick={handleRecenter} title="Volver a mi ubicación">
                        📍
                    </button>
                )}
            </div>

            <Map
                ref={mapRef}
                {...viewState}
                bearing={heading || 0}
                pitch={45}
                transitionDuration={200}
                onMove={evt => setViewState(evt.viewState)}
                onMoveStart={handleMoveStart}
                onClick={handleMapClick}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                interactiveLayerIds={["pol-circles", "inc-circles"]}
                mapStyle={darkMode ? MAP_STYLES.dark : MAP_STYLES.light}
            >
                {showTraffic && TOMTOM_KEY && (
                    <Source id="traffic-tiles" type="raster"
                        tiles={[`https://api.tomtom.com/traffic/map/4/tile/flow/relative/{z}/{x}/{y}.png?key=${TOMTOM_KEY}`]}
                        tileSize={256}
                    >
                        <Layer id="traffic-layer" type="raster" paint={{ "raster-opacity": 0.85 }} />
                    </Source>
                )}

                <RainLayer visible={showRadar} />

                {showHomicidios && homClusters.length > 0 && (
                    <Source id="homicidios" type="geojson" data={homGeojson}>
                        <Layer id="hom-heat" type="heatmap" maxzoom={17} paint={{
                            "heatmap-weight": ["interpolate", ["linear"], ["get", "count"], 0, 0, 10, 1],
                            "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 0, 1, 15, 3],
                            "heatmap-color": ["interpolate", ["linear"], ["heatmap-density"], 0, "rgba(0,0,0,0)", 0.2, "#fbbf24", 0.5, "#f97316", 0.8, "#ef4444", 1, "#991b1b"],
                            "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 0, 4, 15, 30],
                            "heatmap-opacity": 0.8,
                        }} />
                    </Source>
                )}

                {showIncidentes && incClusters.length > 0 && (
                    <Source id="incidentes" type="geojson" data={incGeojson}>
                        <Layer id="inc-circles" type="circle" paint={{
                            "circle-radius": ["interpolate", ["linear"], ["get", "count"], 1, 5, 10, 14, 30, 20],
                            "circle-color": ["interpolate", ["linear"], ["get", "count"], 1, "#fde68a", 5, "#facc15", 10, "#f97316"],
                            "circle-opacity": 0.75,
                        }} />
                    </Source>
                )}

                {showPolicias && policias.length > 0 && (
                    <Source id="policias" type="geojson" data={polGeojson}>
                        <Layer id="pol-circles" type="circle" paint={{
                            "circle-radius": 9, "circle-color": "#3b82f6",
                            "circle-opacity": 0.9, "circle-stroke-width": 2, "circle-stroke-color": "#fff",
                        }} />
                    </Source>
                )}

                {cone && (
                    <Source id="vision" type="geojson" data={{ type: "Feature", geometry: { type: "Polygon", coordinates: [cone] } }}>
                        <Layer id="vision-layer" type="fill" paint={{ "fill-color": "#4aa3ff", "fill-opacity": 0.12 }} />
                    </Source>
                )}

                {destination && routeFast && routeType === "fast" && (
                    <Source id="route-fast" type="geojson" data={{ type: "Feature", geometry: routeFast }}>
                        <Layer id="route-fast-line" type="line" layout={{ "line-join": "round", "line-cap": "round" }}
                            paint={{ "line-color": "#00d4ff", "line-width": 5, "line-opacity": 0.9 }} />
                    </Source>
                )}

                {destination && routeSafe && routeType === "safe" && (
                    <Source id="route-safe" type="geojson" data={{ type: "Feature", geometry: routeSafe }}>
                        <Layer id="route-safe-line" type="line" layout={{ "line-join": "round", "line-cap": "round" }}
                            paint={{ "line-color": "#00ff88", "line-width": 5, "line-opacity": 0.9 }} />
                    </Source>
                )}

                {ubicacion && (
                    <Marker longitude={ubicacion[1]} latitude={ubicacion[0]} anchor="center">
                        <div className="NodeBasic User" />
                    </Marker>
                )}

                {destination && (
                    <Marker longitude={destination[1]} latitude={destination[0]} anchor="bottom">
                        <div className="NodeBasic Destiny" />
                    </Marker>
                )}

                {popup && (
                    <Popup longitude={popup.lng} latitude={popup.lat} onClose={() => setPopup(null)} closeOnClick={false} anchor="bottom">
                        <div className="map-popup">
                            <div className="map-popup__title">{popup.title}</div>
                            <div className="map-popup__body" dangerouslySetInnerHTML={{ __html: popup.body }} />
                        </div>
                    </Popup>
                )}
            </Map>

            {weather && (
                <div className="weather-widget">
                    <div className="weather-widget__icon">{getWeatherIcon(weather.weathercode)}</div>
                    <div>
                        <div className="weather-widget__temp">{weather.temperature}°C</div>
                        <div className="weather-widget__label">Clima actual</div>
                        <div className="weather-widget__meta">💨 {weather.windspeed} km/h</div>
                    </div>
                </div>
            )}

            {destination && <HUD desviacion={desviacion} routeInfo={routeInfo} />}

            {destination && (routeFast || routeSafe) && (
                <div className="route-selector">
                    <button className={`route-selector__btn ${routeType === "fast" ? "route-selector__btn--active-fast" : ""}`} onClick={() => setRouteType("fast")}>
                        🟦 Rápida
                    </button>
                    <button className={`route-selector__btn ${routeType === "safe" ? "route-selector__btn--active-safe" : ""}`} onClick={() => setRouteType("safe")}>
                        🟩 Segura
                    </button>
                </div>
            )}

            <div className="map-layers">
                <button className={`map-layers__btn ${showTraffic ? "map-layers__btn--tra" : ""}`} onClick={() => setShowTraffic(v => !v)}>
                    <span className="map-layers__dot" style={{ background: "#4aef44" }} />Tráfico
                </button>
                <button className={`map-layers__btn ${showHomicidios ? "map-layers__btn--hom" : ""}`} onClick={() => setShowHomicidios(v => !v)}>
                    <span className="map-layers__dot" style={{ background: "#ef4444" }} />Homicidios
                    {!homLoading && <span className="map-layers__count">{homTotal.toLocaleString()}</span>}
                </button>
                <button className={`map-layers__btn ${showIncidentes ? "map-layers__btn--inc" : ""}`} onClick={() => setShowIncidentes(v => !v)}>
                    <span className="map-layers__dot" style={{ background: "#f97316" }} />Accidentes
                    {!incLoading && <span className="map-layers__count">{incTotal.toLocaleString()}</span>}
                </button>
                <button className={`map-layers__btn ${showPolicias ? "map-layers__btn--pol" : ""}`} onClick={() => setShowPolicias(v => !v)}>
                    <span className="map-layers__dot" style={{ background: "#3b82f6" }} />Policías
                    {!polLoading && <span className="map-layers__count">{policias.length}</span>}
                </button>
                <button className={`map-layers__btn ${showRadar ? "map-layers__btn--rain" : ""}`} onClick={() => setShowRadar(v => !v)}>
                    <span className="map-layers__dot" style={{ background: "#60a5fa" }} />Radar lluvia
                </button>
            </div>

            {routeLoading && <div className="FondoBackground">Calculando rutas...</div>}
            {cargando && <div className="FondoBackground">Activando GPS...</div>}

            <Agent
                mapState={{ ubicacion, destination, weather, showHomicidios, showIncidentes, showPolicias, showRadar }}
                homClusters={homClusters}
                incClusters={incClusters}
                onToggleLayer={(layer, visible) => {
                    if (layer === "homicidios") setShowHomicidios(visible);
                    if (layer === "incidentes") setShowIncidentes(visible);
                    if (layer === "policias")   setShowPolicias(visible);
                    if (layer === "radar")      setShowRadar(visible);
                }}
                onNavigateTo={handleSelectDestino}
            />
        </div>
    );
}
