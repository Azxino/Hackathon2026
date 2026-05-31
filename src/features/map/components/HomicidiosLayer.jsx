import { CircleMarker, Popup } from "react-leaflet";
import { useMemo } from "react";

// Color por densidad de casos
function getColor(count) {
    if (count >= 10) return "#ef4444"; // rojo intenso
    if (count >= 5)  return "#f97316"; // naranja
    if (count >= 3)  return "#eab308"; // amarillo
    return "#fbbf24";                  // amarillo claro
}

function getRadius(count) {
    if (count >= 10) return 14;
    if (count >= 5)  return 10;
    if (count >= 3)  return 7;
    return 5;
}

export default function HomicidiosLayer({ clusters, visible }) {
    if (!visible || !clusters.length) return null;

    return clusters.map((c, i) => (
        <CircleMarker
            key={i}
            center={[c.lat, c.lng]}
            radius={getRadius(c.count)}
            pathOptions={{
                color: "transparent",
                fillColor: getColor(c.count),
                fillOpacity: 0.7,
            }}
        >
            <Popup>
                <div style={{ fontFamily: "system-ui", fontSize: 13, lineHeight: 1.6 }}>
                    <strong style={{ color: "#ef4444" }}>⚠ Zona de riesgo</strong><br />
                    {c.barrio && <span>Barrio: <b>{c.barrio}</b><br /></span>}
                    Casos registrados: <b>{c.count}</b>
                </div>
            </Popup>
        </CircleMarker>
    ));
}
