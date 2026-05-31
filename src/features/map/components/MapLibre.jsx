import { useState, useEffect, useRef } from "react";

import Map, {
    Marker,
    Source,
    Layer,
} from "react-map-gl/maplibre";

import "maplibre-gl/dist/maplibre-gl.css";

// Css
import "@/style/css/Map/Map.css";
import "@/style/css/Map/button.css"
import "@/style/css/Map/Weather.css"
import "@/style/css/Map/Hub.css"

// Components
import SearchAddress from "./SearchAddress";
import RainLayer from "./RainLayer";
import HUD from "./Hub";

// Hooks
import useLocation from "../hooks/useLocation";
import useHeading from "../hooks/useHeading";
import useRouteProgress from "../hooks/useRouteProgress"

// Utils
import getVisionCone from "../utils/getVisionCone";

// Config
import configGps from "../config/configGps";

// Services
import getRoute from "../services/getRoute";
import getWeather from "../services/getWeather";

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
    const [weather, setWeather] = useState(null);

    const { ubicacion, cargando } = useLocation();

    const heading = useHeading();
    const lastRef = useRef(null);
    const [destination, setDestination] = useState(null);
    const [route, setRoute] = useState(null);
    const [cone, setCone] = useState(null);
    const [viewState, setViewState] = useState({
        longitude: -75.5636,
        latitude: 6.2518,
        zoom: 13,
    });

    const MAPTILER_KEY =
        import.meta.env.VITE_MAPTILER_KEY;

    const { desviacion: nuevaDesviacion } = useRouteProgress(ubicacion, route);
    const [desviacion, setDesviacion] = useState(false);
    useEffect(() => { setDesviacion(nuevaDesviacion); }, [nuevaDesviacion]);

    useEffect(() => {
        if (!destination) {
            setRoute(null);
            return;
        }
    }, [destination]);

    useEffect(() => {
        if (!ubicacion) return;

        const [lat, lon] = ubicacion;
        getWeather(lat, lon, setWeather);
    }, [ubicacion]);

    // 📍 GPS -> cono de visión
    useEffect(() => {
        if (!ubicacion) return;

        const vision =
            getVisionCone(
                ubicacion,
                heading || 0
            );

        setCone(vision);
    }, [ubicacion, heading]);

    // 📍 GPS -> mover cámara
    configGps({
        ubicacion,
        setViewState,
    });

    // 🛣️ Crear ruta cuando exista destino
    useEffect(() => {
        if (!ubicacion) return;
        if (!destination) return;

        getRoute(
            ubicacion,
            destination
        ).then(setRoute);
    }, [ubicacion, destination]);

    // 🔄 Recalcular si te mueves
    useEffect(() => {
        if (!ubicacion) return;
        if (!destination) return;
        if (lastRef.current) {

            const dx =
                ubicacion[0] -
                lastRef.current[0];

            const dy =
                ubicacion[1] -
                lastRef.current[1];

            const dist =
                Math.sqrt(
                    dx * dx +
                    dy * dy
                );

            if (dist < 0.0002) return;
        }

        lastRef.current = ubicacion;

        getRoute(
            ubicacion,
            destination
        ).then(setRoute);
    }, [ubicacion, destination]);

    return (
        <div className="Map">

            <SearchAddress
                onSelect={(pos) => {
                    console.log("DESTINO RECIBIDO", pos);
                    setDestination(pos);
                }}
            />

            <Map
                {...viewState}
                bearing={heading || 0}
                pitch={45}
                transitionDuration={300}
                onMove={(evt) =>
                    setViewState(
                        evt.viewState
                    )
                }
                mapStyle={`https://api.maptiler.com/maps/dataviz-dark/style.json?key=${MAPTILER_KEY}`}
            >
                {viewState.zoom < 7 && <RainLayer visible={showRadar} />}

                {/* 👁️ Cono de visión */}
                {cone && (
                    <Source
                        id="vision"
                        type="geojson"
                        data={{
                            type: "Feature",
                            geometry: {
                                type: "Polygon",
                                coordinates: [cone],
                            },
                        }}
                    >
                        <Layer
                            id="vision-layer"
                            type="fill"
                            paint={{
                                "fill-color":
                                    "#4aa3ff",
                                "fill-opacity":
                                    0.15,
                            }}
                        />
                    </Source>
                )}

                {/* 🛣️ Ruta */}
                {route && (
                    <Source
                        id="route"
                        type="geojson"
                        data={{
                            type: "Feature",
                            geometry: route,
                        }}
                    >
                        <Layer
                            id="route-line"
                            type="line"
                            paint={{
                                "line-color":
                                    "#00d4ff",
                                "line-width": 5,
                            }}
                        />
                    </Source>
                )}

                {/* 📍 Usuario */}
                {ubicacion && (
                    <Marker
                        longitude={ubicacion[1]}
                        latitude={ubicacion[0]}
                        anchor="center"
                    >
                        <div
                            className="NodeBasic User"
                        />
                    </Marker>
                )}

                {/* 🎯 Destino */}
                {destination && (
                    <Marker
                        longitude={destination[1]}
                        latitude={destination[0]}
                        anchor="bottom"
                    >
                        <div
                            className="NodeBasic Destiny"
                        />
                    </Marker>
                )}
            </Map>

            {weather && (
                <div className="weather-widget">

                    <div className="weather-widget__icon">
                        {getWeatherIcon(weather.weathercode)}
                    </div>

                    <div>
                        <div className="weather-widget__temp">
                            {weather.temperature}°C
                        </div>

                        <div className="weather-widget__label">
                            Clima actual
                        </div>

                        <div className="weather-widget__meta">
                            Viento {weather.windspeed} km/h
                        </div>
                    </div>

                </div>
            )}

            {destination && <HUD desviacion={desviacion}/>}

            <div className="map-layers">
                <button
                    className={`map-layers__btn ${showRadar ? "map-layers__btn--rain" : ""}`}
                    onClick={() =>
                        setShowRadar(prev => !prev)
                    }
                >
                    <span className="map-layers__dot" style={{ background: "#60a5fa" }} />
                    Radar de lluvia
                </button>
            </div>

            {showRadar && viewState.zoom > 7 && (
                <div className="RainMessage">
                    Aleja el mapa para visualizar el radar de lluvia
                </div>
            )}

            {/* ⏳ GPS */}
            {cargando && (
                <div className="FondoBackground">
                    Activando GPS...
                </div>
            )}

        </div>
    );
}