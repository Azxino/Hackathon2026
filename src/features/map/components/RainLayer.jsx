/**
 * @file RainLayer.jsx
 * @description Componente de capa para MapLibre que integra el radar de lluvia en tiempo real
 * desde la API de RainViewer. Gestiona dinámicamente la adición y eliminación de la
 * fuente de datos (raster tiles) y la capa visual.
 * @dependencies [react-map-gl/maplibre, RainViewer API]
 */

import { useEffect } from "react";
import { useMap } from "react-map-gl/maplibre";

/**
 * Capa de radar de lluvia para mapas.
 * @param {Object} props - Propiedades del componente.
 * @param {boolean} props.visible - Determina si la capa debe renderizarse en el mapa.
 */
export default function RainLayer({ visible }) {
    const mapRef = useMap();

    /**
     * Helper para obtener la instancia del mapa de manera segura.
     * Soporta diferentes versiones de la API de react-map-gl.
     */
    function getMapInstance() {
        return (
            mapRef?.current?.getMap?.() ||
            mapRef?.getMap?.() ||
            null
        );
    }

    useEffect(() => {
        async function loadRain() {
            const map = getMapInstance();
            if (!map || !visible) return;

            try {
                // Obtención del endpoint de tiles más reciente desde RainViewer
                const response =
                    await fetch(
                        "https://api.rainviewer.com/public/weather-maps.json"
                    );
                const data = await response.json();
                const frame = data.radar.past.at(-1);

                // Construcción de la URL de tiles (zoom, x, y)
                const tileUrl =
                    `https://tilecache.rainviewer.com${frame.path}/512/{z}/{x}/{y}/2/1_1.png`;

                // Registro de la fuente y capa en el mapa si aún no existen
                if (!map.getSource("rain")) {

                    map.addSource("rain", {
                        type: "raster",
                        tiles: [tileUrl],
                        tileSize: 512,
                    });

                    map.addLayer({
                        id: "rain-layer",
                        type: "raster",
                        source: "rain",
                        paint: {
                            "raster-opacity": 0.7,
                        },
                    });
                }

            } catch (error) {
                console.error(
                    "Error cargando radar:",
                    error
                );
            }
        }

        loadRain();

        // Limpieza: elimina la capa y la fuente del mapa al desmontar el componente 
        // o al cambiar la visibilidad
        return () => {

            const map = getMapInstance();

            if (!map) return;

            try {

                if (map.getLayer("rain-layer")) {
                    map.removeLayer("rain-layer");
                }

                if (map.getSource("rain")) {
                    map.removeSource("rain");
                }

            } catch (err) {
                console.warn(err);
            }
        };

    }, [visible, mapRef]); // Componente visual lógico que no renderiza nada en el DOM

    return null;
}