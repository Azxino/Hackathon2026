import { MapContainer, TileLayer, Marker, Popup, useMap } from "react-leaflet";
import { useEffect, useState, useCallback } from "react";
import L from "leaflet";

import "leaflet/dist/leaflet.css";
import "@/style/css/Map/Map.css";

import useLocation from "../hooks/useLocation";
import useRouting from "../hooks/useRouting";
import useRouteProgress from "../hooks/useRouteProgress";
import useHomicidios from "../hooks/useHomicidios";
import useIncidentes from "../hooks/useIncidentes";
import usePolicias from "../hooks/usePolicias";
import useWeather from "../hooks/useWeather";
import useOrientation from "../hooks/useOrientation";

import RoutePolyline from "./RoutePolyline";
import HomicidiosLayer from "./HomicidiosLayer";
import IncidentesLayer from "./IncidentesLayer";
import PoliciasLayer from "./PoliciasLayer";
import RainLayer from "./RainLayer";
import HUD from "./Hub";
import SearchBar from "./SearchBar";
import WeatherWidget from "./WeatherWidget";

import { destIcon } from "../config/leafletIcon";

function makeUserIcon(heading) {
    const arrow = heading != null
        ? `<div style="
            position:absolute;top:50%;left:50%;
            width:0;height:0;
            border-left:5px solid transparent;
            border-right:5px solid transparent;
            border-bottom:14px solid #3b82f6;
            transform:translate(-50%,-100%) rotate(${heading}deg);
            transform-origin:center bottom;
            margin-top:-9px;
          "></div>`
        : "";

    return L.divIcon({
        className: "",
        html: `<div style="position:relative;width:22px;height:22px;">
            ${arrow}
            <div style="width:22px;height:22px;border-radius:50%;background:#3b82f6;border:3px solid white;box-shadow:0 2px 8px rgba(59,130,246,.5);position:absolute;top:0;left:0;"></div>
        </div>`,
        iconSize: [22, 22],
        iconAnchor: [11, 11],
        popupAnchor: [0, -11],
    });
}

function MapRecenter({ pos }) {
    const map = useMap();
    useEffect(() => {
        if (pos) map.setView(pos, map.getZoom(), { animate: true });
    }, [pos, map]);
    return null;
}

const DEFAULT_DESTINO = [6.2518, -75.5636];

