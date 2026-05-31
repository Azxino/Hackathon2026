import L from "leaflet";

import markerIcon2x from "leaflet/dist/images/marker-icon-2x.png";
import markerIcon from "leaflet/dist/images/marker-icon.png";
import markerShadow from "leaflet/dist/images/marker-shadow.png";

delete L.Icon.Default.prototype._getIconUrl;

L.Icon.Default.mergeOptions({
    iconRetinaUrl: markerIcon2x,
    iconUrl: markerIcon,
    shadowUrl: markerShadow,
});

function makeDotIcon(color, size = 14) {
    return L.divIcon({
        className: "",
        html: `<div style="
            width:${size}px;
            height:${size}px;
            border-radius:50%;
            background:${color};
            border:2.5px solid white;
            box-shadow:0 2px 6px rgba(0,0,0,0.35);
        "></div>`,
        iconSize: [size, size],
        iconAnchor: [size / 2, size / 2],
        popupAnchor: [0, -(size / 2)],
    });
}

export const userIcon = makeDotIcon("#3b82f6", 18);
export const destIcon = makeDotIcon("#ef4444", 18);
