/**
 * @file getSmartRoutes.js
 * @description Servicio encargado de calcular rutas inteligentes utilizando la API de TomTom Routing.
 * Ofrece alternativas de rutas (considerando tráfico) para optimizar tiempos y distancias.
 * @service TomTom Routing API
 */

/**
 * Obtiene rutas calculadas entre un punto de inicio y uno final.
 * @async
 * @param {Array<number>} start - Coordenadas de inicio como [lat, lng].
 * @param {Array<number>} end   - Coordenadas de destino como [lat, lng].
 * @param {string} key          - Clave de API de TomTom para la autenticación.
 * @returns {Promise<Array<{type: string, route: Object, distance: number, duration: number}>|null>} 
 * Retorna un array de objetos con la información de las rutas (tipo, objeto crudo, distancia en metros y duración en segundos),
 * o null si no se encuentran rutas disponibles.
 */

export default async function getSmartRoutes(start, end, key) {
    const baseUrl = `https://api.tomtom.com/routing/1/calculateRoute`;

    // Formato requerido por TomTom: "lat,lng:lat,lng"
    const common = `${start[0]},${start[1]}:${end[0]},${end[1]}`;

    // Parámetros:
    // - traffic=true: Incluye datos de tráfico en tiempo real.
    // - computeBestOrder=false: No reordena los waypoints.
    // - maxAlternatives=2: Solicita hasta 2 rutas alternativas adicionales.
    const url = `${baseUrl}/${common}/json?key=${key}&traffic=true&computeBestOrder=false&maxAlternatives=2`;

    const res = await fetch(url);
    const data = await res.json();

    if (!data.routes) return null;

    // Mapeo y normalización de la respuesta de TomTom
    return data.routes.map((r, index) => ({
        type: index === 0 ? "fast" : "eco", // Clasifica la primera como 'fast' y las siguientes como 'eco'
        route: r,
        distance: r.summary.lengthInMeters,
        duration: r.summary.travelTimeInSeconds,
    }));
}