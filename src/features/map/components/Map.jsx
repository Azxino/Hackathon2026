import {
    MapContainer,
    TileLayer,
    Marker,
    Popup,
    useMap,
    CircleMarker
} from "react-leaflet";

import { useEffect, useMemo } from "react";

import "leaflet/dist/leaflet.css";
import "@/style/css/Map/Map.css";

import useLocation from "../hooks/useLocation";
import useRouting from "../hooks/useRouting";
import useRouteProgress from "../hooks/useRouteProgress";

import RoutePolyline from "./RoutePolyline";
import { userIcon, destIcon } from "../config/leafletIcon";

import HUD from "./Hub";

const DESTINO = [6.2518, -75.5636];

function MapRecenter({ pos }) {
    const map = useMap();

    useEffect(() => {
        if (pos) {
            map.setView(pos, map.getZoom(), { animate: true });
        }
    }, [pos, map]);

    return null;
}

function Mapa({ accidents = [] }) {
    console.log(accidents)
    const { ubicacion, cargando, error: locError } = useLocation();

    const {
        route,
        routeInfo,
        loading: routeLoading,
        error: routeError,
    } = useRouting(ubicacion, DESTINO, false);

    const { desviacion } = useRouteProgress(ubicacion, route);

    // ---------------- VALIDACIONES ----------------

    if (cargando) {
        return (
            <div className="map-loading">
                <div className="map-loading__spinner" />
                Obteniendo ubicación GPS...
            </div>
        );
    }

    if (locError) {
        return (
            <div className="map-loading">
                <div style={{ color: "#f87171", fontSize: 13 }}>
                    Error GPS: {locError}
                </div>
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

    // ---------------- MAPA ----------------

    return (
        <>
            <MapContainer
                center={ubicacion}
                zoom={17}
                className="Map"
                zoomControl={true}
            >
                <TileLayer
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                    attribution="&copy; OpenStreetMap"
                />

                {/* 📍 CENTRAR MAPA */}
                <MapRecenter pos={ubicacion} />

                {/* 👤 USUARIO */}
                <Marker position={ubicacion} icon={userIcon}>
                    <Popup>Tu posición</Popup>
                </Marker>

                {/* 🎯 DESTINO */}
                <Marker position={DESTINO} icon={destIcon}>
                    <Popup>Destino</Popup>
                </Marker>

                {/* 🛣️ RUTA */}
                <RoutePolyline positions={route} />
            </MapContainer>

            {/* HUD */}
            {route.length > 0 && (
                <HUD desviacion={desviacion} routeInfo={routeInfo} />
            )}

            {/* LOADING RUTA */}
            {routeLoading && (
                <div
                    className="map-loading"
                    style={{
                        background: "transparent",
                        position: "absolute",
                        inset: 0,
                        zIndex: 500,
                    }}
                >
                    <div className="map-loading__spinner" />
                    Recalculando ruta...
                </div>
            )}

            {/* ERROR RUTA */}
            {routeError && (
                <div className="map-error">
                    ⚠ Error de ruta: {routeError}
                </div>
            )}
        </>
    );
}

export default Mapa;