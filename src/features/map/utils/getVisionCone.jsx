function destinationPoint(lat, lng, bearing, distance) {
    const R = 6371e3;

    const δ = distance / R;
    const θ = (bearing * Math.PI) / 180;

    const φ1 = (lat * Math.PI) / 180;
    const λ1 = (lng * Math.PI) / 180;

    const φ2 = Math.asin(
        Math.sin(φ1) * Math.cos(δ) +
        Math.cos(φ1) * Math.sin(δ) * Math.cos(θ)
    );

    const λ2 =
        λ1 +
        Math.atan2(
            Math.sin(θ) * Math.sin(δ) * Math.cos(φ1),
            Math.cos(δ) - Math.sin(φ1) * Math.sin(φ2)
        );

    return [
        (λ2 * 180) / Math.PI,
        (φ2 * 180) / Math.PI,
    ];
}

export default function getVisionCone(center, heading, distance = 50, spread = 90) {
    const [lat, lng] = center;

    const points = [];

    const step = 5; // suavidad del cono

    for (let angle = -spread; angle <= spread; angle += step) {
        const point = destinationPoint(
            lat,
            lng,
            heading + angle,
            distance
        );
        points.push(point);
    }

    // cerrar polígono
    points.push(points[0]);

    return points;
}