import {
    MapContainer,
    TileLayer,
    Marker,
    Popup,
    useMap,
} from "react-leaflet";
import { useEffect, useState } from "react";

import "leaflet/dist/leaflet.css";
import "@/style/css/Map/Map.css";

import useLocation from "../hooks/useLocation";
import useRouting from "../hooks/useRouting";
import useRouteProgress from "../hooks/useRouteProgress";
import useHomicidios from "../hooks/useHomicidios";

import RoutePolyline from "./RoutePolyline";
import HomicidiosLayer from "./HomicidiosLayer";
import HUD from "./Hub";

import { userIcon, destIcon } from "../config/leafletIcon";

const DESTINO = [6.2518, -75.5636];

import RainLayer from "./RainLayer";

function MapRecenter({ pos }) {
    const map = useMap();
    useEffect(() => {
        if (pos) map.setView(pos, map.getZoom(), { animate: true });
    }, [pos, map]);
    return null;
}

function Mapa() {
    const { ubicacion, cargando, error: locError, reintentar } = useLocation();
    const { clusters, total, loading: homLoading } = useHomicidios();
    const [showHomicidios, setShowHomicidios] = useState(true);
    const [desviacion, setDesviacion] = useState(false);

    const { route, routeInfo, loading: routeLoading, error: routeError } =
        useRouting(ubicacion, DESTINO, desviacion);

    const { desviacion: nuevaDesviacion } = useRouteProgress(ubicacion, route);

    useEffect(() => {
        setDesviacion(nuevaDesviacion);
    }, [nuevaDesviacion]);

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
                <button className="map-retry-btn" onClick={reintentar}>
                    Reintentar
                </button>
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
        <>
            <MapContainer center={ubicacion} zoom={15} className="Map">
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    zIndex={1}
                />

                <RainLayer />

                <MapRecenter pos={ubicacion} />

                <Marker position={ubicacion} icon={userIcon}>
                    <Popup>Tu posición</Popup>
                </Marker>

                <Marker position={DESTINO} icon={destIcon}>
                    <Popup>Destino</Popup>
                </Marker>

                <RoutePolyline positions={route} />

                <HomicidiosLayer clusters={clusters} visible={showHomicidios} />
            </MapContainer>

            {/* HUD principal */}
            {route.length > 0 && (
                <HUD desviacion={desviacion} routeInfo={routeInfo} />
            )}

            {/* Panel de capas — esquina inferior derecha */}
            <div className="map-layers">
                <button
                    className={`map-layers__btn ${showHomicidios ? "map-layers__btn--active" : ""}`}
                    onClick={() => setShowHomicidios((v) => !v)}
                >
                    <span className="map-layers__dot" />
                    Homicidios
                    {!homLoading && (
                        <span className="map-layers__count">{total.toLocaleString()}</span>
                    )}
                </button>
            </div>

            {/* Leyenda */}
            {showHomicidios && (
                <div className="map-legend">
                    <div className="map-legend__title">Casos por zona</div>
                    <div className="map-legend__item">
                        <span className="map-legend__circle" style={{ background: "#fbbf24" }} />
                        1–2 casos
                    </div>
                    <div className="map-legend__item">
                        <span className="map-legend__circle" style={{ background: "#eab308" }} />
                        3–4 casos
                    </div>
                    <div className="map-legend__item">
                        <span className="map-legend__circle" style={{ background: "#f97316" }} />
                        5–9 casos
                    </div>
                    <div className="map-legend__item">
                        <span className="map-legend__circle" style={{ background: "#ef4444" }} />
                        10+ casos
                    </div>
                </div>
            )}

            {/* Loading ruta */}
            {routeLoading && (
                <div className="map-loading" style={{ background: "transparent", position: "absolute", inset: 0, zIndex: 500 }}>
                    <div className="map-loading__spinner" />
                    Recalculando ruta...
                </div>
            )}

            {routeError && (
                <div className="map-error">⚠ Error de ruta: {routeError}</div>
            )}
        </>
    );
}

export default Mapa;
