import { Polyline } from "react-leaflet";

function RoutePolyline({ positions }) {
    if (!positions || positions.length === 0) return null;

    return (
        <Polyline
            positions={positions}
            pathOptions={{ color: "#6366f1", weight: 5, opacity: 0.85 }}
        />
    );
}

export default RoutePolyline;