function Mapa() {
    const { ubicacion, cargando, error: locError, reintentar } = useLocation();

    const [destino, setDestino] = useState(DEFAULT_DESTINO);
    const [desviacion, setDesviacion] = useState(false);

    // Layers toggle
    const [showHomicidios, setShowHomicidios] = useState(true);
    const [showIncidentes, setShowIncidentes] = useState(false);
    const [showPolicias, setShowPolicias] = useState(false);
    const [showRain, setShowRain] = useState(false); // off by default

    // Data hooks
    const { clusters: homClusters, total: homTotal, loading: homLoading } = useHomicidios();
    const { clusters: incClusters, total: incTotal, loading: incLoading } = useIncidentes();
    const { policias, loading: polLoading } = usePolicias();
    const { weather, loading: weatherLoading } = useWeather(ubicacion);
    const heading = useOrientation();

    // Routing
    const { route, routeInfo, loading: routeLoading, error: routeError } =
        useRouting(ubicacion, destino, desviacion);

    const { desviacion: nuevaDesviacion } = useRouteProgress(ubicacion, route);

    useEffect(() => {
        setDesviacion(nuevaDesviacion);
    }, [nuevaDesviacion]);

    const userIcon = makeUserIcon(heading);

    const handleSelectOrigin = useCallback((pos) => {
        // Could be used to set a manual start point in the future
    }, []);

    const handleSelectDestino = useCallback((pos) => {
        setDestino(pos);
    }, []);

    if (cargando) {
        return (
            <div className="map-loading">
                <div className="map-loading__spinner" />
                Obteniendo ubicación GPS...
            </div>
        );
    }

    if (locError && !ubicacion) {
        return (
            <div className="map-loading">
                <div style={{ color: "#f87171", fontSize: 14, marginBottom: 16, textAlign: "center" }}>
                    No se pudo obtener tu ubicación.
                </div>
                <button className="map-retry-btn" onClick={reintentar}>Reintentar</button>
            </div>
        );
    }

    if (!ubicacion) {
        return (
            <div className="map-loading">
                <div className="map-loading__spinner" />
                Esperando señal GPS...
            </div>
        );
    }

    return (
        <div style={{ position: "relative", width: "100vw", height: "100vh", overflow: "hidden" }}>
            {/* ── Mapa ── */}
            <MapContainer center={ubicacion} zoom={15} className="Map">
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    attribution="&copy; OpenStreetMap &copy; CARTO"
                />

                {showRain && <RainLayer />}

                <MapRecenter pos={ubicacion} />

                <Marker position={ubicacion} icon={userIcon}>
                    <Popup>📍 Tu posición</Popup>
                </Marker>

                <Marker position={destino} icon={destIcon}>
                    <Popup>🏁 Destino</Popup>
                </Marker>

                <RoutePolyline positions={route} />

                <HomicidiosLayer clusters={homClusters} visible={showHomicidios} />
                <IncidentesLayer clusters={incClusters} visible={showIncidentes} />
                <PoliciasLayer policias={policias} visible={showPolicias} />
            </MapContainer>

            {/* ── Barra de búsqueda ── */}
            <SearchBar
                onSelectOrigin={handleSelectOrigin}
                onSelectDestino={handleSelectDestino}
            />

            {/* ── Clima arriba a la derecha ── */}
            <WeatherWidget weather={weather} loading={weatherLoading} />

            {/* ── HUD navegación ── */}
            {route.length > 0 && (
                <HUD desviacion={desviacion} routeInfo={routeInfo} />
            )}

            {/* ── Panel de capas ── */}
            <div className="map-layers">
                <button
                    className={`map-layers__btn ${showHomicidios ? "map-layers__btn--hom" : ""}`}
                    onClick={() => setShowHomicidios(v => !v)}
                >
                    <span className="map-layers__dot" style={{ background: "#ef4444" }} />
                    Homicidios
                    {!homLoading && <span className="map-layers__count">{homTotal.toLocaleString()}</span>}
                </button>
                <button
                    className={`map-layers__btn ${showIncidentes ? "map-layers__btn--inc" : ""}`}
                    onClick={() => setShowIncidentes(v => !v)}
                >
                    <span className="map-layers__dot" style={{ background: "#f97316" }} />
                    Accidentes viales
                    {!incLoading && <span className="map-layers__count">{incTotal.toLocaleString()}</span>}
                </button>
                <button
                    className={`map-layers__btn ${showPolicias ? "map-layers__btn--pol" : ""}`}
                    onClick={() => setShowPolicias(v => !v)}
                >
                    <span className="map-layers__dot" style={{ background: "#3b82f6" }} />
                    Estaciones policía
                    {!polLoading && <span className="map-layers__count">{policias.length}</span>}
                </button>
                <button
                    className={`map-layers__btn ${showRain ? "map-layers__btn--rain" : ""}`}
                    onClick={() => setShowRain(v => !v)}
                >
                    <span className="map-layers__dot" style={{ background: "#60a5fa" }} />
                    Radar lluvia
                </button>
            </div>

            {/* ── Leyenda dinámica ── */}
            {(showHomicidios || showIncidentes) && (
                <div className="map-legend">
                    {showHomicidios && (
                        <>
                            <div className="map-legend__title">Homicidios</div>
                            {[["#fbbf24","1–2"],["#eab308","3–4"],["#f97316","5–9"],["#ef4444","10+"]].map(([c,l]) => (
                                <div key={l} className="map-legend__item">
                                    <span className="map-legend__circle" style={{ background: c }} />{l} casos
                                </div>
                            ))}
                        </>
                    )}
                    {showIncidentes && (
                        <>
                            <div className="map-legend__title" style={{ marginTop: showHomicidios ? 10 : 0 }}>Accidentes viales</div>
                            {[["#fde68a","1–4"],["#facc15","5–9"],["#fbbf24","10–19"],["#f97316","20+"]].map(([c,l]) => (
                                <div key={l} className="map-legend__item">
                                    <span className="map-legend__circle" style={{ background: c }} />{l} casos
                                </div>
                            ))}
                        </>
                    )}
                </div>
            )}

            {routeLoading && (
                <div className="map-loading" style={{ background: "transparent", position: "absolute", inset: 0, zIndex: 500 }}>
                    <div className="map-loading__spinner" />
                    Recalculando ruta...
                </div>
            )}

            {routeError && (
                <div className="map-error">⚠ Error de ruta: {routeError}</div>
            )}
        </div>
    );
}

export default Mapa;
