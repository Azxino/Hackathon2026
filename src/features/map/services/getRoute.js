export default async function getRoute(start, end) {
    const url = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`;

    const res = await fetch(url);
    const data = await res.json();

    if (!data.routes?.length) throw new Error("No se encontró ruta");

    const route = data.routes[0];

    return {
        geometry: route.geometry,
        distance: route.distance,   // metros
        duration: route.duration,   // segundos
    };
}
