const OSRM_BASE = "https://router.project-osrm.org/route/v1/driving";

/**
 * Fetches a driving route between two [lat, lng] points.
 * Returns an array of [lat, lng] coordinates.
 */
export async function getRoute(start, end) {
    const url = `${OSRM_BASE}/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson&steps=false`;

    const res = await fetch(url);

    if (!res.ok) throw new Error(`OSRM error: HTTP ${res.status}`);

    const data = await res.json();

    if (data.code !== "Ok" || !data.routes?.length) {
        throw new Error("No se encontró una ruta disponible");
    }

    const { distance, duration } = data.routes[0];

    const coordinates = data.routes[0].geometry.coordinates.map(
        ([lng, lat]) => [lat, lng]
    );

    return { coordinates, distance, duration };
}
