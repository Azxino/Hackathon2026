import { useEffect, useState } from "react";

function distance(a, b) {
    const R = 6371e3;
    const toRad = (x) => x * Math.PI / 180;

    const dLat = toRad(b[0] - a[0]);
    const dLon = toRad(b[1] - a[1]);

    const lat1 = toRad(a[0]);
    const lat2 = toRad(b[0]);

    const h =
        Math.sin(dLat / 2) ** 2 +
        Math.cos(lat1) * Math.cos(lat2) *
        Math.sin(dLon / 2) ** 2;

    return 2 * R * Math.asin(Math.sqrt(h));
}

export default function useSnapToRoute(ubicacion, route) {
    const [snapped, setSnapped] = useState(null);

    useEffect(() => {
        if (!ubicacion || !route?.length) return;

        let closest = route[0];
        let minDist = Infinity;

        route.forEach((p) => {
            const d = distance(ubicacion, p);
            if (d < minDist) {
                minDist = d;
                closest = p;
            }
        });

        setSnapped(closest);

    }, [ubicacion, route]);

    return snapped;
}