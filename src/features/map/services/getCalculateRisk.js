/**
 * @file getCalculateRisk.js
 * @description Módulo de análisis espacial y penalización. 
 * Contiene la lógica para calcular el riesgo acumulado de una ruta basándose en zonas 
 * predefinidas y para aplicar penalizaciones por congestión vehicular.
 * @dependencies [Geometry Math]
 */

/**
 * Calcula el puntaje de riesgo total para una ruta analizando su proximidad a zonas peligrosas.
 * @param {Object} route - Objeto de ruta que contiene la geometría (coordenadas).
 * @param {Array<{lng: number, lat: number, weight: number}>} riskZones - Array de zonas de riesgo con su peso de peligrosidad.
 * @returns {number} Puntaje de riesgo acumulado.
 */
export function calculateRisk(route, riskZones) {
    let score = 0;

    // Itera sobre cada punto de la geometría de la ruta
    for (const [lng, lat] of route.geometry.coordinates) {
        // Compara cada punto contra cada zona de riesgo definida
        for (const zone of riskZones) {
            const dx = zone.lng - lng;
            const dy = zone.lat - lat;
            // Distancia euclidiana simplificada (dist < 0.01 es aprox. 1.1km)
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < 0.01) {
                score += zone.weight;
            }
        }
    }

    return score;
}

/**
 * Aplica una penalización de tiempo/costo a una ruta basándose en datos de tráfico en tiempo real.
 * @param {Object} route - Objeto de ruta que contiene la geometría (coordenadas).
 * @param {Array<{lng: number, lat: number, congestion: string}>} trafficData - Datos de congestión por punto geográfico.
 * @returns {number} Penalización total acumulada.
 */
export function applyTrafficPenalty(route, trafficData) {
    let penalty = 0;

    // Itera sobre los puntos de la ruta
    for (const point of route.geometry.coordinates) {
        // Itera sobre los puntos de tráfico registrados
        for (const t of trafficData) {
            const dx = t.lng - point[0];
            const dy = t.lat - point[1];
            const dist = Math.sqrt(dx * dx + dy * dy);

            // Si hay proximidad, se asigna una penalización según el nivel de congestión
            if (dist < 0.01) {
                if (t.congestion === "high") penalty += 3;
                if (t.congestion === "medium") penalty += 1;
            }
        }
    }

    return penalty;
}