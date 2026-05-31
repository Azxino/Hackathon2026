/**
 * @file getRoute.js
 * @description Motor central de enrutamiento. Gestiona la comunicación con la API de OSRM
 * para obtener rutas base y aplica algoritmos de análisis de riesgo y tráfico para 
 * categorizar rutas (rápida, segura, equilibrada).
 * @dependencies [OSRM API, getCalculateRisk.js]
 */

import { calculateRisk, applyTrafficPenalty } from "./getCalculateRisk";

/**
 * Obtiene la ruta más eficiente entre dos puntos desde OSRM.
 * @async
 * @param {Array<number>} start     - [lat, lng] de origen.
 * @param {Array<number>} end       - [lat, lng] de destino.
 * @returns {Promise<Object|null>}  - Geometría de la ruta, distancia y duración, o null si falla.
 * @throws {Error}                  - Si la petición a la API falla o no se encuentra ruta.
 */
export default async function getRoute(start, end) {
    if (!start || !end) return null;

    // Nota: OSRM requiere formato [lng, lat] en la URL
    const url = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson`;

    const res = await fetch(url);

    if (!res.ok) {
        throw new Error("OSRM request failed");
    }

    const data = await res.json();

    if (!data.routes || !data.routes.length) {
        throw new Error("No route found");
    }

    const route = data.routes[0];

    return {
        geometry: route.geometry,
        distance: route.distance,
        duration: route.duration,
    };
}

/**
 * Obtiene una ruta completa con detalles de pasos (steps) para análisis detallado.
 * @async
 * @param {Array<number>} start - [lat, lng] de origen.
 * @param {Array<number>} end   - [lat, lng] de destino.
 * @returns {Promise<Object>}   - El objeto de ruta crudo de OSRM.
 */
export async function getBaseRoute(start, end) {
    const url = `https://router.project-osrm.org/route/v1/driving/${start[1]},${start[0]};${end[1]},${end[0]}?overview=full&geometries=geojson&steps=true`;

    const res = await fetch(url);
    const data = await res.json();

    if (!data.routes?.length) throw new Error("No route");

    return data.routes[0];
}

/**
 * Construye múltiples alternativas de ruta basándose en un puntaje de riesgo calculado.
 * @param {Object} baseRoute    - La ruta obtenida de getBaseRoute.
 * @param {Array} riskZones     - Zonas de riesgo a considerar.
 * @returns {Object}            - Un objeto que contiene rutas: { fast, safe, balanced } con sus respectivos puntajes ajustados.
 */
export function buildSmartRoutes(baseRoute, riskZones) {
    const riskScore = calculateRisk(baseRoute, riskZones);

    return {
        fast: {
            ...baseRoute,
            score: riskScore * 0.5, // Menor peso al riesgo
        },

        safe: {
            ...baseRoute,
            score: riskScore * 2, // Mayor peso al riesgo
        },

        balanced: {
            ...baseRoute,
            score: riskScore, // Peso estándar
        }
    };
}

/**
 * Calcula el puntaje total de una ruta combinando riesgos geográficos y condiciones de tráfico.
 * @param {Object} route        - Objeto de ruta de OSRM.
 * @param {Array} riskZones     - Zonas de riesgo a evaluar.
 * @param {Object} trafficData  - Datos de tráfico actuales para aplicar penalizaciones.
 * @returns {number}            - Puntaje final ponderado.
 */
export function scoreRoute(route, riskZones, trafficData) {
    const risk = calculateRisk(route, riskZones);
    const traffic = applyTrafficPenalty(route, trafficData);

    return risk + traffic;
}