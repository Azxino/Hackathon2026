/**
 * @file getVisionCone.js
 * @description Módulo de utilidades matemáticas para cálculos geográficos.
 * Contiene funciones para determinar puntos de destino sobre la superficie terrestre
 * (fórmula del gran círculo) y para generar polígonos que representan campos de visión.
 * @module GeometryUtils
 */

/**
 * Calcula las coordenadas de un punto de destino a partir de un punto de origen,
 * una distancia y un rumbo (bearing) utilizando la fórmula del "gran círculo".
 * @param {number} lat      - Latitud del origen en grados decimales.
 * @param {number} lng      - Longitud del origen en grados decimales.
 * @param {number} bearing  - Dirección inicial en grados (0° norte, 90° este, etc.).
 * @param {number} distance - Distancia al destino en metros.
 * @returns {Array<number>} - Array con [longitud, latitud] del punto final.
 */
function destinationPoint(lat, lng, bearing, distance) {
    const R = 6371e3;                       // Radio medio de la Tierra en metros

    const δ = distance / R;                 // Distancia angular en radianes
    const θ = (bearing * Math.PI) / 180;    // Rumbo convertido a radianes

    const φ1 = (lat * Math.PI) / 180;       // Latitud origen a radianes
    const λ1 = (lng * Math.PI) / 180;       // Longitud origen a radianes

    // Cálculo de la latitud del destino
    const φ2 = Math.asin(
        Math.sin(φ1) * Math.cos(δ) +
        Math.cos(φ1) * Math.sin(δ) * Math.cos(θ)
    );

    // Cálculo de la longitud del destino
    const λ2 =
        λ1 +
        Math.atan2(
            Math.sin(θ) * Math.sin(δ) * Math.cos(φ1),
            Math.cos(δ) - Math.sin(φ1) * Math.sin(φ2)
        );

    // Retorna las coordenadas convertidas de nuevo a grados decimales
    return [
        (λ2 * 180) / Math.PI,
        (φ2 * 180) / Math.PI,
    ];
}

/**
 * Genera una serie de puntos que representan un cono de visión o campo de visión 
 * en un mapa geográfico.
 * @param {Array<number>} center    - Array [lat, lng] del centro de origen.
 * @param {number} heading          - Dirección central del cono (en grados).
 * @param {number} [currentZoom=15] - Nivel de zoom del mapa para escalar la distancia.
 * @param {number} [spread=90]      - Ángulo total de apertura del cono en grados.
 * @returns {Array<Array<number>>}  - Array de coordenadas representando el polígono del cono.
 */
export default function getVisionCone(center, heading, currentZoom = 15, spread = 90) {
    const [lat, lng] = center;
    const points = [];
    const step = 5; // Resolución del cono (menor valor = más suavizado)

    // Constantes para ajustar la escala visual según el zoom del mapa
    const SCALE_CONSTANT = 20000; 
    const OFFSET_CONSTANT = 10;
   
    // Calcula qué tan lejos llega el cono basándose en el zoom actual
    const dynamicDistance = SCALE_CONSTANT / Math.pow(2, currentZoom - OFFSET_CONSTANT);

    // Añadir el punto central del origen
    points.push([lng, lat]); 

    // Generar puntos a lo largo del arco del cono
    for (let angle = -spread; angle <= spread; angle += step) {
        const point = destinationPoint(
            lat,
            lng,
            heading + angle,
            dynamicDistance
        );
        points.push(point);
    }

    // Cerrar el polígono regresando al punto central
    points.push(points[0]); 

    return points;
}