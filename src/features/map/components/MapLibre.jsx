import { useState, useEffect, useRef } from "react";
import Map, { Marker, Source, Layer } from "react-map-gl/maplibre";
import "maplibre-gl/dist/maplibre-gl.css";

import "@/style/css/Map/Map.css";
import "@/style/css/Map/button.css";
import "@/style/css/Map/Weather.css";
import "@/style/css/Map/Hub.css";
import "@/style/css/Map/SearchBar.css";

import SearchAddress from "./SearchAddress";
import RainLayer from "./RainLayer";
import HUD from "./Hub";

import useLocation from "../hooks/useLocation";
import useHeading from "../hooks/useHeading";
import useRouteProgress from "../hooks/useRouteProgress";
import useRouting from "../hooks/useRouting";
import useHomicidios from "../hooks/useHomicidios";
import useIncidentes from "../hooks/useIncidentes";
import usePolicias from "../hooks/usePolicias";

import configGps from "../config/configGps";
import getVisionCone from "../utils/getVisionCone";
import getWeather from "../services/getWeather";

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
    const [showHomicidios, setShowHomicidios] = useState(true);
    const [showIncidentes, setShowIncidentes] = useState(false);
    const [showPolicias, setShowPolicias] = useState(false);
    const [weather, setWeather] = useState(null);
    const [destination, setDestination] = useState(null);
    const [cone, setCone] = useState(null);
    const [desviacion, setDesviacion] = useState(false);
    const [viewState, setViewState] = useState({
        longitude: -75.5636,
        latitude: 6.2518,
        zoom: 13,
    });

    const { ubicacion, cargando } = useLocation();
    const heading = useHeading();

    const { route, routeInfo, loading: routeLoading } = useRouting(ubicacion, destination, desviacion);
    const { desviacion: nuevaDesviacion } = useRouteProgress(ubicacion, route?.coordinates?.map(([lng, lat]) => [lat, lng]));

    const { clusters: homClusters, total: homTotal, loading: homLoading } = useHomicidios();
    const { clusters: incClusters, total: incTotal, loading: incLoading } = useIncidentes();
    const { policias, loading: polLoading } = usePolicias();

    useEffect(() => { setDesviacion(nuevaDesviacion); }, [nuevaDesviacion]);

    // Clima
    useEffect(() => {
        if (!ubicacion) return;
        const [lat, lon] = ubicacion;
        getWeather(lat, lon, setWeather);
    }, [ubicacion]);

    // Cono de visión
    useEffect(() => {
        if (!ubicacion) return;
        setCone(getVisionCone(ubicacion, heading || 0));
    }, [ubicacion, heading]);

    // Seguir GPS
    configGps({ ubicacion, setViewState });

    // GeoJSON homicidios
    const homGeojson = {
        type: "FeatureCollection",
        features: homClusters.map(c => ({
            type: "Feature",
            geometry: { type: "Point", coordinates: [c.lng, c.lat] },
            properties: { count: c.count, barrio: c.barrio },
        })),
    };

    // GeoJSON incidentes
    const incGeojson = {
        type: "FeatureCollection",
        features: incClusters.map(c => ({
            type: "Feature",
            geometry: { type: "Point", coordinates: [c.lng, c.lat] },
            properties: { count: c.count },
        })),
    };

    // GeoJSON policías
    const polGeojson = {
        type: "FeatureCollection",
        features: policias.map(p => ({
            type: "Feature",
            geometry: { type: "Point", coordinates: [p.lng, p.lat] },
            properties: { nombre: p.nombre, direccion: p.direccion },
        })),
    };

    return (
        <div className="Map">
            <SearchAddress
                onSelect={(pos) => setDestination(pos)}
            />

            <Map
                {...viewState}
                bearing={heading || 0}
                pitch={45}
                transitionDuration={300}
                onMove={(evt) => setViewState(evt.viewState)}
                mapStyle={`https://api.maptiler.com/maps/dataviz-dark/style.json?key=${MAPTILER_KEY}`}
            >
                {/* 🌧️ Radar lluvia */}
                <RainLayer visible={showRadar} />

                {/* 🔴 Homicidios — heatmap */}
                {showHomicidios && homClusters.length > 0 && (
                    <Source id="homicidios" type="geojson" data={homGeojson}>
                        <Layer
                            id="hom-heat"
                            type="heatmap"
                            maxzoom={17}
                            paint={{
                                "heatmap-weight": ["interpolate", ["linear"], ["get", "count"], 0, 0, 10, 1],
                                "heatmap-intensity": ["interpolate", ["linear"], ["zoom"], 0, 1, 15, 3],
                                "heatmap-color": ["interpolate", ["linear"], ["heatmap-density"],
                                    0, "rgba(0,0,0,0)",
                                    0.2, "#fbbf24",
                                    0.5, "#f97316",
                                    0.8, "#ef4444",
                                    1, "#991b1b"
                                ],
                                "heatmap-radius": ["interpolate", ["linear"], ["zoom"], 0, 4, 15, 30],
                                "heatmap-opacity": 0.8,
                            }}
                        />
                    </Source>
                )}

                {/* 🟠 Accidentes viales */}
                {showIncidentes && incClusters.length > 0 && (
                    <Source id="incidentes" type="geojson" data={incGeojson}>
                        <Layer
                            id="inc-circles"
                            type="circle"
                            paint={{
                                "circle-radius": ["interpolate", ["linear"], ["get", "count"], 1, 5, 10, 14, 30, 20],
                                "circle-color": ["interpolate", ["linear"], ["get", "count"], 1, "#fde68a", 5, "#facc15", 10, "#f97316"],
                                "circle-opacity": 0.75,
                                "circle-stroke-width": 0,
                            }}
                        />
                    </Source>
                )}

                {/* 🔵 Estaciones policía */}
                {showPolicias && policias.length > 0 && (
                    <Source id="policias" type="geojson" data={polGeojson}>
                        <Layer
                            id="pol-circles"
                            type="circle"
                            paint={{
                                "circle-radius": 9,
                                "circle-color": "#3b82f6",
                                "circle-opacity": 0.9,
                                "circle-stroke-width": 2,
                                "circle-stroke-color": "#fff",
                            }}
                        />
                    </Source>
                )}

                {/* 👁️ Cono de visión */}
                {cone && (
                    <Source id="vision" type="geojson" data={{
                        type: "Feature",
                        geometry: { type: "Polygon", coordinates: [cone] },
                    }}>
                        <Layer id="vision-layer" type="fill"
                            paint={{ "fill-color": "#4aa3ff", "fill-opacity": 0.15 }}
                        />
                    </Source>
                )}

                {/* 🛣️ Ruta */}
                {route && (
                    <Source id="route" type="geojson" data={{ type: "Feature", geometry: route }}>
                        <Layer id="route-line" type="line"
                            layout={{ "line-join": "round", "line-cap": "round" }}
                            paint={{ "line-color": "#00d4ff", "line-width": 5, "line-opacity": 0.9 }}
                        />
                    </Source>
                )}

                {/* 📍 Usuario */}
                {ubicacion && (
                    <Marker longitude={ubicacion[1]} latitude={ubicacion[0]} anchor="center">
                        <div className="NodeBasic User" />
                    </Marker>
                )}

                {/* 🎯 Destino */}
                {destination && (
                    <Marker longitude={destination[1]} latitude={destination[0]} anchor="bottom">
                        <div className="NodeBasic Destiny" />
                    </Marker>
                )}
            </Map>

            {/* ☁️ Clima */}
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

            {/* 🧭 HUD navegación */}
            {destination && <HUD desviacion={desviacion} routeInfo={routeInfo} />}

            {/* 🗂️ Panel de capas */}
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
                    className={`map-layers__btn ${showRadar ? "map-layers__btn--rain" : ""}`}
                    onClick={() => setShowRadar(v => !v)}
                >
                    <span className="map-layers__dot" style={{ background: "#60a5fa" }} />
                    Radar lluvia
                </button>
            </div>

            {/* Aviso radar */}
            {showRadar && viewState.zoom > 7 && (
                <div className="RainMessage">Aleja el mapa para ver el radar de lluvia</div>
            )}

            {/* Recalculando */}
            {routeLoading && (
                <div className="FondoBackground">Recalculando ruta...</div>
            )}

            {/* GPS cargando */}
            {cargando && (
                <div className="FondoBackground">Activando GPS...</div>
            )}
        </div>
    );
}
