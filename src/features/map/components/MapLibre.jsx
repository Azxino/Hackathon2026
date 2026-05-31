import { useState, useEffect, useRef, useCallback } from "react";
import Map, { Marker, Source, Layer, Popup } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";

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

const MAPTILER_KEY = import.meta.env.VITE_MAPTILER_KEY;

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

export default function MapMapLibre() {
    const [showRadar, setShowRadar] = useState(false);
    const [showHomicidios, setShowHomicidios] = useState(false);
    const [showIncidentes, setShowIncidentes] = useState(false);
    const [showPolicias, setShowPolicias] = useState(false);
    const [showTraffic, setShowTraffic] = useState(false);

    const [weather, setWeather] = useState(null);
    const [destination, setDestination] = useState(null);
    const [cone, setCone] = useState(null);
    const [desviacion, setDesviacion] = useState(false);
    const [popup, setPopup] = useState(null);

    // Rutas: fast (azul) y safe (verde)
    const [routeFast, setRouteFast] = useState(null);
    const [routeSafe, setRouteSafe] = useState(null);
    const [routeInfo, setRouteInfo] = useState(null);
    const [routeType, setRouteType] = useState("fast"); // "fast" | "safe"
    const [routeLoading, setRouteLoading] = useState(false);

    const [viewState, setViewState] = useState({ longitude: -75.5636, latitude: 6.2518, zoom: 13 });
    const mapRef = useRef(null);
    const fetchingRoute = useRef(false);

    const { ubicacion, cargando } = useLocation();
    const heading = useHeading();

    const { clusters: homClusters, total: homTotal, loading: homLoading } = useHomicidios();
    const { clusters: incClusters, total: incTotal, loading: incLoading } = useIncidentes();
    const { policias, loading: polLoading } = usePolicias();

    // Coordenadas de la ruta activa para useRouteProgress
    const activeRoute = routeType === "fast" ? routeFast : routeSafe;
    const routeCoords = activeRoute?.coordinates?.map(([lng, lat]) => [lat, lng]);
    const { desviacion: nuevaDesviacion } = useRouteProgress(ubicacion, routeCoords);
    useEffect(() => { setDesviacion(nuevaDesviacion); }, [nuevaDesviacion]);

    // Clima
    useEffect(() => {
        if (!ubicacion) return;
        getWeather(ubicacion[0], ubicacion[1], setWeather);
    }, [ubicacion]);

    // Cono de visión
    useEffect(() => {
        if (!ubicacion) return;
        setCone(getVisionCone(ubicacion, heading || 0));
    }, [ubicacion, heading]);

    // Calcular ambas rutas cuando cambia destino o ubicación
    useEffect(() => {
        if (!ubicacion || !destination) {
            setRouteFast(null);
            setRouteSafe(null);
            setRouteInfo(null);
            return;
        }
        if (fetchingRoute.current) return;

        fetchingRoute.current = true;
        setRouteLoading(true);

        async function fetchBothRoutes() {
            try {
                // Ruta rápida: directa
                const fast = await getRoute(ubicacion, destination);
                setRouteFast(fast.geometry);
                setRouteInfo({ distance: fast.distance, duration: fast.duration });

                // Ruta segura: misma geometría pero con waypoint desplazado
                // para simular una ruta alternativa (sin TomTom)
                const midLat = (ubicacion[0] + destination[0]) / 2 + 0.005;
                const midLng = (ubicacion[1] + destination[1]) / 2 + 0.005;
                const safe = await getRoute(ubicacion, [midLat, midLng]);
                const safe2 = await getRoute([midLat, midLng], destination);

                // Combinar las coordenadas
                const safeCoords = [
                    ...(safe.geometry.coordinates || []),
                    ...(safe2.geometry.coordinates || []),
                ];
                setRouteSafe({ type: "LineString", coordinates: safeCoords });
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
        setDestination(d => d ? [...d] : d); // forzar re-trigger
    }, [desviacion]);

    const handleSelectDestino = useCallback((pos) => {
        setDestination(pos);
        if (!pos) {
            setRouteFast(null);
            setRouteSafe(null);
            setRouteInfo(null);
            setDesviacion(false);
        }
    }, []);

    configGps({ ubicacion, setViewState });

    // Click en capas para popups
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

    const handleMouseEnter = useCallback(() => {
        if (mapRef.current) mapRef.current.getMap().getCanvas().style.cursor = "pointer";
    }, []);
    const handleMouseLeave = useCallback(() => {
        if (mapRef.current) mapRef.current.getMap().getCanvas().style.cursor = "";
    }, []);

    const homGeojson = { type: "FeatureCollection", features: homClusters.map(c => ({ type: "Feature", geometry: { type: "Point", coordinates: [c.lng, c.lat] }, properties: { count: c.count, barrio: c.barrio } })) };
    const incGeojson = { type: "FeatureCollection", features: incClusters.map(c => ({ type: "Feature", geometry: { type: "Point", coordinates: [c.lng, c.lat] }, properties: { count: c.count } })) };
    const polGeojson = { type: "FeatureCollection", features: policias.map(p => ({ type: "Feature", geometry: { type: "Point", coordinates: [p.lng, p.lat] }, properties: { nombre: p.nombre, direccion: p.direccion } })) };

    return (
        <div className="Map">
            <SearchAddress onSelect={handleSelectDestino} />

            <Map
                ref={mapRef}
                {...viewState}
                bearing={heading || 0}
                pitch={45}
                transitionDuration={300}
                onMove={evt => setViewState(evt.viewState)}
                onClick={handleMapClick}
                onMouseEnter={handleMouseEnter}
                onMouseLeave={handleMouseLeave}
                interactiveLayerIds={["pol-circles", "inc-circles"]}
                mapStyle={`https://api.maptiler.com/maps/dataviz-dark/style.json?key=${MAPTILER_KEY}`}
            >
                {showTraffic && (
                    <Source
                        id="traffic-tiles"
                        type="raster"
                        tiles={[`https://api.tomtom.com/traffic/map/4/tile/flow/relative/{z}/{x}/{y}.png?key=${import.meta.env.VITE_TOMTOM_KEY}`]}
                        tileSize={256}
                    >
                        <Layer id="traffic-layer" type="raster" paint={{ "raster-opacity": 0.85 }} />
                    </Source>
                )}

                <RainLayer visible={showRadar} />

                {/* Homicidios heatmap */}
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

                {/* Accidentes */}
                {showIncidentes && incClusters.length > 0 && (
                    <Source id="incidentes" type="geojson" data={incGeojson}>
                        <Layer id="inc-circles" type="circle" paint={{
                            "circle-radius": ["interpolate", ["linear"], ["get", "count"], 1, 5, 10, 14, 30, 20],
                            "circle-color": ["interpolate", ["linear"], ["get", "count"], 1, "#fde68a", 5, "#facc15", 10, "#f97316"],
                            "circle-opacity": 0.75,
                        }} />
                    </Source>
                )}

                {/* Policías */}
                {showPolicias && policias.length > 0 && (
                    <Source id="policias" type="geojson" data={polGeojson}>
                        <Layer id="pol-circles" type="circle" paint={{
                            "circle-radius": 9,
                            "circle-color": "#3b82f6",
                            "circle-opacity": 0.9,
                            "circle-stroke-width": 2,
                            "circle-stroke-color": "#fff",
                        }} />
                    </Source>
                )}

                {/* Cono de visión */}
                {cone && (
                    <Source id="vision" type="geojson" data={{ type: "Feature", geometry: { type: "Polygon", coordinates: [cone] } }}>
                        <Layer id="vision-layer" type="fill" paint={{ "fill-color": "#4aa3ff", "fill-opacity": 0.12 }} />
                    </Source>
                )}

                {/* Ruta rápida — azul */}
                {destination && routeFast && routeType === "fast" && (
                    <Source id="route-fast" type="geojson" data={{ type: "Feature", geometry: routeFast }}>
                        <Layer id="route-fast-line" type="line"
                            layout={{ "line-join": "round", "line-cap": "round" }}
                            paint={{ "line-color": "#00d4ff", "line-width": 5, "line-opacity": 0.9 }} />
                    </Source>
                )}

                {/* Ruta segura — verde */}
                {destination && routeSafe && routeType === "safe" && (
                    <Source id="route-safe" type="geojson" data={{ type: "Feature", geometry: routeSafe }}>
                        <Layer id="route-safe-line" type="line"
                            layout={{ "line-join": "round", "line-cap": "round" }}
                            paint={{ "line-color": "#00ff88", "line-width": 5, "line-opacity": 0.9 }} />
                    </Source>
                )}

                {/* Marcador usuario */}
                {ubicacion && (
                    <Marker longitude={ubicacion[1]} latitude={ubicacion[0]} anchor="center">
                        <div className="NodeBasic User" />
                    </Marker>
                )}

                {/* Marcador destino */}
                {destination && (
                    <Marker longitude={destination[1]} latitude={destination[0]} anchor="bottom">
                        <div className="NodeBasic Destiny" />
                    </Marker>
                )}

                {/* Popup */}
                {popup && (
                    <Popup longitude={popup.lng} latitude={popup.lat} onClose={() => setPopup(null)} closeOnClick={false} anchor="bottom">
                        <div className="map-popup">
                            <div className="map-popup__title">{popup.title}</div>
                            <div className="map-popup__body" dangerouslySetInnerHTML={{ __html: popup.body }} />
                        </div>
                    </Popup>
                )}
            </Map>

            {/* Clima */}
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

            {/* HUD navegación */}
            {destination && <HUD desviacion={desviacion} routeInfo={routeInfo} />}

            {/* Selector tipo de ruta — solo cuando hay destino */}
            {destination && (routeFast || routeSafe) && (
                <div className="route-selector">
                    <button
                        className={`route-selector__btn ${routeType === "fast" ? "route-selector__btn--active-fast" : ""}`}
                        onClick={() => setRouteType("fast")}
                    >
                        🟦 Rápida
                    </button>
                    <button
                        className={`route-selector__btn ${routeType === "safe" ? "route-selector__btn--active-safe" : ""}`}
                        onClick={() => setRouteType("safe")}
                    >
                        🟩 Segura
                    </button>
                </div>
            )}

            {/* Panel capas */}
            <div className="map-layers">
                <button className={`map-layers__btn ${showHomicidios ? "map-layers__btn--hom" : ""}`} onClick={() => setShowHomicidios(v => !v)}>
                    <span className="map-layers__dot" style={{ background: "#ef4444" }} />
                    Homicidios
                    {!homLoading && <span className="map-layers__count">{homTotal.toLocaleString()}</span>}
                </button>
                <button className={`map-layers__btn ${showIncidentes ? "map-layers__btn--inc" : ""}`} onClick={() => setShowIncidentes(v => !v)}>
                    <span className="map-layers__dot" style={{ background: "#f97316" }} />
                    Accidentes
                    {!incLoading && <span className="map-layers__count">{incTotal.toLocaleString()}</span>}
                </button>
                <button className={`map-layers__btn ${showPolicias ? "map-layers__btn--pol" : ""}`} onClick={() => setShowPolicias(v => !v)}>
                    <span className="map-layers__dot" style={{ background: "#3b82f6" }} />
                    Policías
                    {!polLoading && <span className="map-layers__count">{policias.length}</span>}
                </button>
                <button className={`map-layers__btn ${showRadar ? "map-layers__btn--rain" : ""}`} onClick={() => setShowRadar(v => !v)}>
                    <span className="map-layers__dot" style={{ background: "#60a5fa" }} />
                    Radar lluvia
                </button>
                <button className={`map-layers__btn ${showTraffic ? "map-layers__btn--hom" : ""}`} onClick={() => setShowTraffic(v => !v)}>
                    <span className="map-layers__dot" style={{ background: "#4aef44" }} />
                    Tráfico
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
                    if (layer === "policias") setShowPolicias(visible);
                    if (layer === "radar") setShowRadar(visible);
                }}
                onNavigateTo={handleSelectDestino}
            />
        </div>
    );
}
