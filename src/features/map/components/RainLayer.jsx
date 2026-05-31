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
                const res = await fetch("https://api.rainviewer.com/public/weather-maps.json");
                const data = await res.json();

                if (cancelled) return;

                const frames = [
                    ...(data?.radar?.past || []),
                    ...(data?.radar?.nowcast || []),
                ];

                if (!frames.length) return;

                const latest = frames[frames.length - 1];
                const path = latest.path; // e.g. /v2/radar/1234567890/256/{z}/{x}/{y}/2/1_1.png

                if (layerRef.current) map.removeLayer(layerRef.current);

                layerRef.current = L.tileLayer(
                    `https://tilecache.rainviewer.com${path}/{z}/{x}/{y}/256/2/1_1.png`,
                    { opacity: 0.55, zIndex: 10 }
                );

                layerRef.current.addTo(map);
            } catch (err) {
                console.error("RainLayer error:", err);
            }
        }

        loadRain();

        return () => {
            cancelled = true;
            if (layerRef.current) map.removeLayer(layerRef.current);
        };
    }, [map]);

    return null;
}
