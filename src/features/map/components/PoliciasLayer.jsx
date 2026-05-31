import { Marker, Popup } from "react-leaflet";
import L from "leaflet";

const polIcon = L.divIcon({
    className: "",
    html: `<div style="width:22px;height:22px;border-radius:50%;background:#3b82f6;border:2.5px solid white;display:flex;align-items:center;justify-content:center;font-size:11px;box-shadow:0 2px 6px rgba(0,0,0,.4)">🚔</div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -11],
});

export default function PoliciasLayer({ policias, visible }) {
    if (!visible || !policias.length) return null;

    return policias.map((p, i) => (
        <Marker key={i} position={[p.lat, p.lng]} icon={polIcon}>
            <Popup>
                <div style={{ fontFamily: "system-ui", fontSize: 13, lineHeight: 1.6 }}>
                    <strong style={{ color: "#3b82f6" }}>🚔 {p.nombre}</strong><br />
                    {p.tipo && <span>Tipo: {p.tipo}<br /></span>}
                    {p.direccion && <span>📍 {p.direccion}<br /></span>}
                    {p.telefono && <span>📞 {p.telefono}</span>}
                </div>
            </Popup>
        </Marker>
    ));
}
