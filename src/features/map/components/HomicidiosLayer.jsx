import { Circle, Popup } from "react-leaflet";

function getColor(count) {
    if (count >= 10) return "#ef4444";
    if (count >= 5)  return "#f97316";
    if (count >= 3)  return "#eab308";
    return "#fbbf24";
}

function getRadius(count) {
    if (count >= 10) return 250;
    if (count >= 5)  return 180;
    if (count >= 3)  return 120;
    return 80;
}

export default function HomicidiosLayer({ clusters, visible }) {
    if (!visible || !clusters.length) return null;

    return clusters.map((c, i) => (
        <Circle
            key={i}
            center={[c.lat, c.lng]}
            radius={getRadius(c.count)}
            pathOptions={{ color: "transparent", fillColor: getColor(c.count), fillOpacity: 0.65 }}
        >
            <Popup>
                <div style={{ fontFamily: "system-ui", fontSize: 13, lineHeight: 1.6 }}>
                    <strong style={{ color: "#ef4444" }}>⚠ Zona de riesgo</strong><br />
                    {c.barrio && <span>Barrio: <b>{c.barrio}</b><br /></span>}
                    Casos registrados: <b>{c.count}</b>
                </div>
            </Popup>
        </Circle>
    ));
}
