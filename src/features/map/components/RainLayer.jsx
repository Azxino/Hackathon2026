import { useEffect, useRef } from "react";
import { useMap } from "react-leaflet";
import L from "leaflet";

export default function RainLayer() {
    const map = useMap();
    const layerRef = useRef(null);

    useEffect(() => {
        let cancelled = false;

        async function loadRain() {
            try {
                const res = await fetch(
                    "https://api.rainviewer.com/public/weather-maps.json"
                );

                const data = await res.json();

                if (cancelled) return;

                const frames =
                    data?.radar?.nowcast?.length
                        ? data.radar.nowcast
                        : data?.radar?.past || [];

                if (!frames.length) {
                    console.log("No radar frames available");
                    return;
                }

                const time = frames[frames.length - 1].time;

                console.log("Rain frame time:", time);

                // 🧼 limpiar capa anterior
                if (layerRef.current) {
                    map.removeLayer(layerRef.current);
                }

                // 🌧️ crear capa de lluvia
                layerRef.current = L.tileLayer(
                    `https://tilecache.rainviewer.com/v2/radar/{z}/{x}/{y}/256/${time}/0_0.png`,
                    {
                        opacity: 0.6,
                        zIndex: 999,
                    }
                );

                layerRef.current.addTo(map);

            } catch (err) {
                console.error("RainLayer error:", err);
            }
        }

        loadRain();

        return () => {
            cancelled = true;
            if (layerRef.current) {
                map.removeLayer(layerRef.current);
            }
        };
    }, [map]);

    return null;
}