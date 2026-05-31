import { Circle, Popup } from "react-leaflet";

function getColor(count) {
    if (count >= 20) return "#f97316";
    if (count >= 10) return "#fbbf24";
    if (count >= 5)  return "#facc15";
    return "#fde68a";
}

function getRadius(count) {
    if (count >= 20) return 180;
    if (count >= 10) return 130;
    if (count >= 5)  return 90;
    return 60;
}

export default function IncidentesLayer({ clusters, visible }) {
    if (!visible || !clusters.length) return null;

    return clusters.map((c, i) => (
        <Circle
            key={i}
            center={[c.lat, c.lng]}
            radius={getRadius(c.count)}
            pathOptions={{ color: "transparent", fillColor: getColor(c.count), fillOpacity: 0.6 }}
        >
            <Popup>
                <div style={{ fontFamily: "system-ui", fontSize: 13, lineHeight: 1.6 }}>
                    <strong style={{ color: "#f97316" }}>🚗 Incidente vial</strong><br />
                    {c.clase && <span>Tipo: <b>{c.clase}</b><br /></span>}
                    {c.gravedad && <span>Gravedad: <b>{c.gravedad}</b><br /></span>}
                    Casos en zona: <b>{c.count}</b>
                </div>
            </Popup>
        </Circle>
    ));
}
