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

                const past = data?.radar?.past || [];
                if (!past.length) return;

                const latest = past[past.length - 1];
                const timestamp = latest.time;

                const tileUrl = `https://tilecache.rainviewer.com/v2/radar/${timestamp}/256/{z}/{x}/{y}/2/1_1.png`;

                if (layerRef.current) {
                    map.removeLayer(layerRef.current);
                    layerRef.current = null;
                }

                layerRef.current = L.tileLayer(tileUrl, {
                    opacity: 0.5,
                    zIndex: 10,
                    tileSize: 256,
                    minZoom: 0,
                    maxZoom: 18,
                    minNativeZoom: 0,  // escala tiles para zooms bajos
                    maxNativeZoom: 6,  // RainViewer solo tiene tiles hasta zoom 6
                    errorTileUrl: "data:image/gif;base64,R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7",
                });

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
                layerRef.current = null;
            }
        };
    }, [map]);

    return null;
}